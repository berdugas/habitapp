const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockFetchQuery = jest.fn();
const mockUseAuthSession = jest.fn();
const mockUseEligibleHabitsQuery = jest.fn();
const mockUseUpcomingActiveHabitsQuery = jest.fn();
const mockGetHabitLogsInRange = jest.fn();
const mockUpsertHabitLog = jest.fn();
const mockToDeviceDateString = jest.fn();
const mockGetTrailingDateRangeStrings = jest.fn();
const mockAddDeviceDays = jest.fn();
const mockLoggerError = jest.fn();

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
  useEligibleHabitsQuery: () => mockUseEligibleHabitsQuery(),
  useUpcomingActiveHabitsQuery: () => mockUseUpcomingActiveHabitsQuery(),
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

jest.mock("@/services/logger", () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
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
    mockUseEligibleHabitsQuery.mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });
    mockUseUpcomingActiveHabitsQuery.mockReturnValue({
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
    mockUseEligibleHabitsQuery.mockReturnValue({
      data: [
        {
          id: "habit-1",
          name: "Reading",
          start_date: "2026-04-23",
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
    expect(result.upcomingHabits).toEqual([]);
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

  it("returns upcoming habits separately when nothing is eligible yet", () => {
    mockUseEligibleHabitsQuery.mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });
    mockUseUpcomingActiveHabitsQuery.mockReturnValue({
      data: [
        {
          id: "habit-2",
          name: "Meditation",
          start_date: "2026-04-25",
          stack_trigger: "I wake up",
          tiny_action: "Meditate for 1 minute",
        },
      ],
      error: null,
      isLoading: false,
    });

    const result = useTodayHabits();

    expect(result.habits).toEqual([]);
    expect(result.upcomingHabits).toEqual([
      {
        formula: "After I wake up, I will Meditate for 1 minute.",
        id: "habit-2",
        name: "Meditation",
        startDate: "2026-04-25",
      },
    ]);
  });

  it("uses the shared device-local day and selected done status when logging today", async () => {
    useUpsertTodayHabitStatusMutation();

    const mutationOptions = mockUseMutation.mock.calls[0]?.[0] as {
      mutationFn: (variables: { habitId: string; status: string }) => Promise<unknown>;
    };

    await mutationOptions.mutationFn({
      habitId: "habit-1",
      status: "done",
    });

    expect(mockToDeviceDateString).toHaveBeenCalled();
    expect(mockUpsertHabitLog).toHaveBeenCalledWith("user-1", {
      habitId: "habit-1",
      logDate: "2026-04-23",
      status: "done",
    });
  });

  it.each([
    ["skipped"],
    ["missed"],
  ] as const)("passes the selected %s status through unchanged", async (status) => {
    useUpsertTodayHabitStatusMutation();

    const mutationOptions = mockUseMutation.mock.calls[0]?.[0] as {
      mutationFn: (variables: { habitId: string; status: string }) => Promise<unknown>;
    };

    await mutationOptions.mutationFn({
      habitId: "habit-1",
      status,
    });

    expect(mockUpsertHabitLog).toHaveBeenCalledWith("user-1", {
      habitId: "habit-1",
      logDate: "2026-04-23",
      status,
    });
  });

  it("rejects unauthenticated logging attempts before calling the API", async () => {
    mockUseAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: null,
      user: null,
    });

    useUpsertTodayHabitStatusMutation();

    const mutationOptions = mockUseMutation.mock.calls[0]?.[0] as {
      mutationFn: (variables: { habitId: string; status: string }) => Promise<unknown>;
    };

    await expect(
      mutationOptions.mutationFn({
        habitId: "habit-1",
        status: "done",
      }),
    ).rejects.toThrow("You need an account session before logging a habit.");

    expect(mockUpsertHabitLog).not.toHaveBeenCalled();
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

  it("logs mutation failures with habit, status, and user context", () => {
    useUpsertTodayHabitStatusMutation();

    const mutationOptions = mockUseMutation.mock.calls[0]?.[0] as {
      onError: (error: Error, variables: { habitId: string; status: string }) => void;
    };
    const lookupError = new Error(
      "JSON object requested, multiple (or no) rows returned",
    );

    mutationOptions.onError(lookupError, {
      habitId: "habit-404",
      status: "missed",
    });

    expect(mockLoggerError).toHaveBeenCalledWith(
      "Today status mutation failed",
      {
        error: lookupError,
        habitId: "habit-404",
        status: "missed",
        userId: "user-1",
      },
    );
  });
});
