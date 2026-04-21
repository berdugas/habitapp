import { supabase } from "@/lib/supabase/client";
import { logger } from "@/services/logger";

import type {
  CreateHabitPayload,
  HabitRecord,
} from "@/features/habits/types";

function mapCreateHabitPayload(userId: string, payload: CreateHabitPayload) {
  return {
    identity_statement: payload.identityStatement.trim() || null,
    name: payload.name.trim(),
    preferred_time_window: payload.preferredTimeWindow.trim() || null,
    reminder_enabled: payload.reminderEnabled,
    reminder_time: payload.reminderEnabled
      ? payload.reminderTime.trim() || null
      : null,
    stack_trigger: payload.stackTrigger.trim(),
    tiny_action: payload.tinyAction.trim(),
    user_id: userId,
  };
}

export async function getActiveHabits(userId: string) {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as HabitRecord[];
}

export async function createHabit(userId: string, payload: CreateHabitPayload) {
  const { data, error } = await supabase
    .from("habits")
    .insert(mapCreateHabitPayload(userId, payload))
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to create habit", { error });
    throw error;
  }

  return data as HabitRecord;
}
