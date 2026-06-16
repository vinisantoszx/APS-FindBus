-- Setup da tabela de rotas favoritas do estudante.
-- Execute no SQL Editor do Supabase se o coração de favorito não salvar.
-- O script detecta automaticamente se public.routes.id é uuid, bigint ou outro tipo compatível.

create extension if not exists pgcrypto;

DO $$
DECLARE
  route_id_type text;
  favorite_route_id_type text;
  has_favorite_values boolean;
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

  IF to_regclass('public.route_favorites') IS NULL THEN
    EXECUTE format('create table public.route_favorites (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      route_id %s not null references public.routes(id) on delete cascade,
      created_at timestamptz not null default now()
    )', route_id_type);
  ELSE
    alter table public.route_favorites add column if not exists user_id uuid;
    alter table public.route_favorites add column if not exists created_at timestamptz not null default now();
  END IF;

  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO favorite_route_id_type
  FROM pg_attribute attribute
  WHERE attribute.attrelid = 'public.route_favorites'::regclass
    AND attribute.attname = 'route_id'
    AND NOT attribute.attisdropped;

  IF favorite_route_id_type IS NULL THEN
    EXECUTE format('alter table public.route_favorites add column route_id %s', route_id_type);
  ELSIF favorite_route_id_type <> route_id_type THEN
    EXECUTE 'select exists (select 1 from public.route_favorites where route_id is not null)'
    INTO has_favorite_values;

    IF has_favorite_values THEN
      RAISE EXCEPTION 'public.route_favorites.route_id está como %, mas public.routes.id é %. Remova os favoritos antigos antes de converter.', favorite_route_id_type, route_id_type;
    END IF;

    EXECUTE 'alter table public.route_favorites drop column route_id';
    EXECUTE format('alter table public.route_favorites add column route_id %s', route_id_type);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.route_favorites'::regclass
      AND conname = 'route_favorites_route_id_fkey'
  ) THEN
    EXECUTE 'alter table public.route_favorites add constraint route_favorites_route_id_fkey foreign key (route_id) references public.routes(id) on delete cascade';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.route_favorites'::regclass
      AND conname = 'route_favorites_user_id_fkey'
  ) THEN
    EXECUTE 'alter table public.route_favorites add constraint route_favorites_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.route_favorites'::regclass
      AND conname = 'route_favorites_user_route_unique'
  ) THEN
    EXECUTE 'alter table public.route_favorites add constraint route_favorites_user_route_unique unique (user_id, route_id)';
  END IF;
END $$;

alter table public.route_favorites enable row level security;

drop policy if exists "favorites_read_own" on public.route_favorites;
create policy "favorites_read_own" on public.route_favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.route_favorites;
create policy "favorites_insert_own" on public.route_favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.route_favorites;
create policy "favorites_delete_own" on public.route_favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
