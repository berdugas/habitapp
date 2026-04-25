import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { SecondaryButton } from "@/components/buttons/SecondaryButton";
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
import { getHabitSuggestionEditGuidance } from "@/features/recommendations/editGuidance";
import { useGenerateHabitRewriteMutation } from "@/features/recommendations/hooks";
import { normalizeHabitAdjustmentSuggestionType } from "@/features/recommendations/types";
import { colors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { spacing } from "@/theme/spacing";
import {
  getGenerateHabitRewriteErrorMessage,
  getLoadHabitDetailErrorMessage,
  getUpdateHabitErrorMessage,
} from "@/utils/userFacingErrors";

import type { GenerateHabitRewriteResponse } from "@/features/recommendations/aiRewriteApi";

export default function EditHabitScreen() {
  const { habitId, suggestionType } = useLocalSearchParams<{
    habitId?: string | string[];
    suggestionType?: string | string[];
  }>();
  const ownedHabitQuery = useOwnedHabitQuery(habitId);
  const updateHabitMutation = useUpdateHabitMutation();
  const generateRewriteMutation = useGenerateHabitRewriteMutation();
  const hasHydratedFormRef = useRef(false);
  const submitLockRef = useRef(false);
  const normalizedSuggestionType =
    normalizeHabitAdjustmentSuggestionType(suggestionType);
  const suggestionGuidance = getHabitSuggestionEditGuidance(suggestionType);

  const [name, setName] = useState("");
  const [identityStatement, setIdentityStatement] = useState("");
  const [stackTrigger, setStackTrigger] = useState("");
  const [tinyAction, setTinyAction] = useState("");
  const [preferredTimeWindow, setPreferredTimeWindow] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [rewriteDraft, setRewriteDraft] =
    useState<GenerateHabitRewriteResponse | null>(null);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const hasGeneratedRewrite = Boolean(rewriteDraft);
  const rewriteButtonLabel = generateRewriteMutation.isPending
    ? "Generating rewrite..."
    : rewriteError
      ? "Try again"
      : hasGeneratedRewrite
        ? "Generate another rewrite"
        : "Generate rewrite";

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

  async function handleGenerateRewrite() {
    if (
      generateRewriteMutation.isPending ||
      !ownedHabitQuery.data ||
      !normalizedSuggestionType
    ) {
      return;
    }

    setRewriteDraft(null);
    setRewriteError(null);

    try {
      const response = await generateRewriteMutation.mutateAsync({
        habitId: ownedHabitQuery.data.id,
        suggestionType: normalizedSuggestionType,
      });
      setRewriteDraft(response);
    } catch {
      setRewriteError(getGenerateHabitRewriteErrorMessage());
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

      {suggestionGuidance ? (
        <View style={styles.suggestionCard}>
          <Text selectable style={styles.suggestionEyebrow}>
            Suggested adjustment
          </Text>
          <Text selectable style={styles.suggestionTitle}>
            {suggestionGuidance.title}
          </Text>
          <Text selectable style={styles.suggestionBody}>
            {suggestionGuidance.body}
          </Text>
          <Text selectable style={styles.suggestionDraftLabel}>
            {suggestionGuidance.draftTitle}
          </Text>
          <Text selectable style={styles.suggestionDraftBody}>
            {suggestionGuidance.draftBody}
          </Text>
          <Text selectable style={styles.suggestionReasonLabel}>
            Why this suggestion
          </Text>
          <Text selectable style={styles.suggestionReason}>
            {suggestionGuidance.reason}
          </Text>
          <Text selectable style={styles.aiRewriteHelper}>
            AI can suggest a rewrite, but you stay in control. It will not change
            your habit unless you edit and save it.
          </Text>
          <SecondaryButton
            disabled={generateRewriteMutation.isPending}
            label={rewriteButtonLabel}
            onPress={() => void handleGenerateRewrite()}
          />
          {rewriteError ? <ErrorState message={rewriteError} /> : null}
          {rewriteDraft ? (
            <View style={styles.aiRewriteCard}>
              <Text selectable style={styles.aiRewriteTitle}>
                AI rewrite idea
              </Text>
              <Text selectable style={styles.aiRewriteLabel}>
                Trigger
              </Text>
              <Text selectable style={styles.aiRewriteValue}>
                {rewriteDraft.suggestedStackTrigger ??
                  "No trigger change suggested"}
              </Text>
              <Text selectable style={styles.aiRewriteLabel}>
                Tiny action
              </Text>
              <Text selectable style={styles.aiRewriteValue}>
                {rewriteDraft.suggestedTinyAction ??
                  "No tiny action change suggested"}
              </Text>
              <Text selectable style={styles.aiRewriteLabel}>
                Why
              </Text>
              <Text selectable style={styles.aiRewriteValue}>
                {rewriteDraft.explanation}
              </Text>
              <Text selectable style={styles.aiRewriteNote}>
                Use this as inspiration. To use it, manually update the fields
                below and save.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

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
  aiRewriteCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  aiRewriteHelper: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  aiRewriteLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  aiRewriteNote: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  aiRewriteTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  aiRewriteValue: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
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
  suggestionBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  suggestionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  suggestionEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  suggestionDraftBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  suggestionDraftLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  suggestionReason: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  suggestionReasonLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  suggestionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
});
