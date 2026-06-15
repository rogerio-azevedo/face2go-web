---
name: project-conventions
description: >
  Convenções obrigatórias do frontend web Face2GO (Next.js BFF). Consultar antes
  de criar rotas, actions, componentes ou chamadas à API. Define arquitetura
  server-first, multi-tenant, auth e estrutura features/.
metadata:
  author: project-team
  version: "2.0.0"
---

# Project Conventions — Face2GO Web (Next.js BFF)

## Contexto

O **face2go-web** é um **BFF (Backend for Frontend)** — **não possui banco de dados próprio**. Toda persistência e regra de negócio vive no **NestJS** (`face2go-server`). O web:

1. Renderiza UI (App Router, React 19)
2. Protege rotas (NextAuth + proxy Next 16)
3. Chama a API Nest via Server Components, Server Actions e (em clientes interativos) TanStack Query

### Hierarquia multi-tenant

- **Super Admin** → `/super-admin/*`
- **Empresa** → `/company/*`
- **Cliente/Escola** → `/client/*`
- Rotas públicas: login, cadastro, convites, display TV

---

## 1. Arquitetura em camadas

| Zona | Pastas | Conteúdo |
|------|--------|----------|
| Rotas | `src/app/` | Pages, layouts, Server Actions co-localizadas |
| Features | `src/features/<domínio>/` | UI, actions, hooks, validations por domínio |
| Compartilhado | `src/lib/` | api-fetch, openapi-client, validations, permissions |
| UI primitiva | `src/components/ui/` | shadcn v4 (Base UI) |
| Shell | `src/components/shared/` | Sidebar, Header, Providers |
| Tipos API | `src/types/api.generated.ts` | Gerado via OpenAPI — **não editar manualmente** |
| Estado UI | `src/store/` | Zustand apenas para estado de shell (header) |

**Fluxo server-first:**

```
Page (Server Component)
  → apiFetchAuthed('/api/...')
  → passa props para Client Component

Server Action ('use server')
  → valida com Zod
  → apiFetchAuthed
  → revalidatePath
```

**Fluxo client interativo (tabelas, wizards):**

```
Client Component
  → useQuery / useMutation (TanStack Query)
  → createApiClient(token) ou Server Action
```

---

## 2. Stack tecnológica

| Camada | Tecnologia |
|--------|------------|
| Framework | **Next.js 16** (App Router) |
| React | **19** |
| Estilos | **Tailwind CSS v4** + shadcn (Base UI) |
| Validação | **Zod 4** + react-hook-form |
| Auth | **NextAuth 5** (JWT + Credentials) |
| Proxy rotas | `src/proxy.ts` (Next 16 — substitui middleware) |
| Estado client | **Zustand** (shell only) + **TanStack Query** (dados remotos) |
| API | `api-fetch.ts` + `openapi-fetch` (tipado) |
| Pacotes | **pnpm** |

---

## 3. Estrutura de pastas (alvo)

```
src/
├── app/                          # Rotas Next.js
│   ├── company/
│   ├── client/
│   ├── super-admin/
│   └── api/auth/[...nextauth]/
├── features/                     # Domínios autocontidos
│   ├── school/
│   │   ├── components/
│   │   ├── actions/
│   │   ├── hooks/
│   │   └── validations/
│   ├── cameras/
│   ├── readers/
│   └── auth/
├── components/
│   ├── ui/                       # shadcn
│   └── shared/                   # Shell app
├── lib/
│   ├── api-fetch.ts
│   ├── api/openapi-client.ts
│   ├── actions/                  # Helpers compartilhados (zodFirstMessage, actionResult)
│   └── validations/              # Schemas Zod de formulários (legado — migrar para features/)
├── hooks/
├── store/
├── types/
│   ├── api.generated.ts          # OpenAPI gerado
│   └── auth-context.ts
├── auth.ts
├── auth.config.ts
└── proxy.ts
```

**Regra boy scout:** código novo vai em `features/<domínio>/`. Código legado em `components/company/` migra incrementalmente.

---

## 4. Server Actions — padrão

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { zodFirstMessage } from '@/lib/actions/zod-utils';
import { apiFetchAuthed, nestErrorMessage, parseResponseJson } from '@/lib/api-fetch';
import { createStudentSchema } from '@/features/school/validations/students';

export async function createStudentAction(clientId: string, input: unknown) {
  const parsed = createStudentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: zodFirstMessage(parsed.error) };
  }

  const res = await apiFetchAuthed(`/api/clients/${clientId}/students`, {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    const data = await parseResponseJson(res);
    return { ok: false as const, error: nestErrorMessage(data) };
  }

  revalidatePath(`/company/clientes/${clientId}/usuarios`);
  return { ok: true as const };
}
```

**Regras:**
- Actions **finas** — validação + fetch + revalidate
- **Nunca** duplicar `zodFirstMessage` — importar de `@/lib/actions/zod-utils`
- Validar no client (RHF+Zod) **e** no server (action)
- Usar `revalidatePath` ou `revalidateTag` após mutações

---

## 5. Autenticação

- Login → backend retorna token → `signIn('credentials', { accessToken, ... })`
- Server: `auth()` → `session.accessToken` → `apiFetchAuthed`
- Proxy (`src/proxy.ts`) protege rotas autenticadas
- Layouts de área (`company/layout.tsx`) fazem redirect por role
- Helpers: `getDashboardPathForRole` em `lib/dashboard-path.ts`

---

## 6. OpenAPI e tipos

- Tipos gerados: `pnpm openapi:gen` (requer backend rodando ou `openapi.json` do server)
- Cliente tipado: `createApiClient(token)` em `lib/api/openapi-client.ts`
- **Não** manter tipos manuais duplicados em `domain.ts` — migrar para `api.generated.ts`
- Tipos de UI-only (props de componente) podem ficar locais

---

## 7. Componentes

- **Server Components** por padrão nas pages
- `"use client"` apenas quando necessário (forms, interatividade, hooks)
- shadcn em `components/ui/` — não reinventar primitivos
- Forms: react-hook-form + zodResolver
- Arquivos ≤ 300 linhas — extrair subcomponentes

---

## 8. Variáveis de ambiente

| Variável | Obrigatória | Uso |
|----------|-------------|-----|
| `NEXT_PUBLIC_API_URL` | Sim | URL do NestJS |
| `AUTH_SECRET` | Sim (prod) | NextAuth |
| `AUTH_URL` | Sim (prod) | NextAuth |

Ver `.env.example`. Validar env com Zod quando possível.

---

## 9. Checklist antes de commitar

- [ ] Nova feature em `src/features/<domínio>/`?
- [ ] Server Action valida com Zod e usa helpers compartilhados?
- [ ] Fetch via `apiFetchAuthed` (não fetch direto)?
- [ ] Tipos da API vêm de `api.generated.ts`?
- [ ] Componente client justificado e ≤ 300 linhas?
- [ ] `pnpm lint` e `pnpm build` passam?

Consulte também **[data-and-actions](data-and-actions/SKILL.md)** e **[design-system](design-system/SKILL.md)**.
