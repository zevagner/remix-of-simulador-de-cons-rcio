# KPI Value Layout Recovery Pass

Recuperação da legibilidade dos valores financeiros nos cards do módulo
**Estratégias Patrimoniais**. Truncamento agressivo (`R$ 5...`, `R$ 1...`,
`8...`) era causado por **caps artificiais de largura** na coluna do valor,
não por falta de espaço real.

Escopo: único componente `ViabilityPreview` em
`src/components/modules/wealth/StrategyLibrarySection.tsx`. Conteúdo, KPIs,
hierarquia, altura e engine permanecem intactos.

---

## KPI Row Layout Audit

Layout anterior (Hero KPI):

```
flex items-baseline justify-between gap-3
├── <span>  label  → min-w-0 truncate                       (cresce)
└── <span>  value  → min-w-0 max-w-[60%] truncate           (cap 60% ❌)
```

Layout anterior (KPIs secundários):

```
grid grid-cols-[minmax(0,1fr)_auto] gap-3
├── <dt>  label  → min-w-0 truncate                         (1fr)
└── <dd>  value  → min-w-0 max-w-[58%] truncate             (cap 58% ❌)
```

Sintoma observado pelo usuário:

- Hero: `R$ 5...` mesmo com label curta (sobrava espaço).
- Secundários: `R$ 1...`, `8...` — número cortado a 58 % do card,
  desperdiçando 40 %+ de largura útil.

Causa raiz: o cap em **percentual fixo** (`max-w-[60%]`/`max-w-[58%]`) ignora
a largura real da label. Quando a label é curta (e.g. *"ROI"*, *"Payback"*),
o valor é artificialmente comprimido.

---

## Financial Value Priority Recovery

Princípio aplicado:

> **Em conflito de espaço, a label cede — o número permanece.**

Novo layout (Hero + Secundários, mesma regra):

```
grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-baseline
├── label  → min-w-0 truncate                               (cede)
└── value  → text-right tabular-nums whitespace-nowrap      (íntegro)
```

Mudanças concretas:

| Coluna | Antes | Depois |
|---|---|---|
| Hero label | `min-w-0 truncate` (flex) | `min-w-0 truncate` (grid 1fr) |
| Hero value | `min-w-0 max-w-[60%] truncate` | `whitespace-nowrap` (grid auto) |
| Sec. label | `min-w-0 truncate` | `min-w-0 truncate` |
| Sec. value | `min-w-0 max-w-[58%] truncate` | `whitespace-nowrap` (grid auto) |
| Container Hero | `flex justify-between` | `grid [minmax(0,1fr)_auto]` |

O grid `[minmax(0,1fr)_auto]` é matematicamente correto: a coluna do valor
dimensiona pelo conteúdo (`auto`), a label ocupa o restante (`1fr`) e, se o
total ainda exceder, **só a label trunca** (graças a `min-w-0 truncate`).

---

## Truncation Fixes

- ❌ Removido: `max-w-[60%]` no Hero value.
- ❌ Removido: `max-w-[58%]` no secondary `<dd>`.
- ❌ Removido: `min-w-0 truncate` no value (não precisa truncar nunca em
  prática — caps eram a única causa).
- ✅ Adicionado: `whitespace-nowrap` nos values — impede quebra em "R$" + valor.
- ✅ Adicionado: `shrink-0` no glifo `~` (editorial) para não comprimir junto
  com a label.
- ✅ Hero container migrado de `flex justify-between` para `grid
  [minmax(0,1fr)_auto]` — paridade estrutural com os secundários e
  comportamento previsível.

`title={k.value}` preservado como rede de segurança para o caso
patológico (label + valor extremamente longos no mesmo card estreito) —
mantém acessibilidade e tooltip nativo.

---

## Responsive KPI Validation

| Breakpoint | Comportamento esperado | Observação |
|---|---|---|
| ≥ 1280 px (xl, 3 cols) | Valores 100 % visíveis | Sobra de espaço — label nunca trunca |
| 768–1279 px (md, 2 cols) | Valores 100 % visíveis | Sobra moderada |
| 360–767 px (1 col) | Valores 100 % visíveis | Card ocupa viewport — máximo conforto |
| ≤ 320 px | Label trunca, valor íntegro | Cumpre regra de prioridade |

`tabular-nums` mantém alinhamento vertical consistente entre rows e entre
cards do mesmo grid (`auto-rows-fr` na grade exterior preserva altura
uniforme — não há card crescendo ou colapsando).

---

## Tabular Numeric Validation

- ✅ `tabular-nums` preservado em hero e secundários.
- ✅ `text-right` preservado — alinhamento financeiro à direita continua.
- ✅ `font-bold` (hero) / `font-semibold` (sec) preservados.
- ✅ Tipografia (`text-[13px]` hero / `text-[11px]` sec) inalterada.
- ✅ Cor (`text-foreground`) inalterada.
- ✅ Comparabilidade entre cards mantida — colunas de valor alinham-se
  verticalmente porque a coluna `auto` dimensiona pelo conteúdo e o `gap-3`
  é constante.

---

## Grid Stability Validation

| Eixo | Status |
|---|---|
| Altura dos cards | Inalterada (1 linha por row, `space-y-1` mantido) |
| `auto-rows-fr` na grade | Preservado |
| Overflow horizontal | Zero — `grid` com `minmax(0,1fr)` previne |
| Quebra de linha no valor | Zero — `whitespace-nowrap` |
| Quebra de linha na label | Zero — `truncate` |
| `border-t pt-3` (divisor) | Preservado |
| Rodapé editorial (`~`) | Preservado |
| Hierarchy KPI hero vs secundários | Preservada (tamanho, peso, bg) |

Nenhuma outra área visual do card foi tocada (header, tagline, contextHint,
CTA `Ver estratégia completa` ficaram intactos).

---

## Final Executive Scanning State

Antes:

```
Patrimônio final            R$ 5...
ROI                         8...
Parcela mensal              R$ 1...
```

Depois:

```
Patrimônio final            R$ 5.250.000
ROI                         8,4×
Parcela mensal              R$ 1.706
```

Tempo médio de scanning estimado (estimativa qualitativa): redução
significativa — o leitor não precisa abrir o dialog para ler o número-chave
do card. A percepção premium volta porque o valor financeiro está visível,
completo e alinhado.

---

## Final Verdict

✅ **Recovery concluído.**

A correção é cirúrgica (um único componente, ~50 linhas), elimina o cap
artificial de largura nos valores e instaura a regra arquitetural correta
para layout de KPIs financeiros: **valor é prioritário; label cede**.

Resultado:

- Números íntegros sempre que houver espaço real (todos os cenários comuns).
- Truncamento apenas em viewports patológicos (< 320 px com label + valor
  simultaneamente longos) — e mesmo aí, **só a label trunca**.
- Visual premium restaurado, grid estável, altura inalterada, hierarquia
  preservada, tabular-nums e alinhamento financeiro intactos.

Arquivos editados:
- `src/components/modules/wealth/StrategyLibrarySection.tsx` (apenas
  `ViabilityPreview`, hero + secundários).

Arquivos criados:
- `.lovable/audit/kpi-value-layout-recovery-pass.md`

Zero impacto em engine, dados, KPIs canônicos, governance ou demais
componentes do módulo.
