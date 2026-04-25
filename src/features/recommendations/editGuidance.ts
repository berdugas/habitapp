import type { HabitAdjustmentSuggestionType } from "@/features/recommendations/types";

export type HabitSuggestionEditGuidance = {
  body: string;
  title: string;
};

export const HABIT_SUGGESTION_EDIT_GUIDANCE: Record<
  HabitAdjustmentSuggestionType,
  HabitSuggestionEditGuidance
> = {
  change_trigger: {
    body: "Try attaching this habit to a specific moment that already happens every day.",
    title: "Choose a clearer trigger",
  },
  keep_going: {
    body: "This habit seems workable. You may not need to change anything yet.",
    title: "Keep it stable",
  },
  make_tiny_action_smaller: {
    body: "Try choosing a tiny action that feels almost effortless for one week.",
    title: "Make the action smaller",
  },
  plan_for_obstacle: {
    body: "Use what got in the way last week to make one small adjustment.",
    title: "Plan around the hard part",
  },
  reduce_friction: {
    body: "Try changing the setup so starting this habit takes less effort.",
    title: "Reduce the friction",
  },
};

export function getHabitSuggestionEditGuidance(
  suggestionType: string | string[] | undefined,
): HabitSuggestionEditGuidance | null {
  const normalized = Array.isArray(suggestionType)
    ? suggestionType[0]
    : suggestionType;

  if (
    normalized === "make_tiny_action_smaller" ||
    normalized === "change_trigger" ||
    normalized === "reduce_friction" ||
    normalized === "plan_for_obstacle" ||
    normalized === "keep_going"
  ) {
    return HABIT_SUGGESTION_EDIT_GUIDANCE[normalized];
  }

  return null;
}
