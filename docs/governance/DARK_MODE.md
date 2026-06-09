# Modo Escuro — v1.0.0 — 28/05/2026

**Status:** Implementado e auditado

## O que foi feito

- **Bloco `.dark` no `src/index.css`**: Completado com 15 tokens semânticos (background, card, foreground, border, input, muted, accent, success, warning, destructive e variantes).
- **Substituição global**: Cores hardcoded substituídas por tokens semânticos em todos os componentes e páginas (exceto `LandingPage.tsx` e `LandingNav.tsx`, que mantêm identidade visual fixa).
- **Padronização de classes**:
  - `bg-white` → `bg-card`
  - `bg-slate-50` → `bg-muted`
  - `border-slate-200` → `border-border`
  - `text-slate-500` → `text-muted-foreground` em toda a plataforma.
- **Gráficos Recharts**:
  - `background: transparent`
  - `CartesianGrid` stroke="var(--border)"
  - Eixos com `tick={{ fill: 'var(--muted-foreground)' }}`
- **Correção de conflito**: Resolução cirúrgica do conflito Wave 38 no `src/index.css` que sobrescrevia `bg-card` com fundo claro hardcoded via `!important`.
- **Login**: `src/components/ui/input.tsx` atualizado com `dark:text-white dark:placeholder:text-white/50 dark:bg-slate-800 dark:border-slate-600`.
- **Estudo de Lances**: Card de posição do lance migrado de roxo para `bg-card` com borda laranja; cards de referência de grupo adaptados.
- **Estratégias Patrimoniais**: Cards com `bg-card border-border`, fundo da página usando `bg-background`.
- **Admin**: Cards de métricas, gráficos e layout padronizados com tokens semânticos; sidebar navy `#003641` mantida.

## Âncoras de identidade mantidas em modo escuro

- **Laranja `#F5821F`**: Accent principal, funciona bem em modo escuro.
- **Navy `#003641`**: Sidebar e elementos de identidade, mantido fixo.

## Pendências futuras

- Testar telas de signup e recuperação de senha em modo escuro.
- Validar Comparador e Op. Estruturadas em modo escuro (não auditados nessa sessão).
- Considerar transição suave entre modos (CSS transition na raiz).
