import type { Database } from "@/lib/supabase/types";

export type HabitRecord = Database["public"]["Tables"]["habits"]["Row"];

export type CreateHabitPayload = {
  identityStatement: string;
  name: string;
  preferredTimeWindow: string;
  reminderEnabled: boolean;
  reminderTime: string;
  stackTrigger: string;
  tinyAction: string;
};
