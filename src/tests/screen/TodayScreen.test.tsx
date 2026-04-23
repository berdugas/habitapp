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
          consistencyRate: 2 / 3,
          formula: "After I brush my teeth, I will Read 1 page.",
          id: "habit-1",
          name: "Reading",
          skipCount: 1,
          streak: 2,
          todayStatus: "done",
        },
      ],
      isLoading: false,
    });

    render(<TodayScreen />);

    expect(screen.getByText("Reading")).toBeTruthy();
    expect(screen.getByText("Today: Done")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("67%")).toBeTruthy();
    expect(screen.getByText("2 days")).toBeTruthy();
  });

  it("writes a skipped status for the selected habit", () => {
    useTodayHabits.mockReturnValue({
      error: null,
      habits: [
        {
          consistencyRate: 0,
          formula: "After I brush my teeth, I will Read 1 page.",
          id: "habit-1",
          name: "Reading",
          skipCount: 0,
          streak: 0,
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
