const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockFetchQuery = jest.fn();
const mockUseAuthSession = jest.fn();
const mockUseActiveHabitsQuery = jest.fn();
const mockGetHabitLogsInRange = jest.fn();
const mockUpsertHabitLog = jest.fn();
const mockToDeviceDateString = jest.fn();
const mockGetTrailingDateRangeStrings = jest.fn();
const mockAddDeviceDays = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useMutation: (options: unknown) => mockUseMutation(options),
  useQuery: (options: unknown) => mockUseQuery(options),
  useQueryClient: () => ({
    fetchQuery: (options: unknown) => mockFetchQuery(options),
    invalidateQueries: (options: unknown) => mockInvalidateQueries(options),
  }),
}));

jest.mock("@/features/auth/hooks", () => ({
  useAuthSession: () => mockUseAuthSession(),
}));

jest.mock("@/features/habits/hooks", () => ({
  useActiveHabitsQuery: () => mockUseActiveHabitsQuery(),
}));

jest.mock("@/features/habits/api", () => ({
  getHabitLogsInRange: (
    userId: string,
    startDate: string,
    endDate: string,
  ) => mockGetHabitLogsInRange(userId, startDate, endDate),
  upsertHabitLog: (userId: string, payload: unknown) =>
    mockUpsertHabitLog(userId, payload),
}));

jest.mock("@/utils/dates", () => ({
  addDeviceDays: (date: Date, amount: number) => mockAddDeviceDays(date, amount),
  getTrailingDateRangeStrings: (windowDays: number, endDate?: Date) =>
    mockGetTrailingDateRangeStrings(windowDays, endDate),
  toDeviceDateString: (date?: Date) => mockToDeviceDateString(date),
}));

import {
  getHabitLogsRangeQueryKey,
  useTodayHabits,
  useUpsertTodayHabitStatusMutation,
} from "@/features/today/hooks";

describe("today hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: { user: { id: "user-1" } },
      user: { id: "user-1" },
    });
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockUseQuery.mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });
    mockUseActiveHabitsQuery.mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockFetchQuery.mockResolvedValue([]);
    mockGetTrailingDateRangeStrings.mockReturnValue({
      endDate: "2026-04-23",
      startDate: "2026-03-25",
    });
    mockToDeviceDateString.mockImplementation((date?: Date) => {
      const safeDate = date ?? new Date("2026-04-23T12:00:00");
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

  it("builds today habit summaries from the persisted 30-day history window", () => {
    mockUseActiveHabitsQuery.mockReturnValue({
      data: [
        {
          id: "habit-1",
          name: "Reading",
          stack_trigger: "I brush my teeth",
          tiny_action: "Read 1 page",
        },
      ],
      error: null,
      isLoading: false,
    });
    mockUseQuery.mockReturnValue({
      data: [
        {
          created_at: "2026-04-23T00:00:00.000Z",
          habit_id: "habit-1",
          id: "log-1",
          log_date: "2026-04-23",
          note: null,
          status: "done",
          updated_at: "2026-04-23T00:00:00.000Z",
          user_id: "user-1",
        },
        {
          created_at: "2026-04-22T00:00:00.000Z",
          habit_id: "habit-1",
          id: "log-2",
          log_date: "2026-04-22",
          note: null,
          status: "done",
          updated_at: "2026-04-22T00:00:00.000Z",
          user_id: "user-1",
        },
        {
          created_at: "2026-04-21T00:00:00.000Z",
          habit_id: "habit-1",
          id: "log-3",
          log_date: "2026-04-21",
          note: null,
          status: "skipped",
          updated_at: "2026-04-21T00:00:00.000Z",
          user_id: "user-1",
        },
        {
          created_at: "2026-04-20T00:00:00.000Z",
          habit_id: "habit-1",
          id: "log-4",
          log_date: "2026-04-20",
          note: null,
          status: "missed",
          updated_at: "2026-04-20T00:00:00.000Z",
          user_id: "user-1",
        },
      ],
      error: null,
      isLoading: false,
    });

    const result = useTodayHabits();

    expect(result.habits).toEqual([
      {
        consistencyRate: 2 / 3,
        formula: "After I brush my teeth, I will Read 1 page.",
        id: "habit-1",
        name: "Reading",
        skipCount: 1,
        streak: 2,
        todayStatus: "done",
      },
    ]);
    expect(mockUseQuery).toHaveBeenCalledWith({
      enabled: true,
      queryFn: expect.any(Function),
      queryKey: getHabitLogsRangeQueryKey(
        "user-1",
        "2026-03-25",
        "2026-04-23",
      ),
    });
  });

  it("invalidates and explicitly refetches today's log query after a successful mutation", async () => {
    useUpsertTodayHabitStatusMutation();

    const mutationOptions = mockUseMutation.mock.calls[0]?.[0] as {
      onSuccess: () => Promise<void>;
    };

    await mutationOptions.onSuccess();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: getHabitLogsRangeQueryKey(
        "user-1",
        "2026-03-25",
        "2026-04-23",
      ),
    });
    expect(mockFetchQuery).toHaveBeenCalledWith({
      queryFn: expect.any(Function),
      queryKey: getHabitLogsRangeQueryKey(
        "user-1",
        "2026-03-25",
        "2026-04-23",
      ),
    });
    expect(mockInvalidateQueries.mock.invocationCallOrder[0]).toBeLessThan(
      mockFetchQuery.mock.invocationCallOrder[0],
    );

    const fetchQueryCall = mockFetchQuery.mock.calls[0]?.[0] as {
      queryFn: () => Promise<unknown>;
    };

    await fetchQueryCall.queryFn();

    expect(mockGetHabitLogsInRange).toHaveBeenCalledWith(
      "user-1",
      "2026-03-25",
      "2026-04-23",
    );
  });
});
