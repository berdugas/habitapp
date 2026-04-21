begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'habit_log_status') then
    create type public.habit_log_status as enum ('done', 'skipped', 'missed');
  end if;

  if not exists (select 1 from pg_type where typname = 'difficulty_expectation') then
    create type public.difficulty_expectation as enum ('very_easy', 'manageable', 'hard');
  end if;

  if not exists (select 1 from pg_type where typname = 'common_obstacle') then
    create type public.common_obstacle as enum (
      'forget',
      'busy',
      'low_motivation',
      'routine_changes',
      'too_big',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'available_time_band') then
    create type public.available_time_band as enum (
      'under_2_min',
      'about_5_min',
      'ten_plus_min'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'ai_trigger_source') then
    create type public.ai_trigger_source as enum (
      'create_habit',
      'repeated_miss',
      'weekly_review',
      'manual_help',
      'low_consistency'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'ai_suggestion_category') then
    create type public.ai_suggestion_category as enum (
      'shrink_action',
      'clarify_trigger',
      'refine_identity',
      'keep_setup',
      'weekly_adjustment',
      'low_consistency_hint'
    );
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  identity_statement text,
  stack_trigger text not null check (char_length(trim(stack_trigger)) between 1 and 240),
  tiny_action text not null check (char_length(trim(tiny_action)) between 1 and 240),
  preferred_time_window text,
  reminder_enabled boolean not null default false,
  reminder_time time,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint habits_reminder_time_check
    check (
      (reminder_enabled = false)
      or
      (reminder_enabled = true and reminder_time is not null)
    )
);

create table if not exists public.habit_context (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null unique references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  motivation_reason text,
  difficulty_expectation public.difficulty_expectation,
  common_obstacle public.common_obstacle,
  available_time_band public.available_time_band,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  status public.habit_log_status not null,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint habit_logs_one_per_day unique (habit_id, log_date)
);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  trigger_worked boolean,
  tiny_action_too_hard boolean,
  adjustment_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint weekly_reviews_one_per_week unique (habit_id, week_start)
);

create table if not exists public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_source public.ai_trigger_source not null,
  category public.ai_suggestion_category not null,
  headline text not null,
  message text not null,
  suggested_field text check (
    suggested_field in ('tiny_action', 'stack_trigger', 'identity_statement', 'none')
  ),
  current_value text,
  proposed_value text,
  reason_code text,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  shown_at timestamptz not null default timezone('utc', now()),
  applied_at timestamptz,
  dismissed_at timestamptz,
  model_name text,
  input_snapshot jsonb,
  output_snapshot jsonb
);

create index if not exists idx_habits_user_active
  on public.habits (user_id, is_active, created_at desc);

create index if not exists idx_habit_context_user
  on public.habit_context (user_id);

create index if not exists idx_habit_logs_habit_date
  on public.habit_logs (habit_id, log_date desc);

create index if not exists idx_habit_logs_user_date
  on public.habit_logs (user_id, log_date desc);

create index if not exists idx_weekly_reviews_habit_week
  on public.weekly_reviews (habit_id, week_start desc);

create index if not exists idx_ai_suggestions_habit_shown
  on public.ai_suggestions (habit_id, shown_at desc);

create index if not exists idx_ai_suggestions_user_shown
  on public.ai_suggestions (user_id, shown_at desc);

drop trigger if exists trg_habits_updated_at on public.habits;
create trigger trg_habits_updated_at
before update on public.habits
for each row execute function public.set_updated_at();

drop trigger if exists trg_habit_context_updated_at on public.habit_context;
create trigger trg_habit_context_updated_at
before update on public.habit_context
for each row execute function public.set_updated_at();

drop trigger if exists trg_habit_logs_updated_at on public.habit_logs;
create trigger trg_habit_logs_updated_at
before update on public.habit_logs
for each row execute function public.set_updated_at();

drop trigger if exists trg_weekly_reviews_updated_at on public.weekly_reviews;
create trigger trg_weekly_reviews_updated_at
before update on public.weekly_reviews
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_context enable row level security;
alter table public.habit_logs enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.ai_suggestions enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
on public.user_profiles for select to authenticated
using (auth.uid() = id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
on public.user_profiles for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
on public.user_profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "habits_select_own" on public.habits;
create policy "habits_select_own"
on public.habits for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own"
on public.habits for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own"
on public.habits for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own"
on public.habits for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "habit_context_select_own" on public.habit_context;
create policy "habit_context_select_own"
on public.habit_context for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "habit_context_insert_own" on public.habit_context;
create policy "habit_context_insert_own"
on public.habit_context for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "habit_context_update_own" on public.habit_context;
create policy "habit_context_update_own"
on public.habit_context for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "habit_context_delete_own" on public.habit_context;
create policy "habit_context_delete_own"
on public.habit_context for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "habit_logs_select_own" on public.habit_logs;
create policy "habit_logs_select_own"
on public.habit_logs for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "habit_logs_insert_own" on public.habit_logs;
create policy "habit_logs_insert_own"
on public.habit_logs for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "habit_logs_update_own" on public.habit_logs;
create policy "habit_logs_update_own"
on public.habit_logs for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "habit_logs_delete_own" on public.habit_logs;
create policy "habit_logs_delete_own"
on public.habit_logs for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "weekly_reviews_select_own" on public.weekly_reviews;
create policy "weekly_reviews_select_own"
on public.weekly_reviews for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "weekly_reviews_insert_own" on public.weekly_reviews;
create policy "weekly_reviews_insert_own"
on public.weekly_reviews for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "weekly_reviews_update_own" on public.weekly_reviews;
create policy "weekly_reviews_update_own"
on public.weekly_reviews for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "weekly_reviews_delete_own" on public.weekly_reviews;
create policy "weekly_reviews_delete_own"
on public.weekly_reviews for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "ai_suggestions_select_own" on public.ai_suggestions;
create policy "ai_suggestions_select_own"
on public.ai_suggestions for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "ai_suggestions_insert_own" on public.ai_suggestions;
create policy "ai_suggestions_insert_own"
on public.ai_suggestions for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "ai_suggestions_update_own" on public.ai_suggestions;
create policy "ai_suggestions_update_own"
on public.ai_suggestions for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ai_suggestions_delete_own" on public.ai_suggestions;
create policy "ai_suggestions_delete_own"
on public.ai_suggestions for delete to authenticated
using (auth.uid() = user_id);

commit;
