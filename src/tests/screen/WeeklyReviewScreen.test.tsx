import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import WeeklyReviewScreen from "@/features/reviews/screens/WeeklyReviewScreen";

const mockReplace = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseOwnedHabitQuery = jest.fn();
const mockUseCurrentWeeklyReviewQuery = jest.fn();
const mockUseUpsertWeeklyReviewMutation = jest.fn();
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
}));

jest.mock("@/features/reviews/hooks", () => ({
  useCurrentWeeklyReviewQuery: (habitId: string | string[] | undefined) =>
    mockUseCurrentWeeklyReviewQuery(habitId),
  useUpsertWeeklyReviewMutation: () => mockUseUpsertWeeklyReviewMutation(),
}));

jest.mock("@/utils/dates", () => ({
  getWeekStartDateString: () => "2026-04-20",
}));

describe("WeeklyReviewScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
    });
    mockUseOwnedHabitQuery.mockReturnValue({
      data: {
        id: "habit-1",
        name: "Reading",
      },
      error: null,
      isLoading: false,
    });
    mockUseCurrentWeeklyReviewQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
    });
    mockUseUpsertWeeklyReviewMutation.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync: mockMutateAsync,
    });
    mockMutateAsync.mockResolvedValue({
      id: "review-1",
    });
  });

  it("shows a loading state while habit or review data is resolving", () => {
    mockUseOwnedHabitQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
    });

    render(<WeeklyReviewScreen />);

    expect(screen.getByText("Loading weekly review...")).toBeTruthy();
  });

  it("shows a friendly error when the habit or review cannot load", () => {
    mockUseCurrentWeeklyReviewQuery.mockReturnValue({
      data: null,
      error: new Error("boom"),
      isLoading: false,
    });

    render(<WeeklyReviewScreen />);

    expect(
      screen.getByText("We couldn't load this habit right now. Try again."),
    ).toBeTruthy();
  });

  it("renders the habit name and empty form for a new current-week review", () => {
    render(<WeeklyReviewScreen />);

    expect(mockUseOwnedHabitQuery).toHaveBeenCalledWith("habit-1");
    expect(mockUseCurrentWeeklyReviewQuery).toHaveBeenCalledWith("habit-1");
    expect(screen.getByText("Reading")).toBeTruthy();
    expect(screen.getByText("Week of 2026-04-20")).toBeTruthy();
    expect(screen.getByText("What went well this week?")).toBeTruthy();
    expect(screen.getByText("What was hard this week?")).toBeTruthy();
    expect(screen.getByText("Did your trigger work?")).toBeTruthy();
    expect(screen.getByText("Was the tiny action too hard?")).toBeTruthy();
  });

  it("prefills an existing current-week review", () => {
    mockUseCurrentWeeklyReviewQuery.mockReturnValue({
      data: {
        adjustment_note: "Move the book to the table",
        habit_id: "habit-1",
        id: "review-1",
        tiny_action_too_hard: false,
        trigger_worked: true,
        user_id: "user-1",
        was_hard: "Rushed mornings",
        week_start: "2026-04-20",
        went_well: "Breakfast cue worked",
      },
      error: null,
      isLoading: false,
    });

    render(<WeeklyReviewScreen />);

    expect(screen.getByDisplayValue("Breakfast cue worked")).toBeTruthy();
    expect(screen.getByDisplayValue("Rushed mornings")).toBeTruthy();
    expect(screen.getByDisplayValue("Move the book to the table")).toBeTruthy();
  });

  it("blocks a completely blank review", async () => {
    render(<WeeklyReviewScreen />);

    fireEvent.press(screen.getByText("Save weekly review"));

    await waitFor(() => {
      expect(
        screen.getByText("Add at least one reflection before saving."),
      ).toBeTruthy();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("counts a No answer as a valid reflection", async () => {
    render(<WeeklyReviewScreen />);

    fireEvent.press(screen.getByLabelText("Did your trigger work?: No"));
    fireEvent.press(screen.getByText("Save weekly review"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        adjustmentNote: "",
        habitId: "habit-1",
        tinyActionTooHard: null,
        triggerWorked: false,
        wasHard: "",
        weekStart: "2026-04-20",
        wentWell: "",
      });
    });
  });

  it("saves trimmed values and preserves true, false, and null answers", async () => {
    render(<WeeklyReviewScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText("The moment that felt easiest"),
      " Breakfast cue worked ",
    );
    fireEvent.changeText(
      screen.getByPlaceholderText("The part that got in the way"),
      " Rushed mornings ",
    );
    fireEvent.changeText(
      screen.getByPlaceholderText("One small change for next week"),
      " Move the book ",
    );
    fireEvent.press(screen.getByLabelText("Did your trigger work?: Yes"));
    fireEvent.press(screen.getByLabelText("Was the tiny action too hard?: No"));
    fireEvent.press(screen.getByText("Save weekly review"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        adjustmentNote: "Move the book",
        habitId: "habit-1",
        tinyActionTooHard: false,
        triggerWorked: true,
        wasHard: "Rushed mornings",
        weekStart: "2026-04-20",
        wentWell: "Breakfast cue worked",
      });
    });
    expect(mockReplace).toHaveBeenCalledWith("/(app)/habits/habit-1");
  });

  it("preserves input when save fails", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("save failed"));

    render(<WeeklyReviewScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText("The moment that felt easiest"),
      "I showed up",
    );
    fireEvent.press(screen.getByText("Save weekly review"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "We couldn't save your weekly review right now. Try again.",
        ),
      ).toBeTruthy();
    });

    expect(screen.getByDisplayValue("I showed up")).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
