import { useActiveHabitsQuery } from "@/features/habits/hooks";

import type { TodayHabitCardData } from "@/features/today/types";

export function useTodayHabits() {
  const activeHabitsQuery = useActiveHabitsQuery();

  return {
    ...activeHabitsQuery,
    habits: (activeHabitsQuery.data ?? []).map<TodayHabitCardData>((habit) => ({
      formula: `After ${habit.stack_trigger}, I will ${habit.tiny_action}.`,
      id: habit.id,
      name: habit.name,
    })),
  };
}
