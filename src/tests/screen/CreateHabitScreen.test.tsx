import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";

import CreateHabitScreen from "@/features/habits/screens/CreateHabitScreen";

const mockReplace = jest.fn();
const mockMutateAsync = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock("@/features/habits/hooks", () => ({
  useCreateHabitMutation: jest.fn(),
}));

const { useCreateHabitMutation } = jest.requireMock("@/features/habits/hooks") as {
  useCreateHabitMutation: jest.Mock;
};

describe("CreateHabitScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCreateHabitMutation.mockReturnValue({
      isPending: false,
      mutateAsync: mockMutateAsync,
    });
    mockMutateAsync.mockResolvedValue({
      id: "habit-1",
    });
  });

  it("submits the first habit and routes to today", async () => {
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
      expect(mockReplace).toHaveBeenCalledWith("/(app)/(tabs)/today");
    });
  });
});
