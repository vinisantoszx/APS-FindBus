-- Setup completo para o painel administrativo do FindBus.
-- Execute este arquivo no SQL Editor do Supabase quando o admin reclamar de tabela/coluna ausente.
-- O script é idempotente: pode ser rodado mais de uma vez.

create extension if not exists pgcrypto;

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null unique,
  model text not null,
  capacity integer not null default 40,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.routes add column if not exists name text;
alter table public.routes add column if not exists description text;
alter table public.routes add column if not exists active boolean not null default true;
alter table public.routes add column if not exists created_at timestamptz not null default now();

alter table public.vehicles add column if not exists plate text;
alter table public.vehicles add column if not exists model text;
alter table public.vehicles add column if not exists capacity integer not null default 40;
alter table public.vehicles add column if not exists active boolean not null default true;
alter table public.vehicles add column if not exists created_at timestamptz not null default now();

DO $$
DECLARE
  route_id_type text;
  vehicle_id_type text;
  existing_type text;
  has_values boolean;
BEGIN
  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO route_id_type
  FROM pg_attribute attribute
  WHERE attribute.attrelid = 'public.routes'::regclass
    AND attribute.attname = 'id'
    AND NOT attribute.attisdropped;

  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO vehicle_id_type
  FROM pg_attribute attribute
  WHERE attribute.attrelid = 'public.vehicles'::regclass
    AND attribute.attname = 'id'
    AND NOT attribute.attisdropped;

  IF route_id_type IS NULL THEN
    RAISE EXCEPTION 'Não foi possível identificar o tipo de public.routes.id.';
  END IF;

  IF vehicle_id_type IS NULL THEN
    RAISE EXCEPTION 'Não foi possível identificar o tipo de public.vehicles.id.';
  END IF;

  IF to_regclass('public.stops') IS NULL THEN
    EXECUTE format('create table public.stops (
      id uuid primary key default gen_random_uuid(),
      route_id %s references public.routes(id) on delete set null,
      name text not null,
      latitude double precision not null,
      longitude double precision not null,
      sequence_order integer not null default 1,
      created_at timestamptz not null default now()
    )', route_id_type);
  ELSE
    alter table public.stops add column if not exists name text;
    alter table public.stops add column if not exists latitude double precision;
    alter table public.stops add column if not exists longitude double precision;
    alter table public.stops add column if not exists sequence_order integer not null default 1;
    alter table public.stops add column if not exists created_at timestamptz not null default now();
  END IF;

  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO existing_type
  FROM pg_attribute attribute
  WHERE attribute.attrelid = 'public.stops'::regclass
    AND attribute.attname = 'route_id'
    AND NOT attribute.attisdropped;

  IF existing_type IS NULL THEN
    EXECUTE format('alter table public.stops add column route_id %s', route_id_type);
  ELSIF existing_type <> route_id_type THEN
    EXECUTE 'select exists (select 1 from public.stops where route_id is not null)' INTO has_values;
    IF has_values THEN
      RAISE EXCEPTION 'public.stops.route_id está como %, mas public.routes.id é %. Esvazie stops.route_id antes de converter.', existing_type, route_id_type;
    END IF;
    EXECUTE 'alter table public.stops drop column route_id';
    EXECUTE format('alter table public.stops add column route_id %s', route_id_type);
  END IF;

  IF NOT EXISTS (select 1 from pg_constraint where conrelid = 'public.stops'::regclass and conname = 'stops_route_id_fkey') THEN
    EXECUTE 'alter table public.stops add constraint stops_route_id_fkey foreign key (route_id) references public.routes(id) on delete set null';
  END IF;

  IF to_regclass('public.trips') IS NULL THEN
    EXECUTE format('create table public.trips (
      id uuid primary key default gen_random_uuid(),
      route_id %s references public.routes(id) on delete set null,
      vehicle_id %s references public.vehicles(id) on delete set null,
      status text not null default ''waiting'',
      current_lat double precision,
      current_lng double precision,
      eta_next_stop text,
      started_at timestamptz,
      finished_at timestamptz,
      created_at timestamptz not null default now()
    )', route_id_type, vehicle_id_type);
  ELSE
    alter table public.trips add column if not exists status text not null default 'waiting';
    alter table public.trips add column if not exists current_lat double precision;
    alter table public.trips add column if not exists current_lng double precision;
    alter table public.trips add column if not exists eta_next_stop text;
    alter table public.trips add column if not exists started_at timestamptz;
    alter table public.trips add column if not exists finished_at timestamptz;
    alter table public.trips add column if not exists created_at timestamptz not null default now();
  END IF;

  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO existing_type
  FROM pg_attribute attribute
  WHERE attribute.attrelid = 'public.trips'::regclass
    AND attribute.attname = 'route_id'
    AND NOT attribute.attisdropped;

  IF existing_type IS NULL THEN
    EXECUTE format('alter table public.trips add column route_id %s', route_id_type);
  END IF;

  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO existing_type
  FROM pg_attribute attribute
  WHERE attribute.attrelid = 'public.trips'::regclass
    AND attribute.attname = 'vehicle_id'
    AND NOT attribute.attisdropped;

  IF existing_type IS NULL THEN
    EXECUTE format('alter table public.trips add column vehicle_id %s', vehicle_id_type);
  END IF;

  IF to_regclass('public.occurrences') IS NULL THEN
    EXECUTE format('create table public.occurrences (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) on delete set null,
      route_id %s references public.routes(id) on delete set null,
      vehicle_id %s references public.vehicles(id) on delete set null,
      type text not null default ''other'',
      description text not null,
      status text not null default ''open'',
      created_at timestamptz not null default now()
    )', route_id_type, vehicle_id_type);
  ELSE
    alter table public.occurrences add column if not exists user_id uuid references auth.users(id) on delete set null;
    alter table public.occurrences add column if not exists type text not null default 'other';
    alter table public.occurrences add column if not exists description text;
    alter table public.occurrences add column if not exists status text not null default 'open';
    alter table public.occurrences add column if not exists created_at timestamptz not null default now();
  END IF;

  IF to_regclass('public.service_ratings') IS NULL THEN
    EXECUTE format('create table public.service_ratings (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) on delete set null,
      route_id %s references public.routes(id) on delete set null,
      rating integer not null default 5,
      punctuality integer,
      comfort integer,
      communication integer,
      comment text,
      created_at timestamptz not null default now()
    )', route_id_type);
  ELSE
    alter table public.service_ratings add column if not exists rating integer not null default 5;
    alter table public.service_ratings add column if not exists punctuality integer;
    alter table public.service_ratings add column if not exists comfort integer;
    alter table public.service_ratings add column if not exists communication integer;
    alter table public.service_ratings add column if not exists comment text;
    alter table public.service_ratings add column if not exists created_at timestamptz not null default now();
  END IF;
END $$;

alter table public.routes enable row level security;
alter table public.vehicles enable row level security;
alter table public.stops enable row level security;
alter table public.trips enable row level security;
alter table public.occurrences enable row level security;
alter table public.service_ratings enable row level security;

drop policy if exists "routes_read_all" on public.routes;
create policy "routes_read_all" on public.routes for select to anon, authenticated using (true);
drop policy if exists "routes_write_for_prototype" on public.routes;
create policy "routes_write_for_prototype" on public.routes for all to anon, authenticated using (true) with check (true);

drop policy if exists "vehicles_read_all" on public.vehicles;
create policy "vehicles_read_all" on public.vehicles for select to anon, authenticated using (true);
drop policy if exists "vehicles_write_for_prototype" on public.vehicles;
create policy "vehicles_write_for_prototype" on public.vehicles for all to anon, authenticated using (true) with check (true);

drop policy if exists "stops_read_all" on public.stops;
create policy "stops_read_all" on public.stops for select to anon, authenticated using (true);
drop policy if exists "stops_write_for_prototype" on public.stops;
create policy "stops_write_for_prototype" on public.stops for all to anon, authenticated using (true) with check (true);

drop policy if exists "trips_read_all" on public.trips;
create policy "trips_read_all" on public.trips for select to anon, authenticated using (true);
drop policy if exists "trips_write_for_prototype" on public.trips;
create policy "trips_write_for_prototype" on public.trips for all to anon, authenticated using (true) with check (true);

drop policy if exists "occurrences_read_all" on public.occurrences;
create policy "occurrences_read_all" on public.occurrences for select to anon, authenticated using (true);
drop policy if exists "occurrences_write_for_prototype" on public.occurrences;
create policy "occurrences_write_for_prototype" on public.occurrences for all to anon, authenticated using (true) with check (true);

drop policy if exists "ratings_read_all" on public.service_ratings;
create policy "ratings_read_all" on public.service_ratings for select to anon, authenticated using (true);
drop policy if exists "ratings_write_for_prototype" on public.service_ratings;
create policy "ratings_write_for_prototype" on public.service_ratings for all to anon, authenticated using (true) with check (true);

update public.routes set active = true where active is null;
update public.vehicles set active = true where active is null;
update public.occurrences set status = 'open' where status is null;

notify pgrst, 'reload schema';
