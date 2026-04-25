export function getLatestWeeklyReviewQueryKey(
  userId: string | undefined,
  habitId: string | undefined,
) {
  return ["weekly-reviews", "latest", userId ?? "guest", habitId ?? "unknown"];
}

export function getCurrentWeeklyReviewQueryKey(
  userId: string | undefined,
  habitId: string | undefined,
  weekStart: string,
) {
  return [
    "weekly-reviews",
    "current",
    userId ?? "guest",
    habitId ?? "unknown",
    weekStart,
  ];
}
