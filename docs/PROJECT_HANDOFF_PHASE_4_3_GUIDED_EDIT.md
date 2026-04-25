# Phase 4.3 Guided Edit From Suggestion

## Status

Implemented on branch `p4.3-guided-edit-from-suggestion`.

Phase 4.3 lets a user act on a rules-based habit adjustment suggestion by opening Edit Habit with contextual guidance. The app does not automatically edit habit fields.

## Implemented behavior

- Habit Detail suggestion cards include `Review suggestion`.
- `Review suggestion` routes to Edit Habit with route-only `suggestionType`.
- Edit Habit shows a `Suggested adjustment` guidance card for valid suggestion types.
- Missing or invalid `suggestionType` hides the guidance card.
- Normal `Edit habit` remains unchanged and does not pass `suggestionType`.
- Habit form hydration, validation, mutation payloads, submit lock, error handling, and return route remain unchanged.
- Users manually edit habit fields and save through the existing `Save changes` flow.

## Weekly Review contract update

Phase 4.3 also tightened Weekly Review validation because the suggestion engine depends on the structured yes/no answers.

Before:
- A user could save a weekly review with any reflection.

Now:
- A user must answer both yes/no questions before saving:
  - `Did your trigger work?`
  - `Was the tiny action too hard?`
- The visible `Unanswered` option is removed.
- The user-facing validation copy is:
  - `Answer both yes/no questions before saving.`
- Existing older reviews with `null` answers can still load. Habit Detail may display those values as `Not answered` for backwards compatibility.

## Explicitly out of scope

- AI or LLM calls.
- Schema changes.
- Suggestion persistence or history.
- Auto-apply behavior.
- Create Habit changes.
- Notifications or dashboards.

## Verification

Run before merge:

```bash
npm test -- --runInBand
npm run typecheck
```
