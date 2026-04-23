import {
  PHASE_2A_HABIT_IMPLEMENTED_FIELDS,
  PHASE_2A_HABIT_LOG_FIELDS,
  PHASE_2A_HABIT_LOG_ON_CONFLICT,
  PHASE_2A_HABIT_LOG_STATUS_MEANINGS,
  PHASE_2A_HABIT_LOG_STATUS_VALUES,
  PHASE_2A_HABIT_PENDING_FIELDS,
  PHASE_2A_LOGICAL_DAY_FORMAT,
  PHASE_2A_LOGICAL_DAY_SOURCE,
  PHASE_2A_PROGRESS_RULES,
  PHASE_2A_START_DATE_ALIGNMENT_STATUS,
} from "@/features/habits/contract";

describe("Phase 2A habit contract", () => {
  it("locks the implemented habit fields and flags start_date as pending alignment", () => {
    expect(PHASE_2A_HABIT_IMPLEMENTED_FIELDS).toEqual([
      "id",
      "user_id",
      "name",
      "identity_statement",
      "stack_trigger",
      "tiny_action",
      "preferred_time_window",
      "reminder_enabled",
      "reminder_time",
      "is_active",
      "created_at",
      "updated_at",
    ]);
    expect(PHASE_2A_HABIT_PENDING_FIELDS).toEqual(["start_date"]);
    expect(PHASE_2A_START_DATE_ALIGNMENT_STATUS).toBe(
      "pending_implementation_alignment",
    );
  });

  it("locks the habit log field set, statuses, and owned-day uniqueness key", () => {
    expect(PHASE_2A_HABIT_LOG_FIELDS).toEqual([
      "id",
      "habit_id",
      "user_id",
      "log_date",
      "status",
      "created_at",
      "updated_at",
      "note",
    ]);
    expect(PHASE_2A_HABIT_LOG_STATUS_VALUES).toEqual([
      "done",
      "skipped",
      "missed",
    ]);
    expect(PHASE_2A_HABIT_LOG_ON_CONFLICT).toBe("user_id,habit_id,log_date");
  });

  it("locks the official status meanings and progress rules", () => {
    expect(PHASE_2A_HABIT_LOG_STATUS_MEANINGS.done).toContain("completed");
    expect(PHASE_2A_HABIT_LOG_STATUS_MEANINGS.skipped).toContain(
      "intentionally chose not to do",
    );
    expect(PHASE_2A_HABIT_LOG_STATUS_MEANINGS.missed).toContain(
      "future candidate for system-derived behavior",
    );
    expect(PHASE_2A_PROGRESS_RULES).toEqual({
      consistencyFormula: "done / (done + missed)",
      skippedExcludedFromConsistency: true,
      streakBreaksOnNonDoneDay: true,
      streakRequiresConsecutiveDoneDays: true,
    });
    expect(PHASE_2A_LOGICAL_DAY_FORMAT).toBe("YYYY-MM-DD");
    expect(PHASE_2A_LOGICAL_DAY_SOURCE).toBe("device_local_day");
  });
});
