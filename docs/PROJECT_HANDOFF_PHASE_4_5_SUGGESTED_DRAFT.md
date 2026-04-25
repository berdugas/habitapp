# Phase 4.5 Suggested Habit Rewrite Draft

## Status

Implemented on branch `p4.5-suggested-habit-rewrite-draft`.

Phase 4.5 adds a rules-based `Suggested draft` section to the Edit Habit guidance card. This helps the user understand what kind of manual edit to make without changing any habit form fields automatically.

## Guided edit contract

- Edit Habit guidance now includes:
  - `title`
  - `body`
  - `draftTitle`
  - `draftBody`
  - `reason`
- `reason` remains sourced from `HABIT_ADJUSTMENT_SUGGESTIONS`.
- `draftBody` is read-only guidance and is never written into `Tiny action`, `Stack trigger`, or any other form field.
- There is no apply button, copy-to-field button, schema change, persistence, or AI behavior.

## Verification

Run before review or merge:

```bash
npm test -- --runInBand
npm run typecheck
```
