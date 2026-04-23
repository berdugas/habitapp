import {
  exceedsLength,
  isBlank,
  isValidTimeString,
} from "@/utils/validation";

import type { CreateHabitPayload } from "@/features/habits/types";

export type HabitValidationErrors = Partial<
  Record<keyof CreateHabitPayload, string>
>;

export function validateCreateHabitPayload(payload: CreateHabitPayload) {
  const errors: HabitValidationErrors = {};

  if (isBlank(payload.name)) {
    errors.name = "Habit name is required.";
  } else if (exceedsLength(payload.name, 120)) {
    errors.name = "Habit name must stay under 120 characters.";
  }

  if (isBlank(payload.stackTrigger)) {
    errors.stackTrigger = "Stack trigger is required.";
  } else if (exceedsLength(payload.stackTrigger, 240)) {
    errors.stackTrigger = "Stack trigger must stay under 240 characters.";
  }

  if (isBlank(payload.tinyAction)) {
    errors.tinyAction = "Tiny action is required.";
  } else if (exceedsLength(payload.tinyAction, 240)) {
    errors.tinyAction = "Tiny action must stay under 240 characters.";
  }

  if (payload.reminderEnabled && isBlank(payload.reminderTime)) {
    errors.reminderTime = "Pick a reminder time or turn reminders off.";
  } else if (
    payload.reminderEnabled &&
    !isBlank(payload.reminderTime) &&
    !isValidTimeString(payload.reminderTime)
  ) {
    errors.reminderTime = "Use a valid 24-hour time like 20:00.";
  }

  return errors;
}
