import type {
  HabitLogRecord,
  HabitLogStatus,
  HabitRecord,
} from "@/features/habits/types";

export const PHASE_2A_HABIT_IMPLEMENTED_FIELDS: ReadonlyArray<keyof HabitRecord> = [
  "id",
  "user_id",
  "name",
  "identity_statement",
  "stack_trigger",
  "tiny_action",
  "preferred_time_window",
  "reminder_enabled",
  "reminder_time",
  "start_date",
  "is_active",
  "created_at",
  "updated_at",
];

export const PHASE_2A_HABIT_LOG_FIELDS: ReadonlyArray<keyof HabitLogRecord> = [
  "id",
  "habit_id",
  "user_id",
  "log_date",
  "status",
  "created_at",
  "updated_at",
  "note",
];

export const PHASE_2A_HABIT_LOG_STATUS_VALUES = [
  "done",
  "skipped",
  "missed",
] as const satisfies readonly HabitLogStatus[];

export const PHASE_2A_HABIT_LOG_STATUS_LABELS: Record<HabitLogStatus, string> = {
  done: "Done",
  skipped: "Skipped",
  missed: "Missed",
};

export const PHASE_2A_HABIT_LOG_STATUS_MEANINGS: Record<HabitLogStatus, string> = {
  done: "The user completed the habit for that logical day.",
  skipped: "The user intentionally chose not to do the habit for that logical day.",
  missed:
    "The day is treated as not completed. It is user-settable in the current implementation, but it is a future candidate for system-derived behavior.",
};

export const PHASE_2A_HABIT_LOG_UNIQUENESS = [
  "user_id",
  "habit_id",
  "log_date",
] as const;

export const PHASE_2A_HABIT_LOG_ON_CONFLICT =
  PHASE_2A_HABIT_LOG_UNIQUENESS.join(",");

export const PHASE_2A_PROGRESS_RULES = {
  consistencyFormula: "done / (done + missed)",
  skippedExcludedFromConsistency: true,
  streakBreaksOnNonDoneDay: true,
  streakRequiresConsecutiveDoneDays: true,
} as const;

export const PHASE_2A_LOGICAL_DAY_FORMAT = "YYYY-MM-DD";
export const PHASE_2A_LOGICAL_DAY_SOURCE = "device_local_day" as const;
export const PHASE_2A_START_DATE_ALIGNMENT_STATUS = "implemented" as const;
