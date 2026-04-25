import { HABIT_ADJUSTMENT_SUGGESTIONS } from "@/features/recommendations/copy";

import type { HabitAdjustmentSuggestionType } from "@/features/recommendations/types";

export type HabitSuggestionEditGuidance = {
  body: string;
  reason: string;
  title: string;
};

const HABIT_SUGGESTION_EDIT_GUIDANCE_COPY: Record<
  HabitAdjustmentSuggestionType,
  Omit<HabitSuggestionEditGuidance, "reason">
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

export const HABIT_SUGGESTION_EDIT_GUIDANCE: Record<
  HabitAdjustmentSuggestionType,
  HabitSuggestionEditGuidance
> = {
  change_trigger: {
    ...HABIT_SUGGESTION_EDIT_GUIDANCE_COPY.change_trigger,
    reason: HABIT_ADJUSTMENT_SUGGESTIONS.change_trigger.reason,
  },
  keep_going: {
    ...HABIT_SUGGESTION_EDIT_GUIDANCE_COPY.keep_going,
    reason: HABIT_ADJUSTMENT_SUGGESTIONS.keep_going.reason,
  },
  make_tiny_action_smaller: {
    ...HABIT_SUGGESTION_EDIT_GUIDANCE_COPY.make_tiny_action_smaller,
    reason: HABIT_ADJUSTMENT_SUGGESTIONS.make_tiny_action_smaller.reason,
  },
  plan_for_obstacle: {
    ...HABIT_SUGGESTION_EDIT_GUIDANCE_COPY.plan_for_obstacle,
    reason: HABIT_ADJUSTMENT_SUGGESTIONS.plan_for_obstacle.reason,
  },
  reduce_friction: {
    ...HABIT_SUGGESTION_EDIT_GUIDANCE_COPY.reduce_friction,
    reason: HABIT_ADJUSTMENT_SUGGESTIONS.reduce_friction.reason,
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
