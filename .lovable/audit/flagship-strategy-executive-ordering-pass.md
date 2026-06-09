# Flagship Strategy & Executive Ordering Pass

**Módulo:** Estratégias Patrimoniais (Wealth Library)
**Escopo:** UI/Presentation only — engine financeira, dados e diálogo intocados.
**Arquivos:** `strategyFlagships.ts` (novo) · `StrategyLibrarySection.tsx` (editado)

---

## Flagship Strategies Layer

Camada editorial discreta **"Teses patrimoniais emblemáticas"** posicionada entre a hero consultiva e a seção de Estratégias Recomendadas. Renderiza no máximo 4 tiles em grid `md:grid-cols-2`, com:

- **Numeral romano serif itálico** (I · II · III · IV) — pausa editorial, não badge.
- **Hairline gradient** separando ordinal do dot de capítulo (mesma linguagem dos chapter dividers).
- **Tese-síntese em serif italic** entre aspas tipográficas — voz de mesa consultiva, não headline de marketing.
- **Rationale** em 1 linha justificando o destaque editorial.
- **CTA "Explorar tese"** que abre o mesmo `StrategyDetailDialog` do catálogo (zero duplicação de fluxo).

**Seleção curada** (`FLAGSHIP_STRATEGIES`):

| # | ID | Tese-síntese |
|---|----|---|
| I | `escada-patrimonial` | Usar a carta como funding para multiplicar capital. |
| II | `multiplicacao-cotas` | Multiplicação patrimonial por cotas reaplicadas. |
| III | `alavancagem-imobiliaria` | Renda do ativo cobre a parcela e gera margem. |
| IV | `leverage-patrimonial` | Mais patrimônio controlado por unidade de capital. |

Sem hero gigante, sem badge "TOP", sem marketing agressivo. Protagonismo silencioso.

---

## Executive Ordering System

Selector consultivo opcional inserido na hero, abaixo do `ModalityContextSelector` e seguindo sua mesma linguagem visual (chips radio, eyebrow uppercase, helper microcopy).

Modos disponíveis (`EXECUTIVE_ORDER_OPTIONS`):

| Modo | Direção | KPI canônico | Helper microcopy |
|------|---------|-------------|----|
| **Ordem editorial** *(default)* | — | — | Sequência consultiva curada pela mesa patrimonial. |
| Mais aderente ao cenário | — | combinedScore | Ordenação baseada no diagnóstico e simulação ativos. |
| Maior patrimônio estimado | desc | `finalPatrimony` | Ordenação baseada nas estimativas desta simulação. |
| Maior lucro estimado | desc | `profit` | idem |
| Maior ROI | desc | `roi` | idem |
| Menor parcela | asc | `installment` | Ordenação baseada nas parcelas estimadas desta simulação. |
| Maior liquidez preservada | desc | `preserved` | Ordenação baseada no capital líquido remanescente estimado. |

Persistido em `localStorage` (`wealth:order:v1`). Ordenação aplicada **dentro de cada capítulo** — a narrativa editorial dos capítulos (Aquisição → Multiplicação → Acumulação → Uso → Renda & Sucessão) é preservada.

---

## Consultive Ordering Logic

A ordenação deriva 100% de KPIs já declarados na taxonomia canônica (`STRATEGY_EXECUTIVE_KPIS`) — **zero math nova**.

- `getKpiNumericValue(strategy, kind, credit)` aponta para `strategy.calculations[pickIndex].result(credit)` e parseia o número via `parseKpiNumeric` (suporta R$ pt-BR com `.` milhar / `,` decimal, `%`, sufixos como `/mês`, `a.a.`, `meses`).
- Estratégias **sem KPI mapeado** para o `kind` ativo vão ao final (`null` last). **Nunca ocultas.**
- Tiebreak por `combinedScore` (modalidade + diagnóstico) — preserva relevância contextual em empates.
- Helper microcopy reforça caráter consultivo: *"Ordenação baseada nas estimativas desta simulação. Nenhuma estratégia é ocultada."*

Banner antigo "Ordem ajustada silenciosamente ao contexto" só aparece quando `orderKey === 'editorial'` — evita ruído quando o usuário já escolheu ordenação explícita.

---

## Flagship Strategy Criteria

Critérios editoriais documentados no header de `strategyFlagships.ts`:

1. **Profundidade patrimonial** — tese estrutural, multi-camada (não monolinha).
2. **Sofisticação consultiva** — diferenciação real vs. produtos genéricos do mercado.
3. **Impacto patrimonial** — presença de multiplicador, alavancagem ou ROI mensurável.
4. **Força narrativa demonstrável** — explicável ao cliente em ≤30s sem perder substância.

**Proibido critério único de "lucro bruto"** — flagship não é ranking de melhor performance.

---

## Strategic Discovery Flow

```text
HERO (intenção + contexto + ordenação)
        │
        ▼
FLAGSHIP LAYER          ← teses emblemáticas (≤4, curadas)
        │
        ▼
RECOMMENDED LAYER       ← top 3 contextuais (diagnóstico+simulação ativos)
        │
        ▼
EDITORIAL CHAPTERS      ← biblioteca completa, ordenável por capítulo
   I. Comprar sem descapitalizar
   II. Multiplicação patrimonial
   III. Acumulação & escada patrimonial
   IV. Empresas & uso produtivo
   V. Renda, liquidez & sucessão
```

Fluxo natural: **flagship → recomendadas → capítulos**. Usuário sente orientação estratégica em camadas — não "biblioteca infinita".

---

## Visual Hierarchy Refinement

- **Flagship tiles** usam mesma grade visual dos cards de capítulo (rounded-2xl, mesma hover lift, motion-reduce respeitado) — não rompem ritmo editorial.
- **Numeral romano serif itálico** + **hairline gradient** = mesma linguagem dos chapter dividers existentes (consistência).
- **Tese entre aspas tipográficas serif** = continua o vocabulário de "mesa consultiva".
- **Selector de ordenação** = chips idênticos ao `ModalityContextSelector` (mesma dot 1.5px, mesma borda primary/55, mesma shadow inset). Sensação: dois eixos contextuais (modalidade × ordenação) na mesma camada cognitiva.
- **Sem badge "TOP"**, sem cor saturada extra, sem ícone marketing. Crown 12px primary só no eyebrow.

---

## Mobile Validation

- Flagship grid: `grid-cols-1 md:grid-cols-2` — 1 tile por viewport <768px.
- Selector de ordenação: `flex-wrap gap-1.5` + `min-h` adequada (chips 30px+), funcionando como faixa rolável natural por wrap.
- CTA "Explorar tese": `min-h-11` mobile = target acessível.
- Helper microcopy mantida ≤2 linhas no 380px.
- Numeral romano + hairline funcionam em viewport estreito (gradiente termina suave).

---

## Zero Regression Validation

- ✅ `src/core/finance/**` — não tocado.
- ✅ `strategyLibraryData.ts` — não tocado (24 estratégias, todos os `calculations[]`).
- ✅ `StrategyDetailDialog`, `CalculationsBlock`, `ComparisonsBlock`, `DecisionSupportBlock`, `ViabilityPreview` — não tocados.
- ✅ `strategyContextScoring`, `strategyExecutiveKpis`, `strategyNextSteps`, `strategyModalities`, `ActiveStrategyContext`, `ModuleNavigationContext` — não tocados.
- ✅ Editorial chapters (`CHAPTER_ORDER`) — preservados (ordem, narrativa, anchors).
- ✅ Selector de modalidade — preservado, comportamento idêntico.
- ✅ Compra à Vista — continua filtrada (movida ao Comparador), sem regressão.
- ✅ TypeScript build limpo (`tsc --noEmit` 0 erros).

---

## Final Strategic Hierarchy State

| Camada | Função | Profundidade |
|---|---|---|
| Hero consultiva | Intenção + contexto operacional + ordenação | Editorial |
| **Flagship Layer** *(novo)* | Teses emblemáticas com protagonismo curado | Editorial premium |
| Recommended Layer | Top 3 por aderência ao cenário ativo | Algorítmico contextual |
| Editorial Chapters (ordenáveis) | Biblioteca completa por intenção patrimonial | Narrativa + dados |
| Strategy Detail Dialog | Tese, racional, cálculos, decisão, comparativos | Mesa consultiva profunda |

O módulo opera agora em **5 camadas hierárquicas coordenadas**, da curadoria editorial à análise profunda, com ordenação executiva opcional dentro da biblioteca.

---

## Final Verdict

**O módulo possui hierarquia estratégica inteligente.**

Teses patrimoniais flagship (alavancagem, multiplicação de cotas, uso da carta como funding, leverage imobiliário) recuperaram protagonismo via camada editorial curada — **sem virar marketplace, sem ranking agressivo, sem badge "TOP ganhos"**. A ordenação executiva opcional permite descoberta dirigida por intenção (maior patrimônio, maior ROI, menor parcela, maior liquidez) preservando os capítulos consultivos como contêineres narrativos.

O resultado é uma **consultoria patrimonial executiva com descoberta estratégica inteligente** — não um catálogo plano de produtos financeiros.
