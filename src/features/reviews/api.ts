import { getHabitById } from "@/features/habits/api";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/services/logger";

import type {
  UpsertWeeklyReviewPayload,
  WeeklyReviewRecord,
} from "@/features/reviews/types";

const WEEKLY_REVIEW_ON_CONFLICT = "user_id,habit_id,week_start";

function mapWeeklyReviewPayload(
  userId: string,
  payload: UpsertWeeklyReviewPayload,
) {
  return {
    adjustment_note: payload.adjustmentNote.trim() || null,
    habit_id: payload.habitId,
    tiny_action_too_hard: payload.tinyActionTooHard,
    trigger_worked: payload.triggerWorked,
    user_id: userId,
    was_hard: payload.wasHard.trim() || null,
    week_start: payload.weekStart,
    went_well: payload.wentWell.trim() || null,
  };
}

export async function getLatestWeeklyReview(userId: string, habitId: string) {
  const { data, error } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("habit_id", habitId)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch latest weekly review", {
      error,
      habitId,
      userId,
    });
    throw error;
  }

  return (data ?? null) as WeeklyReviewRecord | null;
}

export async function getWeeklyReviewForWeek(
  userId: string,
  habitId: string,
  weekStart: string,
) {
  const { data, error } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("habit_id", habitId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch current weekly review", {
      error,
      habitId,
      userId,
      weekStart,
    });
    throw error;
  }

  return (data ?? null) as WeeklyReviewRecord | null;
}

export async function upsertWeeklyReview(
  userId: string,
  payload: UpsertWeeklyReviewPayload,
) {
  await getHabitById(userId, payload.habitId);

  const { data, error } = await supabase
    .from("weekly_reviews")
    .upsert(mapWeeklyReviewPayload(userId, payload), {
      onConflict: WEEKLY_REVIEW_ON_CONFLICT,
    })
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to upsert weekly review", {
      error,
      habitId: payload.habitId,
      userId,
      weekStart: payload.weekStart,
    });
    throw error;
  }

  return data as WeeklyReviewRecord;
}
