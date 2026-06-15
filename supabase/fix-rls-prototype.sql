-- Correção rápida de RLS para testes locais do protótipo FindBus.
-- Atenção: estas políticas são permissivas para desenvolvimento.
-- Em produção, troque por regras baseadas em profiles.role = 'admin'.

alter table public.routes enable row level security;
alter table public.vehicles enable row level security;
alter table public.stops enable row level security;
alter table public.trips enable row level security;
alter table public.occurrences enable row level security;
alter table public.service_ratings enable row level security;

drop policy if exists "routes_read_all" on public.routes;
create policy "routes_read_all" on public.routes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "routes_write_for_prototype" on public.routes;
create policy "routes_write_for_prototype" on public.routes
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "vehicles_read_all" on public.vehicles;
create policy "vehicles_read_all" on public.vehicles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "vehicles_write_for_prototype" on public.vehicles;
create policy "vehicles_write_for_prototype" on public.vehicles
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "stops_read_all" on public.stops;
create policy "stops_read_all" on public.stops
  for select
  to anon, authenticated
  using (true);

drop policy if exists "stops_write_for_prototype" on public.stops;
create policy "stops_write_for_prototype" on public.stops
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "trips_read_all" on public.trips;
create policy "trips_read_all" on public.trips
  for select
  to anon, authenticated
  using (true);

drop policy if exists "trips_write_for_prototype" on public.trips;
create policy "trips_write_for_prototype" on public.trips
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "occurrences_read_all" on public.occurrences;
create policy "occurrences_read_all" on public.occurrences
  for select
  to anon, authenticated
  using (true);

drop policy if exists "occurrences_insert_for_prototype" on public.occurrences;
create policy "occurrences_insert_for_prototype" on public.occurrences
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "ratings_read_all" on public.service_ratings;
create policy "ratings_read_all" on public.service_ratings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "ratings_insert_for_prototype" on public.service_ratings;
create policy "ratings_insert_for_prototype" on public.service_ratings
  for insert
  to anon, authenticated
  with check (true);

notify pgrst, 'reload schema';
