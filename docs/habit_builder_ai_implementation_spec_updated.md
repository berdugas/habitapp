# Habit Builder AI Implementation Spec

## 1. Purpose

This document translates the AI behavior spec into an implementation-ready format for product, engineering, and design.

The AI in the Habit Builder MVP is a **lightweight micro-coach**.

Its purpose is to look at structured habit data and return **one short, practical suggestion** that makes the habit easier to repeat.

---

## 2. Scope

### In scope
- AI suggestions after habit creation when setup is weak
- AI suggestions after repeated misses
- AI suggestions after weekly review
- manual AI help from habit detail screen
- low-consistency hint generation
- use of optional habit context to personalize suggestions
- Apply and Dismiss actions
- suggestion storage for analytics

### Out of scope
- demographic personalization using age or gender
- open-ended chatbot
- long-form coaching conversations
- motivational essays
- multi-step plans
- therapy-like support
- voice interaction
- memory across unrelated habits

---

## 3. Personalization Strategy

Use **behavioral personalization**, not demographic personalization.

### Do not collect for MVP
- age
- gender
- occupation
- detailed health data

### Use instead
- habit setup
- recent logs
- weekly review answers
- optional habit context:
  - `motivation_reason`
  - `difficulty_expectation`
  - `common_obstacle`
  - `available_time_band`

These fields are more useful for tailoring suggestions.

---

## 4. Trigger Logic

### 4.1 Trigger A: After habit creation
Run after the user saves a newly created habit.

Condition:
- only show a suggestion if the setup is classified as weak

---

### 4.2 Trigger B: Repeated misses
Evaluate after each daily log update.

Condition:
- trigger when a habit has **2 missed days within the last 7 days**

Additional rule:
- do not auto-show the same suggestion text for the same habit more than once within 7 days

---

### 4.3 Trigger C: Weekly review
Run immediately after the weekly review is submitted.

Condition:
- always show one suggestion

---

### 4.4 Trigger D: Manual help
Run when the user taps **Suggest improvement** from the habit detail screen.

Condition:
- always run if enough habit data exists
- if not enough data exists, use the current habit setup only

---

### 4.5 Trigger E: Low consistency hint
Evaluate after a daily log update or when loading the Today / Habit Detail screen.

Condition:
- if recent consistency drops below a threshold such as **70% over recent active days**, the system may show one lightweight hint

Hint categories:
- make the action smaller
- use a clearer trigger
- prepare the environment
- move the habit to a more stable time
- focus on showing up, not doing a lot

---

## 5. Input Schemas

### 5.1 Shared habit input
```json
{
  "habit_id": "string",
  "habit_name": "string",
  "identity_statement": "string|null",
  "stack_trigger": "string",
  "tiny_action": "string",
  "preferred_time_window": "string|null"
}
```

### 5.2 Shared habit context input
```json
{
  "motivation_reason": "string|null",
  "difficulty_expectation": "very_easy|manageable|hard|null",
  "common_obstacle": "forget|busy|low_motivation|routine_changes|too_big|other|null",
  "available_time_band": "under_2_min|about_5_min|10_plus_min|null"
}
```

### 5.3 Habit creation input
```json
{
  "trigger_source": "create_habit",
  "habit": {},
  "habit_context": {}
}
```

### 5.4 Repeated misses input
```json
{
  "trigger_source": "repeated_miss",
  "habit": {},
  "habit_context": {},
  "recent_logs": [
    {
      "date": "YYYY-MM-DD",
      "status": "done|skipped|missed"
    }
  ],
  "miss_count_7d": 0,
  "skip_count_7d": 0,
  "consistency_7d": 0.0,
  "latest_note": "string|null"
}
```

### 5.5 Weekly review input
```json
{
  "trigger_source": "weekly_review",
  "habit": {},
  "habit_context": {},
  "recent_logs": [
    {
      "date": "YYYY-MM-DD",
      "status": "done|skipped|missed"
    }
  ],
  "review": {
    "easiest_habit": "string|null",
    "hardest_habit": "string|null",
    "habit_too_big": true,
    "trigger_strong_enough": false,
    "adjustment_note": "string|null"
  }
}
```

### 5.6 Manual help input
```json
{
  "trigger_source": "manual_help",
  "habit": {},
  "habit_context": {},
  "recent_logs": [
    {
      "date": "YYYY-MM-DD",
      "status": "done|skipped|missed"
    }
  ],
  "latest_review": {
    "habit_too_big": true,
    "trigger_strong_enough": false,
    "adjustment_note": "string|null"
  }
}
```

---

## 6. Output Schema

```json
{
  "show_suggestion": true,
  "category": "shrink_action|clarify_trigger|refine_identity|keep_setup|weekly_adjustment|low_consistency_hint",
  "headline": "string",
  "message": "string",
  "suggested_change": {
    "field": "tiny_action|stack_trigger|identity_statement|none",
    "current_value": "string|null",
    "proposed_value": "string|null"
  },
  "reason_code": "action_too_large|trigger_too_vague|identity_too_abstract|review_pattern|setup_is_strong|low_consistency",
  "confidence": 0.0
}
```

Rules:
- `show_suggestion` can be `false` only for habit creation when the setup is already strong
- `headline` must be short
- `message` must be 1 to 2 short sentences
- `confidence` is internal and not shown in the UI

---

## 7. Heuristic Rules Before Model Call

### 7.1 Trigger screening
- skip model call if trigger source is `create_habit` and no weakness is detected
- skip model call if a repeated-miss suggestion with the same text was shown for this habit in the last 7 days

### 7.2 Weakness heuristics

#### Large action indicators
Flag tiny action as possibly too large if it includes:
- large numbers such as 10, 20, 30, 45, 60
- long durations such as minutes over a threshold
- phrases like `1 hour`, `45 minutes`, `20 pages`, `full workout`

#### Vague trigger indicators
Flag trigger as vague if it includes terms like:
- later
- evening
- sometime
- when I feel like it
- after work
- during the day

#### Abstract identity indicators
Flag identity as abstract if it includes phrases like:
- be better
- improve myself
- be successful
- be healthier

### 7.3 Context-aware hints
Examples:
- if `difficulty_expectation = hard`, prefer shrinking the action
- if `common_obstacle = forget`, prefer clearer trigger or environment cue
- if `common_obstacle = busy`, prefer smaller action or different timing
- if `available_time_band = under_2_min`, avoid suggesting actions above that range

---

## 8. Decision Priority

If multiple issues are detected, choose only one suggestion using this order:
1. shrink the action
2. clarify the trigger
3. refine the identity
4. low-consistency hint
5. keep the setup

For weekly review and repeated misses, prefer:
1. shrink action if the habit seems too big
2. clarify trigger if the trigger seems weak
3. low-consistency hint if follow-through is weak
4. keep setup if no strong issue is found

---

## 9. Prompt Template

### 9.1 System prompt
```text
You are a habit design micro-coach inside a habit tracking app inspired by Atomic Habits.

Your job is to suggest the smallest useful change that makes a habit easier to repeat.

You must follow these rules:
- Return exactly one suggestion only.
- Be warm, practical, calm, and non-judgmental.
- Never shame the user.
- Never give long motivational speeches.
- Keep the message short and actionable.
- Prefer making the action smaller before suggesting anything else.
- Use habit context only when it improves the practicality of the suggestion.
- Do not use demographics like age or gender.
- If the setup already looks strong, confirm it instead of forcing a weak suggestion.
- Output valid JSON only.
```

### 9.2 User prompt template
```text
Trigger source: {{trigger_source}}

Habit:
- Habit name: {{habit_name}}
- Identity statement: {{identity_statement}}
- Stack trigger: {{stack_trigger}}
- Tiny action: {{tiny_action}}
- Preferred time window: {{preferred_time_window}}

Habit context:
{{habit_context_json}}

Recent logs:
{{recent_logs_json}}

Weekly review:
{{weekly_review_json}}

Return JSON with the approved schema.
```

---

## 10. Model Guardrails

Reject or repair response if:
- JSON is invalid
- more than one suggestion appears
- message is too long
- category is outside allowed enums
- language is judgmental

Fallback examples:
- `Make it smaller` / `Try reducing the action so it is easier to repeat.`
- `Use a clearer trigger` / `Attach this habit to a routine you already do every day.`
- `Keep showing up` / `Focus on repeating the smallest version this week.`

---

## 11. UI Behavior

### Suggestion card layout
Display the AI suggestion as a compact card:
- headline
- message
- Apply button
- Dismiss button

### Apply behavior
When the user taps **Apply**:
- open the relevant edit field
- prefill the proposed value
- let the user confirm save

### Dismiss behavior
When the user taps **Dismiss**:
- hide the card
- store the dismissal event

---

## 12. Suggestion Storage Schema

### Table: ai_suggestions
- id
- user_id
- habit_id
- trigger_source (`create_habit`, `repeated_miss`, `weekly_review`, `manual_help`, `low_consistency`)
- category (`shrink_action`, `clarify_trigger`, `refine_identity`, `keep_setup`, `weekly_adjustment`, `low_consistency_hint`)
- headline
- message
- suggested_field
- current_value
- proposed_value
- reason_code
- confidence
- shown_at
- applied_at nullable
- dismissed_at nullable
- model_name nullable
- input_snapshot jsonb
- output_snapshot jsonb

---

## 13. Analytics Events

Track:
- `ai_suggestion_generated`
- `ai_suggestion_shown`
- `ai_suggestion_applied`
- `ai_suggestion_dismissed`
- `ai_suggestion_failed_validation`

---

## 14. Engineering Notes

Recommended flow:
1. app triggers suggestion request
2. backend assembles structured input
3. backend runs heuristic checks
4. backend calls model if needed
5. backend validates output
6. backend stores suggestion
7. backend returns clean JSON to app

---

## 15. MVP Defaults

Use these defaults:
- repeated miss threshold: 2 misses in 7 days
- skip days excluded from consistency denominator
- low-consistency threshold: 70% over recent active days
- weekly review always generates one suggestion
- habit creation only generates suggestion if setup looks weak
- Apply opens prefilled edit state
- suggestions stored for analytics

---

## 16. Final Implementation Definition

The AI implementation for the Habit Builder MVP should behave as a **narrow, structured recommendation system** rather than an open-ended assistant.

It should trigger only at defined moments, consume structured habit data and optional habit context, produce one validated JSON suggestion, and render that suggestion as a lightweight UI card with Apply and Dismiss actions.
