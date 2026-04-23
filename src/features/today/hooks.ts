import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthSession } from "@/features/auth/hooks";
import {
  getHabitLogsInRange,
  upsertHabitLog,
} from "@/features/habits/api";
import { useActiveHabitsQuery } from "@/features/habits/hooks";
import { toDeviceDateString } from "@/utils/dates";

import type { HabitLogStatus } from "@/features/habits/types";
import type { TodayHabitCardData } from "@/features/today/types";

export function getHabitLogsRangeQueryKey(
  userId: string | undefined,
  startDate: string,
  endDate: string,
) {
  return ["habit-logs", userId ?? "guest", startDate, endDate];
}

export function useTodayHabits() {
  const { user } = useAuthSession();
  const activeHabitsQuery = useActiveHabitsQuery();
  const todayDate = toDeviceDateString();
  const todayLogsQuery = useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getHabitLogsInRange(user!.id, todayDate, todayDate),
    queryKey: getHabitLogsRangeQueryKey(user?.id, todayDate, todayDate),
  });
  const todayLogsByHabitId = new Map(
    (todayLogsQuery.data ?? []).map((log) => [log.habit_id, log]),
  );

  return {
    ...todayLogsQuery,
    error: activeHabitsQuery.error ?? todayLogsQuery.error,
    habits: (activeHabitsQuery.data ?? []).map<TodayHabitCardData>((habit) => ({
      formula: `After ${habit.stack_trigger}, I will ${habit.tiny_action}.`,
      id: habit.id,
      name: habit.name,
      todayStatus: todayLogsByHabitId.get(habit.id)?.status ?? null,
    })),
    isLoading: activeHabitsQuery.isLoading || todayLogsQuery.isLoading,
  };
}

type UpsertTodayHabitStatusVariables = {
  habitId: string;
  status: HabitLogStatus;
};

export function useUpsertTodayHabitStatusMutation() {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      status,
    }: UpsertTodayHabitStatusVariables) => {
      if (!user?.id) {
        throw new Error("You need an account session before logging a habit.");
      }

      const todayDate = toDeviceDateString();

      return upsertHabitLog(user.id, {
        habitId,
        logDate: todayDate,
        status,
      });
    },
    onSuccess: async () => {
      if (!user?.id) {
        return;
      }

      const todayDate = toDeviceDateString();
      const queryKey = getHabitLogsRangeQueryKey(user.id, todayDate, todayDate);

      await queryClient.invalidateQueries({
        queryKey,
      });
      await queryClient.fetchQuery({
        queryFn: () => getHabitLogsInRange(user.id, todayDate, todayDate),
        queryKey,
      });
    },
  });
}
