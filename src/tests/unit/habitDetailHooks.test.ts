const mockUseQuery = jest.fn();
const mockUseAuthSession = jest.fn();
const mockGetHabitById = jest.fn();
const mockGetHabitLogsForHabitInRange = jest.fn();
const mockGetLatestWeeklyReview = jest.fn();
const mockGetTrailingDateRangeStrings = jest.fn();
const mockToDeviceDateString = jest.fn();
const mockAddDeviceDays = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQuery: (options: unknown) => mockUseQuery(options),
}));

jest.mock("@/features/auth/hooks", () => ({
  useAuthSession: () => mockUseAuthSession(),
}));

jest.mock("@/features/habits/api", () => ({
  createHabit: jest.fn(),
  getEligibleHabits: jest.fn(),
  getHabitById: (userId: string, habitId: string) =>
    mockGetHabitById(userId, habitId),
  getHabitLogsForHabitInRange: (
    userId: string,
    habitId: string,
    startDate: string,
    endDate: string,
  ) => mockGetHabitLogsForHabitInRange(userId, habitId, startDate, endDate),
  getUpcomingActiveHabits: jest.fn(),
}));

jest.mock("@/features/reviews/api", () => ({
  getLatestWeeklyReview: (userId: string, habitId: string) =>
    mockGetLatestWeeklyReview(userId, habitId),
}));

jest.mock("@/utils/dates", () => ({
  addDeviceDays: (date: Date, amount: number) => mockAddDeviceDays(date, amount),
  getTrailingDateRangeStrings: (windowDays: number, endDate?: Date) =>
    mockGetTrailingDateRangeStrings(windowDays, endDate),
  toDeviceDateString: (date?: Date) => mockToDeviceDateString(date),
}));

import {
  getHabitDetailLogsQueryKey,
  getHabitDetailQueryKey,
  useHabitDetail,
} from "@/features/habits/hooks";
import { getLatestWeeklyReviewQueryKey } from "@/features/reviews/queryKeys";

describe("habit detail hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthSession.mockReturnValue({
      session: { user: { id: "user-1" } },
      user: { id: "user-1" },
    });
    mockGetTrailingDateRangeStrings.mockReturnValue({
      endDate: "2026-04-24",
      startDate: "2026-03-26",
    });
    mockToDeviceDateString.mockImplementation((date?: Date) => {
      const safeDate = date ?? new Date("2026-04-24T12:00:00");
      const year = safeDate.getFullYear();
      const month = `${safeDate.getMonth() + 1}`.padStart(2, "0");
      const day = `${safeDate.getDate()}`.padStart(2, "0");
      return `${year}-${month}-${day}`;
    });
    mockAddDeviceDays.mockImplementation((date: Date, amount: number) => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + amount);
      return nextDate;
    });
  });

  it("loads the owned habit and recent logs with detail-scoped query keys", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: {
          id: "habit-1",
          name: "Reading",
          start_date: "2026-04-24",
          stack_trigger: "I brush my teeth",
          tiny_action: "Read 1 page",
        },
        error: null,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [
          {
            created_at: "2026-04-24T00:00:00.000Z",
            habit_id: "habit-1",
            id: "log-1",
            log_date: "2026-04-24",
            note: null,
            status: "done",
            updated_at: "2026-04-24T00:00:00.000Z",
            user_id: "user-1",
          },
        ],
        error: null,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: {
          adjustment_note: "Keep breakfast as the cue",
          habit_id: "habit-1",
          id: "review-1",
          tiny_action_too_hard: false,
          trigger_worked: true,
          user_id: "user-1",
          was_hard: "Remembering on busy days",
          week_start: "2026-04-20",
          went_well: "Reading after breakfast",
        },
        error: null,
        isLoading: false,
      });

    const result = useHabitDetail("habit-1");

    expect(mockUseQuery).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        enabled: true,
        queryKey: getHabitDetailQueryKey("user-1", "habit-1"),
      }),
    );
    expect(mockUseQuery).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        enabled: true,
        queryKey: getHabitDetailLogsQueryKey(
          "user-1",
          "habit-1",
          "2026-03-26",
          "2026-04-24",
        ),
      }),
    );
    expect(mockUseQuery).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        enabled: true,
        queryKey: getLatestWeeklyReviewQueryKey("user-1", "habit-1"),
      }),
    );
    expect(result.formula).toBe("After I brush my teeth, I will Read 1 page.");
    expect(result.latestReview?.id).toBe("review-1");
    expect(result.progress.todayStatus).toBe("done");
    expect(result.progress.streak).toBe(1);
    expect(result.recentLogs).toHaveLength(1);
  });

  it("handles empty history without mixing logs across habits", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: {
          id: "habit-2",
          name: "Meditation",
          start_date: "2026-04-24",
          stack_trigger: "I wake up",
          tiny_action: "Meditate for 1 minute",
        },
        error: null,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [],
        error: null,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: null,
        error: null,
        isLoading: false,
      });

    const result = useHabitDetail("habit-2");

    expect(result.progress).toEqual({
      consistencyRate: 0,
      skipCount: 0,
      streak: 0,
      todayStatus: null,
    });
    expect(result.recentLogs).toEqual([]);
    expect(result.isUpcoming).toBe(false);
  });

  it("returns an immediate error for a missing route habit id", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
    });

    const result = useHabitDetail(undefined);

    expect(result.error).toBeInstanceOf(Error);
    expect(result.isLoading).toBe(false);
  });

  it("marks a future-dated habit as upcoming in detail", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: {
          id: "habit-3",
          name: "Stretching",
          start_date: "2026-04-26",
          stack_trigger: "After lunch",
          tiny_action: "Stretch for 1 minute",
        },
        error: null,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [],
        error: null,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: null,
        error: null,
        isLoading: false,
      });

    const result = useHabitDetail("habit-3");

    expect(result.isUpcoming).toBe(true);
    expect(result.formula).toBe("After lunch, I will Stretch for 1 minute.");
  });
});
