alter table public.weekly_reviews
add column if not exists went_well text,
add column if not exists was_hard text;

alter table public.weekly_reviews
drop constraint if exists weekly_reviews_one_per_week;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'weekly_reviews_one_per_user_habit_week'
  ) then
    alter table public.weekly_reviews
    add constraint weekly_reviews_one_per_user_habit_week
    unique (user_id, habit_id, week_start);
  end if;
end $$;

drop index if exists public.idx_weekly_reviews_habit_week;

create index if not exists idx_weekly_reviews_user_habit_week
  on public.weekly_reviews (user_id, habit_id, week_start desc);

drop policy if exists "weekly_reviews_select_own" on public.weekly_reviews;
create policy "weekly_reviews_select_own"
on public.weekly_reviews for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "weekly_reviews_insert_own" on public.weekly_reviews;
create policy "weekly_reviews_insert_own"
on public.weekly_reviews for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.habits
    where habits.id = weekly_reviews.habit_id
      and habits.user_id = auth.uid()
  )
);

drop policy if exists "weekly_reviews_update_own" on public.weekly_reviews;
create policy "weekly_reviews_update_own"
on public.weekly_reviews for update to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.habits
    where habits.id = weekly_reviews.habit_id
      and habits.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.habits
    where habits.id = weekly_reviews.habit_id
      and habits.user_id = auth.uid()
  )
);

drop policy if exists "weekly_reviews_delete_own" on public.weekly_reviews;
create policy "weekly_reviews_delete_own"
on public.weekly_reviews for delete to authenticated
using (auth.uid() = user_id);
