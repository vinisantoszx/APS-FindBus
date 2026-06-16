-- Setup das avaliações de rotas para o protótipo FindBus.
-- Execute no SQL Editor do Supabase antes de testar o formulário "Avaliar rota".
-- O script detecta o tipo de public.routes.id para funcionar com bancos usando uuid ou bigint.

DO $$
DECLARE
  route_id_type text;
  rating_route_id_type text;
  has_rating_route_values boolean;
BEGIN
  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO route_id_type
  FROM pg_attribute attribute
  WHERE attribute.attrelid = 'public.routes'::regclass
    AND attribute.attname = 'id'
    AND NOT attribute.attisdropped;

  IF route_id_type IS NULL THEN
    RAISE EXCEPTION 'Não foi possível identificar public.routes.id. Crie a tabela routes antes de rodar este setup.';
  END IF;

  IF to_regclass('public.service_ratings') IS NULL THEN
    EXECUTE format($create_table$
      create table public.service_ratings (
        id bigint generated always as identity primary key,
        user_id uuid references auth.users(id) on delete set null,
        route_id %s references public.routes(id) on delete set null,
        rating integer not null check (rating between 1 and 5),
        punctuality integer check (punctuality between 0 and 100),
        comfort integer check (comfort between 0 and 100),
        communication integer check (communication between 0 and 100),
        comment text,
        created_at timestamptz not null default now()
      )
    $create_table$, route_id_type);
  ELSE
    alter table public.service_ratings add column if not exists user_id uuid references auth.users(id) on delete set null;
    alter table public.service_ratings add column if not exists rating integer not null default 5;
    alter table public.service_ratings add column if not exists punctuality integer;
    alter table public.service_ratings add column if not exists comfort integer;
    alter table public.service_ratings add column if not exists communication integer;
    alter table public.service_ratings add column if not exists comment text;
    alter table public.service_ratings add column if not exists created_at timestamptz not null default now();

    SELECT format_type(attribute.atttypid, attribute.atttypmod)
    INTO rating_route_id_type
    FROM pg_attribute attribute
    WHERE attribute.attrelid = 'public.service_ratings'::regclass
      AND attribute.attname = 'route_id'
      AND NOT attribute.attisdropped;

    IF rating_route_id_type IS NULL THEN
      EXECUTE format('alter table public.service_ratings add column route_id %s', route_id_type);
    ELSIF rating_route_id_type <> route_id_type THEN
      EXECUTE 'select exists (select 1 from public.service_ratings where route_id is not null)'
      INTO has_rating_route_values;

      IF has_rating_route_values THEN
        RAISE EXCEPTION 'A coluna public.service_ratings.route_id existe como %, mas public.routes.id é %. Como há dados preenchidos, corrija manualmente antes de trocar o tipo.', rating_route_id_type, route_id_type;
      END IF;

      EXECUTE 'alter table public.service_ratings drop column route_id';
      EXECUTE format('alter table public.service_ratings add column route_id %s', route_id_type);
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public.service_ratings'::regclass
        AND conname = 'service_ratings_route_id_fkey'
    ) THEN
      EXECUTE 'alter table public.service_ratings add constraint service_ratings_route_id_fkey foreign key (route_id) references public.routes(id) on delete set null';
    END IF;
  END IF;
END $$;

alter table public.service_ratings enable row level security;

drop policy if exists "ratings_read_all" on public.service_ratings;
create policy "ratings_read_all" on public.service_ratings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "ratings_insert_for_prototype" on public.service_ratings;
create policy "ratings_insert_for_prototype" on public.service_ratings
  for insert
  to anon, authenticated
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "ratings_update_for_prototype" on public.service_ratings;
create policy "ratings_update_for_prototype" on public.service_ratings
  for update
  to anon, authenticated
  using (true)
  with check (true);

notify pgrst, 'reload schema';
