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
const mockLoggerError = jest.fn();
const mockLoggerWarn = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

jest.mock("@/services/logger", () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
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

  it("loads the habit by both id and user_id before logging", async () => {
    await upsertHabitLog("user-1", {
      habitId: "habit-1",
      logDate: "2026-04-23",
      status: "done",
    });

    expect(mockFrom).toHaveBeenCalledWith("habits");
    expect(mockHabitEqId).toHaveBeenCalledWith("id", "habit-1");
    expect(mockHabitEqUser).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("writes note as null when the payload does not include one", async () => {
    await upsertHabitLog("user-1", {
      habitId: "habit-1",
      logDate: "2026-04-23",
      status: "done",
    });

    expect(mockUpsert).toHaveBeenCalledWith(
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

  it("rejects writes before the habit start_date and logs the guardrail", async () => {
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

    expect(mockLoggerWarn).toHaveBeenCalledWith(
      "Rejected habit log before habit start_date",
      {
        habitId: "habit-1",
        logDate: "2026-04-23",
        startDate: "2026-04-24",
        status: "done",
        userId: "user-1",
      },
    );
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("rejects writes for inactive habits and logs the guardrail", async () => {
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

    expect(mockLoggerWarn).toHaveBeenCalledWith(
      "Rejected habit log for inactive habit",
      {
        habitId: "habit-1",
        logDate: "2026-04-23",
        status: "done",
        userId: "user-1",
      },
    );
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("logs owned-habit lookup failures without exposing a separate UI-specific reason", async () => {
    const lookupError = new Error("JSON object requested, multiple (or no) rows returned");

    mockHabitSingle.mockResolvedValue({
      data: null,
      error: lookupError,
    });

    await expect(
      upsertHabitLog("user-1", {
        habitId: "habit-404",
        logDate: "2026-04-23",
        status: "missed",
      }),
    ).rejects.toBe(lookupError);

    expect(mockLoggerError).toHaveBeenCalledWith(
      "Failed to load owned habit for logging",
      {
        error: lookupError,
        habitId: "habit-404",
        userId: "user-1",
      },
    );
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
