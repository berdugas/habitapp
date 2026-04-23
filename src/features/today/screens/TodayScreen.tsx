import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { HabitCard } from "@/components/cards/HabitCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { LoadingState } from "@/components/feedback/LoadingState";
import {
  useTodayHabits,
  useUpsertTodayHabitStatusMutation,
} from "@/features/today/hooks";
import { colors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { spacing } from "@/theme/spacing";

import type { HabitLogStatus } from "@/features/habits/types";

const STATUS_OPTIONS: Array<{
  label: string;
  value: HabitLogStatus;
}> = [
  { label: "Done", value: "done" },
  { label: "Skipped", value: "skipped" },
  { label: "Missed", value: "missed" },
];

function formatTodayStatus(status: HabitLogStatus | null) {
  if (!status) {
    return "Today not logged yet";
  }

  return `Today: ${status[0].toUpperCase()}${status.slice(1)}`;
}

export default function TodayScreen() {
  const { error, habits, isLoading } = useTodayHabits();
  const upsertTodayHabitStatusMutation = useUpsertTodayHabitStatusMutation();

  if (isLoading) {
    return <LoadingState message="Loading your Today view..." />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
    >
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Today
        </Text>
        <Text selectable style={styles.body}>
          Stay honest with the habit today, even if the answer is skipped or
          missed.
        </Text>
      </View>

      {upsertTodayHabitStatusMutation.error ? (
        <ErrorState message={upsertTodayHabitStatusMutation.error.message} />
      ) : null}

      {habits.length === 0 ? (
        <EmptyState
          body="Create your first active habit and it will show up here right away."
          title="No active habits yet"
        />
      ) : (
        habits.map((habit) => (
          <HabitCard
            formula={habit.formula}
            key={habit.id}
            metaText={formatTodayStatus(habit.todayStatus)}
            name={habit.name}
          >
            <View style={styles.actionsRow}>
              {STATUS_OPTIONS.map((option) => {
                const isSelected = habit.todayStatus === option.value;

                return (
                  <Pressable
                    accessibilityRole="button"
                    disabled={upsertTodayHabitStatusMutation.isPending}
                    key={option.value}
                    onPress={() =>
                      upsertTodayHabitStatusMutation.mutate({
                        habitId: habit.id,
                        status: option.value,
                      })
                    }
                    style={[
                      styles.statusButton,
                      isSelected && styles.statusButtonSelected,
                    ]}
                  >
                    <Text
                      selectable
                      style={[
                        styles.statusButtonLabel,
                        isSelected && styles.statusButtonLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </HabitCard>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  body: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  statusButton: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusButtonLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  statusButtonLabelSelected: {
    color: colors.white,
  },
  statusButtonSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
});
