import type { Database } from "@/lib/supabase/types";

export type HabitRecord = Database["public"]["Tables"]["habits"]["Row"];
export type HabitLogRecord = Database["public"]["Tables"]["habit_logs"]["Row"];
export type HabitLogStatus = Database["public"]["Enums"]["habit_log_status"];

export type HabitSetupPayload = {
  identityStatement: string;
  name: string;
  preferredTimeWindow: string;
  reminderEnabled: boolean;
  reminderTime: string;
  stackTrigger: string;
  tinyAction: string;
};

export type CreateHabitPayload = HabitSetupPayload;

export type UpsertHabitLogPayload = {
  habitId: string;
  logDate: string;
  note?: string | null;
  status: HabitLogStatus;
};
