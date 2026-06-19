# face2go-web (Next.js 16 BFF)

<!-- BEGIN:nextjs-agent-rules -->
## Atenção: Next.js

Esta versão tem breaking changes — APIs, convenções e estrutura de arquivos podem diferir do seu conhecimento. Leia o guia relevante em `node_modules/next/dist/docs/` antes de escrever código. Respeite avisos de depreciação.
<!-- END:nextjs-agent-rules -->

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn (Base UI) · Zod 4 · NextAuth 5 · TanStack Query · pnpm.

BFF — **sem banco próprio**. Persistência e regras de negócio vivem no `face2go-server`.

## Comandos

- `pnpm dev` – servidor de desenvolvimento
- `pnpm build` · `pnpm lint`
- `pnpm openapi:gen` – regenera tipos em `src/types/api.generated.ts`

## Antes de editar (Skills)

- Antes de criar rota, action, componente ou feature → leia **`.agent/skills/project-conventions/SKILL.md`**.
- Antes de Server Actions, fetch autenticado ou TanStack Query → leia **`.agent/skills/data-and-actions/SKILL.md`**.
- Antes de UI, shadcn ou tokens → leia **`.agent/skills/design-system/SKILL.md`**.

## Não faça

- Fetch direto — use `apiFetchAuthed` / `createApiClient`.
- Tipos manuais duplicados da API — use `api.generated.ts`.
- Código novo em `components/company/` — vai em `src/features/<domínio>/`.
