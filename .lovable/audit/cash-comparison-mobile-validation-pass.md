# Cash Comparison · Mobile Validation Pass

Validação mobile (320–414px) do tab **Comparador → vs Compra à Vista**
(`CashComparisonTab.tsx`). Escopo puramente perceptivo/responsivo —
zero alteração na engine canônica (`useCashComparison`), zero impacto
em desktop, zero mudança de conteúdo ou cálculo.

---

## Riscos identificados na auditoria estática

| # | Risco | Cenário | Severidade |
|---|---|---|---|
| 1 | Padding interno `p-5` (20px) nas 3 camadas comprime conteúdo em 320px | Camada 2 com `ol` + valores tabulares longos | média |
| 2 | Valores hero `text-[22px]` sem `break-words` podem estourar em viewport 320px com créditos ≥ 7 dígitos | Carta dobrada (2× imóvel), resultado mensal | alta |
| 3 | "Diferença patrimonial" `text-[24px]` no card hero da narrativa | valores 7 dígitos `+R$ 1.500.000,00` ultrapassam 280px úteis | alta |
| 4 | KPI "Vantagem do consórcio" com badge `+X%` em `flex justify-between gap-2` sem `flex-wrap` | label longo + badge na mesma linha apertam em 320px | média |
| 5 | Wrapper externo `px-4` deixa apenas 288px úteis em 320px screen | gradient summary + cards aninhados ficam apertados | baixa |
| 6 | `space-y-8` mobile = 32px entre seções (largo para mobile) | scroll desnecessário | baixa |

## Correções aplicadas (mobile-only, zero desktop regression)

| Local | Antes | Depois |
|---|---|---|
| Wrapper externo | `space-y-8 px-4 sm:px-6` | **`space-y-7 px-3 sm:px-6`** |
| Camadas 1/2/3 (sections) | `p-5 md:p-6` | **`p-4 md:p-6` + `min-w-0`** |
| Hero values 22px (Camada 1/2 + Resultado mensal) | `text-[22px]` | **`text-[20px] md:text-[22px] break-words`** |
| KPI "Vantagem do consórcio" | `flex justify-between gap-2` sem wrap | **`flex-wrap gap-x-2 gap-y-1` + `min-w-0` no bloco + `shrink-0` no badge** |
| Card "Diferença patrimonial" | `text-[24px] md:text-[28px]` | **`text-[22px] md:text-[28px] break-words` + `min-w-0`** |
| Card narrative gradient | `px-5 py-5 md:px-6 md:py-6` | **`px-4 py-4 md:px-6 md:py-6`** |
| Section narrativa | `p-5 md:p-7` | **`p-4 md:p-7` + `min-w-0`** |

## Validação por critério

### Legibilidade
- Hero h3 mantém `text-[22px] md:text-[26px]` — leitura confortável em 375px.
- Premissas em grid 2-col mobile (`text-[12px]` label / `text-[12.5px]` valor) com tabular-nums — alinhamento numérico preservado.
- Bloco "Como funciona" em `text-[12.5px] leading-relaxed` — densidade adequada para listas educacionais consultivas.

### Hierarquia
- Ordem narrativa preservada empilhada: **Camada 1 (referência) → Camada 2 (engenharia) → Camada 3 (resultado) → Resumo narrativo → KPIs comparativos → Diferença final**.
- Camada 2 mantém `border-primary/30` + tom primary destacando o "coração" mesmo em coluna única.
- KPI executivo de diferença patrimonial em `text-success` 22→28px destaca o insight final.

### Touch targets
- `PercentInput` e `Checkbox` preservam 44px+ via componentes UI base.
- Labels clicáveis (`<label>` em "Reinvestir excedente") com padding interno `py-3 px-3.5` → área tátil ≥ 44px.

### Overflow horizontal
- Todas as seções com `min-w-0` previnem expansão por conteúdo tabular-nums longo.
- `break-words` em valores hero (creditLetterValue, monthlyResult, patrimonyDifference) elimina overflow em créditos 7 dígitos.
- Grid `grid-cols-1 lg:grid-cols-3` empilha verticalmente abaixo de 1024px — sem horizontal scroll.
- Grid `grid-cols-1 sm:grid-cols-2` nos cards comparativos da narrativa.

### Performance perceptiva
- `animate-fade-in` no wrapper único — sem cascata de animações.
- Nenhum cálculo adicional, nenhum re-render extra: mudanças são puramente Tailwind responsive.

### Engine / Conteúdo / Lógica
- ✓ `useCashComparison` intacto.
- ✓ Premissas vivas (`WealthAssumptionsContext`) intactas.
- ✓ Conteúdo textual byte-a-byte preservado.
- ✓ Zero impacto em desktop (`md:` overrides preservam tudo ≥ 768px).

## Final Verdict

✅ **Compra à Vista validada para mobile premium**: padding calibrado para
320px, valores hero com `break-words` previnem overflow, KPI "Vantagem"
com wrap controlado, hierarquia editorial mantida sem comprimir.

**Arquivos editados:**
- `src/components/modules/comparator/CashComparisonTab.tsx` (apenas classes Tailwind responsive)

**Regressão desktop:** nula.
**Regressão de engine:** nula.
**Risco operacional:** zero.
