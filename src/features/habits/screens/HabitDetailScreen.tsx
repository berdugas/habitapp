import { useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { SecondaryButton } from "@/components/buttons/SecondaryButton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { LoadingState } from "@/components/feedback/LoadingState";
import {
  PHASE_2A_HABIT_LOG_STATUS_LABELS,
} from "@/features/habits/contract";
import {
  useHabitDetail,
  useSetHabitActiveStateMutation,
} from "@/features/habits/hooks";
import { colors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { spacing } from "@/theme/spacing";
import {
  getLoadHabitDetailErrorMessage,
  getUpdateHabitActiveStateErrorMessage,
} from "@/utils/userFacingErrors";

import type { HabitLogStatus } from "@/features/habits/types";

function formatTodayStatus(status: HabitLogStatus | null) {
  if (!status) {
    return "Today not logged yet";
  }

  return `Today: ${status[0].toUpperCase()}${status.slice(1)}`;
}

function formatConsistency(consistencyRate: number) {
  return `${Math.round(consistencyRate * 100)}%`;
}

function formatStreak(streak: number) {
  return `${streak} day${streak === 1 ? "" : "s"}`;
}

function formatDateLabel(dateString: string) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export default function HabitDetailScreen() {
  const { habitId } = useLocalSearchParams<{ habitId?: string | string[] }>();
  const activeStateSubmitLockRef = useRef(false);
  const { error, formula, habit, isLoading, isUpcoming, progress, recentLogs } =
    useHabitDetail(habitId);
  const setHabitActiveStateMutation = useSetHabitActiveStateMutation();

  async function handleActiveStatePress(nextIsActive: boolean) {
    if (
      !habit ||
      activeStateSubmitLockRef.current ||
      setHabitActiveStateMutation.isPending
    ) {
      return;
    }

    activeStateSubmitLockRef.current = true;

    try {
      await setHabitActiveStateMutation.mutateAsync({
        habitId: habit.id,
        isActive: nextIsActive,
      });
    } finally {
      activeStateSubmitLockRef.current = false;
    }
  }

  if (isLoading) {
    return <LoadingState message="Loading habit details..." />;
  }

  if (error || !habit) {
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        style={styles.screen}
      >
        <Text selectable style={styles.title}>
          Habit Detail
        </Text>
        <ErrorState message={getLoadHabitDetailErrorMessage()} />
        <SecondaryButton
          label="Back to Today"
          onPress={() => router.push("/(app)/(tabs)/today")}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
    >
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          {habit.name}
        </Text>
        <Text selectable style={styles.formula}>
          {formula}
        </Text>
      </View>

      {isUpcoming ? (
        <View style={styles.infoCard}>
          <Text selectable style={styles.infoTitle}>
            Starts on {formatDateLabel(habit.start_date)}
          </Text>
          <Text selectable style={styles.infoBody}>
            This habit is scheduled and will become loggable on its start date.
          </Text>
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text selectable style={styles.sectionTitle}>
          Setup
        </Text>
        {habit.identity_statement ? (
          <View style={styles.row}>
            <Text selectable style={styles.label}>
              Identity
            </Text>
            <Text selectable style={styles.value}>
              {habit.identity_statement}
            </Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text selectable style={styles.label}>
            Formula
          </Text>
          <Text selectable style={styles.value}>
            {formula}
          </Text>
        </View>
        {habit.preferred_time_window ? (
          <View style={styles.row}>
            <Text selectable style={styles.label}>
              Preferred time
            </Text>
            <Text selectable style={styles.value}>
              {habit.preferred_time_window}
            </Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text selectable style={styles.label}>
            Reminder
          </Text>
          <Text selectable style={styles.value}>
            {habit.reminder_enabled
              ? `Enabled${habit.reminder_time ? ` at ${habit.reminder_time}` : ""}`
              : "Disabled"}
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text selectable style={styles.sectionTitle}>
          Today
        </Text>
        <Text selectable style={styles.statusText}>
          {formatTodayStatus(progress.todayStatus)}
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text selectable style={styles.sectionTitle}>
          Progress
        </Text>
        <View style={styles.progressGrid}>
          <View style={styles.progressItem}>
            <Text selectable style={styles.progressLabel}>
              30-day skips
            </Text>
            <Text selectable style={styles.progressValue}>
              {progress.skipCount}
            </Text>
          </View>
          <View style={styles.progressItem}>
            <Text selectable style={styles.progressLabel}>
              Consistency
            </Text>
            <Text selectable style={styles.progressValue}>
              {formatConsistency(progress.consistencyRate)}
            </Text>
          </View>
          <View style={styles.progressItem}>
            <Text selectable style={styles.progressLabel}>
              Streak
            </Text>
            <Text selectable style={styles.progressValue}>
              {formatStreak(progress.streak)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text selectable style={styles.sectionTitle}>
          Recent history
        </Text>
        {recentLogs.length === 0 ? (
          <EmptyState
            body="This habit has no recent logs yet."
            title="No recent history yet"
          />
        ) : (
          recentLogs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <Text selectable style={styles.logPrimary}>
                {formatDateLabel(log.log_date)} -{" "}
                {PHASE_2A_HABIT_LOG_STATUS_LABELS[log.status]}
              </Text>
              {log.note ? (
                <Text selectable style={styles.logSecondary}>
                  {log.note}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      <View style={styles.actions}>
        {setHabitActiveStateMutation.error ? (
          <ErrorState message={getUpdateHabitActiveStateErrorMessage()} />
        ) : null}
        <View style={styles.actionHelperCard}>
          <Text selectable style={styles.actionHelperTitle}>
            {habit.is_active ? "Deactivate habit" : "Reactivate habit"}
          </Text>
          <Text selectable style={styles.actionHelperBody}>
            {habit.is_active
              ? "This removes the habit from Today, but keeps its history."
              : "This returns the habit to Today if it has already started."}
          </Text>
        </View>
        <SecondaryButton
          disabled={setHabitActiveStateMutation.isPending}
          label={habit.is_active ? "Deactivate habit" : "Reactivate habit"}
          onPress={() => void handleActiveStatePress(!habit.is_active)}
        />
        <SecondaryButton
          label="Edit habit"
          onPress={() => router.push(`/(app)/habits/${habit.id}/edit`)}
        />
        <SecondaryButton
          label="Back to Today"
          onPress={() => router.push("/(app)/(tabs)/today")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionHelperBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  actionHelperCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  actionHelperTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  actions: {
    gap: spacing.md,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xl,
  },
  formula: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  header: {
    gap: spacing.sm,
  },
  infoBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  infoTitle: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "700",
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  logPrimary: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  logRow: {
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  logSecondary: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  progressGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  progressItem: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    gap: spacing.xs,
    minWidth: 96,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  progressValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  row: {
    gap: spacing.xs,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  statusText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  value: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
});
