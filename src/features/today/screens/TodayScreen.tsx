import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { HabitCard } from "@/components/cards/HabitCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { useTodayHabits } from "@/features/today/hooks";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export default function TodayScreen() {
  const { error, habits, isLoading } = useTodayHabits();

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
          Your first slice is working when this screen shows the habit you just
          created.
        </Text>
      </View>

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
            name={habit.name}
            onPress={() => router.push(`/(app)/habits/${habit.id}`)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
});
