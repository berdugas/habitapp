export function normalizeHabitReminderTime(
  reminderTime: string | null | undefined,
) {
  if (!reminderTime) {
    return "";
  }

  const trimmedReminderTime = reminderTime.trim();
  const hhmmMatch = trimmedReminderTime.match(/^([01]\d|2[0-3]):[0-5]\d/);

  if (hhmmMatch) {
    return hhmmMatch[0];
  }

  return trimmedReminderTime;
}
