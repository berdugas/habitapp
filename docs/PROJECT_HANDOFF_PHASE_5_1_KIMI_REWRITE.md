# Phase 5.1 Kimi Habit Rewrite Draft

## Status

Implemented on branch `p5.1-kimi-habit-rewrite-draft`.

Phase 5.1 adds an optional Kimi-powered rewrite generator inside the existing
Edit Habit guided suggestion flow. The generated rewrite is read-only guidance:
it never writes into Stack trigger, Tiny action, or any other form field.

## Implementation Contract

- The Expo app calls `generate-habit-rewrite` through Supabase Functions.
- The app sends only `habitId` and `suggestionType`.
- The Supabase Edge Function authenticates the caller, verifies habit ownership,
  fetches habit/review/log context server-side, computes progress, and then
  calls Kimi.
- Kimi secrets must be configured only as Supabase secrets:
  - `KIMI_API_KEY`
  - `KIMI_API_BASE_URL`
  - `KIMI_MODEL`
- Do not expose Kimi credentials through `EXPO_PUBLIC_` variables.
- The function validates model JSON strictly before returning it.
- The client validates the function response again before rendering it.
- For `kimi-k2.5`, do not send custom sampling values such as `temperature`.
  The function uses `thinking: { type: "disabled" }` for this short JSON draft.

## Deferred Intentionally

Phase 5.1 intentionally does not persist AI suggestions to `ai_suggestions` yet.
This phase only validates the server-side Kimi integration and read-only rewrite
display. Apply/dismiss tracking, suggestion history, and `ai_suggestions`
persistence will come in a later phase.

Also out of scope for Phase 5.1:

- auto-fill
- Apply button
- Create Habit AI
- schema changes
- notifications
- dashboards

## Local Smoke Checklist

Run before review:

```bash
npm test -- --runInBand
npm run typecheck
```

For live Supabase function smoke, verify:

- missing auth is rejected
- invalid `suggestionType` is rejected
- non-owned habit is rejected
- missing habit is rejected
- Kimi non-JSON output is rejected
- Kimi malformed or extra-key JSON is rejected
- Kimi timeout returns the friendly client error
- valid null/null keep-going response is accepted
- valid suggested rewrite response is accepted

The exact client error copy is:

```text
We couldn't generate a rewrite right now. You can still edit this habit manually.
```

If the client shows this copy during live smoke, check Supabase Edge Function
logs for `[generate-habit-rewrite]`. The function logs safe reason codes such
as `missing_authorization`, `habit_not_found_or_not_owned`,
`missing_supabase_configuration`, `kimi_generation_failed`, or
`invalid_kimi_json_shape`.
