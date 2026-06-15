-- Schema base para testar o FindBus localmente no Supabase.
-- Pode ser executado no SQL Editor do Supabase ou via Supabase CLI.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  institution text not null default 'Universidade Federal do Ceará - Campus Quixadá',
  course text not null default 'Análise e Projeto de Sistemas',
  role text not null default 'student' check (role in ('student', 'driver', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.routes (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id bigint generated always as identity primary key,
  plate text not null unique,
  model text not null,
  capacity integer not null default 40,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.stops (
  id bigint generated always as identity primary key,
  route_id bigint references public.routes(id) on delete set null,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  sequence_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.trips (
  id bigint generated always as identity primary key,
  route_id bigint references public.routes(id) on delete set null,
  vehicle_id bigint references public.vehicles(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'in_transit', 'delayed', 'completed', 'cancelled')),
  current_lat double precision,
  current_lng double precision,
  eta_next_stop text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.route_favorites (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  route_id bigint not null references public.routes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, route_id)
);

create table if not exists public.occurrences (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  route_id bigint references public.routes(id) on delete set null,
  vehicle_id bigint references public.vehicles(id) on delete set null,
  type text not null default 'other' check (type in ('delay', 'crowding', 'mechanical_failure', 'security', 'other')),
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  created_at timestamptz not null default now()
);

create table if not exists public.service_ratings (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  route_id bigint references public.routes(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  punctuality integer check (punctuality between 0 and 100),
  comfort integer check (comfort between 0 and 100),
  communication integer check (communication between 0 and 100),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.routes enable row level security;
alter table public.vehicles enable row level security;
alter table public.stops enable row level security;
alter table public.trips enable row level security;
alter table public.route_favorites enable row level security;
alter table public.occurrences enable row level security;
alter table public.service_ratings enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "routes_read_all" on public.routes;
create policy "routes_read_all" on public.routes
  for select using (true);

drop policy if exists "vehicles_read_all" on public.vehicles;
create policy "vehicles_read_all" on public.vehicles
  for select using (true);

drop policy if exists "stops_read_all" on public.stops;
create policy "stops_read_all" on public.stops
  for select using (true);

drop policy if exists "trips_read_all" on public.trips;
create policy "trips_read_all" on public.trips
  for select using (true);

drop policy if exists "favorites_read_own" on public.route_favorites;
create policy "favorites_read_own" on public.route_favorites
  for select using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.route_favorites;
create policy "favorites_insert_own" on public.route_favorites
  for insert with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.route_favorites;
create policy "favorites_delete_own" on public.route_favorites
  for delete using (auth.uid() = user_id);

drop policy if exists "occurrences_insert_authenticated" on public.occurrences;
create policy "occurrences_insert_authenticated" on public.occurrences
  for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "occurrences_read_all" on public.occurrences;
create policy "occurrences_read_all" on public.occurrences
  for select using (true);

drop policy if exists "ratings_insert_authenticated" on public.service_ratings;
create policy "ratings_insert_authenticated" on public.service_ratings
  for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "ratings_read_all" on public.service_ratings;
create policy "ratings_read_all" on public.service_ratings
  for select using (true);
