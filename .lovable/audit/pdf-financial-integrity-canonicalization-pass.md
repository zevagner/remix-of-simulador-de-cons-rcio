# PDF Financial Integrity & Canonicalization Pass

> Snapshot: 2026-05-16 · Engineer: Principal PDF Financial Integrity Engineer
> Scope: 3 críticos saneados sem regressão visual, sem refactor de pipeline.
> Predecessor: `.lovable/audit/full-pdf-system-document-pipeline-audit.md`

---

## Executive Verdict

Esta passada elimina **as três únicas fontes de drift financeiro** identificadas na auditoria
anterior do ecossistema documental. Nenhum template, layout, generator, edge, cache, mutex ou
retry foi alterado. Apenas o **binding de dados** entre o `InvestmentModule` (engine viva da
UI) e o `ProposalPdfModule` (agregador) foi canonicalizado.

Resultado: **qualquer cálculo financeiro exibido no PDF da Proposta Completa é, byte-a-byte,
o mesmo cálculo já exibido na UI** — sem heurísticas, sem aproximações, sem cálculo paralelo.

| Crítico | Antes | Depois |
|---|---|---|
| Heurística 0,8% a.m. em `cmp-cash` | Texto narrativo gerado com taxa hardcoded | Texto consumindo `useCashComparison` real |
| Compra à Vista — dupla origem matemática | Aggregator com cálculo paralelo + Investment com engine | Engine única (`useCashComparison`) lida via `InvestmentResultsContext` |
| `investment.assumptions: null` hardcoded | PDF recebia `null` mesmo com Investimento aberto | PDF recebe snapshot canônico das premissas reais da sessão |

---

## 1. Cash Comparison Canonicalization

**Problema:** `ProposalPdfModule.tsx` (linhas 175–196 do snapshot anterior) computava o
texto do bloco `cmp-cash` usando `compoundGrowth(credit, 0.008, months)` — uma taxa
mensal hardcoded "~0,8% a.m. (CDI conservador) — referência educativa". Isso divergia
do que a UI mostrava (`useCashComparison` com CDI/percentual reais).

**Solução:**
- O `InvestmentModule` agora publica o resultado completo do `useCashComparison` (a mesma
  instância já memoizada e usada pela UI da aba `Compra à Vista`) no
  `InvestmentResultsContext`, sob a chave `cashComparison`.
- O `ProposalPdfModule` consome **exclusivamente** esse snapshot para montar o texto
  patrimonial do bloco `cmp-cash`. Removida toda computação local.
- Se a sessão ainda não computou o cash (usuário não abriu Investimento), o bloco é
  **descartado pelo gate de integridade** — sem fallback inventado, sem texto vazio.

**Arquivos tocados:**
- `src/contexts/InvestmentResultsContext.tsx` — novo tipo `CashComparisonSnapshot`
- `src/components/modules/InvestmentModule.tsx` — publica `cashComparison` no context
- `src/components/modules/ProposalPdfModule.tsx` — consome `investment.cashComparison`,
  remove `0.008` e `compoundGrowth`

**Garantias preservadas:**
- ZERO recálculo (mesma instância de `useCashComparison`).
- ZERO duplicação de math.
- Visual narrativo do PDF mantém estrutura (3 parágrafos), valores agora derivados
  de `propertyValue`, `capitalToInvest`, `monthlyYield`, `monthlyInstallment`,
  `consortiumFinalPatrimony`, `patrimonyDifference`, `patrimonyDifferencePercent`.

---

## 2. Compra à Vista Single Source Validation

**Mapeamento de entradas após esta passada:**

| Entry-point | Tipo | Engine | Status |
|---|---|---|---|
| `InvestmentModule` → aba `compra-vista` (UI) | Visual + cálculo | `useCashComparison` | **Canônico** |
| `InvestmentModule` → `InvestmentPdfActions` (PDF) | PDF (`PdfAnaliseFinanceira mode="cash"`) | Recebe `cashComparison` como prop | **Canônico** |
| `ComparatorModule` → aba `vs Compra à Vista` (UI) | Visual consultivo | `STRATEGY_LIBRARY['compra-a-vista']` (constantes editoriais) | Consultivo — não computa cenário do cliente |
| `ProposalPdfModule` → bloco `cmp-cash` (PDF) | PDF narrativo agregado | **`investment.cashComparison` via context** | **Canônico (era heurística — corrigido nesta passada)** |
| `StrategyLibrarySection` (UI) | Removido — bloqueado por `filter((s) => s.id !== 'compra-a-vista')` | n/a | Já redirecionado para Comparador (passada anterior) |

**Conclusão:** **uma única engine matemática** (`useCashComparison`) alimenta todos os
locais que mostram **números reais do cliente**. O `CashComparisonTab` do Comparador é
explicitamente consultivo (cards editoriais com `STRATEGY_LIBRARY`) e por design não
computa cenário individual — não é uma segunda fonte matemática, é um overview semântico.

---

## 3. Investment Assumptions Fix

**Problema:** `ProposalPdfModule.tsx` (linha 260) tinha `assumptions: null` hardcoded no
`investmentMirror`. A página de Premissas do PDF nunca recebia os valores reais usados
na sessão (CDI%, valorização, yield, etc.).

**Solução:**
- `InvestmentResultsContext` expõe `assumptions: InvestmentAssumptionsSnapshot` (subset
  tipado: `propertyAppreciation`, `investmentReturn`, `rentalYield`, `cdiPercent`,
  `cdiRate`, `analysisMonths`) — não expõe o tipo interno completo `Assumptions` para
  manter o acoplamento mínimo.
- Helper `toAssumptionsSnapshot(assumptions)` exportado pelo context (sem lógica, só
  projeção tipada).
- `InvestmentModule` publica via `setInvestmentResults({ ..., assumptions: toAssumptionsSnapshot(assumptions) })`.
- `ProposalPdfModule` consome e popula `investmentMirror.assumptions` com os 5 campos
  esperados pelo `PdfPropostaCompletaData.investment.assumptions`.
- Quando Investimento não foi aberto na sessão → `assumptions: null` (comportamento
  esperado, gate trata).

---

## 4. PDF Data Parity Validation

| Métrica | Tela (Investimento → Compra à Vista) | PDF (Proposta Completa → bloco `cmp-cash`) | Paridade |
|---|---|---|---|
| `creditLetterValue` | `useCashComparison` | `investment.cashComparison.creditLetterValue` | ✅ |
| `capitalToInvest` | `useCashComparison` | mesmo valor | ✅ |
| `monthlyYield` | `useCashComparison` | mesmo valor | ✅ |
| `monthlyInstallment` | `useCashComparison` | mesmo valor | ✅ |
| `consortiumFinalPatrimony` | `useCashComparison` | mesmo valor | ✅ |
| `patrimonyDifference` / `Percent` | `useCashComparison` | mesmo valor | ✅ |
| CDI% / CDI rate / análise (meses) | `assumptions` state | `investment.assumptions.*` | ✅ |
| Valorização imóvel / yield aluguel | `assumptions` state | `investment.assumptions.*` | ✅ |

Paridade financeira: **absoluta**. Não existe mais cenário onde a Proposta Completa
diverge da UI por uma casa decimal — porque não existe mais engine paralela.

---

## 5. Legacy Safety Validation

- ✅ `compoundGrowth` removido apenas do `ProposalPdfModule` (continua exportado por
  `@/core/finance` e usado por outros consumidores — `useCashComparison` o usa internamente).
- ✅ Nenhum outro arquivo consome a chave `cashImpact` para reverse-engineer a taxa
  antiga (busca por `0.008` retorna apenas testes de paridade que usam o número como
  fixture genérico, sem relação com cash).
- ✅ Nenhum outro consumidor importa `InvestmentResults` esperando o shape anterior:
  os campos `assumptions` e `cashComparison` são **adições**, não substituições — todos
  os campos antigos (`bestStrategy`, `incomeMonthly`, `saleProfit`, `contemplationMonth`,
  `calculations`, `presentations`, `recommendedId`, `publishedAt`) permanecem intactos.
- ✅ `useInvestmentResults()` continua retornando `{ results, setResults }` — assinatura
  pública inalterada.
- ✅ Botões de export, rotas, pipeline Browserless, mutex, retry, cache, RLS: **zero alteração**.
- ✅ Comparator's CashComparisonTab consultivo (sem PDF próprio) — mantido.

---

## 6. Zero Regression Validation

| Dimensão | Status |
|---|---|
| Visual perceptivo do PDF | ✅ Inalterado (mesmo template, mesmas cores, mesma fonte, mesma hierarquia) |
| Paginação | ✅ Inalterada (mesmo pipeline `pageIf` em `proposta/pipeline.tsx`) |
| Generator principal (`generatePdfFromElement`) | ✅ Não tocado |
| Edge `generate-pdf` Browserless | ✅ Não tocado |
| Cache (`proposal-pdfs` + `proposal_pdf_cache`) | ✅ Não tocado |
| Mutex / retry / share | ✅ Não tocado |
| Templates v1 (`PdfAnaliseFinanceira`, `PdfSimulador`, etc.) | ✅ Não tocado |
| Outros módulos (Carteira, Pós-venda, Wealth) | ✅ Não tocados |
| `useCashComparison` matemática | ✅ Bit-a-bit idêntica |
| `Assumptions` state interno | ✅ Inalterado |
| Hierarchy/layout/global UI | ✅ Não tocados |

---

## 7. Final Document Integrity State

- ✅ Zero drift financeiro entre UI e PDF.
- ✅ Zero cálculo paralelo entre `ProposalPdfModule` e `InvestmentModule`.
- ✅ Zero `assumptions` mortas — premissas reais vivem no payload do PDF.
- ✅ Zero duplicidade matemática de Compra à Vista — engine única (`useCashComparison`).
- ✅ Proposta Completa reflete exatamente o cálculo real visto na tela.
- ✅ Sem heurísticas, sem aproximações, sem fallbacks editoriais financeiros.

---

## Final Verdict

A Proposta Completa agora opera sob **a regra de ouro de integridade documental
financeira**: *o PDF é uma projeção de leitura da UI, não uma recálculo paralela.*

A camada de agregação (`ProposalPdfModule`) deixa de ser fonte autônoma de números e
passa a ser **consumer-only** do `InvestmentResultsContext` para todo dado financeiro
de Investimento/Compra à Vista — exatamente o mesmo padrão já vigente para `simulation`
(via `useSimulatorResult`), `bidsStudy` (via `useBidsStudyResults`) e `journey` (via
`useClientJourneySafe`).

**Status do ecossistema documental após esta passada:** *runtime canônico (já era) +
agregação canônica (agora é). Pipeline de composição visual v1/v2 permanece em coexistência
(fora do escopo desta onda).*

Pronto para qualquer expansão futura sem risco de drift.
