# Phase 4.4 Suggestion Quality & Review Contract Polish

## Status

Implemented on branch `p4.4-suggestion-quality-polish`.

Phase 4.4 makes deterministic rules-based suggestions easier to trust by showing why each suggestion appeared. This phase does not add AI, new recommendation rules, schema changes, suggestion persistence, or auto-apply behavior.

## Suggestion contract

`HabitAdjustmentSuggestion` now includes:

- `type`
- `title`
- `body`
- `reason`

`HABIT_ADJUSTMENT_SUGGESTIONS` is the source of truth for suggestion reason copy. Edit Habit guidance reuses the same reason text by suggestion type so the reason shown after Weekly Review, on Habit Detail, and on guided Edit Habit stays aligned.

## Weekly Review contract

The Phase 4.3 review contract remains in place:

- Users must answer both required yes/no questions before saving:
  - `Did your trigger work?`
  - `Was the tiny action too hard?`
- The validation copy remains:
  - `Answer both yes/no questions before saving.`
- Phase 4.4 adds helper copy before the yes/no questions:
  - `These answers help the app suggest what to adjust next week.`

## Verification

Run before review or merge:

```bash
npm test -- --runInBand
npm run typecheck
```
