import { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useAuthSession } from "@/features/auth/hooks";
import { getActiveHabits } from "@/features/habits/api";
import { TextField } from "@/components/forms/TextField";
import { ToggleRow } from "@/components/forms/ToggleRow";
import {
  getActiveHabitsQueryKey,
  useCreateHabitMutation,
} from "@/features/habits/hooks";
import { logger } from "@/services/logger";
import { validateCreateHabitPayload } from "@/features/habits/validators";
import { colors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { spacing } from "@/theme/spacing";
import {
  getCreateHabitErrorMessage,
  getRefreshHabitsErrorMessage,
} from "@/utils/userFacingErrors";

export default function CreateHabitScreen() {
  const [name, setName] = useState("");
  const [identityStatement, setIdentityStatement] = useState("");
  const [stackTrigger, setStackTrigger] = useState("");
  const [tinyAction, setTinyAction] = useState("");
  const [preferredTimeWindow, setPreferredTimeWindow] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  const { user } = useAuthSession();
  const queryClient = useQueryClient();
  const createHabitMutation = useCreateHabitMutation();

  const payload = {
    identityStatement,
    name,
    preferredTimeWindow,
    reminderEnabled,
    reminderTime,
    stackTrigger,
    tinyAction,
  };

  const validationErrors = useMemo(
    () => validateCreateHabitPayload(payload),
    [payload],
  );

  async function handleSave() {
    if (submitLockRef.current || createHabitMutation.isPending) {
      return;
    }

    setFormError(null);

    if (Object.keys(validationErrors).length > 0) {
      setFormError("Fill in the required fields before saving.");
      return;
    }

    submitLockRef.current = true;
    let hasSavedHabit = false;

    try {
      await createHabitMutation.mutateAsync(payload);
      hasSavedHabit = true;
      if (!user?.id) {
        throw new Error("We could not refresh your habit list right now.");
      }

      const queryKey = getActiveHabitsQueryKey(user.id);

      await queryClient.invalidateQueries({ queryKey });
      await queryClient.fetchQuery({
        queryFn: () => getActiveHabits(user.id),
        queryKey,
      });
      router.replace("/(app)/(tabs)/today");
    } catch (error) {
      logger.error("Create habit flow failed", {
        error,
        payload,
        userId: user?.id ?? null,
      });

      if (hasSavedHabit) {
        setFormError(getRefreshHabitsErrorMessage());
      } else {
        setFormError(getCreateHabitErrorMessage());
      }
    } finally {
      submitLockRef.current = false;
    }
  }

  const preview =
    stackTrigger.trim() && tinyAction.trim()
      ? `After ${stackTrigger.trim()}, I will ${tinyAction.trim()}.`
      : "After I [stack trigger], I will [tiny action].";

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
    >
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Create your first habit
        </Text>
        <Text selectable style={styles.body}>
          Keep it concrete, small, and easy to repeat.
        </Text>
      </View>

      <View style={styles.formCard}>
        {formError ? <ErrorState message={formError} /> : null}
        <TextField
          error={validationErrors.name}
          label="Habit name"
          onChangeText={setName}
          placeholder="Reading"
          value={name}
        />
        <TextField
          label="Identity statement"
          onChangeText={setIdentityStatement}
          placeholder="Become someone who reads daily"
          value={identityStatement}
        />
        <TextField
          error={validationErrors.stackTrigger}
          label="Stack trigger"
          onChangeText={setStackTrigger}
          placeholder="After I brush my teeth"
          value={stackTrigger}
        />
        <TextField
          error={validationErrors.tinyAction}
          label="Tiny action"
          onChangeText={setTinyAction}
          placeholder="Read 1 page"
          value={tinyAction}
        />
        <TextField
          label="Preferred time window"
          onChangeText={setPreferredTimeWindow}
          placeholder="Evening"
          value={preferredTimeWindow}
        />
        <ToggleRow
          description="Reminder scheduling comes in a later phase, but we capture the preference now."
          label="Reminder"
          onValueChange={setReminderEnabled}
          value={reminderEnabled}
        />
        {reminderEnabled ? (
          <TextField
            error={validationErrors.reminderTime}
            label="Reminder time"
            onChangeText={setReminderTime}
            placeholder="20:00"
            value={reminderTime}
          />
        ) : null}
      </View>

      <View style={styles.previewCard}>
        <Text selectable style={styles.previewLabel}>
          Preview
        </Text>
        <Text selectable style={styles.previewText}>
          {preview}
        </Text>
      </View>

      <PrimaryButton
        disabled={createHabitMutation.isPending}
        label={createHabitMutation.isPending ? "Saving habit..." : "Save Habit"}
        onPress={handleSave}
      />
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
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  previewCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  previewLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  previewText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 26,
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
