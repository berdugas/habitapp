import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/features/auth/hooks";
import { createHabit, getActiveHabits } from "@/features/habits/api";
import { trackEvent } from "@/services/analytics";

import type { CreateHabitPayload } from "@/features/habits/types";

export function getActiveHabitsQueryKey(userId: string | undefined) {
  return ["habits", "active", userId ?? "guest"];
}

export function useActiveHabitsQuery() {
  const { user } = useAuthSession();

  return useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getActiveHabits(user!.id),
    queryKey: getActiveHabitsQueryKey(user?.id),
  });
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
