import { fireEvent, render, screen } from "@testing-library/react-native";

import HabitDetailScreen from "@/features/habits/screens/HabitDetailScreen";

const mockPush = jest.fn();
const mockUseHabitDetail = jest.fn();
const mockUseSetHabitActiveStateMutation = jest.fn();
const mockMutateAsync = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("@/features/habits/hooks", () => ({
  useHabitDetail: (habitId: string | string[] | undefined) =>
    mockUseHabitDetail(habitId),
  useSetHabitActiveStateMutation: () => mockUseSetHabitActiveStateMutation(),
}));

describe("HabitDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
    });
    mockUseSetHabitActiveStateMutation.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync: mockMutateAsync,
    });
  });

  it("shows a loading state while the habit detail is resolving", () => {
    mockUseHabitDetail.mockReturnValue({
      error: null,
      formula: "",
      habit: null,
      isLoading: true,
      isUpcoming: false,
      progress: {
        consistencyRate: 0,
        skipCount: 0,
        streak: 0,
        todayStatus: null,
      },
      recentLogs: [],
    });

    render(<HabitDetailScreen />);

    expect(screen.getByText("Loading habit details...")).toBeTruthy();
  });

  it("shows a friendly error and safe return path when detail cannot load", () => {
    mockUseHabitDetail.mockReturnValue({
      error: new Error("boom"),
      formula: "",
      habit: null,
      isLoading: false,
      isUpcoming: false,
      progress: {
        consistencyRate: 0,
        skipCount: 0,
        streak: 0,
        todayStatus: null,
      },
      recentLogs: [],
    });

    render(<HabitDetailScreen />);

    expect(
      screen.getByText("We couldn't load this habit right now. Try again."),
    ).toBeTruthy();

    fireEvent.press(screen.getByText("Back to Today"));

    expect(mockPush).toHaveBeenCalledWith("/(app)/(tabs)/today");
  });

  it("renders habit setup, progress, and recent history", () => {
    mockUseHabitDetail.mockReturnValue({
      error: null,
      formula: "After I brush my teeth, I will Read 1 page.",
      habit: {
        id: "habit-1",
        identity_statement: "Become a reader",
        is_active: true,
        name: "Reading",
        preferred_time_window: "Evening",
        reminder_enabled: true,
        reminder_time: "20:00",
        stack_trigger: "I brush my teeth",
        start_date: "2026-04-24",
        tiny_action: "Read 1 page",
      },
      isLoading: false,
      isUpcoming: false,
      progress: {
        consistencyRate: 2 / 3,
        skipCount: 1,
        streak: 2,
        todayStatus: "done",
      },
      recentLogs: [
        {
          created_at: "2026-04-24T00:00:00.000Z",
          habit_id: "habit-1",
          id: "log-1",
          log_date: "2026-04-24",
          note: "Felt easy today",
          status: "done",
          updated_at: "2026-04-24T00:00:00.000Z",
          user_id: "user-1",
        },
        {
          created_at: "2026-04-23T00:00:00.000Z",
          habit_id: "habit-1",
          id: "log-2",
          log_date: "2026-04-23",
          note: null,
          status: "skipped",
          updated_at: "2026-04-23T00:00:00.000Z",
          user_id: "user-1",
        },
      ],
    });

    render(<HabitDetailScreen />);

    expect(mockUseHabitDetail).toHaveBeenCalledWith("habit-1");
    expect(screen.getByText("Reading")).toBeTruthy();
    expect(screen.getByText("Become a reader")).toBeTruthy();
    expect(
      screen.getAllByText("After I brush my teeth, I will Read 1 page.").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Evening")).toBeTruthy();
    expect(screen.getByText("Enabled at 20:00")).toBeTruthy();
    expect(screen.getByText("Today: Done")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("67%")).toBeTruthy();
    expect(screen.getByText("2 days")).toBeTruthy();
    expect(screen.getByText("Felt easy today")).toBeTruthy();
    expect(
      screen.getByText("This removes the habit from Today, but keeps its history."),
    ).toBeTruthy();
    expect(screen.queryByText("Delete habit")).toBeNull();
    expect(screen.queryByText("Archive habit")).toBeNull();
    expect(screen.queryByText("Pause habit")).toBeNull();

    fireEvent.press(screen.getByText("Edit habit"));

    expect(mockPush).toHaveBeenCalledWith("/(app)/habits/habit-1/edit");
  });

  it("hides optional setup fields when they are absent", () => {
    mockUseHabitDetail.mockReturnValue({
      error: null,
      formula: "After I wake up, I will Meditate for 1 minute.",
      habit: {
        id: "habit-2",
        identity_statement: null,
        is_active: true,
        name: "Meditation",
        preferred_time_window: null,
        reminder_enabled: false,
        reminder_time: null,
        stack_trigger: "I wake up",
        start_date: "2026-04-24",
        tiny_action: "Meditate for 1 minute",
      },
      isLoading: false,
      isUpcoming: false,
      progress: {
        consistencyRate: 0,
        skipCount: 0,
        streak: 0,
        todayStatus: null,
      },
      recentLogs: [],
    });

    render(<HabitDetailScreen />);

    expect(screen.queryByText("Identity")).toBeNull();
    expect(screen.queryByText("Preferred time")).toBeNull();
    expect(screen.getByText("Disabled")).toBeTruthy();
  });

  it("shows reminder times without database seconds noise", () => {
    mockUseHabitDetail.mockReturnValue({
      error: null,
      formula: "After I brush my teeth, I will Read 1 page.",
      habit: {
        id: "habit-1",
        identity_statement: null,
        is_active: true,
        name: "Reading",
        preferred_time_window: null,
        reminder_enabled: true,
        reminder_time: "20:00:00",
        stack_trigger: "I brush my teeth",
        start_date: "2026-04-24",
        tiny_action: "Read 1 page",
      },
      isLoading: false,
      isUpcoming: false,
      progress: {
        consistencyRate: 0,
        skipCount: 0,
        streak: 0,
        todayStatus: null,
      },
      recentLogs: [],
    });

    render(<HabitDetailScreen />);

    expect(screen.getByText("Enabled at 20:00")).toBeTruthy();
    expect(screen.queryByText("Enabled at 20:00:00")).toBeNull();
  });

  it("shows active future-start context and empty history for upcoming habits", () => {
    mockUseHabitDetail.mockReturnValue({
      error: null,
      formula: "After lunch, I will Stretch for 1 minute.",
      habit: {
        id: "habit-3",
        identity_statement: null,
        is_active: true,
        name: "Stretching",
        preferred_time_window: null,
        reminder_enabled: false,
        reminder_time: null,
        stack_trigger: "After lunch",
        start_date: "2026-04-26",
        tiny_action: "Stretch for 1 minute",
      },
      isLoading: false,
      isUpcoming: true,
      progress: {
        consistencyRate: 0,
        skipCount: 0,
        streak: 0,
        todayStatus: null,
      },
      recentLogs: [],
    });

    render(<HabitDetailScreen />);

    expect(screen.getByText(/Starts on/i)).toBeTruthy();
    expect(
      screen.getByText(
        "This habit is scheduled and will become loggable on its start date.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("No recent history yet")).toBeTruthy();
  });

  it("shows deactivate for active habits and updates the active state in place", () => {
    mockUseHabitDetail.mockReturnValue({
      error: null,
      formula: "After breakfast, I will Read 1 page.",
      habit: {
        id: "habit-1",
        identity_statement: null,
        is_active: true,
        name: "Reading",
        preferred_time_window: null,
        reminder_enabled: false,
        reminder_time: null,
        stack_trigger: "breakfast",
        start_date: "2026-04-24",
        tiny_action: "Read 1 page",
      },
      isLoading: false,
      isUpcoming: false,
      progress: {
        consistencyRate: 0,
        skipCount: 0,
        streak: 0,
        todayStatus: null,
      },
      recentLogs: [],
    });

    render(<HabitDetailScreen />);

    fireEvent.press(screen.getAllByText("Deactivate habit")[1]);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      habitId: "habit-1",
      isActive: false,
    });
  });

  it("shows reactivate for inactive habits", () => {
    mockUseHabitDetail.mockReturnValue({
      error: null,
      formula: "After breakfast, I will Read 1 page.",
      habit: {
        id: "habit-1",
        identity_statement: null,
        is_active: false,
        name: "Reading",
        preferred_time_window: null,
        reminder_enabled: false,
        reminder_time: null,
        stack_trigger: "breakfast",
        start_date: "2026-04-24",
        tiny_action: "Read 1 page",
      },
      isLoading: false,
      isUpcoming: false,
      progress: {
        consistencyRate: 0,
        skipCount: 0,
        streak: 0,
        todayStatus: null,
      },
      recentLogs: [],
    });

    render(<HabitDetailScreen />);

    expect(screen.getAllByText("Reactivate habit")).toHaveLength(2);
    expect(
      screen.getByText("This habit is inactive. Reactivate it to return it to Today."),
    ).toBeTruthy();
  });

  it("shows inactive future-start context for upcoming inactive habits", () => {
    mockUseHabitDetail.mockReturnValue({
      error: null,
      formula: "After breakfast, I will Read 1 page.",
      habit: {
        id: "habit-1",
        identity_statement: null,
        is_active: false,
        name: "Reading",
        preferred_time_window: null,
        reminder_enabled: false,
        reminder_time: null,
        stack_trigger: "breakfast",
        start_date: "2026-04-26",
        tiny_action: "Read 1 page",
      },
      isLoading: false,
      isUpcoming: true,
      progress: {
        consistencyRate: 0,
        skipCount: 0,
        streak: 0,
        todayStatus: null,
      },
      recentLogs: [],
    });

    render(<HabitDetailScreen />);

    expect(
      screen.getByText(
        "This habit is inactive and scheduled to start later. Reactivate it first; it will become loggable on its start date.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("This habit is inactive. Reactivate it to return it to Today."),
    ).toBeTruthy();
  });

  it("shows a friendly active-state error instead of the raw mutation message", () => {
    mockUseSetHabitActiveStateMutation.mockReturnValue({
      error: new Error("database exploded"),
      isPending: false,
      mutateAsync: mockMutateAsync,
    });
    mockUseHabitDetail.mockReturnValue({
      error: null,
      formula: "After breakfast, I will Read 1 page.",
      habit: {
        id: "habit-1",
        identity_statement: null,
        is_active: true,
        name: "Reading",
        preferred_time_window: null,
        reminder_enabled: false,
        reminder_time: null,
        stack_trigger: "breakfast",
        start_date: "2026-04-24",
        tiny_action: "Read 1 page",
      },
      isLoading: false,
      isUpcoming: false,
      progress: {
        consistencyRate: 0,
        skipCount: 0,
        streak: 0,
        todayStatus: null,
      },
      recentLogs: [],
    });

    render(<HabitDetailScreen />);

    expect(
      screen.getByText("We couldn't update this habit right now. Try again."),
    ).toBeTruthy();
  });
});
