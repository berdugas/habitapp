import type { Database } from "@/lib/supabase/types";

export type WeeklyReviewRecord =
  Database["public"]["Tables"]["weekly_reviews"]["Row"];

export type UpsertWeeklyReviewPayload = {
  adjustmentNote: string;
  habitId: string;
  tinyActionTooHard: boolean | null;
  triggerWorked: boolean | null;
  wasHard: string;
  weekStart: string;
  wentWell: string;
};
