-- Correção direta para o erro:
-- column occurrences.status does not exist

alter table public.occurrences
  add column if not exists status text not null default 'open';

alter table public.occurrences
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.occurrences'::regclass
      and conname = 'occurrences_status_check'
  ) then
    alter table public.occurrences
      add constraint occurrences_status_check
      check (status in ('open', 'in_review', 'resolved'));
  end if;
end $$;

update public.occurrences
set status = 'open'
where status is null;

notify pgrst, 'reload schema';
