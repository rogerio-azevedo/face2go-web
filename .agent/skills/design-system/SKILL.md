---
name: design-system-face2go
description: >
  Guia de estilos e design system Face2Go. Consultar antes de criar telas públicas,
  layouts de auth, marketing ou quando precisar alinhar UI à marca (cores, tipo,
  logo, espaçamentos). Complementa o skill project-conventions.
metadata:
  author: project-team
  version: "1.0.0"
---

# Design System — Face2Go

Este documento descreve **tokens**, **uso da marca**, **layouts** e **padrões de componentes**.
A fonte técnica de verdade são os tokens CSS em [`src/app/globals.css`](src/app/globals.css)
(Tailwind v4 `@theme`) e componentes [`src/components/ui/`](src/components/ui/) (shadcn).

---

## 1. Paleta de marca (tokens `--color-brand-*`)

| Token Tailwind (`bg-brand-*`, `text-brand-*`) | Hex       | Quando usar                                                                                   |
| --------------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `brand-deep-navy`                             | `#001b3d` | Fundos profundos, ênfases escuras (badges institucionais, shells escuros quando existirem)    |
| `brand-midnight-navy`                         | `#061a2e` | Títulos e texto forte em superfície clara; pode alinhar com `--foreground` onde fizer sentido |
| `brand-turquoise`                             | `#00c7b7` | Destaques da marca na narrativa (“Face2Go” na headline), ícones de destaque primários         |
| `brand-cyan-blue`                             | `#1e90ff` | Links, CTAs secundários informativos, focos suaves quando não competir com o turquoise        |
| `brand-white`                                 | `#ffffff` | Superfícies de cards e formulários em fluxos claros                                           |
| `brand-off-white`                             | `#f7fafc` | Fundo de página em marketing/login (menos frio que branco puro)                               |
| `brand-slate`                                 | `#607083` | Texto secundário, legendas — alinhar com `muted-foreground` onde possível                     |

**Regra**: preferir **tokens semânticos** (`primary`, `background`, `muted-foreground`) em telas administrativas
para herdar comportamento correto dos componentes shadcn. Use `brand-*` explícitos em **hero**, **marketing**
e elementos que devem soar “marca”.

---

## 2. Tokens semânticos (`:root` / tema shadcn)

- **`--primary` / `--primary-foreground`** — Cor principal **midnight navy** (~`#061a2e`), texto sobre botão primário **branco**.
- **`--background`** — Fundo da app em telas públicas/leves: **off-white** (~`#f7fafc`).
- **`--accent` / `--accent-foreground`** — Realce opcional próximo ao **turquoise** para superfícies que precisam de “pulso da marca”; não substituir `primary` em botões CTAs quando o padrão for navy.
- **`--foreground`**, **`--muted`**, **`--border`**, **`--input`**, **`--ring`** — Ajustados para boa legibilidade sobre fundo **off-white** (bordas e muted um pouco mais presentes que no neutro puro `#fff`).

**Checklist antes de novo componente**

- Botão principal de formulário público usa `variant="default"` (herda `primary`).
- Texto auxiliar usa `text-muted-foreground` ou `text-brand-slate` com parcimônia.
- Não fixar hexadecimal em JSX; usar utilitários `bg-brand-*`, `text-brand-*`, ou `--primary`.

---

## 3. Tipografia

- **Família**: `--font-geist-sans` (body, UI); `--font-geist-mono` só para código/IDs técnicos.
- **Heading semântico**: `font-heading` (alias para sans no tema) — já usado em `CardTitle` e pode repetir-se em páginas.
- **Tamanhos sugeridos (telas públicas / auth)**

| Contexto                  | Classe típica                                      | Notas                                            |
| ------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| Título hero               | `text-3xl`–`text-4xl` `font-bold` `tracking-tight` | Nome produto destacado em `text-brand-turquoise` |
| Subtítulo                 | `text-base`–`text-lg` `text-muted-foreground`      | Máximo ~2 linhas                                 |
| Título card               | `text-xl`/`text-2xl` `font-semibold`               | Ex.: “Entrar”                                    |
| Label de campo            | `text-sm` `font-medium`                            | Alinhado aos `Label` shadcn                      |
| Legenda / link secundário | `text-sm` `text-muted-foreground`                  | Hover → `text-foreground`                        |

---

## 4. Logo (`public/face2go_dark.svg`)

- **Fundo obrigatório**: claro (`brand-off-white`, `brand-white` ou superfície de card).
- **Espaço livre**: manter pelo menos altura equivalente ao “cap height” ao redor do logotipo.
- **Implementação recomendada**: `next/image` com `priority` apenas acima da dobra (login/hero).

Se o arquivo SVG ficar pesado ou difícil de versionar no Git, avaliar uma versão otimizada (sem filter complexo quando possível).

---

## 5. Componentes — padrões

### Botões

- **Primário (enviar formulário público)** — `Button` `variant="default"` `size="lg"` onde o CTA deve se destacar; `className="w-full"` quando full-width em mobile-first.
- **Secundário** — `variant="outline"` ou `ghost` para navegação leve dentro do mesmo card.

### Cards

- **Auth / marketing**: `rounded-2xl` ou `rounded-xl`, fundo branco sobre fundo pontilhado, sombra discreta (`shadow-lg` apenas quando não competir com muitos cards na mesma tela).

### Inputs

- Manter `Input`/`Label` shadcn padrão; para **senha** com alternância visível, usar `relative` wrapper + ícone lucide como `button` `type="button"` (acessível com `aria-label`).

### Badges institucionais

- Badge tipo “segurança”: fundo **`brand-deep-navy`**, texto branco uppercase tracking-wide, ícone lucide (~16–18px).

---

## 6. Layouts — padrões obrigatórios

### Auth split-screen (`/login`)

- **Desktop**: duas colunas — esquerda `LoginHero` (branding), direita formulário (`LoginForm`).
- **Mobile (< lg)**: somente formulário centrado (`LoginHero` oculto para reduzir rolagem e ruído).
- **Página inteira**: `min-h-screen`/`min-h-full`, fundo `brand-off-white` + padrão de pontos (classe utilitária definida em `globals.css`, ex.: `bg-auth-dot-grid`).

### Link “voltar para marketing” / site público

- Se existir URL de marketing/host público diferente da app logada, expor opcionalmente
  **`NEXT_PUBLIC_MARKETING_URL`**. Renderizar link “Voltar para o site” / “Voltar para a landing” **somente** quando a variável estiver definida, para evitar redirects circulares com `/`.

### Dashboard interno

- Sidebar e layouts internos já vivem em `src/app/{client|company|super-admin}/layout.tsx`; **evitar aplicar overlay de marca excessiva** (gradientes grandes) dentro de dashboards densos sem necessidade — priorizar densidade informacional.

---

## 7. Manutenibilidade & próximos passos

Manter **`globals.css`** como arquivo curto (~150–220 linhas). Se novos artefatos (gradientes compostos,
animações) crescerem, extrair `@layer utilities` específicas para `src/styles/` ou blocos bem nomeados
com `@import`.

**Possíveis evoluções**

- Registrar “variantes nomeadas” de `Button`/Card apenas para superfície pública quando houver segunda onda de telas iguais.
- Modo escuro público só se decisão explícita de produto (tokens `.dark` hoje são neutros/genéricos)

Consulte também **[`project-conventions`](../project-conventions/SKILL.md)** para stack, estrutura de pastas e regras de dados.
