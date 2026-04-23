import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";

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
  getActiveHabits: jest.fn(),
}));

jest.mock("@/features/habits/hooks", () => ({
  useCreateHabitMutation: jest.fn(),
  getActiveHabitsQueryKey: jest.fn((userId: string | undefined) => [
    "habits",
    "active",
    userId ?? "guest",
  ]),
}));

const { getActiveHabitsQueryKey, useCreateHabitMutation } = jest.requireMock(
  "@/features/habits/hooks",
) as {
  getActiveHabitsQueryKey: jest.Mock;
  useCreateHabitMutation: jest.Mock;
};

describe("CreateHabitScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("submits the first habit, refetches active habits, and then routes to today", async () => {
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
        queryKey: ["habits", "active", "user-1"],
      });
      expect(mockFetchQuery).toHaveBeenCalledWith({
        queryFn: expect.any(Function),
        queryKey: ["habits", "active", "user-1"],
      });
      expect(mockReplace).toHaveBeenCalledWith("/(app)/(tabs)/today");
    });

    expect(getActiveHabitsQueryKey).toHaveBeenCalledWith("user-1");
    expect(mockInvalidateQueries.mock.invocationCallOrder[0]).toBeLessThan(
      mockFetchQuery.mock.invocationCallOrder[0],
    );
    expect(mockFetchQuery.mock.invocationCallOrder[0]).toBeLessThan(
      mockReplace.mock.invocationCallOrder[0],
    );
  });

  it("stays on the create screen when the active habits refetch fails", async () => {
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
        screen.getByText("Could not refresh habits."),
      ).toBeTruthy();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
