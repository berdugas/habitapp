import type { HabitLogStatus } from "@/features/habits/types";

export type TodayHabitCardData = {
  consistencyRate: number;
  formula: string;
  id: string;
  isWeeklyReviewDue: boolean;
  latestReviewWeekStart: string | null;
  name: string;
  skipCount: number;
  streak: number;
  todayStatus: HabitLogStatus | null;
};

export type UpcomingHabitCardData = {
  formula: string;
  id: string;
  name: string;
  startDate: string;
};
