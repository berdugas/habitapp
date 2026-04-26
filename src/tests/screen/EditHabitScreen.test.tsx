import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import EditHabitScreen from "@/features/habits/screens/EditHabitScreen";

const mockReplace = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseOwnedHabitQuery = jest.fn();
const mockUseUpdateHabitMutation = jest.fn();
const mockUseGenerateHabitRewriteMutation = jest.fn();
const mockMutateAsync = jest.fn();
const mockGenerateRewriteMutateAsync = jest.fn();
const rewriteErrorCopy =
  "We couldn't generate a rewrite right now. You can still edit this habit manually.";
const aiRewriteHelperCopy =
  "AI can suggest a rewrite, but you stay in control. It will not change your habit unless you edit and save it.";
const aiRewriteInspirationCopy =
  "Use this as inspiration. To use it, manually update the fields below and save.";
const rewriteCopiedCopy = "Rewrite copied into the form. Review it before saving.";
const noFieldChangesCopy = "No field changes were suggested.";
const noFieldChangesToCopy = "No field changes to copy.";

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

jest.mock("@/features/recommendations/hooks", () => ({
  useGenerateHabitRewriteMutation: () => mockUseGenerateHabitRewriteMutation(),
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
    mockUseGenerateHabitRewriteMutation.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync: mockGenerateRewriteMutateAsync,
    });
    mockMutateAsync.mockResolvedValue({
      id: "habit-1",
    });
    mockGenerateRewriteMutateAsync.mockResolvedValue({
      explanation:
        "This keeps the action small and tied to a clear daily moment.",
      suggestedStackTrigger: "After breakfast",
      suggestedTinyAction: "Read one paragraph",
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
    expect(
      screen.getByLabelText("Evening preferred time window selected"),
    ).toBeTruthy();
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
    expect(screen.getByText("Why this suggestion")).toBeTruthy();
    expect(screen.getByText("Suggested draft")).toBeTruthy();
    expect(screen.getByText(aiRewriteHelperCopy)).toBeTruthy();
    expect(screen.getByText("Generate rewrite")).toBeTruthy();
    expect(
      screen.getByText(
        "Try choosing a tiny action that feels almost effortless for one week.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Look at your Tiny action field and make it smaller. For example, change a big action into one small step you can do in under two minutes.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("You answered that the tiny action was too hard."),
    ).toBeTruthy();
    expect(screen.getByDisplayValue("Read 1 page")).toBeTruthy();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("shows trigger suggestion guidance for a valid suggestion type", () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });

    render(<EditHabitScreen />);

    expect(screen.getByText("Suggested adjustment")).toBeTruthy();
    expect(screen.getByText("Choose a clearer trigger")).toBeTruthy();
    expect(screen.getByText("Why this suggestion")).toBeTruthy();
    expect(screen.getByText("Suggested draft")).toBeTruthy();
    expect(screen.getByText(aiRewriteHelperCopy)).toBeTruthy();
    expect(screen.getByText("Generate rewrite")).toBeTruthy();
    expect(
      screen.getByText(
        "Try attaching this habit to a specific moment that already happens every day.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Look at your Stack trigger field and make it more specific. Try a clear moment like after breakfast or after brushing your teeth.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("You answered that the trigger did not work."),
    ).toBeTruthy();
    expect(screen.getByDisplayValue("After I brush my teeth")).toBeTruthy();
  });

  it("shows combined suggestion guidance when trigger and tiny action both need work", () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "fix_trigger_and_tiny_action",
    });

    render(<EditHabitScreen />);

    expect(screen.getByText("Suggested adjustment")).toBeTruthy();
    expect(screen.getByText("Adjust trigger and action")).toBeTruthy();
    expect(
      screen.getByText(
        "Try making the cue clearer and the action smaller for one week.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Look at both fields. Choose a specific daily moment for Stack trigger, then make the Tiny action small enough to start in under two minutes.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "You answered that the trigger did not work and the tiny action was too hard.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Generate rewrite")).toBeTruthy();
  });

  it("uses a compatible rewrite request type for the combined suggestion", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "fix_trigger_and_tiny_action",
    });

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(mockGenerateRewriteMutateAsync).toHaveBeenCalledWith({
        habitId: "habit-1",
        suggestionType: "make_tiny_action_smaller",
      });
    });
  });

  it("hides suggestion guidance for an invalid suggestion type", () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "rewrite_everything",
    });

    render(<EditHabitScreen />);

    expect(screen.queryByText("Suggested adjustment")).toBeNull();
    expect(screen.queryByText("Make the action smaller")).toBeNull();
    expect(screen.queryByText("Why this suggestion")).toBeNull();
    expect(screen.queryByText("Suggested draft")).toBeNull();
    expect(screen.queryByText(aiRewriteHelperCopy)).toBeNull();
    expect(screen.queryByText("Generate rewrite")).toBeNull();
    expect(screen.queryByText("AI rewrite idea")).toBeNull();
    expect(screen.queryByText("Copy into fields")).toBeNull();
    expect(screen.getByDisplayValue("Read 1 page")).toBeTruthy();
  });

  it("calls the rewrite mutation with only habit id and suggestion type", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(mockGenerateRewriteMutateAsync).toHaveBeenCalledWith({
        habitId: "habit-1",
        suggestionType: "change_trigger",
      });
    });
  });

  it("shows rewrite loading state while generation is pending", () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });
    mockUseGenerateHabitRewriteMutation.mockReturnValue({
      error: null,
      isPending: true,
      mutateAsync: mockGenerateRewriteMutateAsync,
    });

    render(<EditHabitScreen />);

    expect(screen.getByText("Generating rewrite...")).toBeTruthy();
  });

  it("displays the generated rewrite without changing form fields", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText("AI rewrite idea")).toBeTruthy();
    });

    expect(screen.getByText("Generate another rewrite")).toBeTruthy();
    expect(screen.getByText("Trigger")).toBeTruthy();
    expect(screen.getByText("After breakfast")).toBeTruthy();
    expect(screen.getAllByText("Tiny action").length).toBeGreaterThan(1);
    expect(screen.getByText("Read one paragraph")).toBeTruthy();
    expect(screen.getByText("Why")).toBeTruthy();
    expect(
      screen.getByText(
        "This keeps the action small and tied to a clear daily moment.",
      ),
    ).toBeTruthy();
    expect(screen.getByText(aiRewriteInspirationCopy)).toBeTruthy();
    expect(screen.getByText("Copy into fields")).toBeTruthy();
    expect(screen.getByDisplayValue("After I brush my teeth")).toBeTruthy();
    expect(screen.getByDisplayValue("Read 1 page")).toBeTruthy();
  });

  it("keeps the full generated Why explanation visible", async () => {
    const fullExplanation =
      "This shorter cue keeps the habit easy to notice while the tiny action stays small enough to begin quickly.";
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });
    mockGenerateRewriteMutateAsync.mockResolvedValueOnce({
      explanation: fullExplanation,
      suggestedStackTrigger: "breakfast",
      suggestedTinyAction: "Read one paragraph",
    });

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText(fullExplanation)).toBeTruthy();
    });
  });

  it("shows null suggested fields with no-change copy", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "keep_going",
    });
    mockGenerateRewriteMutateAsync.mockResolvedValueOnce({
      explanation: "This setup is workable for another week.",
      suggestedStackTrigger: null,
      suggestedTinyAction: null,
    });

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText("No trigger change suggested")).toBeTruthy();
    });
    expect(screen.getByText("Generate another rewrite")).toBeTruthy();
    expect(screen.getByText("No tiny action change suggested")).toBeTruthy();
    expect(screen.getByText("This setup is workable for another week.")).toBeTruthy();
    expect(screen.queryByText("Copy into fields")).toBeNull();
    expect(screen.getByText(noFieldChangesToCopy)).toBeTruthy();
  });

  it("shows the exact friendly copy when rewrite generation fails", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });
    mockGenerateRewriteMutateAsync.mockRejectedValueOnce(new Error("network"));

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText(rewriteErrorCopy)).toBeTruthy();
    });
    expect(screen.getByText("Try again")).toBeTruthy();
    expect(screen.getByDisplayValue("After I brush my teeth")).toBeTruthy();
    expect(screen.getByDisplayValue("Read 1 page")).toBeTruthy();
  });

  it("shows the exact friendly copy when malformed rewrite output is rejected", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });
    mockGenerateRewriteMutateAsync.mockRejectedValueOnce(
      new Error(rewriteErrorCopy),
    );

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText(rewriteErrorCopy)).toBeTruthy();
    });
    expect(screen.getByText("Try again")).toBeTruthy();
  });

  it("generating another rewrite replaces the previous rewrite", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });
    mockGenerateRewriteMutateAsync
      .mockResolvedValueOnce({
        explanation: "The first idea uses a morning cue.",
        suggestedStackTrigger: "After breakfast",
        suggestedTinyAction: "Read one paragraph",
      })
      .mockResolvedValueOnce({
        explanation: "The second idea uses an evening cue.",
        suggestedStackTrigger: "After dinner",
        suggestedTinyAction: "Read one sentence",
      });

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText("After breakfast")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Generate another rewrite"));

    await waitFor(() => {
      expect(screen.getByText("After dinner")).toBeTruthy();
    });

    expect(screen.getByText("Read one sentence")).toBeTruthy();
    expect(screen.getByText("The second idea uses an evening cue.")).toBeTruthy();
    expect(screen.queryByText("After breakfast")).toBeNull();
    expect(screen.queryByText("Read one paragraph")).toBeNull();
    expect(screen.queryByText("The first idea uses a morning cue.")).toBeNull();
  });

  it("failed retry hides the stale rewrite and keeps form fields unchanged", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });
    mockGenerateRewriteMutateAsync
      .mockResolvedValueOnce({
        explanation: "The first idea uses a morning cue.",
        suggestedStackTrigger: "After breakfast",
        suggestedTinyAction: "Read one paragraph",
      })
      .mockRejectedValueOnce(new Error("network"));

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText("After breakfast")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Generate another rewrite"));

    await waitFor(() => {
      expect(screen.getByText(rewriteErrorCopy)).toBeTruthy();
    });

    expect(screen.getByText("Try again")).toBeTruthy();
    expect(screen.queryByText("After breakfast")).toBeNull();
    expect(screen.queryByText("Read one paragraph")).toBeNull();
    expect(screen.queryByText("The first idea uses a morning cue.")).toBeNull();
    expect(screen.getByDisplayValue("After I brush my teeth")).toBeTruthy();
    expect(screen.getByDisplayValue("Read 1 page")).toBeTruthy();
  });

  it("copies suggested trigger and tiny action into the form without saving", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText("Copy into fields")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Copy into fields"));

    expect(screen.getByDisplayValue("breakfast")).toBeTruthy();
    expect(screen.getByDisplayValue("Read one paragraph")).toBeTruthy();
    expect(screen.getByText(rewriteCopiedCopy)).toBeTruthy();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("does not duplicate After in the preview when manually typed", () => {
    render(<EditHabitScreen />);

    fireEvent.changeText(
      screen.getByDisplayValue("After I brush my teeth"),
      "After breakfast",
    );

    expect(
      screen.getByText("After breakfast, I will Read 1 page."),
    ).toBeTruthy();
    expect(
      screen.queryByText("After After breakfast, I will Read 1 page."),
    ).toBeNull();
  });

  it("normalizes copied AI trigger values before updating the preview", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText("Copy into fields")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Copy into fields"));

    expect(screen.getByDisplayValue("breakfast")).toBeTruthy();
    expect(
      screen.getByText("After breakfast, I will Read one paragraph."),
    ).toBeTruthy();
    expect(
      screen.queryByText("After After breakfast, I will Read one paragraph."),
    ).toBeNull();
  });

  it("submits copied rewrite values only after Save changes is pressed", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText("Copy into fields")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Copy into fields"));
    expect(mockMutateAsync).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText("Save changes"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        habitId: "habit-1",
        payload: {
          identityStatement: "Become a reader",
          name: "Reading",
          preferredTimeWindow: "Evening",
          reminderEnabled: true,
          reminderTime: "20:00",
          stackTrigger: "breakfast",
          tinyAction: "Read one paragraph",
        },
      });
    });
  });

  it("keeps the existing stack trigger when the rewrite has a null trigger", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "make_tiny_action_smaller",
    });
    mockGenerateRewriteMutateAsync.mockResolvedValueOnce({
      explanation: "Only the tiny action needs to be smaller.",
      suggestedStackTrigger: null,
      suggestedTinyAction: "Read one sentence",
    });

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText("Copy into fields")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Copy into fields"));

    expect(screen.getByDisplayValue("After I brush my teeth")).toBeTruthy();
    expect(screen.getByDisplayValue("Read one sentence")).toBeTruthy();
    expect(screen.getByText(rewriteCopiedCopy)).toBeTruthy();
  });

  it("keeps the existing tiny action when the rewrite has a null tiny action", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });
    mockGenerateRewriteMutateAsync.mockResolvedValueOnce({
      explanation: "Only the trigger needs to be clearer.",
      suggestedStackTrigger: "After breakfast",
      suggestedTinyAction: null,
    });

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText("Copy into fields")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Copy into fields"));

    expect(screen.getByDisplayValue("breakfast")).toBeTruthy();
    expect(screen.getByDisplayValue("Read 1 page")).toBeTruthy();
    expect(screen.getByText(rewriteCopiedCopy)).toBeTruthy();
  });

  it("hides copy action when the rewrite has no suggested field changes", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "keep_going",
    });
    mockGenerateRewriteMutateAsync.mockResolvedValueOnce({
      explanation: "This setup is workable for another week.",
      suggestedStackTrigger: null,
      suggestedTinyAction: null,
    });

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText(noFieldChangesToCopy)).toBeTruthy();
    });

    expect(screen.queryByText("Copy into fields")).toBeNull();
    expect(screen.getByDisplayValue("After I brush my teeth")).toBeTruthy();
    expect(screen.getByDisplayValue("Read 1 page")).toBeTruthy();
    expect(screen.queryByText(noFieldChangesCopy)).toBeNull();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("clears the copy message when starting another generation", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "change_trigger",
    });
    mockGenerateRewriteMutateAsync
      .mockResolvedValueOnce({
        explanation: "The first idea uses a morning cue.",
        suggestedStackTrigger: "After breakfast",
        suggestedTinyAction: "Read one paragraph",
      })
      .mockResolvedValueOnce({
        explanation: "The second idea uses an evening cue.",
        suggestedStackTrigger: "After dinner",
        suggestedTinyAction: "Read one sentence",
      });

    render(<EditHabitScreen />);

    fireEvent.press(screen.getByText("Generate rewrite"));

    await waitFor(() => {
      expect(screen.getByText("Copy into fields")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Copy into fields"));
    expect(screen.getByText(rewriteCopiedCopy)).toBeTruthy();

    fireEvent.press(screen.getByText("Generate another rewrite"));

    await waitFor(() => {
      expect(screen.queryByText(rewriteCopiedCopy)).toBeNull();
    });
    await waitFor(() => {
      expect(screen.getByText("After dinner")).toBeTruthy();
    });
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
    mockUseLocalSearchParams.mockReturnValue({
      habitId: "habit-1",
      suggestionType: "make_tiny_action_smaller",
    });

    render(<EditHabitScreen />);

    expect(screen.getByText("Suggested draft")).toBeTruthy();
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
    fireEvent.press(screen.getByLabelText("No preference preferred time window"));
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
