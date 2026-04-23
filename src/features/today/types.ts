import type { HabitLogStatus } from "@/features/habits/types";

export type TodayHabitCardData = {
  consistencyRate: number;
  formula: string;
  id: string;
  name: string;
  skipCount: number;
  streak: number;
  todayStatus: HabitLogStatus | null;
};
