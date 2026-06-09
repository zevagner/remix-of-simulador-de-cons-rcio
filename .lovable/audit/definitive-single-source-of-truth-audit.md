# Auditoria Definitiva — Single Source of Truth Financeiro
**Data:** 2026-05-12 · **Onda:** B (pós Onda A — Parcela Canônica)
**Objetivo:** mapear toda matemática paralela ainda existente e propor a arquitetura financeira institucional definitiva.

---

## 0. Sumário Executivo

| Dimensão | Estado atual | Estado-alvo |
|---|---|---|
| Engines centrais (parcela / schedule / seguro) | **1 canônica** (`@/core/finance`) + legado controlado | 1 canônica |
| Pontos com matemática própria | **8 hot spots** identificados | 0 (ou 1 engine dedicada por domínio) |
| Drift de parcela | Eliminado (Onda A) | Mantido |
| Drift de seguro | Eliminado (Ondas 1–3) | Mantido |
| Drift de **investimento / patrimônio** | **PRESENTE** — `useInvestmentCalculations`, `useCashComparison` e `ScenarioComparisonChart` recalculam paralelos | Engine única `core/finance/investment` |
| Drift de **gráficos** | **PRESENTE** — `ScenarioComparisonChart` reproduz fórmulas em vez de consumir séries | Charts puramente consumers |
| Drift de **comparador (financiamento)** | **PRESENTE** — `FinancingComparisonTab` usa Price inline | Engine `core/finance/financing` |
| Drift de **structured ops** | Baixo (consome canônico) | OK |
| Drift de **PDF** | Eliminado (Onda A) | Mantido |
| Drift de **IA / propostas** | Apenas leitura (centralAI, proposalGenerator) | OK — manter governança |
| Score sistêmico de SSoT | **7.4 / 10** | 9.5+ |

**Veredito:** parcela, schedule e seguro estão unificados. **A matemática de investimento (paths 1–6, cash comparison, gráficos de cenários) é hoje a maior fonte de drift estrutural restante.**

---

## 1. Inventário Matemático Total

### 1.1 Engines oficiais — `src/core/finance/`

| Arquivo | Papel | Status |
|---|---|---|
| `internal/monthlySchedule.ts` | **Motor atuarial mensal** — fonte única de saldo devedor, seguro decrescente, totais reais | ✅ Canônico |
| `internal/calculations.ts` | `calculateSimulation` (legado agregado) + `calculateSimulationLegacy` (alias paramétrico) | ⚠ Legado controlado |
| `internal/reconcile.ts` | `reconcileWithSchedule` — projeta `fullInstallment / reduced / rediluted` a partir do schedule | ✅ Canônico (Onda A) |
| `prestamista/index.ts` | Engine canônica do Seguro Prestamista (% fixo, sem idade) | ✅ Canônico |
| `index.ts` | Fachada pública | ✅ |

### 1.2 Helpers fora de `core/finance/`

| Arquivo | Conteúdo matemático | Classificação |
|---|---|---|
| `src/utils/calculations/investimento.ts` | `calculateIR` (tabela regressiva RFB) | ✅ Fonte única declarada |
| `src/utils/calculations/lances.ts` | Re-export de `bidAnalysis` | ✅ Pure pass-through |
| `src/utils/bidAnalysis/*` | Estatística de lances (Monte Carlo, projeção) | ✅ Engine dedicada |
| `src/utils/mipRates.ts` | Tabela MIP residual (uso restrito) | ⚠ Manter sob lint |
| `src/utils/decisionEngine.ts` | Chama `calculateSimulationLegacy` 4×; **não** recalcula | ✅ Consumer |
| `src/services/pipelineMetrics.ts` | Médias e contagens de pipeline (não financeiro de produto) | ✅ Domínio CRM |
| `src/services/proposals/investmentProposalGenerator.ts` | Apenas `reduce` para escolher melhor cenário (sem matemática) | ✅ Consumer |

### 1.3 Hot spots com **matemática financeira própria** (drift)

| # | Arquivo | Fórmulas detectadas | Risco |
|---|---|---|---|
| H1 | `src/hooks/useInvestmentCalculations.ts` | 6 ocorrências de `Math.pow(1+r, n)`; valorização imóvel, CDI composto, INCC, prev. privada, paths 1–6 | **Alto** — fonte única dos 5 cenários do módulo Investment |
| H2 | `src/hooks/useCashComparison.ts` | Anuidade composta `monthlyExcedent * ((1+i)^n − 1)/i`, taxa equivalente | **Alto** — matemática paralela à H1 |
| H3 | `src/components/modules/investment/ScenarioComparisonChart.tsx` | **Reproduz** localmente as mesmas fórmulas de H1 (CDI composto, valorização, INCC) para construir as séries do gráfico | **Crítico** — drift visual vs cards |
| H4 | `src/components/modules/investment/CotaMultiplicationCard.tsx` | `Math.pow(1 + inccAnnualPercent/100, years)` | Médio |
| H5 | `src/components/modules/comparator/FinancingComparisonTab.tsx` | Price/SAC, taxa equivalente `((1+i)^(1/12)−1)`; tabela de financiamento inline | **Alto** — comparador financeiro sem engine |
| H6 | `src/components/modules/investment/effectiveAssumptions.ts` | Sem matemática, mas **fachada de leitura paralela** entre `assumptions` e `cash*` (state duplicado) | Médio — fonte de inconsistência semântica |
| H7 | `src/components/pdf/proposta/pages/SimulationPage.tsx` linha 20 | Fallback `installmentBeforeContemplation ?? fullInstallment ?? installmentAfter` | Baixo — apenas resolução de fallback |
| H8 | `src/components/pdf/__tests__/PdfSimulador.parity.test.tsx` | Usa `monthlySchedule.rows[0].payment` como `fullInstallment` no fixture | Apenas teste — atualizar para usar reconciliado |

---

## 2. Mapa de Verdades por Domínio

| Domínio | Fontes de verdade hoje | Esperado | Drift? |
|---|---|---|---|
| **Parcela cheia / reduzida / rediluída** | `result.fullInstallment` (reconciliado) | 1 | ✅ Não |
| **Seguro Prestamista** | `core/finance/prestamista` + `monthlySchedule.totalInsurance` | 1 | ✅ Não |
| **Saldo devedor mensal** | `monthlySchedule.rows[i].balance` | 1 | ✅ Não |
| **Custo total** | `result.totalCost` reconciliado | 1 | ✅ Não |
| **Contemplação (mês / regras)** | `SimulatorContext.contemplated/contemplationMonth` + `deriveContemplationType` | 1 | ✅ Não (parametrizado) |
| **Lance (embutido + livre)** | `simulationInput.embeddedBidPercent / freeBidPercent` + `calculateMonthlySchedule(... bidMonth)` | 1 | ✅ Não |
| **Patrimônio / paths 1–6** | `useInvestmentCalculations` **+** `ScenarioComparisonChart` (recálculo) | **2** | 🔴 Sim |
| **Compra à vista / excedente** | `useCashComparison` (paralelo a H1) | 1 dedicada | 🟠 Parcial |
| **Comparador financiamento** | `FinancingComparisonTab` (inline Price) | 0 — sem engine | 🔴 Sim |
| **Multiplicação de cotas (INCC)** | `CotaMultiplicationCard` + `useInvestmentCalculations` | 1 | 🟠 Duplicado |
| **KPIs CRM / forecast** | `salesForecast.ts`, `clientScoring.ts`, `pipelineMetrics.ts` | 1 cada | ✅ Não (domínios distintos) |
| **PDF (todas as páginas)** | Consome props vindos de cada módulo | 0 cálculos | ✅ Não |
| **Central AI** | Consome resultados via `ClientJourneyContext` | 0 cálculos | ✅ Não |

---

## 3. Quem Calcula × Quem Deveria Apenas Consumir

### 3.1 **Calculadores legítimos** (engines)
- `core/finance/internal/monthlySchedule.ts`
- `core/finance/internal/calculations.ts` (legado, único call site produtivo: `SimulatorContext`)
- `core/finance/internal/reconcile.ts`
- `core/finance/prestamista/index.ts`
- `utils/calculations/investimento.ts` (apenas `calculateIR`)
- `utils/bidAnalysis/*`

### 3.2 **Calculadores ilegítimos** (devem virar consumers ou virar engine)
- `hooks/useInvestmentCalculations.ts` → **promover a engine** `core/finance/investment`
- `hooks/useCashComparison.ts` → **fundir** na engine de investimento
- `components/modules/investment/ScenarioComparisonChart.tsx` → **consumer puro** das séries publicadas pela engine
- `components/modules/investment/CotaMultiplicationCard.tsx` → consumer
- `components/modules/comparator/FinancingComparisonTab.tsx` → criar `core/finance/financing` (Price/SAC)

### 3.3 **Consumers já corretos**
- `InstallmentCompositionTable`, `SimulatorActuarialCard`, `SimulatorContemplationCard`
- Todas as páginas de `components/pdf/proposta/*`
- `PdfSimulador`, `PdfOperacoesEstruturadas`
- `services/centralAI`, `services/proposals/*`
- `decisionEngine`, `salesForecast`, `clientScoring`

---

## 4. Detecção de Padrões Perigosos

### 4.1 Inline math (`Math.pow(1+r, n)`, anuidades, etc.)
- **15 ocorrências** fora de `core/finance` — todas concentradas em H1–H5.
- Nenhuma em PDFs, IA, CRM, propostas ou serviços.

### 4.2 Derived states financeiros (`useMemo` com matemática)
- `SimulatorContext.tsx` — legítimo (chama engines canônicas dentro do memo).
- `useInvestmentCalculations.ts` — **9 `useMemo` com matemática** (paths 1–6, INCC, CDI).
- `ScenarioComparisonChart.tsx` — `useMemo` que **reaplica** fórmulas.
- `CotaMultiplicationCard.tsx` — `useMemo` de valorização INCC.
- Demais componentes simulator/structured-ops/comparator: apenas formatação ou agregação direta.

### 4.3 Helpers legados (`calculate*`, `derive*`, `estimate*`, `build*`)
- Em **engines**: `calculateSimulation`, `calculateSimulationLegacy`, `calculateMonthlySchedule`, `calculateIR`, `deriveContemplationType` → ✅ legítimos.
- Em **fora**: `estimateBidProbabilityMonteCarlo` (engine de lances) → ✅ legítimo em domínio próprio.
- Nenhum helper "fantasma" duplicando lógica de parcela/seguro restante.

### 4.4 Schedules paralelos
- 2 fontes: `baseSchedule` (sem contemplação) e `monthlySchedule` (com contemplação) — **ambas vêm da mesma engine**, com IDs já documentados em memória `simulator-base-vs-strategy`. ✅ OK.
- `scheduleWithINCC` em `useInvestmentCalculations` → também vem da engine canônica. ✅ OK.

### 4.5 Gráficos paralelos
- `ScenarioComparisonChart`: **drift confirmado** — recalcula séries em vez de consumir `calculations.path*.timeline`.
- `StructuredOpsCharts`: apenas agrega e percentualiza dados já calculados. ✅ OK.

---

## 5. Riscos Concretos do Drift Restante

1. **Cards de cenário vs gráfico de cenários:** se mudar uma premissa em `useInvestmentCalculations` e esquecer de espelhar em `ScenarioComparisonChart`, o card mostra um número e o gráfico desenha outro.
2. **`CotaMultiplicationCard` vs cenário "Acumular cota corrigida":** ambos calculam INCC composto independentemente.
3. **`useCashComparison` vs caminho 4 (CDI):** fórmula de anuidade replicada em 2 lugares.
4. **`FinancingComparisonTab`:** sem engine, sem testes de paridade — qualquer alteração futura na fórmula Price vira mudança visual silenciosa.

---

## 6. Arquitetura Financeira Definitiva (alvo)

```text
                    ┌──────────────────────────────────────┐
                    │       @/core/finance (fachada)       │
                    └──────────────────────────────────────┘
                                     │
   ┌──────────────┬──────────────┬───┴────────┬────────────────┬──────────────┐
   ▼              ▼              ▼            ▼                ▼              ▼
monthlySchedule  reconcile   prestamista   investment      financing       bidAnalysis
(atuarial)      (parcela     (seguro)     (paths 1–6,     (Price/SAC,     (Monte Carlo,
                 canônica)                 cash, INCC,    taxa equiv.)    projeção)
                                           previdência)
                                     │
                                     ▼
                       SimulationResult oficial (imutável)
                                     │
   ┌─────────────┬─────────────┬─────┴───────┬─────────────┬──────────────┐
   ▼             ▼             ▼             ▼             ▼              ▼
Simulador   Comparador   Investimento   Estruturadas   PDFs           Central AI
(consumer)  (consumer)   (consumer)     (consumer)     (consumer)     (consumer)
```

**Regra institucional:** *Nenhum componente UI, hook de página, gráfico, PDF ou serviço de IA pode conter matemática financeira própria. Toda matemática nasce em `@/core/finance`.*

---

## 7. Plano de Migração em Ondas

### Onda B1 — Promover `useInvestmentCalculations` a engine
- Criar `src/core/finance/investment/` com:
  - `paths.ts` — paths 1–6 puros (input → resultado)
  - `cdi.ts` — anuidades, taxa equivalente, IR
  - `index.ts` — fachada
- Hook vira **adapter** que chama a engine e expõe os mesmos memos (zero quebra visual).
- Testes de paridade `investmentEngineParity.test.ts` (entrada idêntica → mesmo número).

### Onda B2 — Eliminar drift do gráfico
- `ScenarioComparisonChart` passa a receber `series` calculadas pela engine (`calculations.path*.monthlySeries`).
- Remover `Math.pow` do componente.
- Snapshot test cobrindo card-vs-chart parity.

### Onda B3 — Consolidar Cash + CotaMultiplication
- `useCashComparison` → `core/finance/investment/cash.ts`.
- `CotaMultiplicationCard` consome `engine.inccGrowth(value, years)`.
- Remover `effectiveAssumptions.ts` substituindo por **state único** (Onda futura — pode ficar como passo intermediário).

### Onda B4 — Engine de financiamento
- Criar `core/finance/financing/` com Price/SAC, taxa equivalente, tabela amortização.
- `FinancingComparisonTab` vira consumer.
- Lint guard banindo `Math.pow(1 + .* / 12)` fora de `core/finance/**`.

### Onda B5 — Governance
- ESLint `no-restricted-syntax`:
  - Banir `Math.pow(1 +` em `src/components/**`, `src/hooks/**` (allowlist `core/finance/**`).
  - Banir `import .* from '@/utils/calculations/(?!investimento|lances)'`.
  - Banir literais `'Seguro MIP'` (já existe).
- CI parity tests:
  - `investmentEngineParity` (cards × engine × chart)
  - `financingEngineParity` (comparador × engine)
  - `installmentSingleSourceOfTruth` (já existe — manter)
  - `prestamistaCrossModuleConsistency` (já existe — manter)
- Drift detector: novo teste `crossModuleFinancialDrift.test.ts` que renderiza Simulador + Investimento + Comparador + PDF com mesma input e compara KPIs.

### Onda B6 — Cleanup final
- Marcar `calculateSimulation` legacy como `@deprecated` com data de remoção.
- Reduzir uso a 1 call site (já é o caso) e planejar remoção quando reconcile cobrir 100% dos cenários paramétricos.

---

## 8. Governança Financeira Institucional

### 8.1 Regras invioláveis
1. Nenhum componente UI calcula. Apenas formata.
2. Nenhum hook fora de `core/finance/**` aplica fórmula composta, Price/SAC ou IR.
3. Nenhum gráfico reaplica matemática — consome séries publicadas pela engine.
4. Nenhum PDF possui fórmula — apenas consome `SimulationResult`.
5. Nenhum serviço de IA deriva matemática — apenas narra resultados.
6. Toda nova premissa financeira nasce na engine, com teste de paridade obrigatório.

### 8.2 Estrutura de testes
- `*.parity.test.ts` — paridade entre engines e consumers.
- `*.singleSourceOfTruth.test.ts` — soma dos componentes = total oficial.
- `*.crossModule*.test.ts` — mesma input em N módulos → mesmo número.
- Snapshots financeiros versionados (`__snapshots__`).

### 8.3 Fachada única
- Único import permitido: `import { ... } from '@/core/finance'`.
- ESLint bloqueia `@/utils/calculations/*` (exceto `investimento` e `lances`) e qualquer caminho profundo `@/core/finance/internal/*`.

---

## 9. Score Final de Consistência Matemática

| Eixo | Score |
|---|---|
| Parcela canônica | 10 / 10 |
| Seguro canônico | 10 / 10 |
| Schedule mensal | 10 / 10 |
| Reconciliação | 9 / 10 |
| **Investimento (paths + chart + cash)** | **5 / 10** |
| **Comparador financiamento** | **4 / 10** |
| Structured Ops | 9 / 10 |
| PDFs | 9 / 10 |
| Central AI | 9 / 10 |
| Governance (lint/CI) | 7 / 10 |
| **Sistêmico** | **7.4 / 10** |

---

## 10. Conclusão

O simulador eliminou o drift estrutural de **parcela** (Onda A), **seguro** (Ondas 1–3) e **schedule mensal** (Onda 0). Resta um **bloco coeso de drift no domínio Investimento + Comparador de Financiamento**, concentrado em 5 arquivos (H1–H5).

A solução não é cosmética: é **promover essas matemáticas a engines dedicadas dentro de `@/core/finance`** (sub-módulos `investment/` e `financing/`) e converter os componentes em consumers puros, replicando o padrão já vitorioso da parcela.

Executando as Ondas B1–B6, o sistema atinge a meta institucional:

> **"Nenhum módulo financeiro calcula. Todos consomem."**

Score projetado pós-Onda B: **9.6 / 10**.
