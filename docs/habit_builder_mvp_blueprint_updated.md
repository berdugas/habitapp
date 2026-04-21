# Habit Builder MVP Blueprint

## 1. Product Summary

**Working product idea:** A simple mobile app that helps users build habits using the core ideas of *Atomic Habits*, with a focus on **habit stacking**, **small daily actions**, **weekly reflection**, and a **light AI coaching layer**.

**Primary goal:** Help users repeat a behavior consistently enough for it to become part of their identity.

**MVP principle:** Keep the app lightweight, clean, and easy to use every day.

---

## 2. Core Product Promise

This app is not mainly a productivity tracker.

It is a **habit repetition app** that helps the user:
- define a habit clearly
- connect it to an existing routine using a **stack trigger**
- reduce the habit into a tiny action
- track whether it happened today
- review whether the habit setup is working
- receive small AI suggestions that improve habit design and consistency

---

## 3. Core Atomic Habits Concepts Included in MVP

### Included
- **Identity-based habits**
- **Habit stacking**
- **Tiny habits / easy first step**
- **Consistency over perfection**
- **Weekly review and adjustment**

### Not included in MVP
- habit bundling
- social accountability
- advanced gamification
- community features
- complex analytics
- AI chat as the main interface

---

## 4. Target User

A person who wants to build a new habit but struggles with consistency.

Typical behaviors:
- starts habits with good intention but stops after a few days
- wants something simpler than a full productivity app
- responds well to small wins and low-friction tracking
- wants structure without pressure

---

## 5. MVP Success Criteria

The MVP is successful if users can:
1. create at least one habit easily
2. understand the stack trigger concept
3. check in daily with very little friction
4. reflect weekly and adjust the habit instead of abandoning it
5. receive small, useful suggestions when consistency is weak

Key product metrics later:
- habit creation rate
- daily check-in frequency
- 7-day retention
- 14-day retention
- % of users who complete a weekly review
- % of users who view or apply an AI suggestion

---

## 6. Core User Journey

### Step 1: Onboarding
The user learns that the app helps build habits through repetition, small actions, and habit stacking.

### Step 2: Create first habit
The user defines:
- what habit they want to build
- who they want to become
- what existing routine will trigger it
- what the smallest possible version of the habit is

### Step 3: Add optional habit context
After the first habit is created, the app can ask a few lightweight optional questions to personalize AI suggestions.

### Step 4: Daily tracking
The user opens the app and marks the habit as done, skipped, or missed.

### Step 5: Reflection
At the end of the week, the app prompts the user to review what is working and what should change.

---

## 7. Product Formula

The core habit formula inside the app is:

**After [stack trigger], I will [tiny action].**

Optional identity layer:

**I am becoming someone who [identity statement].**

Example:
- Identity: I am becoming someone who reads daily.
- Stack trigger: After I brush my teeth at night
- Tiny action: Read 1 page

---

## 8. MVP Features

### 8.1 AI role in MVP
The AI should not be the main product experience.

For the MVP, the AI should act as a **small suggestion layer** that helps the user improve the setup of a habit and recover when consistency is weak.

Best uses in MVP:
- suggest a better tiny action when the habit is too big
- suggest a clearer stack trigger when the trigger is vague
- suggest a simpler identity statement if the identity is too abstract
- suggest one hint when consistency is weak
- suggest one small adjustment after repeated misses or weekly review

The AI should feel like a helpful coach giving short, practical suggestions.

It should not dominate the interface or require the user to chat.

---

### 8.2 Create Habit

Fields:
- Habit name
- Identity statement
- Stack trigger
- Tiny action
- Preferred time window (optional)
- Reminder on/off
- Reminder time (optional)

Example record:
- Habit name: Reading
- Identity statement: Become someone who reads daily
- Stack trigger: After I brush my teeth
- Tiny action: Read 1 page

### UX goal
The habit creation flow should be easy enough to finish in under 2 minutes.

### AI support in this screen
After the user enters the habit, stack trigger, and tiny action, the app can show one optional AI suggestion such as:
- “This habit may still be too big. Start with 1 page instead.”
- “Try using a more specific trigger, like ‘After I make coffee.’”
- “This setup looks strong. Keep it simple.”

The suggestion should be optional and dismissible.

---

### 8.3 Habit Context Profile

To personalize suggestions, the app can collect a small amount of optional **habit context** after the user creates the habit.

Recommended fields:
- Why this habit matters (`motivation_reason`)
- How easy or hard this feels right now (`difficulty_expectation`)
- What usually gets in the way (`common_obstacle`)
- How much time is realistically available most days (`available_time_band`)

### Design principle
Use **behavioral personalization**, not demographic personalization.

For MVP, do **not** require:
- age
- gender
- occupation
- detailed health data

These are less useful than habit-specific context.

---

### 8.4 Today Screen

This is the main screen of the app.

For each active habit, show:
- habit name
- stack trigger + tiny action summary
- status for today
- one-tap “Done” action
- optional “Skipped” or “Missed” action
- consistency summary
- streak summary
- skip count

### UX goal
User should be able to open the app and complete logging in a few seconds.

---

### 8.5 Habit Detail Screen

Shows:
- habit name
- identity statement
- stack trigger
- tiny action
- streak
- last 7 days completion
- last 30 days completion
- recent notes
- edit habit button
- suggest improvement action

### Purpose
Help the user understand whether the system is working and get help improving the habit.

---

### 8.6 Weekly Review

Once every 7 days, prompt the user to answer:
- Which habit felt easiest this week?
- Which habit was hardest?
- Was the habit too big?
- Was the stack trigger strong enough?
- What should be adjusted next week?

### Purpose
Encourage system improvement, not guilt.

### AI support in weekly review
This is one of the best places for AI in the MVP.

After the user completes the weekly review, the AI can generate a very short coaching message based on the user’s recent logs and review answers.

Examples:
- “You missed this most often on busy days. Try reducing it for next week.”
- “Your trigger seems too broad. Try attaching it to a routine you never miss.”
- “This setup looks solid. Focus on repetition next week.”

The output should be short, concrete, and action-oriented.

The AI should suggest only one small change at a time.

---

### 8.7 Notifications

Very simple for MVP:
- one reminder per habit
- reminder references the stack trigger or time

Example:
- “After dinner, do your 1 minute journal.”

---

### 8.8 Low-Consistency Hint System

If the user is struggling to maintain consistency, the app should offer one lightweight hint.

### Purpose
Help the user recover before they abandon the habit.

### Example hint categories
- make the habit smaller
- use a clearer stack trigger
- prepare the environment in advance
- move the habit to a more stable time
- focus on showing up, not doing a lot

### Suggested trigger levels
- **Low consistency hint:** show one hint if consistency drops below a threshold such as 70% over recent active days
- **Repeated misses:** trigger a stronger AI suggestion when the user has 2 misses in 7 days
- **Weekly review:** always show one practical next step

---

## 9. Features Excluded from MVP

To keep scope tight, exclude:
- social features
- friend accountability
- leaderboards
- achievements/badges
- AI chat assistant as the main UX
- voice journaling
- health integrations
- widgets
- mood tracking
- many customization options

---

## 10. Screen List

1. Welcome / onboarding  
2. Create first habit  
3. Optional habit context questions  
4. Today  
5. Habit detail  
6. Weekly review  
7. Settings  

---

## 11. Screen-by-Screen Wireframe Outline

### 11.1 Welcome
Contents:
- app name
- short explanation
- CTA: Start building a habit

Possible message:
“Build habits through small actions, repetition, and better triggers.”

---

### 11.2 Create Habit
Fields on screen:
- Habit name
- Identity statement
- Stack trigger
- Tiny action
- Reminder toggle
- Reminder time
- Save button

Helper text under stack trigger:
“What existing routine will remind you to do this?”

Preview card:
“After I [stack_trigger], I will [tiny_action].”

---

### 11.3 Habit Context Questions
Optional questions:
- Why this habit matters
- How easy or hard it feels
- What usually gets in the way
- How much time is realistically available

Goal:
Improve AI suggestions without adding too much onboarding friction.

---

### 11.4 Today
Sections:
- Today’s date
- Greeting
- Active habits list

Habit card contents:
- Habit name
- Mini formula
- Status chip
- Done / Skipped / Missed buttons
- Consistency
- Streak
- Skip count

Bottom area:
- weekly review prompt if due

---

### 11.5 Habit Detail
Sections:
- Habit header
- Identity statement
- Stack formula
- Streak
- Completion history
- Notes
- Suggest improvement
- Edit habit
- Archive habit

---

### 11.6 Weekly Review
Questions shown as short cards or inputs:
- Easiest habit this week
- Hardest habit this week
- Was the tiny action too hard?
- Was the trigger clear enough?
- One change for next week

CTA:
- Save review

---

### 11.7 Settings
Basic settings only:
- notifications on/off
- profile or account
- sign out

---

## 12. Design Principles

### Visual style
- clean
- calm
- minimal
- not crowded
- warm neutral background or white
- one accent color
- rounded cards
- strong spacing
- large readable typography

### Product feel
The app should feel:
- gentle
- reflective
- encouraging
- low-pressure

It should not feel like a scoreboard or punishment tool.

---

## 13. Suggested Tech Stack

### Frontend
- React Native
- Expo
- TypeScript
- Expo Router

### Backend
- Supabase
  - authentication
  - database
  - sync across devices

### Notifications
- Expo Notifications

### Styling
- NativeWind or standard React Native StyleSheet

### Suggested reason
This stack is simple, modern, cross-platform, and fast enough for an MVP on iOS and Android.

---

## 14. Technical Architecture

### Client
Mobile app for iOS and Android

### Server / backend
Supabase backend

### Data flow
1. user creates or updates habit
2. app stores habit in backend
3. app may store optional habit context
4. user logs daily completion
5. app records habit log
6. app calculates streaks and completion rates
7. app may generate hints or AI suggestions when needed
8. app prompts weekly review every 7 days

---

## 15. Database Schema

### Table: users
- id
- created_at

### Table: habits
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

### Table: habit_context
- id
- habit_id
- user_id
- motivation_reason
- difficulty_expectation
- common_obstacle
- available_time_band
- created_at
- updated_at

### Table: habit_logs
- id
- habit_id
- user_id
- log_date
- status (`done`, `skipped`, `missed`)
- note
- created_at

### Table: weekly_reviews
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

### Optional table: ai_suggestions
- id
- user_id
- habit_id
- trigger_source
- category
- suggestion_text
- shown_at
- applied_at nullable
- dismissed_at nullable

---

## 16. Business Logic Notes

### Streak logic
A streak increases when the habit is marked done on consecutive valid days.

### Completion rate
- 7-day completion rate
- 30-day completion rate

Rule for skipped days:
- skipped days are excluded from the consistency denominator
- skipped days should still be counted and shown in the UI

Formula:
- consistency = done / (done + missed)

### Missed vs skipped
- **Done**: user completed habit
- **Skipped**: intentional non-completion and excluded from consistency score, but counted and shown
- **Missed**: habit was not done and not intentionally skipped

### Low consistency
If recent consistency drops below a threshold such as 70%, the app may show one lightweight hint.

### Repeated misses
Repeated misses means:
- 2 missed days within the last 7 days

---

## 17. MVP Build Phases

### Phase 1: Foundation
- set up Expo app
- set up Supabase
- authentication
- basic navigation

### Phase 2: Core habit system
- create habit screen
- optional habit context screen
- today screen
- habit list storage
- daily logging

### Phase 3: Progress and review
- streaks
- completion rates
- habit detail screen
- weekly review screen

### Phase 4: AI and hint layer
- AI suggestions after weak setup
- low-consistency hints
- repeated miss suggestions
- weekly review suggestion
- suggestion logging

### Phase 5: Polish
- notifications
- improved UI spacing and typography
- error handling
- loading states

---

## 18. Recommended MVP Release Scope

The actual first release should include only:
- account creation / login
- create one habit in onboarding
- stack trigger field
- tiny action field
- optional habit context questions
- daily check-ins
- consistency + streak + skip count
- weekly reflection
- reminders
- lightweight AI suggestions and hints

This is enough to test whether users value the product.

---

## 19. Future Features After MVP

After validating the AI suggestion layer, consider:
- optional AI habit coach chat
- smarter suggestions based on time patterns
- habit templates generated from user goals
- personalized trigger recommendations
- automatic detection of weak or vague habit setups
- richer analytics
- tags or habit categories
- mood/energy correlation
- calendar views
- shared habits or accountability partner

---

## 20. Final Product Direction

This app should be defined by **clarity and consistency**, not by feature volume.

The strongest version of the product is:

**A clean mobile app that helps users build habits through identity, stack triggers, tiny actions, daily repetition, weekly reflection, optional habit context, and small AI suggestions that improve behavior design.**
