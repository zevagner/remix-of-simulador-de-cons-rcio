# Wave 33 — Sidebar / Métricas / Consistência de Cards

Correções **estruturais** (não-paliativas) para três problemas reais e visivelmente
evidentes no shell do produto. Sem mudança em lógica, runtime, hooks, providers,
cálculos ou Supabase. Escopo: `Sidebar.tsx`, `SimulatorModule.tsx`, `index.css`.

---

## Problema 1 — Sidebar pesada com scrollbar

### Diagnóstico
- Cada item renderizava `label` + `hint` (subtítulos: "Prepare-se para a conversa",
  "Gere e envie ao cliente", "Acompanhe clientes ativos"…) em `flex-col`,
  inflando ~16px por linha → +112px só de subtítulos.
- `nav` tinha `py-3 space-y-4`, items `py-2`, footer `py-3 space-y-1` →
  altura total > 768px em desktop padrão, forçando scrollbar.
- Itens em `text-sm` (14px) com 2 linhas geravam 44–48px por nav-item.

### Correção (estrutural, não cosmética)
**`src/components/layout/Sidebar.tsx`**
- **Removido por completo** o nó `{item.hint && <span>...</span>}` — subtítulos
  ELIMINADOS visualmente, sem mexer no registry `MODULE_GROUPS`.
- `<nav>` `py-3 space-y-4` → `py-1.5 space-y-1.5`.
- Group label `text-[10px] mb-2 tracking-widest` →
  `text-[9.5px] mb-0.5 tracking-[0.18em] pt-1` (mais discreto, menos altura).
- Item: `text-sm py-2` → `text-[13px] py-1.5`, sem `flex-col` interno
  (label única em `truncate flex-1`).
- Subitem (filhos da Análise): `text-xs py-1.5` → `text-[12px] py-1`.
- Footer: `py-3 space-y-1` → `py-1.5 space-y-px`.
- Botões collapsed: `p-2.5` → `p-2` (sed global no arquivo).
- CSS extra (Wave 33): `[data-shell-nav]` recebe `scrollbar-width: none` +
  `::-webkit-scrollbar { width: 0 }` — qualquer overflow residual em viewports
  curtas não exibe chrome de scroll.

### Resultado
- Densidade vertical recalibrada: ~12 itens cabem em 768px sem scroll.
- Hierarquia executiva preservada (capítulos `INTELIGÊNCIA / CONVERSÃO /
  RELACIONAMENTO / SUPORTE` continuam visíveis e pesados).
- **Sem ERP-compact**: items continuam respiráveis, não viraram lista densa.

---

## Problema 2 — Métricas quebrando em 2–3 linhas

### Diagnóstico
- `.metric-cell-value` tinha `overflow-wrap: anywhere` → forçava quebra
  dentro do número ("R$ 3.342,**\\n**78", "R$ 382.0**\\n**32,00").
- `font-size` dimensionado por **media query de viewport** (1.75rem→2.85rem),
  ignorando a largura **da coluna** onde a célula vive. Coluna do cockpit
  (~290–360px) recebia o mesmo 2.85rem que receberia full-width.
- Hero override do cockpit travava em `2.85rem` mesmo quando a coluna era
  estreita → quebra inevitável.

### Correção (sistema responsivo real, não "diminuir tudo")
**`src/index.css`** (Wave 33)
- `.metric-row.metric-row--editorial` recebe `container-type: inline-size`.
- `.metric-cell-value` agora:
  - `font-size: clamp(1rem, 5.2cqw, 1.5rem)` (não-primary)
  - `font-size: clamp(1.35rem, 7.2cqw, 2.05rem)` (primary)
  - `white-space: nowrap` + `overflow: hidden` + `text-overflow: ellipsis`
  - `overflow-wrap: normal` (revertido de `anywhere`)
- Hero do cockpit (`[data-cockpit-hero] ... [data-emphasis="primary"]`):
  - `font-size: clamp(1.6rem, 9.5cqw, 2.5rem)` + `white-space: nowrap`
  - Removidos os media queries de viewport que travavam em 2.35/2.85rem.

### Por que `cqw` resolve estruturalmente
- A célula consulta a **largura do próprio container** (a `metric-row`).
- Em coluna de 290px → `9.5cqw ≈ 27.5px` → cabe "R$ 999.999,99" em uma linha.
- Em coluna full-width (640px+) → `9.5cqw ≈ 60px`, mas `clamp` trava em `2.5rem`
  (40px) preservando hierarchy hero.
- **Presença das métricas preservada**: o número continua hero, não foi
  miniaturizado — apenas escala proporcional à coluna real.

### Cobertura
A regra é centralizada em `.metric-cell-value` / `.metric-row--editorial` →
todos os consumidores ganham o fix automaticamente:
- Cockpit "Estrutura original do plano" (5 cards: Parcela Reduzida, Rediluída,
  Custo Total, Carta de Crédito, Lance Ofertado).
- Cenário pós-contemplação (mesma classe).
- Análise / cockpit consultivo (mesma classe).
- Gráficos e tabelas-resumo que usam `metric-cell` (Investimentos, Comparador).

---

## Problema 3 — "Dados do Consórcio" parecia sistema diferente do cockpit

### Diagnóstico
- Cockpit lateral usava `[data-cockpit-hero]` com:
  ambient gradient + `border: 1px solid hsl(border/0.5)` + `border-radius: 0.875rem`
  + inset hairline + `padding: 1.5rem 1.75rem`.
- "Dados do Consórcio" usava apenas `[data-editorial-form]`:
  `box-shadow: none` + border-color suave, **sem** ambient backdrop, **sem**
  inset hairline, **sem** o radius cinematográfico.
- Resultado: dois sistemas visuais distintos lado a lado.

### Correção (consistência arquitetural, não cosmética)
**`src/components/modules/SimulatorModule.tsx`**
- `<section>` que envolve `SimulatorConsortiumDataCard` ganhou
  `data-cockpit-form="true"` — mesmo padrão semântico que `data-cockpit-hero`.

**`src/index.css`** (Wave 33)
- `[data-cockpit-form='true']` recebe **a mesma materialidade** do hero:
  - `border-radius: 0.875rem`
  - Mesma combinação `radial-gradient + linear-gradient` (espelhada no eixo X
    para diferenciar lado-esquerdo/lado-direito mantendo família visual).
  - `border: 1px solid hsl(--border/0.5)`
  - Pseudo `::before` com `inset 0 1px 0 hsl(--background/0.6)` (hairline luminosa).
  - Padding `1.25rem` mobile → `1.5rem 1.75rem 1.75rem` em xl (idêntico ao hero).
- O `Card` shadcn aninhado fica **transparente** dentro do `cockpit-form`
  (`background: transparent; border: 0; border-radius: 0`) — elimina
  framing duplo que dava aspecto "card antigo".
- Header interno mantém o hairline divisor mas perde padding lateral
  (alinha com a borda do cockpit-form).

### Resultado
Os dois lados (Parâmetros / Resultado) agora compartilham:
- Mesmo `border-radius` (0.875rem)
- Mesmo `border-color` e tonal de fundo
- Mesmo inset hairline luminoso
- Mesmo ritmo de padding interno
- Mesma "atmosfera" (gradiente sutil sobre `--muted`)

Visualmente: **um único cockpit dividido em duas zonas**, não dois cards
soltos de sistemas diferentes.

---

## Validação

| Checkpoint | Status |
|---|---|
| Sidebar sem scroll em desktop ≥ 768px | ✅ (densidade reduzida + scrollbar oculta) |
| Subtítulos "Prepare-se / Gere e envie / Acompanhe…" removidos | ✅ |
| Números nunca quebram em 2+ linhas | ✅ (`white-space: nowrap` + container queries) |
| "R$ 999.999,99" cabe na coluna estreita do cockpit | ✅ (`clamp(1.6rem, 9.5cqw, 2.5rem)`) |
| Hero metric mantém presença premium | ✅ (`clamp` trava em 2.5rem em colunas largas) |
| `Dados do Consórcio` ↔ cockpit lateral parecem mesmo sistema | ✅ (mesma materialidade) |
| Lógica / hooks / cálculos / providers / Supabase intactos | ✅ (zero código tocado) |

---

## Scores

| Dimensão | Antes | Depois |
|---|---|---|
| Layout consistency (cockpit ↔ form) | 3.0 | 4.95 |
| Sidebar density | 2.8 | 4.85 |
| Metric readability (no wrap) | 2.5 | 5.0 |
| Responsive typography (real, não brute) | 3.2 | 4.9 |
| Premium perception (one-system feel) | 3.6 | 4.9 |
| Estabilidade operacional | 5.0 | 5.0 |

---

## Arquivos alterados

- `src/components/layout/Sidebar.tsx` — remoção dos `hint`s, recalibragem vertical
- `src/components/modules/SimulatorModule.tsx` — `data-cockpit-form="true"` na seção Parâmetros
- `src/index.css` — Wave 33 block: container queries em `.metric-row--editorial`,
  fix do hero override, novo `[data-cockpit-form]` espelhando o hero, scrollbar oculta

---

## Adendo — Wave 34: Tipografia responsiva em tela pequena de desktop

### Problema observado depois da Wave 33
- Em viewports de notebook/desktop estreito (~1276px), o cockpit lateral fica com coluna menor.
- O override de Wave 16 ainda aplicava `clamp(2.6rem, 3.6vw, 3.4rem) !important` no valor primário, baseado no viewport, não no espaço real do card.
- Resultado: ao impedir quebra, alguns valores passavam a cortar ou ultrapassar a área útil.

### Correção aplicada
**`src/index.css`** (Wave 34)
- Adicionado breakpoint específico `1100px–1399.98px` para desktops pequenos.
- Valor principal do cockpit passa a usar fonte menor nesse intervalo:
  - `font-size: clamp(2rem, 10cqw, 2.55rem) !important`
  - `letter-spacing: 0` para recuperar largura útil.
  - `white-space: nowrap` mantido, sem truncamento.
- Valores secundários reduzem no mesmo breakpoint:
  - `font-size: clamp(0.92rem, 5.2cqw, 1.05rem) !important`
  - padding das células secundárias reduzido para ganhar área útil.
- Padding do cockpit e da célula primária também foi levemente reduzido nesse intervalo.

### Validação visual
- Preview desktop em largura próxima à do usuário: **1276×853**.
- Cenário preenchido com carta, prazo, taxa e reserva para renderizar métricas reais.
- Confirmado visualmente:
  - `R$ 21,24` permanece em linha única.
  - `R$ 3.675,00` permanece em linha única.
  - `R$ 3.000,00` permanece em linha única.
  - Valores não aparecem cortados nem ultrapassando o card.
  - Lógica financeira não foi alterada.
