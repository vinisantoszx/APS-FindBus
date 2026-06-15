-- Correção rápida para bancos Supabase criados antes das últimas alterações do protótipo.
-- Execute este arquivo no SQL Editor se aparecer erro de coluna ausente, como:
-- Could not find the 'active' column of 'routes' in the schema cache
-- column stops.route_id does not exist

alter table public.routes add column if not exists active boolean not null default true;
alter table public.vehicles add column if not exists active boolean not null default true;

alter table public.stops add column if not exists route_id bigint references public.routes(id) on delete set null;
alter table public.stops add column if not exists sequence_order integer not null default 1;
alter table public.stops add column if not exists created_at timestamptz not null default now();

update public.routes set active = true where active is null;
update public.vehicles set active = true where active is null;
update public.stops set sequence_order = 1 where sequence_order is null;

notify pgrst, 'reload schema';
