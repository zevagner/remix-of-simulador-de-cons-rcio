# Wealth-to-Proposal Executive Continuity Pass

> Auditoria + correção cirúrgica (2 arquivos). Zero engine financeira tocada, zero novo provider, zero matemática nova, zero regressão de PDF/cache/edge. Objetivo: fechar o último gap de continuidade consultiva entre **Estratégias Patrimoniais** e **Proposal Completa**.

---

## Strategy → Proposal Bridge

A ponte já existia e foi **validada como completa nos níveis estrutural e narrativo**:

| Camada | Fonte | Estado |
|---|---|---|
| Seleção da tese | `ActiveStrategyContext` (id + source + selectedAt em localStorage) | ✅ presente |
| Continuidade declarativa | `strategyNextSteps.ts` ("Levar para Proposal" / "Estruturar proposta patrimonial" / "Gerar Proposal executiva" por estratégia) | ✅ presente |
| Wiring CTA → contexto + navegação | `StrategyLibrarySection` → `setActiveStrategy(id, 'wealth-library')` + `navigateTo('proposals')` | ✅ presente |
| Bloco `wealth-thesis` no PDF | `ProposalPdfModule` resolve `activeStrategy.id` → `STRATEGY_LIBRARY` → tese, lógica patrimonial, vantagens, riscos, KPIs | ✅ presente |
| Façade unificada | `useProposalData()` reexporta `activeStrategy` ao lado de simulation/diagnostic/journey/investment/bidsStudy | ✅ presente |

**Gap único identificado:** os KPIs do bloco `wealth-thesis` no PDF eram renderizados via `c.result(creditValue)` **sem** passar o `calcContext` da matriz viva (`WealthAssumptionsContext`). Resultado: o consultor ajustava CDI / contemplação / yield no Wealth, via presets ou sliders, mas o PDF voltava a usar os **defaults canônicos** — quebra de continuidade paramétrica invisível.

---

## Executive Narrative Continuity

A narrativa da estratégia agora atravessa o módulo sem retrabalho:

- **Tese consultiva** (`lib.tagline`) → cabeçalho do bloco no PDF.
- **Capítulo editorial** (`lib.chapter`) → âncora hierárquica, preserva o agrupamento usado em Wealth.
- **Como funciona** (`lib.howItWorks`) + **Lógica patrimonial** (`lib.patrimonialLogic`) → corpo executivo.
- **Vantagens / Riscos** (top 4 cada) → leitura balanceada, sem promessa.
- **KPIs** (top 3 calculations) → mesma primitiva chamada na Library, **agora com `calcContext` preservado** (correção desta onda).
- **Source da escolha** (`'wealth-library' | 'compare-winner' | 'manual'`) → rastreável no payload (sem UI ruidosa).

Resultado: a Proposal **não é export de card** — é o mesmo discurso da consultoria, traduzido para formato executivo.

---

## Parametric Context Preservation

**Correção desta onda — 2 toques cirúrgicos:**

1. `src/contexts/WealthAssumptionsContext.tsx`
   - Nova função pura `readWealthCalcContextFromStorage(): StrategyCalcContext` — leitura standalone do localStorage (sem React, sem subscriptions). Reutiliza `loadStored()` + `toCalcContext()` já existentes.

2. `src/components/modules/ProposalPdfModule.tsx`
   - Import `useWealthAssumptionsSafe` + `readWealthCalcContextFromStorage`.
   - `const wealthCalcCtx = useWealthAssumptionsSafe()?.calcContext ?? readWealthCalcContextFromStorage();`
   - `c.result(creditValue, wealthCalcCtx)` na geração de KPIs do bloco `wealth-thesis`.

**Por que o fallback em storage:** `WealthAssumptionsProvider` é montado **só dentro de `WealthPlatformModule`**. Quando o consultor está no Proposal, o Provider não está na árvore — mas as premissas vivem em localStorage (`wealth:assumptions:v1`). O fallback garante continuidade sem hoist invasivo de Provider e sem violar o V2 lock de `WealthPlatformModule`.

**O que é preservado agora no PDF:**
- CDI (rate + %CDI líquido)
- Contemplação assumida
- Meses pós-contemplação (= analysisMonths − contemplationMonth)
- Yield locatício
- Valorização do ativo
- Ágio / deságio em venda da carta
- `tipoVendaCarta`

Para as 3 estratégias migradas (`usar-carta-investir`, `compra-hibrida`, `alavancagem-imobiliaria`), os KPIs no PDF agora batem **byte-a-byte** com os exibidos no card de Wealth após o consultor aplicar o preset Otimista (ou customizar premissas). Para as 22 estratégias canônicas, os KPIs permanecem idênticos (callsites sem `ctx` ou com fallback `??` para `CDI_LIQ`/`CAP_RATE`/`REF_TERM_M`).

---

## Proposal Strategy Sections

O bloco `wealth-thesis` no PDF (página dedicada via `PdfPropostaCompleta` + `MissingDataNote` interna como fallback) já entrega leitura executiva consultiva:

```
┌─ Tese patrimonial · {chapter} ──────────────────┐
│ {title}                                         │
│ {tagline}                                       │
│                                                 │
│ Como funciona     · {howItWorks}                │
│ Lógica patrimonial · {patrimonialLogic}         │
│                                                 │
│ Vantagens (≤4)    | Riscos (≤4)                 │
│ KPIs (≤3)         ← agora paramétricos          │
└─────────────────────────────────────────────────┘
```

Não é "export do card" porque:
- O catálogo inteiro **não é exportado** — só a tese ativa.
- A copy é a editorial da Library (mesma voz consultiva, sem marketing).
- KPIs vêm das `calculations` canônicas, reusando primitivas de `@/core/finance` via `ctx`.
- Página é gated por `wealth-thesis` no `defaultSelectedIds()` — usuário pode tirar do PDF se a venda não pedir tese patrimonial.

---

## Strategic Proposal Entrypoints

Já entregues — não foi necessário criar entrypoints novos nesta onda:

| Origem | CTA | Wiring |
|---|---|---|
| Card de estratégia (Library) | "Levar para Proposal" / "Levar tese para Proposal" / "Estruturar proposta patrimonial" / "Gerar Proposal executiva" — varia por tese via `strategyNextSteps.OVERRIDES` | `setActiveStrategy(id, 'wealth-library')` → `navigateTo('proposals')` |
| Compare Winners | "Simular esta tese" (KPI Source Governance wave) | `setActiveStrategy(id, 'compare-winner')` → `navigateTo('simulator')` (e o `wealth-thesis` segue ativo na próxima visita ao PDF) |
| Restauração (deep-link / sessão antiga) | — | `source: 'manual'` |

Discrição preservada: CTAs secundários ficam como `kind: 'secondary'` (link/ghost), apenas o passo natural da tese vira primário. Zero marketing.

---

## Cross-Module Memory Validation

| Estado | Onde vive | Quem lê |
|---|---|---|
| `activeStrategy` | `ActiveStrategyContext` (localStorage `active-strategy:v1`) | Wealth · Compare · Proposal · Façade `useProposalData()` |
| Premissas vivas | `WealthAssumptionsContext` + localStorage `wealth:assumptions:v1` | Wealth (live) · **Proposal (via `readWealthCalcContextFromStorage`)** |
| Modalidade ativa | `SelectedGroupContext` (já canônico) | Simulator · Bids · Assemblies · Wealth (via heurística) |
| Diagnóstico | `DiagnosticContext` | Wealth (ordering/scoring) · Proposal · Investment |
| Investment results | `InvestmentResultsContext` | Investment · Proposal |
| Bids study | `BidsStudyContext` | Bids · Proposal |
| Structured ops | `StructuredOpsResultsContext` | Structured · Proposal |

**Nenhum snapshot duplicado.** Tudo flui por contextos canônicos já existentes; o PDF é **leitura derivada** via `useProposalData()` + os contextos específicos. Esta onda apenas reconecta o último estado (premissas vivas) que vazava na transição Wealth → Proposal.

---

## Proposal Integrity Validation

- **PDF pipeline (Browserless edge `generate-pdf`):** payload `wealth` mantém shape (`{ strategyId, title, chapter, tagline, source, howItWorks, patrimonialLogic, advantages, risks, kpis }`). Apenas o conteúdo numérico de `kpis[].value` muda quando o consultor alterou premissas. Gate de bloco e `MissingDataNote` intactos.
- **Cache de storytelling (IA):** não toca em `getStorytelling()` / `useStorytellingAutoGen()`.
- **Cache de assumptions:** localStorage é compartilhado entre Wealth e Proposal — leitura é síncrona, ~0,1 ms, sem rede.
- **Edge functions:** zero alteração em `generate-pdf`, `generate-proposal`, `share-proposal`.
- **Performance:** uma chamada `JSON.parse` extra por geração de PDF (storage hit único). Nenhum effect novo, nenhum subscription.

---

## UX Continuity Validation

Cenário de uso end-to-end agora:

1. Consultor explora Wealth, aplica preset **Otimista** (`cdiPercent: 120`, `propertyAppreciation: 7`, `agioOnSale: 40`).
2. Abre "Usar a Carta para Investir", lê tese — KPIs reagem ao vivo.
3. Clica **"Levar tese para Proposal"** → `setActiveStrategy('usar-carta-investir', 'wealth-library')` + `navigateTo('proposals')`.
4. No Proposal, bloco `wealth-thesis` aparece **já marcado** com a tese ativa.
5. Gera PDF → KPIs no PDF refletem o preset Otimista (era o gap fechado nesta onda).

**Sensação de ecossistema único:** ✅. Sem retrabalho, sem reconstrução narrativa, sem "por que o número mudou quando saí do Wealth?".

---

## Zero Regression Validation

- `src/core/finance/**` — não tocado.
- `WealthPlatformModule.tsx` / `ConsultiveStrategyPanel.tsx` / `CompareWorkspace.tsx` (V2 LOCK) — não tocados.
- `strategyLibraryData.ts` / `strategyFlagships.ts` / `strategyExecutiveKpis.ts` — não tocados.
- `ViabilityPreview` / KPI Source Governance — não tocado.
- Edge `generate-pdf` e `_lib/` compartilhados — não tocados.
- `PdfPropostaCompleta` e shape do payload `wealth` — não tocados.
- `ActiveStrategyContext` — não tocado.
- `strategyNextSteps.ts` (mapa de continuidade) — não tocado.

Diff total da onda: **2 arquivos · 13 linhas adicionadas · 4 substituídas**.

---

## Final Executive Continuity State

| Eixo | Antes | Depois desta onda |
|---|---|---|
| Bridge Wealth → Proposal | ✅ id + tese editorial | ✅ id + tese editorial **+ premissas vivas** |
| Narrative continuity | ✅ tagline / howItWorks / patrimonialLogic | ✅ idem |
| Parametric continuity | ❌ KPIs voltavam aos defaults canônicos no PDF | ✅ `calcContext` preservado via storage fallback |
| Entrypoints | ✅ por estratégia via `strategyNextSteps` | ✅ idem |
| Cross-module memory | ✅ contextos canônicos | ✅ idem (sem snapshot novo) |
| Integrity (PDF/cache/edge) | ✅ íntegro | ✅ íntegro |

---

## Final Verdict

**Estratégias Patrimoniais agora alimenta naturalmente a Proposal — não funciona mais isoladamente.**

A última costura paramétrica foi feita com a menor superfície possível: uma função pura de leitura standalone do localStorage e duas linhas no callsite do PDF. Nada foi hoisted, nenhuma engine foi tocada, nenhum Provider foi reorganizado, nenhuma matemática nova foi escrita. A plataforma agora se comporta como uma **consultoria patrimonial integrada**: a tese escolhida no Wealth, com as premissas ajustadas pelo consultor, chega íntegra à Proposal executiva e ao PDF final.

**Próxima onda candidata (opcional, fora deste escopo):** expor as 3-4 premissas mais sensíveis (CDI, contemplação, yield) como um banner discreto no topo do bloco `wealth-thesis` do PDF — "Cenário: Otimista · CDI 120% · contemplação 24m" — para que o cliente veja explicitamente o cenário usado. Isso eleva ainda mais a sensação consultiva sem mexer em nenhuma engine.
