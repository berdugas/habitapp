# Phase 1B Smoke Checklist

Use this checklist before moving beyond the current Phase 1B slice.

## Setup
- Launch the app with valid Supabase env values.
- Use one fresh account and, if possible, a second account for ownership checks.

## Main flow
- Open the app while signed out.
  Expected: Welcome screen appears and no protected content is shown.
- Sign up with a valid new account.
  Expected: Account is created, a session is returned immediately, and the app enters the signed-in flow.
- Force close and reopen the app.
  Expected: Session restores without requiring a new login.
- While signed in with zero active habits, land on root.
  Expected: App routes to Create Habit.
- Create a habit with valid values.
  Expected: Habit saves once, active habits refetch, and the app routes to Today.
- Reopen the app after the habit is created.
  Expected: Root routes to Today and the same active habit is visible.

## Validation and safety
- Try sign in and sign up with empty fields.
  Expected: Inline-friendly validation appears and no backend request is sent.
- Try creating a habit with whitespace-only required values.
  Expected: Validation blocks save.
- Try creating a habit with overly long required values.
  Expected: Validation blocks save before hitting the backend.
- Enable reminders and enter an invalid time.
  Expected: Validation requires a valid `HH:MM` time.
- Rapidly tap Sign In, Sign Up, Save Habit, and Today status buttons.
  Expected: Only one request is sent for each action and no duplicate records appear.

## Today and logging
- On Today, mark the habit `Done`.
  Expected: Today status updates, the selected state is visible, and the 30-day summary reflects persisted history after refetch.
- Replace the same-day status with `Skipped`, then `Missed`.
  Expected: The same `habit_logs` row is updated for the same day rather than duplicated.
- Force close and reopen the app after logging a status.
  Expected: Today status, skip count, consistency, and streak still match persisted data.

## Failure handling
- Simulate or trigger a failed sign-in request.
  Expected: User sees a simple message, while the detailed failure is visible in dev logs.
- Simulate or trigger a failed create-habit request.
  Expected: User stays on Create Habit with a simple error message and no duplicate record is created.
- Simulate or trigger a failed Today status write.
  Expected: User sees a simple error message and the UI does not drift into a false success state.
- Simulate or trigger a failed active-habits load while signed in.
  Expected: Root shows an error state instead of misrouting to Create Habit.

## Ownership and backend checks
- Sign in as account A and create a habit.
  Expected: The habit is stored under account A only.
- Sign out and sign in as account B.
  Expected: Account B cannot see account A's habit data.
- Verify `habits` and `habit_logs` rows include the correct `user_id`.
  Expected: Writes are tied to the signed-in user and row-level security prevents cross-user reads.
