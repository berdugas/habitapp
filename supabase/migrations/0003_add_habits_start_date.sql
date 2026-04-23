begin;

alter table public.habits
add column if not exists start_date date;

update public.habits
set start_date = created_at::date
where start_date is null;

alter table public.habits
alter column start_date set not null;

commit;
