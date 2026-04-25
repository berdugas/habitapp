import { supabase } from "@/lib/supabase/client";
import { getGenerateHabitRewriteErrorMessage } from "@/utils/userFacingErrors";

export const GENERATE_HABIT_REWRITE_ERROR_MESSAGE =
  getGenerateHabitRewriteErrorMessage();

export type GenerateHabitRewriteClientRequest = {
  habitId: string;
  suggestionType:
    | "make_tiny_action_smaller"
    | "change_trigger"
    | "reduce_friction"
    | "plan_for_obstacle"
    | "keep_going";
};

export type GenerateHabitRewriteResponse = {
  suggestedStackTrigger: string | null;
  suggestedTinyAction: string | null;
  explanation: string;
};

const RESPONSE_KEYS = [
  "suggestedStackTrigger",
  "suggestedTinyAction",
  "explanation",
] as const;
const TRIGGER_MAX_LENGTH = 160;
const TINY_ACTION_MAX_LENGTH = 160;
const EXPLANATION_MAX_LENGTH = 360;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeNullableString(
  value: unknown,
  maxLength: number,
): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return undefined;
  }

  return trimmed || null;
}

export function validateGenerateHabitRewriteResponse(
  value: unknown,
): GenerateHabitRewriteResponse {
  if (!isRecord(value)) {
    throw new Error(GENERATE_HABIT_REWRITE_ERROR_MESSAGE);
  }

  const keys = Object.keys(value);
  if (
    keys.length !== RESPONSE_KEYS.length ||
    !RESPONSE_KEYS.every((key) => keys.includes(key))
  ) {
    throw new Error(GENERATE_HABIT_REWRITE_ERROR_MESSAGE);
  }

  const suggestedStackTrigger = normalizeNullableString(
    value.suggestedStackTrigger,
    TRIGGER_MAX_LENGTH,
  );
  const suggestedTinyAction = normalizeNullableString(
    value.suggestedTinyAction,
    TINY_ACTION_MAX_LENGTH,
  );

  if (
    suggestedStackTrigger === undefined ||
    suggestedTinyAction === undefined ||
    typeof value.explanation !== "string"
  ) {
    throw new Error(GENERATE_HABIT_REWRITE_ERROR_MESSAGE);
  }

  const explanation = value.explanation.trim();
  if (!explanation || explanation.length > EXPLANATION_MAX_LENGTH) {
    throw new Error(GENERATE_HABIT_REWRITE_ERROR_MESSAGE);
  }

  return {
    explanation,
    suggestedStackTrigger,
    suggestedTinyAction,
  };
}

export async function generateHabitRewrite(
  input: GenerateHabitRewriteClientRequest,
) {
  const { data, error } = await supabase.functions.invoke(
    "generate-habit-rewrite",
    {
      body: {
        habitId: input.habitId,
        suggestionType: input.suggestionType,
      },
    },
  );

  if (error) {
    throw new Error(GENERATE_HABIT_REWRITE_ERROR_MESSAGE);
  }

  return validateGenerateHabitRewriteResponse(data);
}
