import { fireEvent, render, screen } from "@testing-library/react-native";

import TodayScreen from "@/features/today/screens/TodayScreen";

jest.mock("@/features/today/hooks", () => ({
  useTodayHabits: jest.fn(),
  useUpsertTodayHabitStatusMutation: jest.fn(),
}));

const {
  useTodayHabits,
  useUpsertTodayHabitStatusMutation,
} = jest.requireMock("@/features/today/hooks") as {
  useTodayHabits: jest.Mock;
  useUpsertTodayHabitStatusMutation: jest.Mock;
};

describe("TodayScreen", () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useUpsertTodayHabitStatusMutation.mockReturnValue({
      error: null,
      isPending: false,
      mutate: mockMutate,
    });
  });

  it("renders the created habit and its persisted today status", () => {
    useTodayHabits.mockReturnValue({
      error: null,
      habits: [
        {
          formula: "After I brush my teeth, I will Read 1 page.",
          id: "habit-1",
          name: "Reading",
          todayStatus: "done",
        },
      ],
      isLoading: false,
    });

    render(<TodayScreen />);

    expect(screen.getByText("Reading")).toBeTruthy();
    expect(screen.getByText("Today: Done")).toBeTruthy();
  });

  it("writes a skipped status for the selected habit", () => {
    useTodayHabits.mockReturnValue({
      error: null,
      habits: [
        {
          formula: "After I brush my teeth, I will Read 1 page.",
          id: "habit-1",
          name: "Reading",
          todayStatus: null,
        },
      ],
      isLoading: false,
    });

    render(<TodayScreen />);

    fireEvent.press(screen.getByText("Skipped"));

    expect(mockMutate).toHaveBeenCalledWith({
      habitId: "habit-1",
      status: "skipped",
    });
  });
});
