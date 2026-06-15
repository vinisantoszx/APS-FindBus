# Testes locais do FindBus

Este fluxo é para a branch `dev`, onde o protótipo visual será transformado em funcionalidades reais.

## 1. Entrar na branch dev

```bash
git fetch origin
git checkout dev
git pull origin dev
```

## 2. Instalar dependências

```bash
npm install
```

## 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` com base no `.env.example`:

```bash
cp .env.example .env.local
```

Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL="https://SEU-PROJETO.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="SUA_CHAVE_ANONIMA"
```

## 4. Criar ou atualizar as tabelas no Supabase

No painel do Supabase, abra o **SQL Editor** e execute, nesta ordem:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

O `schema.sql` cria e atualiza as tabelas principais do projeto:

- `profiles`
- `routes`
- `vehicles`
- `stops`
- `trips`
- `route_favorites`
- `occurrences`
- `service_ratings`

O `seed.sql` cria dados iniciais de rotas, veículos, viagens, paradas, ocorrências e avaliações.

### Correção rápida para erro de schema cache

Se aparecer erro parecido com:

```text
Could not find the 'active' column of 'routes' in the schema cache
```

execute no SQL Editor:

```sql
alter table public.routes add column if not exists active boolean not null default true;
alter table public.vehicles add column if not exists active boolean not null default true;

update public.routes set active = true where active is null;
update public.vehicles set active = true where active is null;

notify pgrst, 'reload schema';
```

Também deixei esse mesmo ajuste em `supabase/fix-schema-cache.sql`.

## 5. Rodar localmente

```bash
npm run dev
```

Acesse:

- Estudante: http://localhost:3000
- Admin: http://localhost:3000/admin
- Login: http://localhost:3000/login

## 6. Primeiros testes esperados

Na tela do estudante:

- as rotas devem vir do Supabase;
- a busca deve filtrar as rotas carregadas;
- o botão de favorito deve salvar/remover favoritos quando o usuário estiver logado;
- o botão de ocorrência deve registrar uma ocorrência no banco.

Na tela admin:

- os cards devem carregar veículos, rotas, paradas, ocorrências e avaliações do Supabase;
- o cadastro de veículos, rotas e paradas deve inserir dados reais no banco;
- o mapa deve carregar viagens da tabela `trips`.
