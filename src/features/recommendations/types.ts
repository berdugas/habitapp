import type { HabitRecord } from "@/features/habits/types";
import type { WeeklyReviewRecord } from "@/features/reviews/types";

export type HabitAdjustmentSuggestionType =
  | "make_tiny_action_smaller"
  | "change_trigger"
  | "reduce_friction"
  | "plan_for_obstacle"
  | "keep_going";

export type HabitAdjustmentSuggestion = {
  body: string;
  reason: string;
  title: string;
  type: HabitAdjustmentSuggestionType;
};

export type HabitAdjustmentInput = {
  habit: HabitRecord;
  latestReview: WeeklyReviewRecord;
  progress: {
    consistencyRate: number;
    skipCount: number;
    streak: number;
  };
};
