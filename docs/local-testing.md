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

## 4. Criar as tabelas no Supabase

No painel do Supabase, abra o **SQL Editor** e execute, nesta ordem:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

O `schema.sql` cria as tabelas principais do projeto:

- `profiles`
- `routes`
- `vehicles`
- `stops`
- `trips`
- `route_favorites`
- `occurrences`
- `service_ratings`

O `seed.sql` cria dados iniciais de rotas, veículos, viagens, paradas, ocorrências e avaliações.

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

Na tela admin, a próxima etapa é ligar os cards, veículos, rotas, paradas, ocorrências e relatórios diretamente ao Supabase.
