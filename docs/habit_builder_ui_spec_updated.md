# Habit Builder MVP — UI Spec Document

## 1. Purpose

This document defines the UI structure and behavior for the Habit Builder MVP.

The goal is to create a clean, calm, low-friction mobile experience for iOS and Android that helps users:
- create one habit during onboarding
- optionally share a few habit context details
- track the habit daily
- review it weekly
- receive lightweight AI suggestions and hints

---

## 2. Product UX Principles

The UI should feel:
- simple
- gentle
- focused
- encouraging
- uncluttered

### AI as support, not the center
AI should appear as a lightweight suggestion card, not a chatbot interface.

### Behavioral personalization
Personalization should come from habit context and behavior patterns, not demographic questions.

---

## 3. Platform Scope

This UI is intended for:
- iOS
- Android

Built as a cross-platform mobile app.

---

## 4. Navigation Model

### Primary navigation
- Today
- Settings

### Secondary navigation
- Create Habit
- Habit Context
- Habit Detail
- Edit Habit
- Weekly Review

### Entry flow
- First-time user → Welcome → Create First Habit → Optional Habit Context → Today
- Returning user → Today

---

## 5. Core UI Components

### Primary Button
Used for:
- Start Your First Habit
- Save Habit
- Continue
- Save Review
- Save Changes

### Secondary Button
Used for:
- Skip for now
- Edit Habit
- Suggest improvement
- Back to Today

### Selection Chips / Buttons
Used for optional habit context:
- why this habit matters
- difficulty expectation
- common obstacle
- available time band

### Habit Card
Used on Today screen.

Content:
- habit name
- habit formula
- daily status
- action buttons
- consistency summary
- streak summary
- skip count

### AI Suggestion Card
Used on:
- Create Habit
- Today or Habit Detail for low-consistency hints
- Habit Detail
- Weekly Review result

Content:
- short headline
- short body message
- Apply button
- Dismiss button

### Hint Card
A smaller coaching card used for low-consistency coaching.

---

## 6. Screen Specs

## 6.1 Welcome Screen
Purpose:
- introduce the app
- move the user into first habit creation

Main CTA:
- Start Your First Habit

---

## 6.2 Create First Habit Screen

Fields:
1. Habit name
2. Identity statement
3. Stack trigger
4. Tiny action
5. Reminder toggle
6. Reminder time picker

Helper text:
- Stack trigger: What existing routine will remind you to do this?
- Tiny action: Make it the smallest version you can repeat easily.

Preview:
- After I [stack trigger], I will [tiny action].

AI behavior:
- if setup appears weak, show one AI suggestion card below the preview

Primary action:
- Save Habit

---

## 6.3 Optional Habit Context Screen

Purpose:
- collect lightweight inputs that help personalize suggestions

Questions:
1. Why does this habit matter to you?
2. How easy does this feel right now?
3. What usually gets in the way?
4. How much time can you realistically give this on most days?

Suggested answer patterns:
- Why this habit matters:
  - improve health
  - reduce stress
  - learn something
  - feel more consistent
  - other

- How easy does this feel right now?
  - very easy
  - manageable
  - hard

- What usually gets in the way?
  - I forget
  - I get busy
  - I lose motivation
  - my routine changes
  - I start too big
  - other

- Time available:
  - under 2 minutes
  - about 5 minutes
  - 10+ minutes

Actions:
- Continue
- Skip for now

Note:
- do not ask age or gender here

---

## 6.4 Today Screen

Content:
- date
- greeting
- active habit cards
- weekly review prompt if due
- optional low-consistency hint card when needed

Habit card contents:
- habit name
- habit formula
- Done / Skipped / Missed buttons
- consistency summary
- streak
- skip count

Low-consistency hint:
- if consistency is weak, show one small hint card

Examples:
- Try reducing this for the next few days.
- Use a trigger that happens every day.

---

## 6.5 Habit Detail Screen

Content:
- habit title
- identity statement
- habit formula
- progress metrics
- recent history
- notes
- optional hint or AI suggestion card
- Suggest improvement action
- Edit Habit
- Archive Habit

Recent history:
- D = done
- S = skipped
- M = missed

---

## 6.6 Weekly Review Screen

Questions:
1. Which habit felt easiest this week?
2. Which habit felt hardest?
3. Was the habit too big?
4. Was the stack trigger strong enough?
5. One change for next week

After save:
- confirmation message
- AI suggestion card
- Back to Today button

---

## 6.7 Edit Habit Screen

Content:
- same fields as Create Habit, prefilled

If user taps Apply on an AI suggestion:
- navigate to Edit Habit
- prefill the suggested value
- visually indicate the changed field

---

## 6.8 Settings Screen

Content:
- notifications toggle
- account info
- sign out

---

## 7. Interaction Behavior Rules

### Daily logging
- one status per habit per day
- statuses: Done, Skipped, Missed
- user may update the same day’s status if needed

### Consistency display
Formula:
- done / (done + missed)

Rule:
- skipped is excluded from the denominator
- skip count is still shown

### Streak display
- streak is secondary
- consistency is the main metric

### AI suggestion behavior
AI appears only:
- after habit creation if setup is weak
- after 2 misses in 7 days
- after weekly review
- after user taps Suggest improvement

### Low-consistency hint behavior
If consistency drops below a threshold such as 70% over recent active days:
- show one small hint card
- do not show too many hints at once

### AI Apply behavior
- open Edit Habit
- prefill proposed value
- require save confirmation

### AI Dismiss behavior
- hide the suggestion
- avoid re-showing the exact same suggestion too often

---

## 8. Reusable Copy Patterns

Buttons:
- Start Your First Habit
- Save Habit
- Continue
- Skip for now
- Save Changes
- Start Review
- Save Review
- Suggest improvement
- Apply
- Dismiss
- Back to Today
- Edit Habit
- Archive Habit
- Sign Out

Labels:
- Habit name
- Identity
- Stack trigger
- Tiny action
- Reminder
- Preview
- This week
- Current streak
- Skips this week

AI headline examples:
- Make it smaller
- Use a clearer trigger
- Keep this setup
- Adjust next week
- Keep showing up

---

## 9. Design Constraints for MVP

To keep the UI simple:
- no demographic onboarding questions
- no dark mode yet unless desired later
- no dense analytics dashboard
- no chat-based AI screen
- no gamification UI

---

## 10. Final UI Definition

The Habit Builder MVP UI should be:
- clean
- calm
- lightly structured
- centered on one habit at a time

It should help the user:
- set up a habit clearly
- optionally share small habit context
- check in quickly
- reflect weekly
- receive small, practical AI guidance
