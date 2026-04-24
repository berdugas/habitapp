const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockMaybeSingle = jest.fn();
const mockUpsert = jest.fn();
const mockUpsertSelect = jest.fn();
const mockSingle = jest.fn();
const mockGetHabitById = jest.fn();
const mockLoggerError = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

jest.mock("@/features/habits/api", () => ({
  getHabitById: (userId: string, habitId: string) =>
    mockGetHabitById(userId, habitId),
}));

jest.mock("@/services/logger", () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

import {
  getLatestWeeklyReview,
  getWeeklyReviewForWeek,
  upsertWeeklyReview,
} from "@/features/reviews/api";

describe("weekly review api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setupSelectBuilder(result: unknown) {
    const builder = {
      eq: mockEq,
      limit: mockLimit,
      maybeSingle: mockMaybeSingle,
      order: mockOrder,
      select: mockSelect,
    };

    mockSelect.mockReturnValue(builder);
    mockEq.mockReturnValue(builder);
    mockOrder.mockReturnValue(builder);
    mockLimit.mockReturnValue(builder);
    mockMaybeSingle.mockResolvedValue(result);
    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    return builder;
  }

  it("loads the latest review scoped by user and habit ordered by week_start", async () => {
    const result = {
      data: { id: "review-1", week_start: "2026-04-20" },
      error: null,
    };

    setupSelectBuilder(result);

    const response = await getLatestWeeklyReview("user-1", "habit-1");

    expect(mockFrom).toHaveBeenCalledWith("weekly_reviews");
    expect(mockEq).toHaveBeenNthCalledWith(1, "user_id", "user-1");
    expect(mockEq).toHaveBeenNthCalledWith(2, "habit_id", "habit-1");
    expect(mockOrder).toHaveBeenCalledWith("week_start", { ascending: false });
    expect(mockLimit).toHaveBeenCalledWith(1);
    expect(response).toEqual(result.data);
  });

  it("loads the current week review scoped by user, habit, and week_start", async () => {
    const result = {
      data: { id: "review-2", week_start: "2026-04-27" },
      error: null,
    };

    setupSelectBuilder(result);

    const response = await getWeeklyReviewForWeek(
      "user-1",
      "habit-1",
      "2026-04-27",
    );

    expect(mockEq).toHaveBeenNthCalledWith(1, "user_id", "user-1");
    expect(mockEq).toHaveBeenNthCalledWith(2, "habit_id", "habit-1");
    expect(mockEq).toHaveBeenNthCalledWith(3, "week_start", "2026-04-27");
    expect(response).toEqual(result.data);
  });

  it("verifies ownership and upserts the weekly review with trimmed fields", async () => {
    mockGetHabitById.mockResolvedValue({
      id: "habit-1",
    });
    mockUpsert.mockReturnValue({
      select: mockUpsertSelect,
    });
    mockUpsertSelect.mockReturnValue({
      single: mockSingle,
    });
    mockSingle.mockResolvedValue({
      data: { id: "review-1" },
      error: null,
    });
    mockFrom.mockReturnValue({
      upsert: mockUpsert,
    });

    await upsertWeeklyReview("user-1", {
      adjustmentNote: " Move the book ",
      habitId: "habit-1",
      tinyActionTooHard: false,
      triggerWorked: true,
      wasHard: " Busy mornings ",
      weekStart: "2026-04-20",
      wentWell: " Breakfast worked ",
    });

    expect(mockGetHabitById).toHaveBeenCalledWith("user-1", "habit-1");
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        adjustment_note: "Move the book",
        habit_id: "habit-1",
        tiny_action_too_hard: false,
        trigger_worked: true,
        user_id: "user-1",
        was_hard: "Busy mornings",
        week_start: "2026-04-20",
        went_well: "Breakfast worked",
      },
      {
        onConflict: "user_id,habit_id,week_start",
      },
    );
  });

  it("uses the same upsert path for another week", async () => {
    mockGetHabitById.mockResolvedValue({
      id: "habit-1",
    });
    mockUpsert.mockReturnValue({
      select: mockUpsertSelect,
    });
    mockUpsertSelect.mockReturnValue({
      single: mockSingle,
    });
    mockSingle.mockResolvedValue({
      data: { id: "review-2", week_start: "2026-04-27" },
      error: null,
    });
    mockFrom.mockReturnValue({
      upsert: mockUpsert,
    });

    await upsertWeeklyReview("user-1", {
      adjustmentNote: "",
      habitId: "habit-1",
      tinyActionTooHard: null,
      triggerWorked: null,
      wasHard: "",
      weekStart: "2026-04-27",
      wentWell: "Still showed up",
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        week_start: "2026-04-27",
      }),
      {
        onConflict: "user_id,habit_id,week_start",
      },
    );
  });

  it("rejects non-owned habits before attempting the review upsert", async () => {
    mockGetHabitById.mockRejectedValueOnce(new Error("not found"));

    await expect(
      upsertWeeklyReview("user-1", {
        adjustmentNote: "",
        habitId: "other-user-habit",
        tinyActionTooHard: null,
        triggerWorked: null,
        wasHard: "",
        weekStart: "2026-04-20",
        wentWell: "Worked",
      }),
    ).rejects.toThrow("not found");

    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("logs and throws save failures", async () => {
    const saveError = new Error("save failed");

    mockGetHabitById.mockResolvedValue({
      id: "habit-1",
    });
    mockUpsert.mockReturnValue({
      select: mockUpsertSelect,
    });
    mockUpsertSelect.mockReturnValue({
      single: mockSingle,
    });
    mockSingle.mockResolvedValue({
      data: null,
      error: saveError,
    });
    mockFrom.mockReturnValue({
      upsert: mockUpsert,
    });

    await expect(
      upsertWeeklyReview("user-1", {
        adjustmentNote: "",
        habitId: "habit-1",
        tinyActionTooHard: null,
        triggerWorked: null,
        wasHard: "",
        weekStart: "2026-04-20",
        wentWell: "Worked",
      }),
    ).rejects.toThrow("save failed");

    expect(mockLoggerError).toHaveBeenCalledWith("Failed to upsert weekly review", {
      error: saveError,
      habitId: "habit-1",
      userId: "user-1",
      weekStart: "2026-04-20",
    });
  });
});
