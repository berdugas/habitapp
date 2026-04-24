const mockUseMutation = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockFetchQuery = jest.fn();
const mockUseAuthSession = jest.fn();
const mockUpdateHabit = jest.fn();
const mockSetHabitActiveState = jest.fn();
const mockGetHabitById = jest.fn();
const mockToDeviceDateString = jest.fn();
const mockLoggerError = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useMutation: (options: unknown) => mockUseMutation(options),
  useQuery: jest.fn(),
  useQueryClient: () => ({
    fetchQuery: (options: unknown) => mockFetchQuery(options),
    invalidateQueries: (options: unknown) => mockInvalidateQueries(options),
  }),
}));

jest.mock("@/features/auth/hooks", () => ({
  useAuthSession: () => mockUseAuthSession(),
}));

jest.mock("@/features/habits/api", () => ({
  createHabit: jest.fn(),
  getEligibleHabits: jest.fn(),
  getHabitById: (userId: string, habitId: string) =>
    mockGetHabitById(userId, habitId),
  getHabitLogsForHabitInRange: jest.fn(),
  getUpcomingActiveHabits: jest.fn(),
  setHabitActiveState: (userId: string, habitId: string, isActive: boolean) =>
    mockSetHabitActiveState(userId, habitId, isActive),
  updateHabit: (
    userId: string,
    habitId: string,
    payload: unknown,
  ) => mockUpdateHabit(userId, habitId, payload),
}));

jest.mock("@/utils/dates", () => ({
  getTrailingDateRangeStrings: jest.fn(),
  toDeviceDateString: (date?: Date) => mockToDeviceDateString(date),
}));

jest.mock("@/services/logger", () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

import {
  getEligibleHabitsQueryKey,
  getHabitDetailQueryKey,
  getUpcomingActiveHabitsQueryKey,
  useSetHabitActiveStateMutation,
  useUpdateHabitMutation,
} from "@/features/habits/hooks";

describe("habit update hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthSession.mockReturnValue({
      session: { user: { id: "user-1" } },
      user: { id: "user-1" },
    });
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockToDeviceDateString.mockReturnValue("2026-04-24");
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockFetchQuery.mockResolvedValue({
      id: "habit-1",
    });
  });

  it("rejects unauthenticated edit attempts before calling the API", async () => {
    mockUseAuthSession.mockReturnValue({
      session: null,
      user: null,
    });

    useUpdateHabitMutation();

    const mutationOptions = mockUseMutation.mock.calls[0]?.[0] as {
      mutationFn: (variables: { habitId: string; payload: object }) => Promise<unknown>;
    };

    await expect(
      mutationOptions.mutationFn({
        habitId: "habit-1",
        payload: {},
      }),
    ).rejects.toThrow("You need an account session before updating a habit.");

    expect(mockUpdateHabit).not.toHaveBeenCalled();
  });

  it("calls updateHabit and refreshes detail plus Today-facing queries", async () => {
    useUpdateHabitMutation();

    const mutationOptions = mockUseMutation.mock.calls[0]?.[0] as {
      mutationFn: (variables: {
        habitId: string;
        payload: object;
      }) => Promise<unknown>;
      onSuccess: (_data: unknown, variables: { habitId: string }) => Promise<void>;
    };

    await mutationOptions.mutationFn({
      habitId: "habit-1",
      payload: { name: "Reading" },
    });

    expect(mockUpdateHabit).toHaveBeenCalledWith("user-1", "habit-1", {
      name: "Reading",
    });

    await mutationOptions.onSuccess({}, { habitId: "habit-1" });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: getHabitDetailQueryKey("user-1", "habit-1"),
    });
    expect(mockFetchQuery).toHaveBeenCalledWith({
      queryFn: expect.any(Function),
      queryKey: getHabitDetailQueryKey("user-1", "habit-1"),
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: getEligibleHabitsQueryKey("user-1", "2026-04-24"),
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: getUpcomingActiveHabitsQueryKey("user-1", "2026-04-24"),
    });

    const fetchQueryCall = mockFetchQuery.mock.calls[0]?.[0] as {
      queryFn: () => Promise<unknown>;
    };

    await fetchQueryCall.queryFn();

    expect(mockGetHabitById).toHaveBeenCalledWith("user-1", "habit-1");
  });

  it("logs edit mutation failures with habit and user context", () => {
    useUpdateHabitMutation();

    const mutationOptions = mockUseMutation.mock.calls[0]?.[0] as {
      onError: (error: Error, variables: { habitId: string }) => void;
    };
    const updateError = new Error("save failed");

    mutationOptions.onError(updateError, {
      habitId: "habit-1",
    });

    expect(mockLoggerError).toHaveBeenCalledWith(
      "Habit update mutation failed",
      {
        error: updateError,
        habitId: "habit-1",
        userId: "user-1",
      },
    );
  });

  it("calls setHabitActiveState and refreshes detail plus Today-facing queries", async () => {
    useSetHabitActiveStateMutation();

    const mutationOptions = mockUseMutation.mock.calls[0]?.[0] as {
      mutationFn: (variables: {
        habitId: string;
        isActive: boolean;
      }) => Promise<unknown>;
      onSuccess: (_data: unknown, variables: { habitId: string }) => Promise<void>;
    };

    await mutationOptions.mutationFn({
      habitId: "habit-1",
      isActive: false,
    });

    expect(mockSetHabitActiveState).toHaveBeenCalledWith(
      "user-1",
      "habit-1",
      false,
    );

    await mutationOptions.onSuccess({}, { habitId: "habit-1" });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: getHabitDetailQueryKey("user-1", "habit-1"),
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: getEligibleHabitsQueryKey("user-1", "2026-04-24"),
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: getUpcomingActiveHabitsQueryKey("user-1", "2026-04-24"),
    });
  });

  it("logs active-state mutation failures with habit and user context", () => {
    useSetHabitActiveStateMutation();

    const mutationOptions = mockUseMutation.mock.calls[0]?.[0] as {
      onError: (
        error: Error,
        variables: { habitId: string; isActive: boolean },
      ) => void;
    };
    const updateError = new Error("toggle failed");

    mutationOptions.onError(updateError, {
      habitId: "habit-1",
      isActive: true,
    });

    expect(mockLoggerError).toHaveBeenCalledWith(
      "Habit active-state mutation failed",
      {
        error: updateError,
        habitId: "habit-1",
        isActive: true,
        userId: "user-1",
      },
    );
  });
});
