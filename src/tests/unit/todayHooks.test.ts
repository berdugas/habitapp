const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockFetchQuery = jest.fn();
const mockUseAuthSession = jest.fn();
const mockUseActiveHabitsQuery = jest.fn();
const mockGetHabitLogsInRange = jest.fn();
const mockUpsertHabitLog = jest.fn();
const mockToDeviceDateString = jest.fn();

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
  toDeviceDateString: () => mockToDeviceDateString(),
}));

import {
  getHabitLogsRangeQueryKey,
  useUpsertTodayHabitStatusMutation,
} from "@/features/today/hooks";

describe("useUpsertTodayHabitStatusMutation", () => {
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
    mockToDeviceDateString.mockReturnValue("2026-04-23");
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
        "2026-04-23",
        "2026-04-23",
      ),
    });
    expect(mockFetchQuery).toHaveBeenCalledWith({
      queryFn: expect.any(Function),
      queryKey: getHabitLogsRangeQueryKey(
        "user-1",
        "2026-04-23",
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
      "2026-04-23",
      "2026-04-23",
    );
  });
});
