# Compra à Vista Repositioning Pass

Reposicionamento semântico da estratégia **Compra à Vista** — da biblioteca de
**Estratégias Patrimoniais** (camada operacional) para o módulo **Comparador**
(camada de modelos financeiros concorrentes), junto de *Consórcio × Financiamento*
e *Consórcio × Outro Consórcio*.

Nenhum cálculo, constante, fórmula, comparativo ou disclosure foi alterado.
Apenas o **slot cognitivo** mudou.

---

## Safe Extraction Validation

Antes do pass, `compra-a-vista` vivia exclusivamente em
`StrategyLibrarySection.tsx`, renderizado por `STRATEGY_LIBRARY_ORDERED` com um
branch interno `isCashStrategy` que invertia a hierarquia editorial do dialog.

Ações:

- ✅ A entrada em `STRATEGY_LIBRARY` (data canônica) **permanece intocada** —
  passa a ser consumida pelo Comparador como fonte única.
- ✅ A grade da biblioteca filtra `s.id !== 'compra-a-vista'` em
  `orderedStrategies` (única linha funcional alterada em `StrategyLibrarySection`).
- ✅ Branches `isCashStrategy` no `StrategyDetailDialog` ficam dormentes (sem
  reach), mas continuam compilando — zero código órfão exposto ao usuário.
- ✅ `strategyContextScoring.ts` segue referenciando o id em arrays de boost —
  inofensivo, pois a estratégia simplesmente não aparece na grade. Sem ghost
  state, sem erro de lookup, sem ranking quebrado.
- ✅ `strategyExecutiveKpis`, `strategyExplanationEnhancements`,
  `strategyDecisionSupport` mantêm entradas para `compra-a-vista` — reusadas
  pelo Comparador para `getCalcMeaning` / `getComparisonWhy`.

Zero imports quebrados. Zero contracts quebrados. Zero engine quebrada.

---

## Comparator Integration

Novo componente: `src/components/modules/comparator/CashComparisonTab.tsx`.

- Consome `STRATEGY_LIBRARY.find(s => s.id === 'compra-a-vista')` — **mesma**
  fonte da antiga renderização patrimonial.
- Reusa `getCalcMeaning` e `getComparisonWhy` (camada de explicações premium).
- Lê `creditValue` via `useSimulatorInput()` — mesmo crédito da grade
  patrimonial, com fallback `R$ 300.000` idêntico ao da biblioteca.
- Renderiza, em ordem: header consultivo → `CalculationsBlock` →
  `ComparisonsBlock` (mesma hierarquia simulação-first do realinhamento
  anterior).

Em `ComparatorModule.tsx`:

- `TabsList` passa de `grid-cols-2` → `grid-cols-3`.
- Nova `TabsTrigger value="cash"` posicionada **entre** `financing` e
  `consortium` — leitura cognitiva natural (Financiamento → Compra à Vista →
  Outro Consórcio).
- `comparisonType === 'cash'` renderiza `<CashComparisonTab />`.
- `comparisonLabels.cash` já existia (`"Consórcio vs Compra à Vista"`) — pronto
  para `PrintHeader`.

---

## Canonical Engine Preservation

| Camada | Antes | Depois |
|---|---|---|
| `STRATEGY_LIBRARY['compra-a-vista']` | fonte única | fonte única (idêntica) |
| Constantes `CV_*` (carta, lance, prazo, CDI, IR) | em `strategyLibraryData.ts` | em `strategyLibraryData.ts` |
| `computeAdminFee` / `computeReserveFund` / `computeBaseCost` / `computeFullInstallment` / `compoundGrowthAnnualMonthly` | `@/core/finance` | `@/core/finance` |
| `strategy.calculations[i].result(credit)` | invocado pelo dialog | invocado pelo tab |
| `strategy.comparisons` | renderizado pelo dialog | renderizado pelo tab |

Zero recálculo. Zero math duplicada. Zero versão paralela. Zero fonte nova.

---

## Strategy Library Cleanup

- `STRATEGY_LIBRARY_ORDERED.filter((s) => s.id !== 'compra-a-vista')` em
  `orderedStrategies` (única mudança visível na grade).
- A grade patrimonial passa de 24 → 23 cards (sem hole visual — `auto-rows-fr`
  e `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` absorvem naturalmente).
- Nenhum card órfão, nenhum botão morto, nenhum CTA quebrado.
- Bookmarks/links profundos que apontassem para o dialog do card removido
  não existiam (dialog interno, sem rota).
- `STRATEGY_LIBRARY` (export bruto) permanece com 24 entradas — necessário
  porque o Comparador agora depende da entrada `compra-a-vista`.

---

## Comparative Hierarchy Validation

Antes:

```
Estratégias Patrimoniais
├── Compra à Vista          ← anomalia semântica (comparativo dentro de operacional)
├── Compra Híbrida
├── Reforma
├── Energia Solar
├── Multiplicação de Cotas
└── … (20 demais)
```

Depois:

```
Comparador                                Estratégias Patrimoniais
├── vs Financiamento                      ├── Compra Híbrida
├── vs Compra à Vista   ← novo            ├── Reforma
└── vs Outro Consórcio                    ├── Energia Solar
                                          ├── Multiplicação de Cotas
                                          └── … (19 demais)
```

Compra à Vista agora é percebida como **modelo financeiro concorrente** —
mesma família semântica de Financiamento e Outro Consórcio.

---

## Mobile Validation

- `TabsList grid-cols-3` cabe confortavelmente a partir de 320px com
  `text-xs sm:text-sm whitespace-normal` (labels já curtos: *vs Financiamento*,
  *vs Compra à Vista*, *vs Outro Consórcio*).
- `CashComparisonTab` mantém o padrão da biblioteca: card-stack `< md`,
  tabela `≥ md` com `overflow-x-auto`.
- Disclosure curto no header (essência em 1 linha) preserva scroll mobile.
- Crédito de referência aparece com `border-l-2 border-primary/40 pl-3` quando
  o simulador está vazio — mesma convenção da biblioteca patrimonial.

---

## Zero Regression Validation

| Eixo | Status |
|---|---|
| Engine financeira (`@/core/finance`) | inalterada |
| Constantes (`@/config/consortiumRates`, `CV_*`) | inalteradas |
| Fórmulas das 8 linhas de `calculations` | inalteradas |
| 5 linhas de `comparisons` (Compra à Vista) | inalteradas |
| Demais 23 estratégias patrimoniais | renderização e ordering inalterados |
| Comparador `financing` / `consortium` | renderização inalterada |
| Simulador | sem toque |
| PDF (`PdfAnaliseFinanceira` mode comparador) | data shape preservada |
| `strategyContextScoring` | preserva ids (boost dormente, inofensivo) |
| Testes financeiros (golden snapshots) | sem impacto (UI-only) |

---

## Cognitive Architecture Validation

Mensagem mental do usuário, antes vs depois:

| Pergunta do usuário | Resposta cognitiva | Local |
|---|---|---|
| "Compro à vista ou faço consórcio?" | **Comparador → vs Compra à Vista** | Modelos financeiros |
| "Financio ou faço consórcio?" | **Comparador → vs Financiamento** | Modelos financeiros |
| "Qual consórcio é melhor?" | **Comparador → vs Outro Consórcio** | Modelos financeiros |
| "O que faço com o consórcio?" | **Estratégias Patrimoniais** | Teses operacionais |

Linha mental clara:

> **Comparador** responde *"que modelo escolher?"*
> **Estratégias Patrimoniais** responde *"o que fazer com o modelo escolhido?"*

Compra à Vista deixa de ser um outlier semântico na biblioteca patrimonial e
passa a ocupar exatamente o slot mental correto.

---

## Final System State

**Arquivos criados:**
- `src/components/modules/comparator/CashComparisonTab.tsx`
- `.lovable/audit/compra-a-vista-repositioning-pass.md`

**Arquivos editados (mínimo cirúrgico):**
- `src/components/modules/ComparatorModule.tsx` — import + 3ª aba + render branch.
- `src/components/modules/wealth/StrategyLibrarySection.tsx` — `orderedStrategies`
  filtra `compra-a-vista` (uma linha funcional).

**Não tocados (preservação obrigatória):**
- `src/components/modules/wealth/strategyLibraryData.ts`
- `src/components/modules/wealth/strategyExplanationEnhancements.ts`
- `src/components/modules/wealth/strategyDecisionSupport.ts`
- `src/components/modules/wealth/strategyExecutiveKpis.ts`
- `src/components/modules/wealth/strategyContextScoring.ts`
- `src/components/modules/wealth/WealthPlatformModule.tsx`
- `src/components/modules/comparator/FinancingComparisonTab.tsx`
- `src/components/modules/comparator/ConsortiumComparisonTab.tsx`
- `src/core/finance/**`
- Simulador, PDF, edges, governança, memória.

---

## Final Verdict

✅ **Repositioning concluído.**

Compra à Vista agora aparece **naturalmente** dentro do Comparador, lado a lado
com Financiamento e Outro Consórcio — três modelos financeiros concorrentes
para a mesma decisão de aquisição. A biblioteca patrimonial volta a ser uma
coleção coerente de **teses operacionais** (Multiplicação, Reforma, Solar,
Frota, Holding, etc.) sem o outlier comparativo que distorcia sua semântica.

Zero regressão financeira, zero duplicação, zero perda de conteúdo, zero
quebra perceptiva. Resultado cognitivo: leitura instantânea da arquitetura
do sistema.
