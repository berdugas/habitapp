# Habit Builder Project Handoff

## Current status

Phase 2 is complete and merged into `main`.

The app now supports the core habit loop:

```text
sign in -> create habit -> Today -> log Done/Skipped/Missed -> progress updates -> habit detail -> edit -> deactivate/reactivate
```

Current milestone: **Milestone 5 / Phase 3.1 Weekly Review Foundation**.

Current reviewed feature branch: `p3-weekly-review`.

---

## Completed Phase 2

### 2.7.1 Data contract
Completed.

Locked decisions:
- Use existing richer habit model.
- Use `habit_logs` for daily tracking.
- Daily statuses are `done | skipped | missed`.
- Use `is_active` for active/inactive state for now.
- One log per user/habit/date.
- `start_date` is part of the habit contract.

### 2.7.2 Schema and `start_date` alignment
Completed.

Implemented:
- `start_date` added/backfilled.
- Create habit writes `start_date`.
- Today eligibility uses `is_active = true` and `start_date <= today`.
- Upcoming active habits use `start_date > today`.
- Pre-start logging is blocked.

### 2.1 Habit creation stabilization
Completed.

Implemented:
- Stable create form validation.
- `start_date` remains system-managed.
- Successful create routes to Today.
- Saved-but-refresh-failed still routes safely to Today.
- Duplicate-submit protection.
- Save failure preserves form input.

### 2.2 Today/Home behavior stabilization
Completed.

Implemented:
- Today supports eligible habits, upcoming-only, empty, loading, and error states.
- Upcoming habits are display-only.
- Empty state has a create CTA.
- Root flow distinguishes no session, eligible habits, upcoming-only, and empty user.

### 2.3 Daily status logging stabilization
Completed.

Implemented:
- Done / Skipped / Missed writes stabilized.
- Same-day upsert confirmed.
- Owned-day conflict key used.
- Inactive habit logging blocked.
- Pre-start logging blocked.
- Persisted `habit_logs` are source of truth.

### 2.4 Progress and streak logic stabilization
Completed.

Implemented:
- `summarizeHabitProgress()` hardened.
- Trailing window enforced internally.
- Consistency rule: `done / (done + missed)`.
- Skipped excluded from consistency denominator.
- Streak breaks on non-done days.
- Duplicate same-day fallback handled.
- Per-habit grouping tested.

### 2.8 First-time user journey polish
Completed.

Implemented:
- First-time root flow validated.
- Empty signed-in user routes to Create Habit.
- Create first habit routes to Today.
- Today shows safe no-log defaults.
- Direct Today empty state has create CTA.

### 2.5 Habit Detail View
Completed and merged.

Implemented:
- Habit Detail screen.
- Owned habit loading by `id + user_id`.
- Habit-scoped recent logs.
- Reused `summarizeHabitProgress()`.
- Setup summary, Today status, progress, recent history.
- Eligible and upcoming habits can open detail.
- Edit entry point exposed.

### 2.6 Edit Habit and Active-State Management
Completed and merged into `main`.

Implemented:
- Edit basic habit fields.
- Shared create/edit validation via `HabitSetupPayload`.
- `updateHabit()` scoped by `id + user_id`.
- `setHabitActiveState()` scoped by `id + user_id`.
- Deactivate/reactivate from Habit Detail.
- Inactive habits disappear from Today.
- Inactive habit recovery path in Settings.
- Settings inactive-habit loading/error states.
- Inactive + future-start detail copy refinement.

### Final Phase 2 smoke test
Completed.

Validated:
- first-time journey
- create habit
- Today logging
- progress updates
- Habit Detail
- Edit Habit
- deactivate/reactivate
- inactive recovery through Settings
- upcoming behavior through seeded/test-data coverage
- error/loading sanity checks

---

## Blueprint milestone decision

Current blueprint order:

1. Project foundation
2. Habit creation and onboarding
3. Daily tracking
4. Habit detail and edit
5. Weekly Review
6. AI and hint layer
7. Reminders and polish

Decision: **Do Milestone 5 before Milestone 6.**

Reason: Weekly Review creates structured reflection data that the later AI layer can use. AI should not be started before Weekly Review foundation is stable.

---

## Current milestone: Phase 3.1 Weekly Review Foundation

### Product decision

3.1 should **not** include the Today `Review this week` CTA.

Entry point for 3.1:

```text
Habit Detail -> Start weekly review / Update weekly review
```

The Today CTA is deferred to **3.2 Weekly Review Prompting / Today CTA**.

### 3.1 approved scope

In scope:
- weekly review data contract
- schema alignment
- Monday-based `week_start`
- review due utility
- Weekly Review screen
- save/upsert review flow
- latest review display on Habit Detail
- tests

Out of scope:
- AI suggestions
- automatic habit edits
- notifications
- charts
- dashboards
- Today review CTA
- habit recommendation engine

---

## 3.1 approved implementation plan

Approved plan:

- Add migration `0004_weekly_review_foundation.sql`.
- Add nullable fields to `weekly_reviews`:
  - `went_well text`
  - `was_hard text`
- Replace weekly uniqueness with:
  - `unique (user_id, habit_id, week_start)`
- Add/update index:
  - `(user_id, habit_id, week_start desc)`
- Keep/update RLS ownership policies.
- Update generated Supabase types.
- Add review types:
  - `WeeklyReviewRecord`
  - `UpsertWeeklyReviewPayload`
- Keep Monday week logic in `src/utils/dates.ts`.
- Add review due utility:
  - `isWeeklyReviewDue({ habit, latestReview, todayDate, currentWeekStart })`
- Implement review API:
  - `getLatestWeeklyReview(userId, habitId)`
  - `getWeeklyReviewForWeek(userId, habitId, weekStart)`
  - `upsertWeeklyReview(userId, payload)`
- Verify owned habit before upsert.
- Upsert on `user_id,habit_id,week_start`.
- Implement review hooks and query keys.
- Replace Weekly Review screen scaffold with real form.
- Add Weekly Review section to Habit Detail.
- Defer Today CTA.

Important UI validation rule:
- Completely blank review is blocked.
- A `No` answer on a nullable yes/no field counts as a valid reflection.

---

## Current branch review: `p3-weekly-review`

The branch `p3-weekly-review` was reviewed and is **approved pending full Jest suite and typecheck**.

Review result:
- Scope is clean and aligned with 3.1.
- No Today CTA added.
- No AI behavior added.
- No notifications/charts/dashboards added.

Implemented in branch:
- `supabase/migrations/0004_weekly_review_foundation.sql`
- review API
- review hooks
- review query keys
- review due utility
- Weekly Review screen
- Habit Detail weekly review integration
- Supabase type updates
- tests for API, hooks, due logic, date utilities, Weekly Review screen, and Habit Detail integration

Minor non-blocking note:
- Weekly Review screen currently uses habit-detail load error copy when either habit or current-review query fails. This is acceptable for 3.1 because the message is friendly and non-technical. Later it can be made more specific.

Requested final checks:

```bash
npm test -- --runInBand
npm run typecheck
```

If both pass, branch can be merged.

Suggested dev message:

> Reviewed `p3-weekly-review`. Scope is clean and aligned with 3.1. Weekly review schema, API, hooks, screen, Habit Detail integration, Monday week-start logic, and tests all look good. Please run the full Jest suite and typecheck. If green, this branch is approved to merge.

---

## Next steps

### Immediate next step

Ask dev team to run on `p3-weekly-review`:

```bash
npm test -- --runInBand
npm run typecheck
```

If green:
- merge `p3-weekly-review` into `main`
- run Jest/typecheck again on `main`
- mark 3.1 Weekly Review Foundation complete

### After 3.1

Proceed to **3.2 Weekly Review Prompting / Today CTA**.

Likely 3.2 scope:
- surface review due CTA on Today
- CTA only for active, started, due habits
- CTA routes to `/(app)/reviews/[habitId]`
- CTA does not interfere with Done/Skipped/Missed
- CTA disappears after current-week review is saved

### After 3.2

Then start Milestone 6 / AI and hint layer.

Potential AI foundation should use:
- habit setup fields
- habit context if added
- habit logs
- weekly reviews
- progress / low consistency signals

---

## Key product rules to remember

- Weeks start on Monday.
- `week_start` is stored as `YYYY-MM-DD`.
- Today CTA for weekly review is deferred to 3.2.
- AI is Milestone 6, not 3.1.
- Habit context is optional background info for later AI and is not part of 3.1.
- `start_date` remains system-managed and not user-editable.
- Future-dated habits are tested via seed/manual data or automated tests, not normal create UI.
- Inactive habits are recoverable through Settings.
- Inactive habits are not loggable.
- Deactivation is not deletion and preserves history.
- Daily consistency remains `done / (done + missed)`.
- Skipped is excluded from consistency denominator.
- Skipped breaks the streak in current MVP rules.

---

## Useful smoke checks for current app

1. Signed-out user sees Welcome/Auth.
2. Signed-in empty user routes to Create Habit.
3. Create habit routes to Today.
4. Today shows no-log defaults.
5. Done/Skipped/Missed save and update persisted status.
6. Habit Detail opens from Today.
7. Edit Habit updates setup fields.
8. Deactivate removes habit from Today.
9. Settings lists inactive habit.
10. Reactivate returns habit to Today if started.
11. Weekly Review opens from Habit Detail.
12. Blank weekly review is blocked.
13. Weekly Review save returns to Habit Detail.
14. Latest review appears on Habit Detail.

---

## Resume prompt for next ChatGPT conversation

```text
We are working on the Habit Builder app repo `berdugas/habitapp`. Phase 2 is complete and merged into main: create habit, Today logging, progress/streaks, Habit Detail, Edit Habit, deactivate/reactivate, inactive recovery in Settings, and final smoke testing.

We moved to Milestone 5 / Phase 3.1 Weekly Review Foundation. Decision: do Weekly Review before AI. 3.1 excludes Today CTA and AI. Entry point is Habit Detail only.

The branch `p3-weekly-review` was reviewed and approved pending checks. It adds migration 0004 with `went_well` and `was_hard`, uniqueness `user_id, habit_id, week_start`, Monday week_start logic, review due utility, review API/hooks, Weekly Review screen, and latest review display on Habit Detail. Need to confirm `npm test -- --runInBand` and `npm run typecheck`; if green, merge to main. After 3.1, next is 3.2 Today weekly review CTA.
```
