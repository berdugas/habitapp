# Habit Builder Technical Architecture / App Structure Spec v2

## 1. Purpose

This document translates the product blueprint, AI behavior spec, AI implementation spec, and UI spec into a build-ready technical plan.

It defines:
- app architecture
- folder structure
- route ownership
- app shell ownership
- backend responsibilities
- data model implementation notes
- AI integration points
- notifications flow
- offline and sync ownership
- testing structure
- suggested development sequencing

This version tightens the earlier architecture so it can act as a stronger engineering contract.

---

## 2. Recommended Stack

### Frontend
- React Native
- Expo
- TypeScript
- Expo Router

### Backend
- Supabase
  - Auth
  - Postgres
  - Row Level Security
  - Edge Functions or server-side functions for AI orchestration

### Notifications
- Expo Notifications

### Styling
- NativeWind or standard React Native StyleSheet

### State / data
- TanStack Query for server state
- lightweight local UI state with React hooks or Zustand

### AI orchestration
- server-side function that:
  - assembles structured input
  - applies heuristics
  - calls model if needed
  - validates output
  - stores suggestion
  - returns clean JSON to the app

### Local persistence
For MVP, choose one and lock it for the team:
- AsyncStorage for simpler setup
- MMKV for faster local persistence if the team is already comfortable with it

If the team does not already have a strong preference, use **AsyncStorage** first for MVP simplicity.

---

## 3. Architecture Principles

### 3.1 Keep route files thin
Expo Router route files should be thin wrappers only.

They should mainly:
- receive route params
- mount screen containers
- avoid owning large business logic

### 3.2 Keep client simple
The mobile app should focus on:
- rendering screens
- collecting input
- showing suggestions and hints
- handling local interactions
- sending structured requests

### 3.3 Keep business rules server-side
The backend should own:
- AI trigger checks
- AI prompt orchestration
- suggestion validation
- logging and analytics events where practical
- reliable business-rule enforcement where centralization matters

### 3.4 Prefer structured data over free text
Most product logic should operate on:
- habit setup fields
- log statuses
- review answers
- optional habit context

This keeps the AI and product behavior more predictable.

### 3.5 Design for offline tolerance
The app should still allow:
- viewing habits
- logging daily status
- editing a habit

When offline, then sync later.

---

## 4. High-Level System Architecture

### 4.1 Main parts

#### Mobile client
Responsibilities:
- onboarding
- create/edit habit
- optional habit context screen
- today logging UI
- weekly review UI
- render AI suggestion cards
- local pending state while syncing

#### Supabase database
Responsibilities:
- users
- habits
- habit context
- habit logs
- weekly reviews
- AI suggestions

#### AI service layer
Responsibilities:
- receive trigger requests
- apply heuristics
- call model only when needed
- validate model output
- store suggestion
- return JSON response

#### Notification layer
Responsibilities:
- local reminders per habit
- weekly review prompt notification later if enabled

#### Local persistence layer
Responsibilities:
- persist auth-adjacent local state when needed
- persist scheduled notification IDs
- persist sync queue
- persist lightweight UI recovery state if needed

---

## 5. Route Ownership and App Shell Ownership

## 5.1 Route ownership rule
This should be explicitly locked for the team:
- `app/` contains **thin Expo Router route files only**
- route files should mainly handle route params and export screen containers
- screen containers live in `src/features/.../screens/`
- shared UI lives in `src/components/`
- feature-specific UI lives in `src/features/.../components/`

### Example route pattern
`app/(app)/today.tsx` should be a thin wrapper such as:
- import the Today screen container
- export it as the default screen

Do not place large business logic, mutations, or data orchestration directly inside route files.

## 5.2 App shell ownership
This should also be locked.

### `app/_layout.tsx`
Owns app-wide providers and bootstrapping:
- `GestureHandlerRootView`
- `SafeAreaProvider`
- `QueryClientProvider`
- auth/session bootstrap
- splash handling
- font loading
- theme/design token provider if used
- app-wide toast or feedback host if used

### `app/(auth)/_layout.tsx`
Owns auth-area navigation layout.

### `app/(app)/_layout.tsx`
Owns protected app shell:
- tab layout
- auth redirect if no session
- authenticated navigation structure

### Notes
- `index.tsx` routes based on auth/session and whether the user already has a habit
- Habit Context can be shown only during onboarding first, but keep the route reusable
- provider placement should not be left to individual engineers

---

## 6. Navigation Structure

Use Expo Router with a structure like this:

```text
app/
  _layout.tsx
  index.tsx
  (auth)/
    _layout.tsx
    sign-in.tsx
    sign-up.tsx
  (app)/
    _layout.tsx
    today.tsx
    settings.tsx
    habits/
      create.tsx
      [habitId].tsx
      [habitId]/edit.tsx
      [habitId]/context.tsx
    reviews/
      [habitId].tsx
```

### Routing notes
- `index.tsx` decides whether to send the user to auth, onboarding, or today
- `(auth)` contains public auth flows
- `(app)` contains protected routes only
- the detail route should load a screen container from the feature layer, not own the logic itself

---

## 7. Suggested Folder Structure

```text
app/
  _layout.tsx
  index.tsx
  (auth)/
    _layout.tsx
    sign-in.tsx
    sign-up.tsx
  (app)/
    _layout.tsx
    today.tsx
    settings.tsx
    habits/
      create.tsx
      [habitId].tsx
      [habitId]/edit.tsx
      [habitId]/context.tsx
    reviews/
      [habitId].tsx

assets/
  fonts/
  images/
  icons/

src/
  providers/
    AppProviders.tsx
    AuthBootstrap.tsx
  theme/
    colors.ts
    spacing.ts
    typography.ts
    radius.ts
    shadows.ts
  components/
    buttons/
      PrimaryButton.tsx
      SecondaryButton.tsx
    cards/
      HabitCard.tsx
      AISuggestionCard.tsx
      HintCard.tsx
      ProgressSummaryCard.tsx
    forms/
      TextField.tsx
      ToggleRow.tsx
      SelectionChips.tsx
      TimePickerField.tsx
      StatusButtonGroup.tsx
    feedback/
      EmptyState.tsx
      LoadingState.tsx
      ErrorState.tsx
  features/
    auth/
      api.ts
      hooks.ts
      types.ts
      screens/
        SignInScreen.tsx
        SignUpScreen.tsx
    habits/
      api.ts
      hooks.ts
      types.ts
      validators.ts
      screens/
        CreateHabitScreen.tsx
        HabitDetailScreen.tsx
        EditHabitScreen.tsx
      components/
    habit-context/
      api.ts
      hooks.ts
      types.ts
      screens/
        HabitContextScreen.tsx
    logs/
      api.ts
      hooks.ts
      types.ts
    progress/
      selectors.ts
      utils.ts
      types.ts
    reviews/
      api.ts
      hooks.ts
      types.ts
      screens/
        WeeklyReviewScreen.tsx
    ai/
      api.ts
      hooks.ts
      types.ts
      utils.ts
    notifications/
      permissions.ts
      scheduler.ts
      hooks.ts
      types.ts
    sync/
      queue.ts
      storage.ts
      processor.ts
      hooks.ts
      types.ts
  lib/
    supabase/
      client.ts
      types.ts
      auth.ts
    query/
      queryClient.ts
    storage/
      index.ts
      keys.ts
    config/
      env.ts
  services/
    analytics.ts
    network.ts
    logger.ts
  stores/
    uiStore.ts
    syncStore.ts
  utils/
    dates.ts
    habits.ts
    progress.ts
    strings.ts
    validation.ts
  constants/
    copy.ts
    routes.ts
  tests/
    unit/
    integration/
    screen/
```

### Structure decisions to lock
- `assets/` is the home for fonts, images, and app icons
- `src/theme/` owns design tokens, not scattered constants
- `src/lib/supabase/types.ts` stores generated Supabase database types and should be committed to the repo
- `src/lib/storage/` owns local persistence adapters and storage keys
- `src/features/sync/` owns queue logic and offline mutation processing
- `src/features/notifications/` owns permission and scheduling logic
- `src/tests/` is the default home for tests

### Generated Supabase types
This should be explicit:
- generated types live in `src/lib/supabase/types.ts`
- they should be committed to the repo
- they should be regenerated whenever schema changes are introduced

---

## 8. Screen-Level Technical Responsibilities

### 8.1 Welcome screen
- decide next route
- if no habit exists, go to create habit
- if habit exists, go to today

### 8.2 Create Habit screen
- local form state
- validate required fields
- save habit to backend
- optionally request AI setup suggestion if setup looks weak
- navigate to optional context screen or today

### 8.3 Habit Context screen
- optional questions
- upsert habit context
- skip path allowed
- navigate to today

### 8.4 Today screen
- fetch active habits
- fetch today log status for each habit
- render consistency, streak, skip count
- allow daily status update
- show weekly review CTA if due
- show low-consistency hint if applicable

### 8.5 Habit Detail screen
- fetch habit detail
- fetch recent logs
- fetch latest review
- fetch current suggestion/hint if any
- allow manual suggest improvement action
- navigate to edit

### 8.6 Weekly Review screen
- local form state
- submit review
- trigger AI weekly review suggestion
- show suggestion result

### 8.7 Edit Habit screen
- prefill fields
- if opened from AI apply, preload proposed field value
- save updates
- reschedule reminder if needed

### 8.8 Settings screen
- toggle notifications preference
- sign out

---

## 9. Data Model Implementation Notes

### 9.1 Core tables

#### users
Managed by Supabase auth plus optional profile row if needed later.

#### habits
Core fields:
- id
- user_id
- name
- identity_statement
- stack_trigger
- tiny_action
- preferred_time_window
- reminder_enabled
- reminder_time
- is_active
- created_at
- updated_at

#### habit_context
Optional per habit:
- id
- habit_id
- user_id
- motivation_reason
- difficulty_expectation
- common_obstacle
- available_time_band
- created_at
- updated_at

#### habit_logs
One row per habit per date:
- id
- habit_id
- user_id
- log_date
- status
- note
- created_at

Recommended constraint:
- unique `(habit_id, log_date)`

#### weekly_reviews
- id
- user_id
- habit_id
- week_start
- easiest_habit
- hardest_habit
- trigger_worked
- tiny_action_too_hard
- adjustment_note
- created_at

Recommended constraint:
- unique `(habit_id, week_start)`

#### ai_suggestions
- id
- user_id
- habit_id
- trigger_source
- category
- headline
- message
- suggested_field
- current_value
- proposed_value
- reason_code
- confidence
- shown_at
- applied_at
- dismissed_at
- model_name
- input_snapshot
- output_snapshot

---

## 10. Row Level Security Direction

Recommended policy direction:
- users can only read/write their own habits
- users can only read/write their own habit_context rows
- users can only read/write their own logs
- users can only read/write their own weekly reviews
- users can only read their own AI suggestions

All tables should include `user_id` where helpful for simple RLS policies.

---

## 11. Progress Calculation Logic

### 11.1 Consistency
Formula:
- `done / (done + missed)`

Rules:
- skipped is excluded from denominator
- skip count is displayed separately

### Example
- done = 5
- skipped = 1
- missed = 1
- consistency = 5 / (5 + 1) = 83%

### 11.2 Streak
A streak increases on consecutive days marked `done`.

Need a clear rule for skipped days.

### Recommended MVP rule
- skipped does not increase streak
- skipped breaks the streak
- a calendar day with no persisted log also breaks the streak

This is simpler technically and easier to explain.

### 11.3 Low consistency threshold
Suggested default:
- 70% over recent active days

Can be computed:
- on client for simple rendering
- on backend for AI / hint triggers

Recommendation:
- compute display values on client first
- re-check trigger conditions on backend for AI decisions

---

## 12. Query and API Responsibilities

### 12.1 Habit queries
- `getActiveHabits(userId)`
- `getHabitById(habitId)`
- `createHabit(payload)`
- `updateHabit(habitId, payload)`
- `archiveHabit(habitId)`

### 12.2 Habit context queries
- `getHabitContext(habitId)`
- `upsertHabitContext(payload)`

### 12.3 Log queries
- `getRecentLogs(habitId, days)`
- `upsertDailyLog(habitId, date, status, note?)`
- `getTodayLog(habitId)`

### 12.4 Review queries
- `getLatestReview(habitId)`
- `createWeeklyReview(payload)`
- `isWeeklyReviewDue(habitId)`

### 12.5 AI queries
- `requestAISuggestion(triggerSource, habitId)`
- `getLatestSuggestion(habitId)`
- `applySuggestion(suggestionId)`
- `dismissSuggestion(suggestionId)`

---

## 13. AI Integration Architecture

### 13.1 Suggested backend flow

```text
Client action
  -> API / Edge Function trigger
  -> load habit + context + recent logs + review data
  -> run heuristic checks
  -> decide whether model call is needed
  -> call model if needed
  -> validate JSON output
  -> store suggestion in ai_suggestions
  -> return suggestion to client
```

### 13.2 Trigger sources supported
- `create_habit`
- `repeated_miss`
- `weekly_review`
- `manual_help`
- `low_consistency`

### 13.3 Why backend orchestration is better
- protects prompt logic
- centralizes heuristics
- improves logging
- allows validation and fallback logic
- avoids duplicate client logic

---

## 14. Notifications Architecture

### 14.1 MVP approach
Use local notifications first.

### Why
- simpler than remote push
- enough for per-habit reminders
- good fit for MVP

### 14.2 Ownership
This should be explicitly owned by `src/features/notifications/`.

Suggested files:
- `permissions.ts`
- `scheduler.ts`
- `hooks.ts`
- `types.ts`

Responsibilities:
- request notification permissions
- schedule local reminders
- cancel and reschedule reminders
- map scheduled notification IDs back to habits

### 14.3 Notification flows

#### Habit reminder
When a habit is created or edited:
- if reminder is enabled, schedule local reminder at chosen time
- if reminder changes, cancel old and reschedule new

#### Weekly review reminder
Optional later in MVP or post-MVP:
- schedule a weekly reminder if review is due

### 14.4 Storage for scheduled notification IDs
The app should persist a mapping such as:
- `habit_id -> local_notification_id`

This mapping should live in local storage or in a small local persistence layer, not scattered across screens.

---

## 15. Offline / Sync Strategy

### 15.1 MVP recommendation
Use a lightweight offline-tolerant model.

### Should work offline
- viewing last synced habits
- logging today’s status
- editing local form state

### Sync behavior
- queue updates locally if request fails
- retry on reconnect or next app open

If you want to move faster, you can initially ship online-first with graceful retry, then improve offline behavior after MVP.

### 15.2 Ownership
Offline and retry logic should be owned by `src/features/sync/`.

Suggested files:
- `queue.ts`
- `storage.ts`
- `processor.ts`
- `hooks.ts`
- `types.ts`

Responsibilities:
- queue failed mutations
- persist the queue locally
- retry mutations on reconnect or app foreground
- expose sync status to the UI

### 15.3 Queue storage
This should be explicitly persisted through the shared storage layer in `src/lib/storage/`.

Do not distribute sync persistence logic across individual feature hooks.

---

## 16. State Management Recommendation

### 16.1 Server state
Use TanStack Query for:
- habits
- context
- logs
- reviews
- AI suggestions

### 16.2 UI state
Use local state or small Zustand store for:
- form drafts
- current selected status before mutation settles
- AI card visibility
- pending sync indicators

Avoid heavy global state unless needed later.

### 16.3 Provider layout decision
The provider stack should be centralized in `src/providers/AppProviders.tsx` and mounted from `app/_layout.tsx`.

Recommended provider order:
1. `GestureHandlerRootView`
2. `SafeAreaProvider`
3. theme provider if used
4. `QueryClientProvider`
5. auth bootstrap / session listener layer
6. app children

Font loading and splash handling should also be coordinated from the root app shell, not distributed across screens.

---

## 17. Suggested Utility Functions

Examples:
- `calculateConsistency(logs)`
- `calculateStreak(logs)`
- `countSkips(logs)`
- `isReviewDue(lastReviewDate)`
- `getTodayStatus(logs)`
- `isWeakSetup(habit)`
- `isLowConsistency(logs, threshold)`

These should live in shared utility or feature-specific utility files.

---

## 18. Error Handling Strategy

### User-facing
- short calm errors
- retry where appropriate
- preserve form data if submission fails

### Developer-facing
- log API failures
- log AI validation failures
- log notification scheduling errors

For AI specifically:
- if suggestion generation fails, do not block the main habit flow
- simply show no suggestion or a safe fallback hint

---

## 19. Testing Structure

The project should not leave testing as an afterthought.

Recommended structure:
- `src/tests/unit/` for logic such as progress calculations and validators
- `src/tests/integration/` for data-layer behaviors such as daily log upserts
- `src/tests/screen/` for basic screen smoke tests

Minimum useful MVP test coverage:
- `calculateConsistency`
- `calculateStreak`
- weak setup heuristics
- daily log upsert behavior
- create habit screen smoke test
- today screen smoke test

---

## 20. Development Sequence

### Milestone 1: Project foundation
- Expo app setup
- routing setup
- Supabase client setup
- auth flow
- base UI components
- root provider shell

### Milestone 2: Habit creation and onboarding
- welcome screen
- create habit screen
- optional habit context screen
- save flow

### Milestone 3: Daily tracking
- today screen
- habit card
- done/skipped/missed logging
- progress summary

### Milestone 4: Habit detail and edit
- habit detail screen
- recent history
- edit habit flow
- archive flow

### Milestone 5: Weekly review
- review due logic
- weekly review form
- save review flow

### Milestone 6: AI and hint layer
- backend suggestion orchestration
- create-habit AI suggestion
- repeated miss trigger
- weekly review suggestion
- low-consistency hint
- manual suggest improvement

### Milestone 7: Reminders and polish
- local notifications
- loading / empty / error states
- analytics events
- polish interactions

---

## 21. MVP Technical Decisions to Lock

These are the technical decisions I recommend locking now:
- Expo Router for navigation
- thin route files only
- screen containers live in feature folders
- Supabase for backend
- TanStack Query for server state
- AsyncStorage or MMKV chosen explicitly and documented
- local notifications first
- backend-controlled AI orchestration
- unique daily log per habit/date
- client-calculated progress display, backend-validated AI trigger checks
- generated Supabase types committed in repo
- centralized provider shell in `app/_layout.tsx`

---

## 22. Final Technical Definition

The Habit Builder MVP should be built as a **cross-platform mobile app with a thin client and a structured backend**.

The client should focus on a clean, fast daily experience.
The backend should own persistence, access control, AI orchestration, and reliable business rules.

This tighter structure reduces implementation drift and gives the team a clearer path from specification to code.
