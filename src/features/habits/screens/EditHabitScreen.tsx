import { ScrollView, StyleSheet, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { EmptyState } from "@/components/feedback/EmptyState";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export default function EditHabitScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
    >
      <Text selectable style={styles.title}>
        Edit Habit
      </Text>
      <EmptyState
        body={`Edit flow lands later. Habit ID: ${habitId ?? "unknown"}.`}
        title="Route scaffolded for the next phase"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    padding: spacing.xl,
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
