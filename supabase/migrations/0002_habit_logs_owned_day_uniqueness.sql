begin;

alter table public.habit_logs
drop constraint if exists habit_logs_one_per_day;

alter table public.habit_logs
add constraint habit_logs_one_per_owned_day unique (user_id, habit_id, log_date);

commit;
