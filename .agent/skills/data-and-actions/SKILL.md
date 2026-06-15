---
name: data-and-actions
description: >
  Padrões de data fetching, Server Actions, TanStack Query e cliente OpenAPI
  no frontend web Face2GO. Consultar antes de implementar chamadas à API.
metadata:
  author: project-team
  version: "1.0.0"
---

# Data & Actions — Face2GO Web

## Quando usar cada abordagem

| Cenário | Abordagem |
|---------|-----------|
| Page inicial / SSR | Server Component + `apiFetchAuthed` |
| Mutação simples (form submit) | Server Action |
| Tabela interativa (sort, filter, paginate) | TanStack Query + Server Action ou API client |
| Polling / SSE | Hook dedicado (`use-arrival-stream.ts`) |
| Wizard multi-step | Server Actions por step + estado local |

---

## 1. api-fetch (server-side)

```typescript
import { apiFetchAuthed, parseResponseJson, nestErrorMessage } from '@/lib/api-fetch';

const res = await apiFetchAuthed('/api/clients');
if (!res.ok) throw new Error(nestErrorMessage(await parseResponseJson(res)));
const data = await res.json();
```

**Regras:**
- Sempre usar `apiFetchAuthed` / `apiFetchPublic` — nunca `fetch(NEXT_PUBLIC_API_URL + ...)` direto
- `getApiBaseUrl()` ajusta host LAN automaticamente no browser
- Token vem de `auth()` — não passar token manualmente em Server Components

---

## 2. Cliente OpenAPI tipado

```typescript
import { createApiClient } from '@/lib/api/openapi-client';

const client = createApiClient(session.accessToken);
const { data, error } = await client.GET('/api/health');
```

**Quando usar:** client components que precisam de tipagem forte nos paths/responses.
**Regenerar tipos:** `pnpm openapi:gen` após mudanças no backend.

---

## 3. TanStack Query

### Setup

Provider em `AppProviders` (client component):

```typescript
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});
```

### Hook de feature

```typescript
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useStudents(clientId: string) {
  return useQuery({
    queryKey: ['students', clientId],
    queryFn: () => fetchStudentsAction(clientId),
  });
}

export function useCreateStudent(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStudentInput) => createStudentAction(clientId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', clientId] }),
  });
}
```

**Regras:**
- `queryKey` inclui tenant scope (`clientId`, `companyId`)
- Invalidar queries após mutações
- Não duplicar fetch entre page server e client — escolher uma estratégia por tela

---

## 4. Helpers compartilhados de actions

Local: `src/lib/actions/`

### zod-utils.ts

```typescript
import { ZodError } from 'zod';

export function zodFirstMessage(error: unknown): string {
  if (error instanceof ZodError && error.issues[0]?.message) {
    return error.issues[0].message;
  }
  return 'Dados inválidos.';
}
```

### action-result.ts

```typescript
export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };
```

**Nunca** copiar `zodFirstMessage` inline em actions — importar do helper.

---

## 5. Validação em formulários

```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createStudentSchema, type CreateStudentInput } from '@/features/school/validations/students';

const form = useForm<CreateStudentInput>({
  resolver: zodResolver(createStudentSchema),
});
```

Schemas de formulário podem ser subset dos schemas do backend — manter comentário de alinhamento.

---

## 6. Tratamento de erros

- Server Actions retornam `{ ok: false, error: string }` — não throw em fluxo esperado
- Client exibe erro via toast (sonner) ou inline no form
- Erros de rede: mensagem genérica + log no console (dev only)
- 401: redirect para login via NextAuth

---

## 7. Checklist

- [ ] Fetch unificado via `apiFetchAuthed`?
- [ ] Action usa helper `zodFirstMessage`?
- [ ] TanStack Query com queryKey scoped por tenant?
- [ ] Tipos da API regenerados se endpoint mudou?
- [ ] Invalidação de cache após mutação?
