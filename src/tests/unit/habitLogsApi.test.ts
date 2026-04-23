const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({
  single: mockSingle,
}));
const mockUpsert = jest.fn(() => ({
  select: mockSelect,
}));
const mockFrom = jest.fn((_table: string) => ({
  upsert: mockUpsert,
}));

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

import { upsertHabitLog } from "@/features/habits/api";

describe("upsertHabitLog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockResolvedValue({
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
});
