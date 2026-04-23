# Habit Builder Environment Setup

## Supabase MVP Requirement

For MVP testing, Supabase email confirmation must be **disabled**.

This is a required project setting, not an optional UX branch:
- successful sign-up is expected to return a session immediately
- the app routes directly into the signed-in flow after sign-up success
- if sign-up returns no session, treat the project as misconfigured

Hosted Supabase setting to verify:
- Auth
- Providers
- Email
- Confirm email: **OFF**

## Required Environment Variables

Set these Expo public environment variables before running the app against a real backend:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
