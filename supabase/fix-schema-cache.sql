-- Correção rápida para bancos Supabase criados antes da coluna active.
-- Execute este arquivo no SQL Editor se aparecer erro como:
-- Could not find the 'active' column of 'routes' in the schema cache

alter table public.routes add column if not exists active boolean not null default true;
alter table public.vehicles add column if not exists active boolean not null default true;

update public.routes set active = true where active is null;
update public.vehicles set active = true where active is null;

notify pgrst, 'reload schema';
