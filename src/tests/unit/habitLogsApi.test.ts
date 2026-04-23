const mockLogSingle = jest.fn();
const mockHabitSingle = jest.fn();
const mockLogSelect = jest.fn(() => ({
  single: mockLogSingle,
}));
const mockHabitEqUser = jest.fn(() => ({
  single: mockHabitSingle,
}));
const mockHabitEqId = jest.fn(() => ({
  eq: mockHabitEqUser,
}));
const mockHabitSelect = jest.fn(() => ({
  eq: mockHabitEqId,
}));
const mockUpsert = jest.fn(() => ({
  select: mockLogSelect,
}));
const mockFrom = jest.fn((table: string) => {
  if (table === "habits") {
    return {
      select: mockHabitSelect,
    };
  }

  return {
    upsert: mockUpsert,
  };
});

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

import { upsertHabitLog } from "@/features/habits/api";

describe("upsertHabitLog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHabitSingle.mockResolvedValue({
      data: {
        id: "habit-1",
        is_active: true,
        start_date: "2026-04-23",
        user_id: "user-1",
      },
      error: null,
    });
    mockLogSingle.mockResolvedValue({
      data: {
        habit_id: "habit-1",
        id: "log-1",
        log_date: "2026-04-23",
        note: null,
        status: "done",
        user_id: "user-1",
      },
      error: null,
    });
  });

  it("uses the owned-day conflict target so same-day replacements do not create duplicates", async () => {
    await upsertHabitLog("user-1", {
      habitId: "habit-1",
      logDate: "2026-04-23",
      status: "done",
    });

    await upsertHabitLog("user-1", {
      habitId: "habit-1",
      logDate: "2026-04-23",
      status: "skipped",
    });

    expect(mockFrom).toHaveBeenCalledWith("habits");
    expect(mockFrom).toHaveBeenCalledWith("habit_logs");
    expect(mockUpsert).toHaveBeenNthCalledWith(
      1,
      {
        habit_id: "habit-1",
        log_date: "2026-04-23",
        note: null,
        status: "done",
        user_id: "user-1",
      },
      {
        onConflict: "user_id,habit_id,log_date",
      },
    );
    expect(mockUpsert).toHaveBeenNthCalledWith(
      2,
      {
        habit_id: "habit-1",
        log_date: "2026-04-23",
        note: null,
        status: "skipped",
        user_id: "user-1",
      },
      {
        onConflict: "user_id,habit_id,log_date",
      },
    );
  });

  it("rejects writes before the habit start_date", async () => {
    mockHabitSingle.mockResolvedValue({
      data: {
        id: "habit-1",
        is_active: true,
        start_date: "2026-04-24",
        user_id: "user-1",
      },
      error: null,
    });

    await expect(
      upsertHabitLog("user-1", {
        habitId: "habit-1",
        logDate: "2026-04-23",
        status: "done",
      }),
    ).rejects.toThrow("Habits cannot be logged before their start date.");

    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("rejects writes for inactive habits", async () => {
    mockHabitSingle.mockResolvedValue({
      data: {
        id: "habit-1",
        is_active: false,
        start_date: "2026-04-23",
        user_id: "user-1",
      },
      error: null,
    });

    await expect(
      upsertHabitLog("user-1", {
        habitId: "habit-1",
        logDate: "2026-04-23",
        status: "done",
      }),
    ).rejects.toThrow("Inactive habits cannot receive new logs.");

    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
