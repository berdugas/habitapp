# Phase 2A Implemented Data Contract

This document is the canonical Phase 2A contract for habits and daily logging.
If earlier docs describe a simpler or conflicting model, this document wins.

## Summary

- Phase 2A keeps the implemented richer `Habit` setup model.
- Phase 2A keeps `habit_logs` as the official day-level tracking entity.
- Phase 2A keeps `done`, `skipped`, and `missed` as the official daily log statuses.
- Same-day writes are upserts that overwrite the current day row.
- `is_active` remains the official active-loop eligibility flag.
- `start_date` is implemented as part of the Phase 2A habit contract.

## Habit

| Field | Type | Required | Default | Create | Today/Home | Detail/Edit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `id` | `string` UUID | yes | DB-generated | no | yes | yes | Primary key |
| `user_id` | `string` UUID | yes | none | no | scoped query only | scoped query only | Ownership boundary |
| `name` | `string` | yes | none | yes | yes | yes | Trimmed, non-blank |
| `identity_statement` | `string \| null` | no | `null` | yes | no | yes | Supported setup field |
| `stack_trigger` | `string` | yes | none | yes | yes, via formula | yes | Used in Today formula |
| `tiny_action` | `string` | yes | none | yes | yes, via formula | yes | Used in Today formula |
| `preferred_time_window` | `string \| null` | no | `null` | yes | no | yes | Stored preference only in Phase 2A |
| `reminder_enabled` | `boolean` | yes | `false` | yes | no | yes | Stored preference only in Phase 2A |
| `reminder_time` | `string \| null` | conditional | `null` | yes | no | yes | Required when reminders are enabled |
| `start_date` | `string` (`YYYY-MM-DD`) | yes | current logical user day | system-defaulted | eligibility only | yes | Earliest logical day the habit is eligible for logging |
| `is_active` | `boolean` | yes | `true` | implicit | yes | yes | Active-loop eligibility |
| `created_at` | ISO timestamp string | yes | system-managed | no | no | no | Audit/debug |
| `updated_at` | ISO timestamp string | yes | system-managed | no | no | no | Audit/debug |

### Field classification

#### Core Phase 2A fields

- `id`
- `user_id`
- `name`
- `stack_trigger`
- `tiny_action`
- `is_active`
- `created_at`
- `updated_at`

#### Supported setup fields in Phase 2A

- `identity_statement`
- `preferred_time_window`
- `reminder_enabled`
- `reminder_time`

## HabitLog

| Field | Type | Required | Default | Used in Today | Used in progress | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | `string` UUID | yes | DB-generated | no | no | Primary key |
| `habit_id` | `string` UUID | yes | none | yes | yes | Habit foreign key |
| `user_id` | `string` UUID | yes | none | query/RLS only | query/RLS only | Direct ownership on log row |
| `log_date` | `string` (`YYYY-MM-DD`) | yes | none | yes | yes | Logical day, not event timestamp |
| `status` | `'done' \| 'skipped' \| 'missed'` | yes | none | yes | yes | Source of truth for that day |
| `note` | `string \| null` | no | `null` | no | no | Present in schema, not used in current UI |
| `created_at` | ISO timestamp string | yes | system-managed | no | no | Audit/debug |
| `updated_at` | ISO timestamp string | yes | system-managed | no | no | Updated when same-day status is overwritten |

## Locked enums and constants

### Habit log statuses

- `done`
  Meaning: the user completed the habit for that logical day.
- `skipped`
  Meaning: the user intentionally chose not to do the habit for that logical day.
- `missed`
  Meaning: the day is treated as not completed.
  Current implementation note: this is user-settable because the Today UI exposes it directly.
  Product direction note: this is not the preferred long-term behavior and is a future candidate for system-derived handling.

### Uniqueness and write rule

- Official uniqueness key: `(user_id, habit_id, log_date)`
- One owned habit log row per logical day
- Same-day writes use upsert/update semantics
- The latest valid same-day write becomes the source of truth
- No action history is preserved in Phase 2A

## Business rules

### Today and logical day

- The logical day is the app/device local day.
- `log_date` uses a device-local `YYYY-MM-DD` string.
- All create, Today, and progress logic must share the same day calculation rule.

### Active and inactive

- `is_active = true`
  The habit is part of the active Today loop and is eligible for logging.
- `is_active = false`
  The habit is excluded from Today's active list and should not receive new active-loop logs.
  Historical logs remain intact.

### Start date

- `start_date` is the eligibility floor for logging.
- A habit is eligible for logging on or after its `start_date`.
- In Phase 2A, `start_date` is system-defaulted to the current logical user day.
- There is no future-start UX in Phase 2A.
- Contract status: approved and implemented.
- Database schema, Supabase row types, create mapping, and eligibility queries all use `start_date`.

### Ownership and access

- Every habit belongs to exactly one authenticated user through `user_id`.
- Every habit log row stores `user_id` directly and must belong to the same user as its habit.
- Users may only read and write their own habits and habit logs.
- Query logic, mutation logic, and Supabase RLS must all enforce the same ownership rule.

### Progress rules

- `consistency = done / (done + missed)`
- `skipped` is excluded from the consistency denominator
- streak increases only on consecutive `done` days
- streak breaks on any non-`done` day under current implementation
- Today state comes from the persisted habit log row for the current logical day

## Decision log

- Keep the richer implemented habit fields instead of collapsing back to a simpler schema.
- Keep `habit_logs` as the Phase 2A day-level tracking model.
- Keep `done`, `skipped`, and `missed` as the official Phase 2A status model.
- Keep same-day overwrite/upsert behavior as the source of truth.
- Keep `is_active` as the official eligibility flag for the active loop.
- Do not introduce cadence, paused/archived enums, a separate check-in table, or action-history tracking in this step.
- Keep `start_date` as a required Phase 2A contract field backed by the actual schema and row types.
