import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { TextField } from "@/components/forms/TextField";
import { ToggleRow } from "@/components/forms/ToggleRow";
import {
  useOwnedHabitQuery,
  useUpdateHabitMutation,
} from "@/features/habits/hooks";
import { normalizeHabitReminderTime } from "@/features/habits/time";
import {
  normalizeHabitSetupPayload,
  validateHabitSetupPayload,
} from "@/features/habits/validators";
import { colors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { spacing } from "@/theme/spacing";
import {
  getLoadHabitDetailErrorMessage,
  getUpdateHabitErrorMessage,
} from "@/utils/userFacingErrors";

export default function EditHabitScreen() {
  const { habitId } = useLocalSearchParams<{ habitId?: string | string[] }>();
  const ownedHabitQuery = useOwnedHabitQuery(habitId);
  const updateHabitMutation = useUpdateHabitMutation();
  const hasHydratedFormRef = useRef(false);
  const submitLockRef = useRef(false);

  const [name, setName] = useState("");
  const [identityStatement, setIdentityStatement] = useState("");
  const [stackTrigger, setStackTrigger] = useState("");
  const [tinyAction, setTinyAction] = useState("");
  const [preferredTimeWindow, setPreferredTimeWindow] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const formPayload = {
    identityStatement,
    name,
    preferredTimeWindow,
    reminderEnabled,
    reminderTime,
    stackTrigger,
    tinyAction,
  };
  const normalizedPayload = normalizeHabitSetupPayload(formPayload);
  const validationErrors = useMemo(
    () => validateHabitSetupPayload(formPayload),
    [formPayload],
  );

  useEffect(() => {
    if (!ownedHabitQuery.data || hasHydratedFormRef.current) {
      return;
    }

    setName(ownedHabitQuery.data.name);
    setIdentityStatement(ownedHabitQuery.data.identity_statement ?? "");
    setStackTrigger(ownedHabitQuery.data.stack_trigger);
    setTinyAction(ownedHabitQuery.data.tiny_action);
    setPreferredTimeWindow(ownedHabitQuery.data.preferred_time_window ?? "");
    setReminderEnabled(ownedHabitQuery.data.reminder_enabled);
    setReminderTime(normalizeHabitReminderTime(ownedHabitQuery.data.reminder_time));
    hasHydratedFormRef.current = true;
  }, [ownedHabitQuery.data]);

  async function handleSave() {
    if (
      submitLockRef.current ||
      updateHabitMutation.isPending ||
      !ownedHabitQuery.data
    ) {
      return;
    }

    setFormError(null);

    if (Object.keys(validationErrors).length > 0) {
      setFormError("Fix the highlighted fields before saving.");
      return;
    }

    submitLockRef.current = true;

    try {
      await updateHabitMutation.mutateAsync({
        habitId: ownedHabitQuery.data.id,
        payload: normalizedPayload,
      });
      router.replace(`/(app)/habits/${ownedHabitQuery.data.id}`);
    } catch {
      setFormError(getUpdateHabitErrorMessage());
    } finally {
      submitLockRef.current = false;
    }
  }

  const preview =
    normalizedPayload.stackTrigger && normalizedPayload.tinyAction
      ? `After ${normalizedPayload.stackTrigger}, I will ${normalizedPayload.tinyAction}.`
      : "After I [stack trigger], I will [tiny action].";

  if (ownedHabitQuery.isLoading) {
    return <LoadingState message="Loading habit details..." />;
  }

  if (ownedHabitQuery.error || !ownedHabitQuery.data) {
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        style={styles.screen}
      >
        <Text selectable style={styles.title}>
          Edit Habit
        </Text>
        <ErrorState message={getLoadHabitDetailErrorMessage()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
    >
      <Text selectable style={styles.title}>
        Edit Habit
      </Text>

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
        disabled={updateHabitMutation.isPending}
        label={updateHabitMutation.isPending ? "Saving changes..." : "Save changes"}
        onPress={() => void handleSave()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
