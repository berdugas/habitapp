import { fireEvent, render, screen } from "@testing-library/react-native";

import TodayScreen from "@/features/today/screens/TodayScreen";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
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

  it("shows a loading state while today data is still resolving", () => {
    useTodayHabits.mockReturnValue({
      error: null,
      habits: [],
      isLoading: true,
      upcomingHabits: [],
    });

    render(<TodayScreen />);

    expect(screen.getByText("Loading your Today view...")).toBeTruthy();
    expect(screen.queryByText("No active habits yet")).toBeNull();
  });

  it("shows a friendly load error instead of an empty state when today data fails", () => {
    useTodayHabits.mockReturnValue({
      error: new Error("query failed"),
      habits: [],
      isLoading: false,
      upcomingHabits: [],
    });

    render(<TodayScreen />);

    expect(
      screen.getByText("We couldn't load your habits right now. Try again."),
    ).toBeTruthy();
    expect(screen.queryByText("No active habits yet")).toBeNull();
  });

  it("shows the softer guidance copy on the today screen", () => {
    useTodayHabits.mockReturnValue({
      error: null,
      habits: [],
      isLoading: false,
      upcomingHabits: [],
    });

    render(<TodayScreen />);

    expect(
      screen.getByText(
        "Log what happened today. Done, skipped, or missed - honesty helps you improve.",
      ),
    ).toBeTruthy();
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

  it("opens detail when an eligible habit card is pressed", () => {
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

    fireEvent.press(screen.getByLabelText("Reading details"));

    expect(mockPush).toHaveBeenCalledWith("/(app)/habits/habit-1");
  });

  it("updates the visible progress values when the hook returns refreshed persisted data", () => {
    useTodayHabits
      .mockReturnValueOnce({
        error: null,
        habits: [
          {
            consistencyRate: 0,
            formula: "After I brush my teeth, I will Read 1 page.",
            id: "habit-1",
            name: "Reading",
            skipCount: 1,
            streak: 0,
            todayStatus: "skipped",
          },
        ],
        isLoading: false,
        upcomingHabits: [],
      })
      .mockReturnValueOnce({
        error: null,
        habits: [
          {
            consistencyRate: 2 / 3,
            formula: "After I brush my teeth, I will Read 1 page.",
            id: "habit-1",
            name: "Reading",
            skipCount: 0,
            streak: 2,
            todayStatus: "done",
          },
        ],
        isLoading: false,
        upcomingHabits: [],
      });

    const { rerender } = render(<TodayScreen />);

    expect(screen.getByText("Today: Skipped")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("0%")).toBeTruthy();
    expect(screen.getByText("0 days")).toBeTruthy();

    rerender(<TodayScreen />);

    expect(screen.getByText("Today: Done")).toBeTruthy();
    expect(screen.getByText("67%")).toBeTruthy();
    expect(screen.getByText("2 days")).toBeTruthy();
  });

  it("shows that today's habit has not been logged yet when no persisted status exists", () => {
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

    expect(screen.getByText("Today not logged yet")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.getByText("0%")).toBeTruthy();
    expect(screen.getByText("0 days")).toBeTruthy();
    expect(screen.getByText("Done")).toBeTruthy();
    expect(screen.getByText("Skipped")).toBeTruthy();
    expect(screen.getByText("Missed")).toBeTruthy();
  });

  it.each([
    ["skipped", "Today: Skipped"],
    ["missed", "Today: Missed"],
  ] as const)(
    "shows the persisted %s status label",
    (todayStatus, expectedLabel) => {
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
            todayStatus,
          },
        ],
        isLoading: false,
        upcomingHabits: [],
      });

      render(<TodayScreen />);

      expect(screen.getByText(expectedLabel)).toBeTruthy();
    },
  );

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
    expect(mockPush).not.toHaveBeenCalled();
  });

  it.each([
    ["Done", "done"],
    ["Missed", "missed"],
  ] as const)(
    "writes %s for the selected habit",
    (label, status) => {
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

      fireEvent.press(screen.getByText(label));

      expect(mockMutateAsync).toHaveBeenCalledWith({
        habitId: "habit-1",
        status,
      });
    },
  );

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

  it("shows the empty state only when there are no eligible or upcoming habits", () => {
    useTodayHabits.mockReturnValue({
      error: null,
      habits: [],
      isLoading: false,
      upcomingHabits: [],
    });

    render(<TodayScreen />);

    expect(screen.getByText("No active habits yet")).toBeTruthy();
    expect(
      screen.getByText(
        "Create your first active habit and it will show up here right away.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Create your first habit")).toBeTruthy();
  });

  it("routes to Create Habit from the direct Today empty state CTA", () => {
    useTodayHabits.mockReturnValue({
      error: null,
      habits: [],
      isLoading: false,
      upcomingHabits: [],
    });

    render(<TodayScreen />);

    fireEvent.press(screen.getByText("Create your first habit"));

    expect(mockPush).toHaveBeenCalledWith("/(app)/habits/create");
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
    expect(screen.getByText(/Starts on/i)).toBeTruthy();
    expect(screen.getByText("Create another habit")).toBeTruthy();
    expect(screen.queryByText("Done")).toBeNull();
    expect(screen.queryByText("Skipped")).toBeNull();
    expect(screen.queryByText("Missed")).toBeNull();
  });

  it("opens detail when an upcoming habit card is pressed", () => {
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

    fireEvent.press(screen.getByLabelText("Meditation details"));

    expect(mockPush).toHaveBeenCalledWith("/(app)/habits/habit-2");
  });
});
