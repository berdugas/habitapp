import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import EditHabitScreen from "@/features/habits/screens/EditHabitScreen";

const mockReplace = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseOwnedHabitQuery = jest.fn();
const mockUseUpdateHabitMutation = jest.fn();
const mockMutateAsync = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("@/features/habits/hooks", () => ({
  useOwnedHabitQuery: (habitId: string | string[] | undefined) =>
    mockUseOwnedHabitQuery(habitId),
  useUpdateHabitMutation: () => mockUseUpdateHabitMutation(),
}));

describe("EditHabitScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
    });
    mockUseOwnedHabitQuery.mockReturnValue({
      data: {
        id: "habit-1",
        identity_statement: "Become a reader",
        is_active: true,
        name: "Reading",
        preferred_time_window: "Evening",
        reminder_enabled: true,
        reminder_time: "20:00",
        stack_trigger: "After I brush my teeth",
        start_date: "2026-04-24",
        tiny_action: "Read 1 page",
      },
      error: null,
      isLoading: false,
    });
    mockUseUpdateHabitMutation.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync: mockMutateAsync,
    });
    mockMutateAsync.mockResolvedValue({
      id: "habit-1",
    });
  });

  it("shows a loading state while the habit form is resolving", () => {
    mockUseOwnedHabitQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
    });

    render(<EditHabitScreen />);

    expect(screen.getByText("Loading habit details...")).toBeTruthy();
  });

  it("shows a friendly error when the habit cannot be loaded", () => {
    mockUseOwnedHabitQuery.mockReturnValue({
      data: null,
      error: new Error("boom"),
      isLoading: false,
    });

    render(<EditHabitScreen />);

    expect(
      screen.getByText("We couldn't load this habit right now. Try again."),
    ).toBeTruthy();
  });

  it("prefills the editable fields from the current habit", () => {
    render(<EditHabitScreen />);

    expect(mockUseOwnedHabitQuery).toHaveBeenCalledWith("habit-1");
    expect(screen.queryByText("Suggested adjustment")).toBeNull();
    expect(screen.getByDisplayValue("Reading")).toBeTruthy();
    expect(screen.getByDisplayValue("Become a reader")).toBeTruthy();
    expect(screen.getByDisplayValue("After I brush my teeth")).toBeTruthy();
    expect(screen.getByDisplayValue("Read 1 page")).toBeTruthy();
    expect(screen.getByDisplayValue("Evening")).toBeTruthy();
    expect(screen.getByDisplayValue("20:00")).toBeTruthy();
  });

  it("shows tiny-action suggestion guidance without changing hydrated fields", () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "make_tiny_action_smaller",
    });

    render(<EditHabitScreen />);

    expect(screen.getByText("Suggested adjustment")).toBeTruthy();
    expect(screen.getByText("Make the action smaller")).toBeTruthy();
    expect(
      screen.getByText(
        "Try choosing a tiny action that feels almost effortless for one week.",
      ),
    ).toBeTruthy();
    expect(screen.getByDisplayValue("Read 1 page")).toBeTruthy();
  });

  it("shows trigger suggestion guidance for a valid suggestion type", () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });

    render(<EditHabitScreen />);

    expect(screen.getByText("Suggested adjustment")).toBeTruthy();
    expect(screen.getByText("Choose a clearer trigger")).toBeTruthy();
    expect(
      screen.getByText(
        "Try attaching this habit to a specific moment that already happens every day.",
      ),
    ).toBeTruthy();
  });

  it("hides suggestion guidance for an invalid suggestion type", () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "rewrite_everything",
    });

    render(<EditHabitScreen />);

    expect(screen.queryByText("Suggested adjustment")).toBeNull();
    expect(screen.queryByText("Make the action smaller")).toBeNull();
    expect(screen.getByDisplayValue("Read 1 page")).toBeTruthy();
  });

  it("normalizes database reminder times with seconds before showing the form", () => {
    mockUseOwnedHabitQuery.mockReturnValue({
      data: {
        id: "habit-1",
        identity_statement: "Become a reader",
        is_active: true,
        name: "Reading",
        preferred_time_window: "Evening",
        reminder_enabled: true,
        reminder_time: "20:00:00",
        stack_trigger: "After I brush my teeth",
        start_date: "2026-04-24",
        tiny_action: "Read 1 page",
      },
      error: null,
      isLoading: false,
    });

    render(<EditHabitScreen />);

    expect(screen.getByDisplayValue("20:00")).toBeTruthy();
    expect(screen.queryByDisplayValue("20:00:00")).toBeNull();
    expect(screen.queryByText("Use a valid 24-hour time like 20:00.")).toBeNull();
  });

  it("blocks blank required edits before saving", async () => {
    render(<EditHabitScreen />);

    fireEvent.changeText(screen.getByDisplayValue("Reading"), "   ");
    fireEvent.press(screen.getByText("Save changes"));

    await waitFor(() => {
      expect(
        screen.getByText("Fix the highlighted fields before saving."),
      ).toBeTruthy();
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("requires a reminder time when reminders are enabled", async () => {
    mockUseOwnedHabitQuery.mockReturnValue({
      data: {
        id: "habit-1",
        identity_statement: null,
        is_active: true,
        name: "Reading",
        preferred_time_window: null,
        reminder_enabled: false,
        reminder_time: null,
        stack_trigger: "After I brush my teeth",
        start_date: "2026-04-24",
        tiny_action: "Read 1 page",
      },
      error: null,
      isLoading: false,
    });

    render(<EditHabitScreen />);

    fireEvent(screen.getByRole("switch"), "valueChange", true);
    fireEvent.press(screen.getByText("Save changes"));

    await waitFor(() => {
      expect(
        screen.getByText("Fix the highlighted fields before saving."),
      ).toBeTruthy();
    });

    expect(screen.getByText("Pick a reminder time or turn reminders off.")).toBeTruthy();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("submits trimmed setup values and routes back to detail on success", async () => {
    render(<EditHabitScreen />);

    fireEvent.changeText(screen.getByDisplayValue("Reading"), "  Reading habit  ");
    fireEvent.changeText(
      screen.getByDisplayValue("Become a reader"),
      "  ",
    );
    fireEvent.changeText(
      screen.getByDisplayValue("After I brush my teeth"),
      "  After breakfast  ",
    );
    fireEvent.changeText(screen.getByDisplayValue("Read 1 page"), "  Read 2 pages  ");
    fireEvent.changeText(screen.getByDisplayValue("Evening"), "  ");
    fireEvent.changeText(screen.getByDisplayValue("20:00"), " 21:15 ");

    fireEvent.press(screen.getByText("Save changes"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        habitId: "habit-1",
        payload: {
          identityStatement: "",
          name: "Reading habit",
          preferredTimeWindow: "",
          reminderEnabled: true,
          reminderTime: "21:15",
          stackTrigger: "After breakfast",
          tinyAction: "Read 2 pages",
        },
      });
    });

    expect(mockReplace).toHaveBeenCalledWith("/(app)/habits/habit-1");
  });

  it("preserves user input when save fails", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("save failed"));

    render(<EditHabitScreen />);

    fireEvent.changeText(screen.getByDisplayValue("Reading"), "Reading updated");
    fireEvent.changeText(
      screen.getByDisplayValue("Read 1 page"),
      "Read 2 pages",
    );
    fireEvent.press(screen.getByText("Save changes"));

    await waitFor(() => {
      expect(
        screen.getByText("We couldn't save your changes right now. Try again."),
      ).toBeTruthy();
    });

    expect(screen.getByDisplayValue("Reading updated")).toBeTruthy();
    expect(screen.getByDisplayValue("Read 2 pages")).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
