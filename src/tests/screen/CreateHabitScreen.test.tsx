import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import CreateHabitScreen from "@/features/habits/screens/CreateHabitScreen";

const mockReplace = jest.fn();
const mockMutateAsync = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockFetchQuery = jest.fn();
const mockUseAuthSession = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    fetchQuery: (...args: unknown[]) => mockFetchQuery(...args),
    invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args),
  }),
}));

jest.mock("@/features/auth/hooks", () => ({
  useAuthSession: () => mockUseAuthSession(),
}));

jest.mock("@/features/habits/api", () => ({
  getEligibleHabits: jest.fn(),
}));

jest.mock("@/features/habits/hooks", () => ({
  useCreateHabitMutation: jest.fn(),
  getEligibleHabitsQueryKey: jest.fn(
    (userId: string | undefined, todayDate: string) => [
      "habits",
      "eligible",
      userId ?? "guest",
      todayDate,
    ],
  ),
}));

jest.mock("@/utils/dates", () => ({
  toDeviceDateString: jest.fn(() => "2026-04-23"),
}));

const { getEligibleHabitsQueryKey, useCreateHabitMutation } = jest.requireMock(
  "@/features/habits/hooks",
) as {
  getEligibleHabitsQueryKey: jest.Mock;
  useCreateHabitMutation: jest.Mock;
};

describe("CreateHabitScreen", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: { user: { id: "user-1" } },
      user: { id: "user-1" },
    });
    useCreateHabitMutation.mockReturnValue({
      isPending: false,
      mutateAsync: mockMutateAsync,
    });
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockFetchQuery.mockResolvedValue([
      {
        id: "habit-1",
      },
    ]);
    mockMutateAsync.mockResolvedValue({
      id: "habit-1",
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("submits the first habit, refetches eligible habits, and then routes to today", async () => {
    render(<CreateHabitScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Reading"), "Reading");
    fireEvent.changeText(
      screen.getByPlaceholderText("After I brush my teeth"),
      "I brush my teeth",
    );
    fireEvent.changeText(
      screen.getByPlaceholderText("Read 1 page"),
      "Read 1 page",
    );

    fireEvent.press(screen.getByText("Save Habit"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        identityStatement: "",
        name: "Reading",
        preferredTimeWindow: "",
        reminderEnabled: false,
        reminderTime: "",
        stackTrigger: "I brush my teeth",
        tinyAction: "Read 1 page",
      });
    });

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["habits", "eligible", "user-1", "2026-04-23"],
      });
      expect(mockFetchQuery).toHaveBeenCalledWith({
        queryFn: expect.any(Function),
        queryKey: ["habits", "eligible", "user-1", "2026-04-23"],
      });
      expect(mockReplace).toHaveBeenCalledWith("/(app)/(tabs)/today");
    });

    expect(getEligibleHabitsQueryKey).toHaveBeenCalledWith(
      "user-1",
      "2026-04-23",
    );
    expect(mockInvalidateQueries.mock.invocationCallOrder[0]).toBeLessThan(
      mockFetchQuery.mock.invocationCallOrder[0],
    );
    expect(mockFetchQuery.mock.invocationCallOrder[0]).toBeLessThan(
      mockReplace.mock.invocationCallOrder[0],
    );
  });

  it("stays on the create screen when the eligible habits refetch fails", async () => {
    mockFetchQuery.mockRejectedValueOnce(new Error("Could not refresh habits."));

    render(<CreateHabitScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Reading"), "Reading");
    fireEvent.changeText(
      screen.getByPlaceholderText("After I brush my teeth"),
      "I brush my teeth",
    );
    fireEvent.changeText(
      screen.getByPlaceholderText("Read 1 page"),
      "Read 1 page",
    );

    fireEvent.press(screen.getByText("Save Habit"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "We saved your habit, but we couldn't refresh Today right now. Try again.",
        ),
      ).toBeTruthy();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("prevents a second save while the first one is still in flight", async () => {
    let resolveSave: ((value: { id: string }) => void) | undefined;

    mockMutateAsync.mockReturnValue(
      new Promise<{ id: string }>((resolve) => {
        resolveSave = resolve;
      }),
    );

    render(<CreateHabitScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Reading"), "Reading");
    fireEvent.changeText(
      screen.getByPlaceholderText("After I brush my teeth"),
      "I brush my teeth",
    );
    fireEvent.changeText(
      screen.getByPlaceholderText("Read 1 page"),
      "Read 1 page",
    );

    fireEvent.press(screen.getByText("Save Habit"));
    fireEvent.press(screen.getByText("Save Habit"));

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);

    if (resolveSave) {
      resolveSave({ id: "habit-1" });
    }

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(app)/(tabs)/today");
    });
  });
});
