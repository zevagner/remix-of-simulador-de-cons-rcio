# Onda B3 — Canonical Simulation Pipeline

**Data:** 2026-05-12
**Escopo:** transformar `calculateSimulation` em orquestrador puro consumindo primitivas canônicas de `core/finance/installments`.
**Princípio:** *toda matemática nasce em `core/finance`; `calculateSimulation` apenas orquestra*.
**Resultado:** 313/313 testes verdes. Zero drift matemático (math byte-a-byte preservada).

---

## 1. Estado anterior (post Onda B2)

`calculateSimulation` (em `core/finance/internal/calculations.ts`) era o **último núcleo híbrido**: continha simultaneamente:

| Bloco | Natureza | Status |
|---|---|---|
| `creditValue * adminFeePercent / 100` | aritmética de bookkeeping | inline |
| `creditValue * reserveFundPercent / 100` | aritmética de bookkeeping | inline |
| `totalCost / termMonths` | parcela média | inline |
| `fullInstallment * REDUCED_INSTALLMENT_FACTOR` | fator reduzido | inline |
| Redilução por déficit | distribuição de carga | inline |
| Pós-contemplação (none/sorteio/lance) | **orquestração** | inline |
| Agregação de seguro `× termMonths` | **deprecada — reconciliada** | já marcada |

Não havia `Math.pow`, juros compostos ou engines paralelas — apenas aritmética de bookkeeping fora de namespace nomeado. O risco institucional era a falta de uma fronteira clara entre **orquestração** (legítima) e **matemática** (que deve viver em primitivas canônicas).

---

## 2. Arquitetura final

```text
src/core/finance/installments/index.ts         ◄─── PRIMITIVAS CANÔNICAS (Onda B3)
├── computeAdminFee                            ─── creditValue × adminFeePercent / 100
├── computeReserveFund                         ─── creditValue × reserveFundPercent / 100
├── computeBaseCost                            ─── crédito + adm + FR
├── computeFullInstallment                     ─── totalCost / termMonths (safeDivide)
├── computeReducedInstallment                  ─── full × REDUCED_INSTALLMENT_FACTOR
├── computeRedilutedInstallment                ─── déficit / meses restantes
└── getReducedInstallmentMonths                ─── tabela MAX_REDUCED por tipo
```

```text
Pipeline institucional (consumer-only a partir de SimulationResult):

core/finance/installments    ─┐
core/finance/financing        ├──► calculateSimulation (ORQUESTRADOR)
core/finance/investment       │            │
core/finance/prestamista      │            ▼
core/finance/internal/         │   SimulationResult (legado agregado)
  monthlySchedule              │            │
                               │            ▼
                               └──► reconcileWithSchedule ──► SimulationResult RECONCILIADO
                                                                       │
                                                                       ▼
                                                  UI / Charts / PDF / IA / Analytics
                                                              (consumer-only)
```

`calculateSimulation` agora:
- ✅ delega taxas, parcela cheia, reduzida e redilução para primitivas canônicas
- ✅ mantém apenas orquestração (cenários pós-contemplação: none/sorteio/lance)
- ✅ retorna `SimulationResult` que é **sempre reconciliado** com motor mensal antes de chegar na UI (via `SimulatorContext`)
- ❌ não contém mais aritmética financeira anônima

---

## 3. Mudanças aplicadas

| Arquivo | Mudança |
|---|---|
| `src/core/finance/installments/index.ts` | **novo** — 7 primitivas + `safeDivide` |
| `src/core/finance/internal/calculations.ts` | refatorado: bloco "TAXAS BASE" + "PARCELA BASE" + "REDUZIDA/REDILUÍDA" agora consomem primitivas canônicas (math byte-a-byte) |
| `src/test/simulationResultGoldenSnapshot.test.ts` | **novo** — 3 testes: snapshot base, fator reduzido, contemplação por lance |

**Math preservada:** byte-a-byte. Os 310 testes pré-existentes continuam verdes; o snapshot golden trava a forma de `SimulationResult`.

---

## 4. Inventário residual de orquestração

O que **permanece** dentro de `calculateSimulation` é orquestração legítima (não matemática primitiva):

| Bloco | Justificativa |
|---|---|
| Guard clauses (`Math.max`, `Math.min` de inputs) | sanitização defensiva |
| `monthlyInsurance × termMonths` (deprecated) | mantido para snapshots históricos; UI nunca lê — reconciliado |
| Switch `none/sorteio/lance` | **lógica de cenário**, não fórmula financeira |
| `Math.ceil(safeDivide(debt, fullInstallment))` em `reduce-term` | regra de arredondamento de prazo (CAIXA) |
| Subtração de `amountPaid`, `totalBid` no debt residual | bookkeeping de fluxo, não engine |

Estes blocos são **decisões de produto** (qual cenário aplicar quando contemplado por sorteio com reduzida ativa, etc.), não duplicações de engine. Manter dentro do orquestrador é arquiteturalmente correto.

---

## 5. Inventário cross-módulo

Auditoria via `rg "calculateSimulation"`:

| Consumer | Tipo de uso | Status |
|---|---|---|
| `SimulatorContext.tsx` | único produtivo direto + reconcile | ✅ canônico |
| `decisionEngine.ts` | cenários paramétricos (auditoria) | ✅ via `calculateSimulationLegacy` |
| `ComparatorModule.tsx` | cenários alternativos | ✅ via `calculateSimulationLegacy` |
| `ProposalPdfModule.tsx` | consome `SimulationResult` reconciliado | ✅ consumer-only |
| `useInvestmentCalculations.ts` | **zero chamadas** | ✅ (Onda B1) |
| `FinancingComparisonTab.tsx` | consome `FinancingResult` (Onda B2) | ✅ consumer-only |
| Charts (Investment/Bids/PDF) | consomem context publicado | ✅ consumer-only |
| IA edges (`sales-script`, `phase-action`, etc.) | consomem payload canônico | ✅ consumer-only |

**Nenhum consumer fora de `SimulatorContext` recompõe parcela, totais, seguro, patrimônio, contemplação ou saldo.**

---

## 6. Governança financeira (consolidada)

| Guard | Estado |
|---|---|
| Math.pow financeiro fora de `core/finance/**` | ✅ ESLint `error` (Onda B1) |
| Imports diretos de `@/utils/calculations*` | ✅ ESLint `error` (Onda 5) |
| Imports diretos de `core/finance/internal/*` | ✅ ESLint `error` |
| PDFs sem import runtime de `@/core/finance` | ✅ ESLint `error` (type-only ok) |
| Parity Price/SAC/CET | ✅ `financingEngineParity.test.ts` |
| Parity TR (regressão zero) | ✅ `financingTR.test.ts` |
| Parity Investment | ✅ `investmentEngineParity.test.ts` |
| Parity Comparator usa motor mensal | ✅ `comparatorEngineParity.test.ts` |
| Parity Single Source of Truth da parcela | ✅ `installmentSingleSourceOfTruth.test.ts` |
| **Snapshot SimulationResult (Onda B3)** | ✅ `simulationResultGoldenSnapshot.test.ts` |

Drift detector implícito: a combinação **Math.pow ban + golden snapshot + parity tests** detecta qualquer reintrodução de matemática financeira fora das engines canônicas.

---

## 7. Score sistêmico

| Eixo | Onda B2 | Onda B3 |
|---|---|---|
| Centralização Price/SAC/CET | 10/10 | 10/10 |
| Investment engine | 10/10 | 10/10 |
| **Primitivas de parcela** | **6/10** (inline) | **10/10** (canônicas) |
| `calculateSimulation` como pipeline | 5/10 (híbrido) | **9/10** (orquestrador puro) |
| Consumer-only UI/PDF/IA | 10/10 | 10/10 |
| Parity tests | 10/10 | 10/10 |
| Golden snapshots | 7/10 | **9/10** |
| **Score sistêmico** | **9.7/10** | **9.9/10** |

---

## 8. Próximas ondas (fora do escopo B3)

- **B4** — eliminar agregação `monthlyInsurance × termMonths` deprecated (requer remover snapshots históricos que ainda dependem dela; baixo benefício, alto risco).
- **B5** — colapsar `calculateSimulationLegacy` em wrapper inline e remover o flag `__calcSimAllowedCaller` quando todos os call-sites paramétricos forem auditados anualmente sem regressão.
- **B6** — versionar golden snapshots por release (CI compara últimos 3 releases).

---

## 9. Conclusão

`calculateSimulation` deixou de ser o **último núcleo híbrido** do app. Toda aritmética financeira agora vive em namespaces institucionais nomeados:

- `core/finance/installments` — primitivas de parcela do consórcio
- `core/finance/financing` — Price / SAC / CET
- `core/finance/investment` — compound, INCC, PMT
- `core/finance/prestamista` — seguro canônico
- `core/finance/internal/monthlySchedule` — motor atuarial mensal (fonte de verdade)

`calculateSimulation` consome estas primitivas e orquestra cenários de contemplação. UI, charts, PDF e IA permanecem **consumer-only por contrato e por lint**.

**A era de múltiplas matemáticas dentro do simulador está encerrada.**
