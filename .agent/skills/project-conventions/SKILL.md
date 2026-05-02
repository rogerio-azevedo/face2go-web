---
name: project-conventions
description: >
  Convenções obrigatórias do projeto Face2go. Consultar antes de criar rotas,
  schema, actions ou componentes. Define stack, multi-tenant, estrutura de
  pastas e autenticação.
metadata:
  author: project-team
  version: "1.0.0"
---

# Project Conventions — Face2go

## Contexto do Domínio

**Face2go** é um SaaS **multi-tenant** para **cadastro de faces em leitores faciais**.

Hierarquia:

- **Super Admin**: operação global da plataforma (todas as empresas).
- **Empresa (`companies`)**: tenant raiz — agrupa clientes e usuários internos.
- **Cliente (`clients`)**: unidade operacional (escritório, clínica, condomínio, etc.).
- **Leitor facial (`facial_readers`)**: dispositivo vinculado a um cliente.
- **Face (`faces`)**: registro biométrico / metadados associados a um usuário e cliente.

### Isolamento multi-tenant

- Toda query à listagem de dados de negócio DEVE ser filtrada por **`company_id`** e/ou **`client_id`**, conforme o papel do usuário.
- **Super admin** pode cruzar empresas; demais papéis apenas dentro do escopo da sessão (`companyId`, `clientId`).
- Nunca retornar linhas de outro tenant por esquecimento de `WHERE`.

---

## 1. Arquitetura (Servidor / Cliente / Compartilhado)

| Zona | Pastas | Conteúdo |
|------|--------|-----------|
| Servidor | `src/db/`, `src/app/actions/`, `src/app/api/`, `src/services/`, `src/auth.ts`, `src/auth.config.ts` | ORM, queries, actions (finas), handlers, regras de negócio |
| Compartilhado | `src/lib/`, `src/utils/`, `src/types/` | `cn()`, validações Zod reutilizáveis, tipos |
| Cliente | `src/components/`, `src/hooks/` | UI React, hooks |

**Fluxo Action → Service → Query**

1. **Action** (`src/app/actions/`): checa sessão, valida com Zod, chama service, `revalidatePath` / `redirect`.
2. **Service** (`src/services/`): regras de negócio, sem `"use server"` fixo no topo se puro servidor importado pela action.
3. **Query** (`src/db/queries/`): apenas acesso a dados (Drizzle).

**Utilitários**

- `src/lib/utils.ts` — **somente** `cn()` (convenção shadcn).
- Demais funções puras (máscaras, formatadores) em `src/utils/`.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Observações |
|--------|------------|-------------|
| Framework | **Next.js 16** (App Router) | App Router apenas |
| Linguagem | **TypeScript 5** (strict) | Evitar `any` |
| Estilos | **Tailwind CSS v4** + shadcn (Base UI/registry atual) | Utility-first |
| Banco | **PostgreSQL** (Neon) | Pool via `DATABASE_URL` / `POSTGRES_URL` |
| ORM | **Drizzle ORM ~0.45** | Schema em `src/db/schema`, migrations em `drizzle/` |
| HTTP driver app | `@neondatabase/serverless` | `src/db/index.ts` |
| Migrations CLI | `postgres` + drizzle-kit | URL **unpooled** em `DATABASE_URL_UNPOOLED` |
| Validação | **Zod 4** | Forms, APIs, env quando aplic |
| Auth | **Auth.js / next-auth `5.0.0-beta.30`** | JWT + Credentials; adapter Drizzle |
| Pacotes | **pnpm** | Não usar npm/yarn no repo |
| Proxy (Next 16) | `src/proxy.ts` | Proteção de rotas (substitui convenção `middleware`) |

---

## 3. Papéis e rotas

**Papel global** (`user.role` enum `global_user_role`): `super_admin`, `face_user`, `member`.

**Papéis de empresa** (`company_users.role`): `company_admin`, `company_operator`.

**Papéis de cliente** (`client_users.role`): `client_admin`, `client_operator`.

Na **sessão**, o campo `session.user.role` reflete o **papel efetivo** para autorização de UI:

- `super_admin` → área `/super-admin/*`
- `company_admin` | `company_operator` → `/company/*`
- `client_admin` | `client_operator` | `face_user` → `/client/*`

Helpers: `getDashboardPathForRole` em [`src/lib/dashboard-path.ts`](src/lib/dashboard-path.ts).

---

## 4. Estrutura de pastas (alvo)

```
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts
│   ├── login/
│   ├── super-admin/
│   ├── company/
│   ├── client/
│   ├── layout.tsx, page.tsx, globals.css
├── components/
│   ├── ui/                 # shadcn
│   ├── shared/             # AppProviders, SignOutButton, ...
│   └── [rota]/[Nome]/      # componentes por tela
├── db/
│   ├── index.ts
│   ├── schema/
│   ├── queries/
│   └── seeds/
├── lib/
│   ├── utils.ts            # só cn()
│   └── validations/
├── services/
├── hooks/
├── types/
├── auth.ts
├── auth.config.ts
└── proxy.ts
```

Componentes por **rota**: `src/components/login/LoginForm/index.tsx`, etc.

---

## 5. Banco de dados (Drizzle)

- Um arquivo por módulo em `src/db/schema/*.ts`, export central em `index.ts`.
- Nomes de tabelas NextAuth compatíveis com adapter: `user`, `account`, `session`, `verificationToken`.
- Scripts: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`.

---

## 6. Variáveis de ambiente

Ver `.env.example` na raiz do projeto Face2go. Obrigatórios para produção:

- `DATABASE_URL` (pooled)
- `DATABASE_URL_UNPOOLED` (migrations)
- `AUTH_SECRET`, `AUTH_URL`

Seed local: `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`.

---

## 7. Checklist antes de commitar

- [ ] Queries com filtro de tenant quando não for super admin?
- [ ] Entradas validadas com Zod?
- [ ] `pnpm` para dependências?
- [ ] Novos componentes shadcn antes de reinventar UI?
- [ ] Actions finas + lógica em `services/` quando crescer?
