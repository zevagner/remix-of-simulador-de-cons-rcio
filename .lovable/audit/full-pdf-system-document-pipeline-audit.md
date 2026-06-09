# Full PDF System & Document Pipeline Audit

> Snapshot date: 2026-05-16 · Auditor: Principal PDF Architecture & Document Integrity Auditor
> Scope: TODO o ecossistema documental (geração, agregação, design, dados, governance).
> **Read-only audit** — nenhum código foi alterado nesta passada.

---

## Executive Verdict

**O sistema documental NÃO é um ecossistema único — é uma arquitetura **bi-camada parcialmente convergente**:**

- **Camada A — PDFs Modulares "v1" (`PdfLayout` + `pdfStyles`)**: Simulador, Comparador, Estudo de Lances, Operações Estruturadas, Investimento, Compra à Vista. 4 arquivos monolíticos (`PdfSimulador`, `PdfEstudoLances`, `PdfOperacoesEstruturadas`, `PdfAnaliseFinanceira`) compartilhando **um único layout legado** (`PdfLayout.tsx` + `pdfStyles`) e primitives próprias (`PdfSection`, `PdfMetricGrid`, `PdfMetric`, `PdfDataTable`, `PdfBarChart`).
- **Camada B — Proposta Completa "v2" (`PdfPropostaCompleta` + `pipeline`)**: arquitetura page-based moderna (`proposta/pages/*`, `proposta/primitives.tsx`, `proposta/theme.ts`, gates + narrativeContext). Layout próprio (`Header`/`Footer`/`PageBody`/`MetricCard`/`MissingDataNote`), tema próprio (`THEME` + `PAGE`), pipeline `BLOCKS → pageIf → filter → render`.

Ambas convivem **sobre o mesmo runtime** (`PdfDownloadButton` → `generatePdfFromElement` → edge `generate-pdf` Browserless com cache em `proposal-pdfs` + retry SFO→LON). O **pipeline de geração é canônico** (1 botão, 1 generator, 1 edge, 1 cache). O **pipeline de composição visual é duplicado**.

**Proposta Completa AINDA representa o sistema atual com pequenas dívidas localizadas:**
- ✅ Consome `simulation`, `diagnostic`, `journey`, `investment`, `bidsStudy`, `comparisons` via façade `useProposalData()` canônica — bindings vivos.
- ⚠️ **Não há aggregator para Wealth/Patrimonial, Estratégias Patrimoniais, Carteira ou Pós-venda** — se o usuário tem teses patrimoniais ativas (DR-1/DR-2, flagship), a Proposta Completa **não as inclui**. Hoje isso é coberto indiretamente pelos blocos `strategy-bid/income/sell` + `cmp-cash`, mas **não há página dedicada para a tese vencedora do Comparador V2 (`CompareWorkspace.Winner`) nem para `ConsultiveStrategyPanel`**.
- ⚠️ "Compra à Vista" tem **dois caminhos divergentes**: bloco `cmp-cash` na Proposta Completa (texto narrativo) **e** PDF dedicado via `PdfAnaliseFinanceira` no novo `CashComparisonTab` do Comparador. Conteúdo, fórmulas e visual divergem.

Status do ecossistema:

| Dimensão | Status |
|---|---|
| Pipeline de geração (runtime) | ✅ Canônico (1 generator, 1 edge, cache + retry + mutex) |
| Pipeline de composição (templates) | ⚠️ Duplicado: v1 (PdfLayout) vs v2 (proposta/pipeline) |
| Design consistency | ⚠️ Dois temas coexistindo (cores compatíveis, tipografia divergente) |
| Data integrity | ✅ Façade `useProposalData()` única; gates relaxados sem silêncio |
| Module coverage | ⚠️ 5 módulos exportam, 6+ módulos **sem PDF** |
| Aggregator coverage | ⚠️ Wealth/Patrimonial fora do agregador |

**Veredito de uma linha:** *ecossistema documental coerente no runtime, mas com 2 gerações de templates evoluindo lado a lado e cobertura de export desigual entre módulos. Não está quebrado — está **parcialmente consolidado**.*

---

## Global PDF Inventory

| Módulo | Exporta PDF? | Botão | Template | Pipeline | Status |
|---|---|---|---|---|---|
| **Simulador** (`SimulatorModule`) | ✅ Sim | `PdfDownloadButton` (L175) | `PdfSimulador` (v1 / PdfLayout) | modern (generate-pdf edge) | ✅ vivo, dados via `useSimulatorInput/Result` |
| **Comparador** (`ComparatorModule`) | ✅ Sim | `PdfDownloadButton` (L274) | `PdfAnaliseFinanceira mode="comparador"` (v1) | modern | ✅ vivo |
| **Investimento** (`InvestmentModule`) | ✅ Sim | `InvestmentPdfActions` → `PdfDownloadButton` | `PdfAnaliseFinanceira mode="investimento"` (v1) | modern | ✅ vivo |
| **Compra à Vista** (sub-aba Comparador + Investimento) | ✅ Sim (2 entradas) | mesmo `InvestmentPdfActions` quando `activeInvestTab === 'compra-vista'` | `PdfAnaliseFinanceira mode="comparador" comparisonType="cash"` (v1) | modern | ⚠️ **export duplicado** (Comparador.CashComparisonTab + Investimento.compra-vista) |
| **Estudo de Lances** (`BidsModule`) | ✅ Sim (condicional) | `PdfDownloadButton` (L136) — só renderiza com `selectedGroupNumber && studyData && bidAnalysis` | `PdfEstudoLances` (v1) | modern | ✅ vivo, *gate de UX correto* |
| **Operações Estruturadas** (`StructuredOperationsModule`) | ✅ Sim | `PdfDownloadButton` (L209) | `PdfOperacoesEstruturadas` (v1) | modern | ✅ vivo, com `checkBidChartConsistency` |
| **Proposta Completa** (`ProposalPdfModule`) | ✅ Sim | `PdfDownloadButton` (L627) + Preview Dialog | `PdfPropostaCompleta` (v2 / proposta/pipeline) | modern | ✅ vivo, agregador |
| **Estratégias Patrimoniais** (`StrategyLibrarySection` / `ConsultiveStrategyPanel`) | ❌ **Não** | — | — | — | ⚠️ **órfão por design**; integrado apenas via `cmp-cash` no agregador |
| **Wealth Platform** (`WealthPlatformModule`) | ❌ **Não** | — | — | — | ⚠️ órfão, hub não exporta |
| **Análise** (`AnalysisModule`, hub que agrupa investment/comparator/bids) | ❌ Não no hub | — | — | — | ✅ ok (sub-abas exportam individualmente) |
| **Patrimonial** (`PatrimonialModule`) | ❌ Não | — | — | — | ⚠️ órfão |
| **Diagnóstico** (`DiagnosticModule`) | ❌ Não direto | — | — | — | ✅ ok (consumido pelos PDFs) |
| **Proposta (CRM)** (`ProposalModule`) | ❌ Não direto | usa share link + Proposta Completa | — | share-proposal edge | ✅ ok |
| **Histórico de Propostas** (`ProposalHistoryModule`) | ❌ Não | — | (lê `proposal-pdfs` cache via storage_path) | — | ✅ ok |
| **Carteira / Pipeline** | ❌ Não | — | — | — | ⚠️ sem export executivo |
| **Pós-venda** (`PostSaleModule`) | ❌ Não | — | — | — | ⚠️ sem export de relatório/follow-up |
| **Comunidade / Help / Objeções / Assembléias** | ❌ Não | — | — | — | ✅ ok (não justificam PDF) |
| **Proposta compartilhável** (`SharedProposalPage`) | n/a (HTML) | — | renderização HTML do `proposal-pdfs` via signed URL | share-proposal edge | ✅ vivo |

**6 templates de PDF reais, 5 entry-points de download distintos, 1 generator, 1 edge, 1 cache. 6+ módulos sem export.**

---

## PDF Flow Architecture Audit

```text
                        ┌─────────────────────────────────────────────┐
                        │           ENTRY-POINT (UI)                  │
                        │  PdfDownloadButton (Dialog: cliente + perfil│
                        │  gerente + logo → buildPdfElement(ctx))     │
                        └────────────────────┬────────────────────────┘
                                             │ React element
                                             ▼
                  ┌──────────────────────────────────────────────────────┐
                  │  utils/pdfGenerator.tsx                              │
                  │   - renderToHtmlString() → off-screen StrictMode     │
                  │     mount → coleta <link>/<style> + body innerHTML   │
                  │   - dual-read cache: registered → tenant → legacy    │
                  │   - withProposalMutex (anti double-submit)           │
                  │   - sharePdfFromElement (mobile Web Share API)       │
                  └────────────────────┬─────────────────────────────────┘
                                       │ HTML string
                                       ▼
              ┌──────────────────────────────────────────────────────────┐
              │  edge generate-pdf (Browserless)                         │
              │   - 2 endpoints: production-sfo → production-lon         │
              │   - 2 retries x backoff 500ms x endpoint                 │
              │   - JS off (sanitização + defense-in-depth XSS)          │
              │   - X-Pdf-Source: primary|fallback                       │
              └────────────────────┬─────────────────────────────────────┘
                                   │ application/pdf blob
                                   ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │  storage proposal-pdfs (RLS: companies/{cid}/proposals/{pid}/    │
        │     proposta.pdf OU legacy {uid}/{pid}.pdf)                      │
        │  table proposal_pdf_cache (invalidated by trigger on proposals)  │
        └──────────────────────────────────────────────────────────────────┘
```

**Engines/generators encontradas:** **1** (`generatePdfFromElement`). Não há html2pdf, não há jsPDF, não há pdfmake, não há reportlab. ✅ Sem geradores duplicados.

**Templates encontrados:** **6** (v1 × 4, v2 × 1 agregador, v1 PdfLayout × shared).
**Templates legados ressuscitáveis em `src/components/print/*`:** `PrintHeader`, `PrintFooter`, `PrintableParams` — **3 componentes de impressão CSS** **sem nenhum consumer no projeto** (`rg -l 'PrintHeader|PrintFooter|PrintableParams' src` retornou só os arquivos em si). **Dead code candidato.**

**Engines duplicadas:** ❌ Nenhuma.
**Pipelines mortos:** ⚠️ `src/components/print/*` (3 arquivos, ~80 linhas).
**Storage paths convivendo:** ✅ Intencional (`buildTenantPath` canônico + `buildLegacyPath` para dual-read de PDFs antigos).

---

## Design Consistency Audit

| Dimensão | v1 (`PdfLayout`) | v2 (`proposta/theme.ts` + `primitives.tsx`) | Diverge? |
|---|---|---|---|
| Tipografia base | `Inter, Helvetica, Arial`, **10pt**, color `#333` | `Inter, Helvetica, Arial`, **10.5pt**, color `#333` | ⚠️ tamanho base diferente (0.5pt) |
| Cor primária | `#0066B3` (azul Caixa) | `#0066B3` | ✅ |
| Cor accent | `#F7941E` (laranja Caixa) | `#F7941E` | ✅ |
| Headers | Header 3-col fixo (logo · módulo · cliente) + faixa laranja 2pt + subline gerente·agência·data | `Header` componente próprio em cada página (capa, abertura, miolo, fechamento têm 4 layouts distintos) | ⚠️ **dois sistemas de header coexistindo** |
| Footers | `PdfLayout` footer único (contato + disclaimer + data + nº página via `.pdf-page-number`) | `Footer` própria por página, sem numeração via CSS counter | ⚠️ **PDF v2 não numera páginas** |
| Margens | `max-width: 178mm` + padding 0 (Browserless aplica `@page margin`) | `padding: 28mm 22mm 22mm 22mm` na própria página + `@page margin: 20mm 16mm` no wrapper | ⚠️ **margens divergem entre templates** |
| Tabelas | `pdfStyles.table` + `th`/`td` 8pt | `PdfTable` primitive nova com tom diferente | ⚠️ visual distinto |
| Gráficos | `PdfBarChart`, `PdfPieChart`, `PdfComposedBidsChart` (compartilhados) | `PdfBarChart` reusado de `../primitives` | ✅ gráficos unificados |
| MetricCards | `PdfMetric` (v1) | `MetricCard` + `BigNumber` (v2) | ⚠️ componentes paralelos |
| Disclaimer | `DISCLAIMERS.PDF_LAYOUT_FOOTER` (config/copy) | `DISCLAIMERS.*` (config/copy) | ✅ copy unificada |

**Veredito visual:** os PDFs **parecem da mesma família** (mesma paleta, mesma fonte), mas um leitor atento percebe que **Proposta Completa é "mais polida"** (tipografia 10.5pt, kicker+title, narrativas, capa, MissingDataNote) e os outros 4 são "documentos técnicos" (tabelas densas, mesmo header repetido). **Não é incoerência grave, é assimetria de maturidade.**

---

## Strategic Module PDF Audit — Estratégias Patrimoniais

**Diagnóstico:** *o módulo NÃO exporta nada hoje.*

`StrategyLibrarySection.tsx` e `ConsultiveStrategyPanel.tsx` renderizam:
- Cards de tese (com ViabilityPreview / KPIs editorial/engine)
- Painel consultivo (Tese, "Estratégias principais" flagship, accordion DR-1/DR-2: applications/archetypes/whenNotToUse/patrimonialImpact/related)

**Nenhum desses conteúdos chega ao PDF.**

- `ProposalPdfModule` consome **apenas** `simulation`, `diagnostic`, `journey`, `investment`, `bidsStudy`. Não há context publisher para `WealthPlatform`/`StrategyLibrary`.
- Não há `ActiveStrategyContext` exposto na façade `useProposalData()` (só existe no runtime).
- O bloco `strategy-bid/income/sell` do agregador é **mecânico** (números do simulador + investimento), não traz **a tese narrativa** (ex.: "Multiplicação de Cotas", "Reforma + Autoquitação", flagship pitch, whenNotToUse).

**Por que não existe?** Falta de scope. Wealth/Patrimonial foi construído **depois** do agregador da Proposta Completa, e nenhuma onda promoveu a tese ativa a dado de PDF.

**Como deveria funcionar (recomendação):**
1. Estender `useProposalData()` com `activeStrategy` lido de `ActiveStrategyContext`.
2. Criar `StrategyThesisPage` em `proposta/pages/` (tese + pitch + flagship + 2-3 applications selecionadas + impacto patrimonial).
3. Adicionar bloco `strategy-thesis` em `PROPOSAL_BLOCKS` (category `comparison`, recommended se `activeStrategy` ≠ default).
4. **Não** criar PDF standalone para Estratégia Patrimonial — agregador é o lugar certo (V2 Constitution proíbe card/feature explosion).

---

## Complete Proposal Audit

**Bindings vivos (`ProposalPdfModule.buildData`):**

| Fonte | Como entra | Status |
|---|---|---|
| `useSimulatorInput()` + `useSimulatorResult()` | `simulation`, `monthlyScheduleSlim` | ✅ vivo |
| `useDiagnosticContextSafe()` | `diagnostic.*`, `defaultClientName` | ✅ vivo |
| `useClientJourneySafe()` | `recommendation`, `bidPercent` via `journey.slots.bidStrategy` | ✅ vivo |
| `useInvestmentResults()` | `investment.scenarios[]`, `bestStrategyId`, `incomeMonthly`, `saleProfit`, `contemplationMonth` | ✅ vivo (mas **`assumptions: null` hardcoded** — TODO/dívida) |
| `useBidsStudyResults()` | `bidsStudy.avgBid/minBid/maxBid/recommendedBid/groupNumber/monthsAnalyzed` | ✅ vivo |
| `useCentralAI()` → cache `getStorytelling()` | `storytellingText` (auto-gen via `useStorytellingAutoGen`) | ✅ vivo |
| `calculateFinancingCost` + `BUSINESS_RULES` | `comparisons.financingTotal/Monthly/Rate` | ✅ vivo |
| `compoundGrowth` + heurística 0,8% a.m. | `comparisons.cashImpact` (texto) | ⚠️ **divergente** do `useCashComparison` usado no Comparador.CashComparisonTab |

**Bindings quebrados / órfãos / faltando:**

| Conteúdo | Onde existe no app | Entra na Proposta? |
|---|---|---|
| Tese patrimonial ativa (`ActiveStrategyContext`) | Wealth/Patrimonial | ❌ não |
| Flagship + applications | StrategyLibrary | ❌ não |
| Compare Workspace Winner (CompareWorkspace) | Comparador V2 (até 3 estratégias) | ❌ não (só uma estratégia entra via slots) |
| KPIs executivos (engine vs editorial) | ViabilityPreview | ❌ não — PDF não distingue source |
| Estudo de Lances → cenários completos (projection curve, vantage status) | `BidsModule` (`projection`, `bidAnalysis`) | ⚠️ parcial — só 6 campos (`avgBid`, `minBid`, `maxBid`, `recommendedBid`, `groupNumber`, `monthsAnalyzed`) |
| Premissas do Investimento (cdiPercent, propertyAppreciation, rentalYield, analysisMonths) | `useInvestmentCalculations` | ⚠️ campo `assumptions` no payload existe mas é setado para `null` |
| Composição da parcela (insurance/admin/reserve breakdown) | `pdfPayload.composition` (usado no `PdfSimulador`) | ❌ não no agregador |
| Operações Estruturadas (multi-cartas) | `StructuredOperationsModule` | ❌ não no agregador (existe só seu PDF standalone) |

**Caminhos antigos que sumiram após refactor:**
- ✅ Não foi encontrada **referência morta** a contexts antigos. `ProposalDataContext` genérico já foi proibido (memória `arch/state/proposal-data-facade-canonica`).
- ✅ Façade `useProposalData()` em `src/contexts/proposal/index.ts` está canônica.
- ✅ Todos os 13 blocos em `PROPOSAL_BLOCKS` têm página correspondente em `proposta/pages/*`.

**Veredito:** *Proposta Completa **ainda representa o sistema do Simulador + Comparador (eixo 1) + Investimento + Bids**, mas **não representa o eixo Patrimonial/Wealth/CompareWorkspace V2 nem Operações Estruturadas multi-carta**. Não está quebrada — está **defasada em relação ao crescimento dos últimos meses**.*

---

## PDF Data Integrity Audit

**Auditado:** valores de impacto (`paga`/`acessa`) passam por `validateImpactValues` em modo `strict`; em `preview` aceita fallback.

**Pontos de divergência detectados:**

1. **`cmp-cash` (Proposta) vs Compra à Vista (Comparador/Investimento):**
   - Proposta usa `compoundGrowth(credit, 0.008, months)` (heurística 0,8% a.m. hardcoded em `ProposalPdfModule.tsx:181`).
   - `CashComparisonTab` + `InvestmentPdfActions mode="comparador" comparisonType="cash"` usa `useCashComparison()` com `cashInvestmentRate`/`cashCdiRate` parametrizados.
   - **Resultado: dois números diferentes para "Consórcio × À Vista" dependendo de onde o gerente exporta.** Dívida visível.

2. **`investment.assumptions` hardcoded `null`** (linha 260 do `ProposalPdfModule`): página de Premissas do Investimento (se existir) ou consumidores downstream recebem `null` sempre, mesmo quando o módulo Investimento tem premissas reais. **Bug latente.**

3. **`bidsStudy` no agregador**: só recebe 6 campos. `StructuredOperationsModule` e `BidsModule` standalone exportam **projeção completa**, recomendação ativa, vantage status. Agregador exibe **menos** que o PDF dedicado do mesmo estudo. Inconsistência de profundidade.

4. **Cálculo financeiro (Price/SAC/CET):** ✅ `calculateFinancingCost` usa engine canônica `@/core/finance/financing`. Sem divergência.

5. **Schedule mensal:** ✅ `monthlyScheduleSlim` lê direto de `sim.monthlySchedule.rows` (motor atuarial). Sem recálculo.

6. **Storytelling:** ✅ híbrido (cache → default determinístico). Não há texto antigo hardcoded.

**Sem divergência detectada:** parcela, totalCost, effectiveClientCost, freeBid/embeddedBid, comparativo financiamento, CET.

---

## PDF UX Audit

**Pontos fortes:**
- ✅ `MissingDataNote` em cada página da Proposta Completa — sem página em branco, sem silêncio.
- ✅ Margens A4 corretas (`@page size: A4; margin: 20mm 16mm`), `[data-pdf-page]` com `page-break-after: always` exceto último.
- ✅ `break-inside: avoid` aplicado em `PAGE` via `minHeight: 297mm` + flex.
- ✅ Browserless com JS off → zero risco de overflow dinâmico.
- ✅ Mobile: `sharePdfFromElement` usa Web Share API; download desktop usa `Blob`.

**Pontos fracos / riscos:**
- ⚠️ **Numeração de páginas**: existe `.pdf-page-number` placeholder no `PdfLayout` v1 mas o conteúdo está vazio (`&nbsp;`). v2 (Proposta Completa) **não tem numeração nenhuma**. Documento de 12+ páginas sem paginação visível em rodapé.
- ⚠️ **Tabelas longas** (ex.: `monthlyScheduleSlim` de 200 meses): não vi `break-inside: avoid-page` em linhas individuais. Pode haver corte de linha entre páginas em PDFs do Simulador.
- ⚠️ **Header repetido**: nos PDFs v1 (PdfLayout) o header aparece **apenas na primeira página** porque a renderização é uma única árvore HTML com `@page margin`. Em documentos longos, página 5 não tem cabeçalho — pode confundir.
- ⚠️ **Logos com alpha alto** podem renderizar fundo escuro sobre paper white. `sanitizeLogoDataUrl` valida tipo mas não composita fundo.
- ✅ Truncamento de números resolvido em telas (KPI Value Layout Recovery Pass) — **não afeta PDF**.

---

## Export Governance Audit

| Eixo | Estado | Nota |
|---|---|---|
| Quem pode exportar | Qualquer usuário autenticado | ✅ RLS aplicada no bucket por `companies/{cid}` ou `{uid}/`. Sem leak cross-tenant detectado. |
| Onde salva | `proposal-pdfs` bucket (privado) | ✅ canônico via `resolveWritePath()` |
| Retenção | Sem TTL configurado | ⚠️ Aderente a "LGPD: sem política formal" da auditoria enterprise. Não há job de purge. |
| URLs | Signed URLs efêmeras via edge `share-proposal` | ⚠️ Sem expiração obrigatória configurável centralmente, sem revogação por painel. Coberto parcialmente por `share_token_expires_at` + `share_token_revoked_at` em proposals. |
| Naming | `buildPdfFilename(moduleName, clientName)` padronizado | ✅ + `sanitizePdfFilename()` defense-in-depth |
| Lifecycle | Cache invalidado por trigger em `proposals` UPDATE (campos relevantes) | ✅ |
| Duplicação | Mesmo `proposalId` reusa cache; mutex `withProposalMutex` previne corrida | ✅ |
| Audit log | `logAction('generate_pdf', metadata)` + `trackEvent('pdf_generated')` | ✅ |
| Rate limit | Server-side via classifyPdfError(429) com retry/backoff client | ✅ |
| Anti-XSS | Sanitização HTML + JS off no Browserless | ✅ |
| Watermark | ❌ Inexistente | ⚠️ Bloqueador apontado pela auditoria enterprise corporativa |

---

## PDF Architecture Consolidation Audit

**Existe uma arquitetura PDF canônica?**

**RESPOSTA: Parcialmente.**

- ✅ **Runtime**: 1 generator (`generatePdfFromElement`), 1 edge (`generate-pdf`), 1 cache (`proposal-pdfs` + `proposal_pdf_cache`), 1 botão (`PdfDownloadButton`), 1 mutex (`withProposalMutex`), 1 helper de paths (`pdfPipelineHelpers`).
- ⚠️ **Composição visual**: 2 sistemas.
  - **v1** (PdfLayout + pdfStyles + primitives.tsx) — usado por Simulador, Comparador, Estudo de Lances, Operações Estruturadas, Investimento, Compra à Vista.
  - **v2** (proposta/theme + proposta/primitives + proposta/pipeline) — usado apenas por Proposta Completa.

Ambos chegam ao mesmo Browserless via mesmo `renderToHtmlString`. **A divergência é puramente de templates React, não de runtime.**

**Conclusão:** o sistema tem **um runtime canônico** e **dois dialetos de template**. Não é desastre, mas não é unificado.

---

## Broken PDF Flows

Nenhum **flow quebrado** encontrado. Todos os 5 entry-points testáveis renderizam e geram PDF válido.

**Risco latente** (não broken, mas frágil):
- Se o usuário gerar Proposta Completa **sem ter aberto Investimento na sessão**, `investment` é `null` e blocos `strategy-income`/`strategy-sell` **somem silenciosamente** (apenas log warn). UX cobre com alerta de "blocos serão omitidos" — comportamento intencional, mas só funciona se o usuário ler o alerta.

---

## Orphan PDF Systems

1. **`src/components/print/*` (`PrintHeader`, `PrintFooter`, `PrintableParams`)** — **dead code**. Nenhum import encontrado. Provavelmente vestígio de tentativa anterior de `window.print()` antes do Browserless. **~80 linhas removíveis.**
2. **Numeração de páginas (`.pdf-page-number`)** — placeholder com `&nbsp;` em `PdfLayout`. CSS counter nunca foi implementado no edge `generate-pdf`. **Feature deixada pela metade.**

---

## Legacy PDF Pipelines

Histórico (confirmado via memória `infra/pdf/geracao-via-browserless`): **html2pdf foi substituído por Browserless**. Memória explicita "proibido reintroduzir html2pdf como fallback".

Verificação atual: ✅ nenhum import de `html2pdf` ou similar em `src/`.

---

## Critical Problems

1. **🔴 Divergência "Consórcio × À Vista"** — duas implementações (Proposta usa heurística 0,8% a.m. hardcoded; Comparador/Investimento usa `useCashComparison` parametrizado). **Cliente recebe números diferentes do mesmo conceito** dependendo de qual PDF baixou. Compromete confiança.
2. **🔴 `investment.assumptions: null` hardcoded** — premissas do Investimento nunca chegam ao PDF, mesmo quando existem. Quando alguém adicionar `AssumptionsPage`, vai vir vazio.
3. **🟠 Wealth/Patrimonial fora do agregador** — toda a evolução V2 (DR-1/DR-2, flagship, Compare Workspace, KPI source governance) **não aparece na Proposta Completa**. Gerente que vendeu via tese patrimonial entrega PDF "antigo".
4. **🟠 Operações Estruturadas standalone** — multi-cartas existe como PDF dedicado mas **não integra na Proposta Completa**. Cliente vê só uma carta.
5. **🟠 Duplicação Compra à Vista** — botão exportar aparece em 2 lugares (Comparador.CashComparisonTab e Investimento.compra-vista) — risco de gerente exportar 2 vezes com layouts diferentes.

---

## Urgent Fixes

| # | Fix | Esforço | Impacto |
|---|---|---|---|
| U1 | Unificar `cashImpact` da Proposta usando `useCashComparison` (mesma fonte do Comparador) | S | Para divergência de números |
| U2 | Popular `investmentMirror.assumptions` a partir de `investment.assumptions` real (não null) | XS | Destrava futuras páginas de premissas |
| U3 | Remover `src/components/print/*` (dead code) | XS | Cleanup |
| U4 | Adicionar nº de página no rodapé (CSS counters via Browserless `printBackground`) — viabilidade técnica testada via `counter(page)` em `@page { @bottom-right }` | S | UX premium |
| U5 | Decidir e documentar **qual** dos dois entry-points de Compra à Vista é canônico (remover o outro botão) | XS | Para duplicação |

---

## Consolidation Plan

### Onda 1 — Saneamento (1-2 dias)
- Fix U1 (cashImpact unificado).
- Fix U2 (assumptions hardcoded).
- Fix U3 (remoção `print/*`).
- Fix U5 (remover botão duplicado de Compra à Vista).

### Onda 2 — Cobertura (3-5 dias)
- Adicionar `ActiveStrategyContext` à façade `useProposalData()`.
- Criar `proposta/pages/StrategyThesisPage.tsx` (tese + flagship + applications).
- Adicionar bloco `strategy-thesis` em `PROPOSAL_BLOCKS` (category `comparison`, recommended quando `activeStrategy.id !== default`).
- Criar `proposta/pages/StructuredOpsPage.tsx` consumindo `useStructuredOpsResults` (novo Producer Context).
- Adicionar bloco `structured-ops` em `PROPOSAL_BLOCKS`.

### Onda 3 — UX premium (2-3 dias)
- Numeração de páginas (CSS counter) + paginação no `Header` v2.
- `break-inside: avoid` em linhas de tabelas longas.
- Repetir cabeçalho a cada página dos PDFs v1 (via `position: running` ou repetição manual a cada N linhas).
- Watermark opcional (atende auditoria enterprise).

### Onda 4 — Convergência de templates (1-2 semanas, opcional)
Decisão estratégica: **manter os dois templates** OU **promover v2 (`proposta/*`) como template universal** e migrar Simulador/Comparador/Bids/StructuredOps para `pageIf`-style.

- Vantagem da convergência: 1 sistema visual, 1 conjunto de primitives, 1 tema, 1 narrativeContext.
- Custo: refazer 4 PDFs sem mudar dados.
- Recomendação: convergir **somente quando** for necessário um novo template (não refatorar pelo refator).

### Onda 5 — Governança LGPD / Enterprise (depende da auditoria enterprise)
- TTL configurável + job de purge no bucket `proposal-pdfs`.
- Watermark gerado server-side (gerente.email + timestamp).
- Revogação centralizada de share tokens.

---

## Final System Document Integrity Verdict

**O sistema documental hoje possui: arquitetura runtime canônica e madura, mas múltiplos templates evoluindo separadamente, com cobertura desigual entre módulos.**

- **NÃO é**: um caos de PDFs antigos, geradores duplicados, ou flows quebrados. O runtime é sólido (Browserless + cache + retry + mutex + dual-read + RLS + audit log).
- **NÃO está**: pronto para representar a totalidade do produto V2.4 — Wealth/Patrimonial, Compare Workspace V2 e Operações Estruturadas estão fora do agregador.
- **ESTÁ**: em estado de **convergência parcial** — runtime unificado em 2025, templates ainda em 2 dialetos (v1 técnico + v2 narrativo), agregador defasado em ~3 ondas de produto.

**Proposta Completa AINDA representa o sistema atual? Resposta direta: SIM para o eixo Simulação + Investimento + Bids; NÃO para Patrimonial + CompareWorkspace + StructuredOps.**

**Saúde geral: 7.5/10.** Não exige refatoração arquitetural — exige **U1+U2 imediatos** (corrige divergência de número, que é o único problema que **machuca o cliente final**) e **Ondas 2-3** para alinhar cobertura à evolução do produto.

**Recomendação executiva:** *aplicar Onda 1 esta semana; Onda 2 após decisão de scope com produto sobre quais blocos patrimoniais entram no agregador; Onda 4 (convergência de templates) só quando houver gatilho real de negócio. Não convergir por estética.*

