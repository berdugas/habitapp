// @ts-nocheck - Supabase Edge Functions run in Deno and use URL imports outside the Expo TS config.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.0";

type SuggestionType =
  | "fix_trigger_and_tiny_action"
  | "make_tiny_action_smaller"
  | "change_trigger"
  | "reduce_friction"
  | "plan_for_obstacle"
  | "keep_going";

type HabitRecord = {
  id: string;
  identity_statement: string | null;
  name: string;
  preferred_time_window: string | null;
  stack_trigger: string;
  tiny_action: string;
  user_id: string;
};

type WeeklyReviewRecord = {
  adjustment_note: string | null;
  tiny_action_too_hard: boolean | null;
  trigger_worked: boolean | null;
  was_hard: string | null;
  went_well: string | null;
};

type HabitLogRecord = {
  log_date: string;
  status: "done" | "skipped" | "missed";
  updated_at: string;
};

type ProgressSummary = {
  consistencyRate: number;
  skipCount: number;
  streak: number;
};

type GenerateHabitRewriteResponse = {
  suggestedStackTrigger: string | null;
  suggestedTinyAction: string | null;
  explanation: string;
};

const ALLOWED_SUGGESTION_TYPES = new Set<SuggestionType>([
  "fix_trigger_and_tiny_action",
  "make_tiny_action_smaller",
  "change_trigger",
  "reduce_friction",
  "plan_for_obstacle",
  "keep_going",
]);
const RESPONSE_KEYS = [
  "suggestedStackTrigger",
  "suggestedTinyAction",
  "explanation",
] as const;
const TRIGGER_MAX_LENGTH = 120;
const TINY_ACTION_MAX_LENGTH = 120;
const EXPLANATION_MAX_LENGTH = 360;
const PROGRESS_WINDOW_DAYS = 30;
const KIMI_TIMEOUT_MS = 12000;
const CONTEXT_FIELD_MAX_LENGTH = 240;

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
}

function safeError(status = 400, reason = "unknown", meta?: Record<string, unknown>) {
  console.error("[generate-habit-rewrite]", {
    meta: meta ?? {},
    reason,
    status,
  });

  return jsonResponse(
    {
      error: "Unable to generate habit rewrite.",
    },
    status,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateRequestBody(body: unknown) {
  if (!isRecord(body)) {
    return null;
  }

  const keys = Object.keys(body);
  if (
    keys.length !== 2 ||
    !keys.includes("habitId") ||
    !keys.includes("suggestionType") ||
    typeof body.habitId !== "string" ||
    typeof body.suggestionType !== "string" ||
    !ALLOWED_SUGGESTION_TYPES.has(body.suggestionType as SuggestionType)
  ) {
    return null;
  }

  const habitId = body.habitId.trim();
  if (!habitId) {
    return null;
  }

  return {
    habitId,
    suggestionType: body.suggestionType as SuggestionType,
  };
}

function parseModelJsonContent(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    // Some OpenAI-compatible providers still wrap JSON in markdown despite strict prompts.
  }

  const fencedMatch = content.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1]);
    } catch {
      // Fall through to the bounded object extraction below.
    }
  }

  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(content.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("Model content was not parseable JSON.");
}

function dateStringFromUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function summarizeProgress(logs: HabitLogRecord[], endDate: Date): ProgressSummary {
  const startDateString = dateStringFromUtcDate(
    addUtcDays(endDate, -(PROGRESS_WINDOW_DAYS - 1)),
  );
  const endDateString = dateStringFromUtcDate(endDate);
  const newestLogByDate = new Map<string, HabitLogRecord>();

  for (const log of logs) {
    if (log.log_date < startDateString || log.log_date > endDateString) {
      continue;
    }

    const existing = newestLogByDate.get(log.log_date);
    if (!existing || log.updated_at > existing.updated_at) {
      newestLogByDate.set(log.log_date, log);
    }
  }

  const windowLogs = Array.from(newestLogByDate.values());
  const doneCount = windowLogs.filter((log) => log.status === "done").length;
  const missedCount = windowLogs.filter((log) => log.status === "missed").length;
  const skipCount = windowLogs.filter((log) => log.status === "skipped").length;
  const denominator = doneCount + missedCount;

  let streak = 0;
  let cursor = new Date(endDate);
  for (let day = 0; day < PROGRESS_WINDOW_DAYS; day += 1) {
    const log = newestLogByDate.get(dateStringFromUtcDate(cursor));
    if (!log || log.status !== "done") {
      break;
    }

    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }

  return {
    consistencyRate: denominator === 0 ? 0 : doneCount / denominator,
    skipCount,
    streak,
  };
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

function validateRewriteResponse(value: unknown): GenerateHabitRewriteResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const keys = Object.keys(value);
  if (
    keys.length !== RESPONSE_KEYS.length ||
    !RESPONSE_KEYS.every((key) => keys.includes(key))
  ) {
    return null;
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
    return null;
  }

  const explanation = value.explanation.trim();
  if (!explanation || explanation.length > EXPLANATION_MAX_LENGTH) {
    return null;
  }

  return {
    explanation,
    suggestedStackTrigger,
    suggestedTinyAction,
  };
}

function describeInvalidKimiJson(value: unknown) {
  if (!isRecord(value)) {
    return {
      type: Array.isArray(value) ? "array" : typeof value,
    };
  }

  return {
    keys: Object.keys(value),
    valuePreview: Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        typeof entry === "string"
          ? `${entry.slice(0, 80)}${entry.length > 80 ? "..." : ""}`
          : entry === null
            ? null
            : Array.isArray(entry)
              ? "array"
              : typeof entry,
      ]),
    ),
  };
}

function boundContextString(value: string | null) {
  return value ? value.slice(0, CONTEXT_FIELD_MAX_LENGTH) : null;
}

function buildPrompt({
  habit,
  latestReview,
  progress,
  suggestionType,
}: {
  habit: HabitRecord;
  latestReview: WeeklyReviewRecord | null;
  progress: ProgressSummary;
  suggestionType: SuggestionType;
}) {
  return [
    "You help users improve small habits.",
    "",
    "Return only valid JSON with exactly these keys:",
    "{",
    '  "suggestedStackTrigger": string | null,',
    '  "suggestedTinyAction": string | null,',
    '  "explanation": string',
    "}",
    "",
    "Example valid output:",
    '{ "suggestedStackTrigger": "breakfast", "suggestedTinyAction": "Read one paragraph", "explanation": "This keeps the habit small and tied to a clear daily moment." }',
    "",
    "Rules:",
    "- Use exactly the three keys shown above.",
    "- Do not include any extra keys.",
    "- Do not use markdown.",
    "- Do not include extra commentary.",
    "- Do not create a new habit.",
    "- Do not make the habit bigger.",
    '- suggestedStackTrigger should be a short cue, not a full sentence.',
    '- suggestedStackTrigger must not start with "After".',
    "- suggestedStackTrigger should be 2 to 8 words when possible.",
    "- suggestedTinyAction should start with a verb.",
    "- Keep the tiny action small and realistic.",
    "- Prefer actions that can be started in under two minutes.",
    "- suggestedTinyAction should be 2 to 10 words when possible.",
    "- If triggerWorked is false, provide suggestedStackTrigger.",
    "- If tinyActionTooHard is true, provide suggestedTinyAction.",
    "- If triggerWorked is false and tinyActionTooHard is true, provide both fields.",
    '- If suggestionType is "fix_trigger_and_tiny_action", provide both suggestedStackTrigger and suggestedTinyAction.',
    "- explanation must be one sentence.",
    "- explanation must be 12 to 45 words.",
    "- Do not mention AI.",
    "- Do not give medical, financial, legal, or mental health advice.",
    "- If no change is needed, return null for both suggested fields and explain why.",
    "",
    "Verified context:",
    JSON.stringify({
      habit: {
        identityStatement: boundContextString(habit.identity_statement),
        name: boundContextString(habit.name),
        preferredTimeWindow: boundContextString(habit.preferred_time_window),
        stackTrigger: boundContextString(habit.stack_trigger),
        tinyAction: boundContextString(habit.tiny_action),
      },
      latestReview: latestReview
        ? {
            adjustmentNote: boundContextString(latestReview.adjustment_note),
            tinyActionTooHard: latestReview.tiny_action_too_hard,
            triggerWorked: latestReview.trigger_worked,
            wasHard: boundContextString(latestReview.was_hard),
            wentWell: boundContextString(latestReview.went_well),
          }
        : null,
      progress,
      suggestionType,
    }),
  ].join("\n");
}

async function callKimi(prompt: string) {
  const apiKey = Deno.env.get("KIMI_API_KEY");
  const baseUrl = Deno.env.get("KIMI_API_BASE_URL");
  const model = Deno.env.get("KIMI_MODEL");

  if (!apiKey || !baseUrl || !model) {
    throw new Error("Missing Kimi configuration.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), KIMI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        body: JSON.stringify({
          max_tokens: 320,
          messages: [
            {
              content:
                "Return a single JSON object only. Do not wrap the JSON in markdown or code fences.",
              role: "system",
            },
            {
              content: prompt,
              role: "user",
            },
          ],
          model,
          thinking: {
            type: "disabled",
          },
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Kimi request failed with status ${response.status}: ${errorBody.slice(
          0,
          600,
        )}`,
      );
    }

    const body = await response.json();
    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Kimi response did not include content.");
    }

    return parseModelJsonContent(content);
  } finally {
    clearTimeout(timeoutId);
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  if (request.method !== "POST") {
    return safeError(405, "method_not_allowed");
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return safeError(401, "missing_authorization");
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return safeError(400, "invalid_json_body");
  }

  const validatedRequest = validateRequestBody(requestBody);
  if (!validatedRequest) {
    return safeError(400, "invalid_request_body");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return safeError(500, "missing_supabase_configuration");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return safeError(401, "invalid_user_session", {
      message: userError?.message ?? null,
    });
  }

  const { data: habit, error: habitError } = await supabase
    .from("habits")
    .select(
      "id,user_id,name,identity_statement,stack_trigger,tiny_action,preferred_time_window",
    )
    .eq("id", validatedRequest.habitId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (habitError || !habit) {
    return safeError(404, "habit_not_found_or_not_owned", {
      message: habitError?.message ?? null,
    });
  }

  const { data: latestReview, error: latestReviewError } = await supabase
    .from("weekly_reviews")
    .select(
      "went_well,was_hard,trigger_worked,tiny_action_too_hard,adjustment_note",
    )
    .eq("habit_id", validatedRequest.habitId)
    .eq("user_id", user.id)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestReviewError) {
    return safeError(500, "latest_review_fetch_failed", {
      message: latestReviewError.message,
    });
  }

  const today = new Date();
  const startDate = dateStringFromUtcDate(
    addUtcDays(today, -(PROGRESS_WINDOW_DAYS - 1)),
  );
  const endDate = dateStringFromUtcDate(today);
  const { data: logs, error: logsError } = await supabase
    .from("habit_logs")
    .select("log_date,status,updated_at")
    .eq("habit_id", validatedRequest.habitId)
    .eq("user_id", user.id)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: false });

  if (logsError) {
    return safeError(500, "habit_logs_fetch_failed", {
      message: logsError.message,
    });
  }

  const progress = summarizeProgress((logs ?? []) as HabitLogRecord[], today);
  const prompt = buildPrompt({
    habit: habit as HabitRecord,
    latestReview: (latestReview ?? null) as WeeklyReviewRecord | null,
    progress,
    suggestionType: validatedRequest.suggestionType,
  });

  try {
    const kimiJson = await callKimi(prompt);
    const validatedResponse = validateRewriteResponse(kimiJson);

    if (!validatedResponse) {
      return safeError(502, "invalid_kimi_json_shape", {
        output: describeInvalidKimiJson(kimiJson),
      });
    }

    return jsonResponse(validatedResponse);
  } catch (error) {
    return safeError(502, "kimi_generation_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
