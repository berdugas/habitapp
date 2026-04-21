import { isBlank } from "@/utils/validation";

import type { CreateHabitPayload } from "@/features/habits/types";

export type HabitValidationErrors = Partial<
  Record<keyof CreateHabitPayload, string>
>;

export function validateCreateHabitPayload(payload: CreateHabitPayload) {
  const errors: HabitValidationErrors = {};

  if (isBlank(payload.name)) {
    errors.name = "Habit name is required.";
  }

  if (isBlank(payload.stackTrigger)) {
    errors.stackTrigger = "Stack trigger is required.";
  }

  if (isBlank(payload.tinyAction)) {
    errors.tinyAction = "Tiny action is required.";
  }

  if (payload.reminderEnabled && isBlank(payload.reminderTime)) {
    errors.reminderTime = "Pick a reminder time or turn reminders off.";
  }

  return errors;
}
