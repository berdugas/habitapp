import {
  exceedsLength,
  isBlank,
  isValidTimeString,
} from "@/utils/validation";

import type { HabitSetupPayload } from "@/features/habits/types";

export type HabitValidationErrors = Partial<
  Record<keyof HabitSetupPayload, string>
>;

export function normalizeHabitSetupPayload(
  payload: HabitSetupPayload,
): HabitSetupPayload {
  return {
    identityStatement: payload.identityStatement.trim(),
    name: payload.name.trim(),
    preferredTimeWindow: payload.preferredTimeWindow.trim(),
    reminderEnabled: payload.reminderEnabled,
    reminderTime: payload.reminderTime.trim(),
    stackTrigger: payload.stackTrigger.trim(),
    tinyAction: payload.tinyAction.trim(),
  };
}

export function validateHabitSetupPayload(payload: HabitSetupPayload) {
  const normalizedPayload = normalizeHabitSetupPayload(payload);
  const errors: HabitValidationErrors = {};

  if (isBlank(normalizedPayload.name)) {
    errors.name = "Habit name is required.";
  } else if (exceedsLength(normalizedPayload.name, 120)) {
    errors.name = "Habit name must stay under 120 characters.";
  }

  if (isBlank(normalizedPayload.stackTrigger)) {
    errors.stackTrigger = "Stack trigger is required.";
  } else if (exceedsLength(normalizedPayload.stackTrigger, 240)) {
    errors.stackTrigger = "Stack trigger must stay under 240 characters.";
  }

  if (isBlank(normalizedPayload.tinyAction)) {
    errors.tinyAction = "Tiny action is required.";
  } else if (exceedsLength(normalizedPayload.tinyAction, 240)) {
    errors.tinyAction = "Tiny action must stay under 240 characters.";
  }

  if (normalizedPayload.reminderEnabled && isBlank(normalizedPayload.reminderTime)) {
    errors.reminderTime = "Pick a reminder time or turn reminders off.";
  } else if (
    normalizedPayload.reminderEnabled &&
    !isBlank(normalizedPayload.reminderTime) &&
    !isValidTimeString(normalizedPayload.reminderTime)
  ) {
    errors.reminderTime = "Use a valid 24-hour time like 20:00.";
  }

  return errors;
}

export const validateCreateHabitPayload = validateHabitSetupPayload;
