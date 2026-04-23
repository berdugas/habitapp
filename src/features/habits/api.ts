import { supabase } from "@/lib/supabase/client";
import { logger } from "@/services/logger";
import { PHASE_2A_HABIT_LOG_ON_CONFLICT } from "@/features/habits/contract";

import type {
  CreateHabitPayload,
  HabitLogRecord,
  HabitRecord,
  UpsertHabitLogPayload,
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
    logger.error("Failed to fetch active habits", { error, userId });
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

export async function getHabitLogsInRange(
  userId: string,
  startDate: string,
  endDate: string,
) {
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: false });

  if (error) {
    logger.error("Failed to fetch habit logs", {
      endDate,
      error,
      startDate,
      userId,
    });
    throw error;
  }

  return (data ?? []) as HabitLogRecord[];
}

export async function upsertHabitLog(
  userId: string,
  payload: UpsertHabitLogPayload,
) {
  const { data, error } = await supabase
    .from("habit_logs")
    .upsert(
      {
        habit_id: payload.habitId,
        log_date: payload.logDate,
        note: payload.note ?? null,
        status: payload.status,
        user_id: userId,
      },
      {
        onConflict: PHASE_2A_HABIT_LOG_ON_CONFLICT,
      },
    )
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to upsert habit log", {
      error,
      habitId: payload.habitId,
      logDate: payload.logDate,
      status: payload.status,
      userId,
    });
    throw error;
  }

  return data as HabitLogRecord;
}
