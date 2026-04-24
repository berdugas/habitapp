import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthSession } from "@/features/auth/hooks";
import {
  createHabit,
  getEligibleHabits,
  getHabitById,
  getInactiveHabits,
  getHabitLogsForHabitInRange,
  getUpcomingActiveHabits,
  setHabitActiveState,
  updateHabit,
} from "@/features/habits/api";
import { summarizeHabitProgress } from "@/features/today/progress";
import { trackEvent } from "@/services/analytics";
import { logger } from "@/services/logger";
import {
  getTrailingDateRangeStrings,
  toDeviceDateString,
} from "@/utils/dates";
import { TODAY_PROGRESS_WINDOW_DAYS } from "@/features/today/constants";

import type {
  CreateHabitPayload,
  HabitSetupPayload,
  HabitLogRecord,
  HabitRecord,
} from "@/features/habits/types";

export function getEligibleHabitsQueryKey(
  userId: string | undefined,
  todayDate: string,
) {
  return ["habits", "eligible", userId ?? "guest", todayDate];
}

export function getUpcomingActiveHabitsQueryKey(
  userId: string | undefined,
  todayDate: string,
) {
  return ["habits", "upcoming", userId ?? "guest", todayDate];
}

export function getInactiveHabitsQueryKey(userId: string | undefined) {
  return ["habits", "inactive", userId ?? "guest"];
}

export function getHabitDetailQueryKey(
  userId: string | undefined,
  habitId: string | undefined,
) {
  return ["habits", "detail", userId ?? "guest", habitId ?? "unknown"];
}

export function getHabitDetailLogsQueryKey(
  userId: string | undefined,
  habitId: string | undefined,
  startDate: string,
  endDate: string,
) {
  return [
    "habit-logs",
    "detail",
    userId ?? "guest",
    habitId ?? "unknown",
    startDate,
    endDate,
  ];
}

export function useEligibleHabitsQuery() {
  const { user } = useAuthSession();
  const todayDate = toDeviceDateString();

  return useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getEligibleHabits(user!.id, todayDate),
    queryKey: getEligibleHabitsQueryKey(user?.id, todayDate),
  });
}

export function useUpcomingActiveHabitsQuery() {
  const { user } = useAuthSession();
  const todayDate = toDeviceDateString();

  return useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getUpcomingActiveHabits(user!.id, todayDate),
    queryKey: getUpcomingActiveHabitsQueryKey(user?.id, todayDate),
  });
}

type UseHabitDetailResult = {
  error: Error | null;
  formula: string;
  habit: HabitRecord | null;
  isLoading: boolean;
  isUpcoming: boolean;
  recentLogs: HabitLogRecord[];
  progress: ReturnType<typeof summarizeHabitProgress>;
};

function normalizeHabitId(habitId: string | string[] | undefined) {
  if (Array.isArray(habitId)) {
    return habitId[0];
  }

  return habitId;
}

export function useOwnedHabitQuery(
  habitIdParam: string | string[] | undefined,
) {
  const { user } = useAuthSession();
  const habitId = normalizeHabitId(habitIdParam);

  return useQuery({
    enabled: Boolean(user?.id && habitId),
    queryFn: () => getHabitById(user!.id, habitId!),
    queryKey: getHabitDetailQueryKey(user?.id, habitId),
  });
}

export function useInactiveHabitsQuery() {
  const { user } = useAuthSession();

  return useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getInactiveHabits(user!.id),
    queryKey: getInactiveHabitsQueryKey(user?.id),
  });
}

export function useHabitDetail(
  habitIdParam: string | string[] | undefined,
): UseHabitDetailResult {
  const { user } = useAuthSession();
  const habitId = normalizeHabitId(habitIdParam);
  const { endDate, startDate } = getTrailingDateRangeStrings(
    TODAY_PROGRESS_WINDOW_DAYS,
  );
  const endDateObject = new Date(`${endDate}T12:00:00`);
  const routeError = habitId ? null : new Error("Missing habit id.");

  const habitQuery = useOwnedHabitQuery(habitId);
  const habitLogsQuery = useQuery({
    enabled: Boolean(user?.id && habitId),
    queryFn: () =>
      getHabitLogsForHabitInRange(user!.id, habitId!, startDate, endDate),
    queryKey: getHabitDetailLogsQueryKey(user?.id, habitId, startDate, endDate),
  });

  const habit = habitQuery.data ?? null;
  const recentLogs = habitLogsQuery.data ?? [];

  return {
    error:
      routeError ??
      (habitQuery.error as Error | null) ??
      (habitLogsQuery.error as Error | null) ??
      null,
    formula: habit
      ? `After ${habit.stack_trigger}, I will ${habit.tiny_action}.`
      : "",
    habit,
    isLoading: !routeError && (habitQuery.isLoading || habitLogsQuery.isLoading),
    isUpcoming: habit ? habit.start_date > endDate : false,
    progress: summarizeHabitProgress({
      endDate: endDateObject,
      logs: recentLogs,
      windowDays: TODAY_PROGRESS_WINDOW_DAYS,
    }),
    recentLogs,
  };
}

export function useCreateHabitMutation() {
  const { user } = useAuthSession();

  return useMutation({
    mutationFn: async (payload: CreateHabitPayload) => {
      if (!user?.id) {
        throw new Error("You need an account session before creating a habit.");
      }

      return createHabit(user.id, payload);
    },
    onSuccess: () => {
      trackEvent("habit_created");
    },
  });
}

async function invalidateHabitSurfaceQueries(
  userId: string,
  habitId: string,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  const todayDate = toDeviceDateString();

  await queryClient.invalidateQueries({
    queryKey: getHabitDetailQueryKey(userId, habitId),
  });
  await queryClient.fetchQuery({
    queryFn: () => getHabitById(userId, habitId),
    queryKey: getHabitDetailQueryKey(userId, habitId),
  });
  await queryClient.invalidateQueries({
    queryKey: getEligibleHabitsQueryKey(userId, todayDate),
  });
  await queryClient.invalidateQueries({
    queryKey: getUpcomingActiveHabitsQueryKey(userId, todayDate),
  });
  await queryClient.invalidateQueries({
    queryKey: getInactiveHabitsQueryKey(userId),
  });
}

type UpdateHabitMutationVariables = {
  habitId: string;
  payload: HabitSetupPayload;
};

export function useUpdateHabitMutation() {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, payload }: UpdateHabitMutationVariables) => {
      if (!user?.id) {
        throw new Error("You need an account session before updating a habit.");
      }

      return updateHabit(user.id, habitId, payload);
    },
    onSuccess: async (_updatedHabit, variables) => {
      if (!user?.id) {
        return;
      }

      await invalidateHabitSurfaceQueries(user.id, variables.habitId, queryClient);
    },
    onError: (error, variables) => {
      logger.error("Habit update mutation failed", {
        error,
        habitId: variables.habitId,
        userId: user?.id ?? null,
      });
    },
  });
}

type SetHabitActiveStateVariables = {
  habitId: string;
  isActive: boolean;
};

export function useSetHabitActiveStateMutation() {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      isActive,
    }: SetHabitActiveStateVariables) => {
      if (!user?.id) {
        throw new Error(
          "You need an account session before updating a habit state.",
        );
      }

      return setHabitActiveState(user.id, habitId, isActive);
    },
    onSuccess: async (_updatedHabit, variables) => {
      if (!user?.id) {
        return;
      }

      await invalidateHabitSurfaceQueries(user.id, variables.habitId, queryClient);
    },
    onError: (error, variables) => {
      logger.error("Habit active-state mutation failed", {
        error,
        habitId: variables.habitId,
        isActive: variables.isActive,
        userId: user?.id ?? null,
      });
    },
  });
}
