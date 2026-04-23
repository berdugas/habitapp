import { fireEvent, render, screen } from "@testing-library/react-native";

import TodayScreen from "@/features/today/screens/TodayScreen";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

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
  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useUpsertTodayHabitStatusMutation.mockReturnValue({
      error: null,
      isPending: false,
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
    });
    mockMutateAsync.mockResolvedValue(undefined);
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
      upcomingHabits: [],
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
      upcomingHabits: [],
    });

    render(<TodayScreen />);

    fireEvent.press(screen.getByText("Skipped"));

    expect(mockMutateAsync).toHaveBeenCalledWith({
      habitId: "habit-1",
      status: "skipped",
    });
  });

  it("shows a friendly save error instead of the raw mutation message", () => {
    useUpsertTodayHabitStatusMutation.mockReturnValue({
      error: new Error("database exploded"),
      isPending: false,
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
    });
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
      upcomingHabits: [],
    });

    render(<TodayScreen />);

    expect(
      screen.getByText("We couldn't save today's status right now. Try again."),
    ).toBeTruthy();
  });

  it("prevents a second status write while the first one is still in flight", async () => {
    let resolveMutation: (() => void) | undefined;

    mockMutateAsync.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveMutation = resolve;
      }),
    );
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
      upcomingHabits: [],
    });

    render(<TodayScreen />);

    fireEvent.press(screen.getByText("Done"));
    fireEvent.press(screen.getByText("Done"));

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);

    if (resolveMutation) {
      resolveMutation();
    }
  });

  it("shows the upcoming state when active habits are scheduled for later", () => {
    useTodayHabits.mockReturnValue({
      error: null,
      habits: [],
      isLoading: false,
      upcomingHabits: [
        {
          formula: "After I wake up, I will Meditate for 1 minute.",
          id: "habit-2",
          name: "Meditation",
          startDate: "2026-05-02",
        },
      ],
    });

    render(<TodayScreen />);

    expect(screen.getByText("Nothing starts today yet")).toBeTruthy();
    expect(screen.getByText("Meditation")).toBeTruthy();
    expect(screen.getByText("Create another habit")).toBeTruthy();
  });
});
