-- Correção rápida para bancos Supabase criados antes das últimas alterações do protótipo.
-- Execute este arquivo no SQL Editor se aparecer erro de coluna ausente, como:
-- Could not find the 'active' column of 'routes' in the schema cache
-- column stops.route_id does not exist
--
-- Este script detecta automaticamente o tipo de public.routes.id.
-- Assim ele funciona tanto em bancos com routes.id uuid quanto bigint.

alter table public.routes add column if not exists active boolean not null default true;
alter table public.vehicles add column if not exists active boolean not null default true;

DO $$
DECLARE
  route_id_type text;
BEGIN
  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO route_id_type
  FROM pg_attribute attribute
  WHERE attribute.attrelid = 'public.routes'::regclass
    AND attribute.attname = 'id'
    AND NOT attribute.attisdropped;

  IF route_id_type IS NULL THEN
    RAISE EXCEPTION 'Não foi possível identificar o tipo da coluna public.routes.id.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stops'
      AND column_name = 'route_id'
  ) THEN
    EXECUTE format('alter table public.stops add column route_id %s', route_id_type);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.stops'::regclass
      AND conname = 'stops_route_id_fkey'
  ) THEN
    EXECUTE 'alter table public.stops add constraint stops_route_id_fkey foreign key (route_id) references public.routes(id) on delete set null';
  END IF;
END $$;

alter table public.stops add column if not exists sequence_order integer not null default 1;
alter table public.stops add column if not exists created_at timestamptz not null default now();

update public.routes set active = true where active is null;
update public.vehicles set active = true where active is null;
update public.stops set sequence_order = 1 where sequence_order is null;

notify pgrst, 'reload schema';
