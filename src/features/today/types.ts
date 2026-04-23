import type { HabitLogStatus } from "@/features/habits/types";

export type TodayHabitCardData = {
  formula: string;
  id: string;
  name: string;
  todayStatus: HabitLogStatus | null;
};
