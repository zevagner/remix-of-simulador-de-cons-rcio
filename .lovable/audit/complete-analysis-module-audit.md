# Complete Analysis Module Audit

> Auditoria estratégica do módulo **Análise** e de todos os seus submódulos.
> Modo: **leitura profunda + crítica**. Nada foi modificado, refatorado ou corrigido.
> Baseline: V2 LOCKED FOR PRODUCTION · Plataforma Patrimonial · Edição Consultiva.
> Escopo: `src/components/modules/AnalysisModule.tsx`, `analysis/*`, `wealth/*`,
> `strategy-v2/*`, `investment/*`, `patrimonial/*`, `comparator/*`, `bids/*`,
> `structured-ops/*`, `assemblies/*`, `core/finance/*`, hooks correlatos.

---

## Executive Summary

O módulo Análise está **estruturalmente coeso, financeiramente confiável e perceptivamente
estabilizado**. A V2 entregou o que prometeu:

- **Motor financeiro único** em `src/core/finance` (financing, installments, insurance,
  prestamista, investment) — sem duplicação de fórmulas em UI.
- **Unificação patrimonial bem-sucedida**: `WealthPlatformModule` substitui visualmente
  Investimentos + Patrimonial, consumindo `InvestmentResultsContext.presentations` +
  `usePatrimonialKpis()` sem recalcular.
- **Compare Workspace cross-intent** funcional, com `COMPARE_MAX=3` respeitado.
- **Cockpit Consultivo** disciplinado (hub de roteamento, não dashboard).
- **Submódulos legados (Investimento, Patrimonial)** mantidos como rotas "headless"
  com allowlist explícita — bom para deep-links sem poluir sidebar.

Riscos **não-críticos** detectados (sem ação imediata recomendada):

1. **Carga conceitual residual**: o usuário ainda enxerga *Cockpit + Estratégias
   Patrimoniais + Comparador + Lances + Assembleias* como 5 caminhos paralelos.
   A V2 unificou estratégias mas não unificou *narrativa* dos 5 capítulos.
2. **`Cockpit Consultivo` está em zona cinza**: ainda essencial enquanto roteador
   da venda, mas seu valor cai à medida que `WealthPlatformModule` cresce.
3. **`ComparatorModule`** (consórcio×financiamento) e o **Compare Workspace**
   (estratégias patrimoniais) compartilham vocabulário ("Comparador") sem
   compartilhar conceito — overlap **linguístico**, não funcional.
4. **`AssembliesModule`** é renderizado em 2 lugares (subaba do Análise +
   seção interna do `BidsModule` "Histórico do grupo") — redundância tolerável,
   porém merece monitoramento.
5. **`InvestmentModule` (850 linhas)** segue como módulo gordo apesar de estar
   coberto pelo `WealthPlatformModule`. É a maior dívida estrutural restante.

**Veredito**: Análise está **APROVADA para produção**. Nenhum risco financeiro,
nenhuma fórmula divergente, nenhuma quebra arquitetural. Há **3 rationalizations
recomendadas para uma futura onda** (não para agora).

---

## Full Module Mapping

### Container

`AnalysisModule.tsx` (223 LOC) — orquestrador puro:
- Tabs com renderização condicional via `hidden` (preserva estado entre trocas).
- Lazy import de todos os submódulos + `requestIdleCallback` preload.
- `usePersistLastTab(MODULE_KEYS.analysis)`.
- Suprime `ModuleHeader` quando `tab === WEALTH` (hero editorial próprio).

### Submódulos registrados (`ANALYSIS_TABS`)

| ID            | Componente                       | LOC  | Visível na sidebar | Status |
|---------------|----------------------------------|------|--------------------|--------|
| `OVERVIEW`    | `AnalysisOverview`               | 341  | sim — "Cockpit Consultivo" | Ativo |
| `WEALTH`      | `WealthPlatformModule`           | 483  | sim — "Estratégias Patrimoniais" | Ativo · canônico |
| `INVESTMENT`  | `InvestmentModule`               | 850  | **headless allowlist** | Legado vivo (deep-links/CTAs) |
| `PATRIMONIAL` | `PatrimonialModule`              | n/d  | **headless allowlist** | Legado vivo (deep-links/CTAs) |
| `COMPARATOR`  | `ComparatorModule`               | 406  | sim — "Comparador" | Ativo |
| `BIDS`        | `BidsModule`                     | 292  | sim — "Estudo de lances" | Ativo |
| `ADVANCED`    | `StructuredOperationsModule`     | 266  | **headless** (CTA cockpit ≥ R$500k) | Ativo |
| `ASSEMBLIES`  | `AssembliesModule`               | 104  | sim — "Assembleias" + embed em Bids | Ativo (com overlap) |

### Pontos de entrada

- **Sidebar** → 5 itens (Cockpit, Estratégias, Comparador, Lances, Assembleias).
- **Cockpit Consultivo** → CTA contextual para `ADVANCED` (carta ≥ R$500k).
- **BidsModule** → embed lazy de `AssembliesModule` em "Histórico do grupo".
- **Deep-links / CTAs legados** → `investment` e `patrimonial` (allowlist).

### Componentes compartilhados (V2)

- `strategy-v2/`: `ExecutiveStrategyCard`, `ConsultiveStrategyPanel`,
  `CompareWorkspace`, `CompareSelectionContext`, `adapters`, `blueprint`,
  `contracts`, `tokens`, `telemetry`.
- `shared/`: `ConsultiveBridge`, `RecommendationCard`.
- `AIInsightsPanel`, `AnalysisCopilot`, `JourneyGuideBanner`.

### Contexts e fontes de dados

| Context                                | Produtor                  | Consumidores no Análise |
|----------------------------------------|---------------------------|-------------------------|
| `SimulatorContext`                     | `SimulatorModule`         | TODOS (Cockpit, Wealth, Investment, Comparator, Bids, Structured) |
| `InvestmentResultsContext`             | `InvestmentModule`        | `WealthPlatformModule` (sem recálculo) |
| `BidsStudyContext`                     | `BidsModule`              | `ProposalPdfModule`, façade `useProposalData` |
| `SelectedGroupContext`                 | fonte única tipo+grupo    | `BidsContext`, `AssembliesContext` |
| `DiagnosticContext`                    | `DiagnosticModule`        | Cockpit (`buildSuggestions`) |
| `ClientJourneyContext`                 | layout                    | Cockpit (`applyBidFromStudy → slots`) |

### Mapa visual (ASCII)

```text
                            ┌─────────────────────────┐
                            │   SimulatorContext      │  (fonte única)
                            └────────────┬────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              ▼                          ▼                          ▼
     ┌────────────────┐         ┌────────────────┐         ┌────────────────┐
     │ AnalysisModule │         │ InvestmentMod. │ ──prod─▶│ Investment     │
     │  (container)   │         │  (850 LOC)     │         │ ResultsContext │
     └───┬────┬───┬───┘         └────────┬───────┘         └────────┬───────┘
         │    │   │                      │                          │
         ▼    ▼   ▼                      └──────────► WealthPlatformModule
   Cockpit Bids Comparator                              (consumer puro)
   Overview │  (motor finance)
            ▼
       Assemblies (embed)                ── BidsStudyContext ──▶ PDF/Proposta
```

---

## Financial Calculation Audit

### Fonte única confirmada

`src/core/finance` é a entrada única:
- `financing/` (price, sac, cet) — auditado em Onda B2.
- `installments/` — pipeline canônico Onda B3 (`calculateSimulation` virou orquestrador).
- `internal/monthlySchedule.ts` + `reconcile.ts` — motor mensal atuarial.
- `insurance/`, `prestamista/`, `investment/` — engines especializados.

ESLint hoje **alerta** importação direta de `@/utils/calculations*` (warn em Onda 0,
deve virar error em Onda 5). Único survivor legítimo: `src/utils/calculations/{investimento,lances}.ts`
ainda referenciados — porém são wrappers finos sobre `core/finance/investment` e
`utils/bidAnalysis/*`.

### Consistência verificada por testes (já no repo)

- `installmentSingleSourceOfTruth.test.ts` — drift zero parcela canônica.
- `comparatorEngineParity.test.ts` — Comparator usa motor mensal canônico.
- `crossModuleConsistency.test.ts` — Investimento × Simulador.
- `prestamistaCrossModuleConsistency.test.ts`
- `financingEngineParity.test.ts` (Onda B2)
- `simulationResultGoldenSnapshot.test.ts` (Onda B3)
- `monthlyScheduleAdjustment.test.ts`, `baseScheduleInvariance.test.ts`,
  `insuranceToggle.test.ts`, `postContemplationChoiceCoherence.test.ts`

### Comparator — análise pontual

`ComparatorModule` agora chama `calculateSimulationLegacy + calculateMonthlySchedule
+ reconcileWithSchedule` exatamente como o `SimulatorContext`. Toggle INCC/IPCA
propaga `annualAdjustmentPercent`; toggle TR no financiamento via parâmetro do
`calculateFinancingCost`. **Custo efetivo** = `consortiumResult.totalCost + lances`
(livre+embutido). Representação consultiva (`custoDesembolsado`, `creditoLiquido`,
`custoEfetivoReal`) é **descrição derivada**, não recálculo paralelo.

### Bids — análise pontual

`BidsContext` consome `SelectedGroupContext` (fonte única tipo+grupo), aplica
parâmetros adaptativos de volatilidade (memorizados) e expõe `bidAnalysis` (avg/min/max/recommended em % do crédito) para o `BidsStudyContext`. `BidsHeroInsight`,
`BidsZonesCard`, `BidAIRecommendation` são consumidores puros. Sem cálculo
duplicado.

### Investment — análise pontual

`useInvestmentCalculations` (410 LOC) é o **único** ponto de cálculo dos 6
paths/cenários (split de hot paths já registrado em memória). `InvestmentModule`
**publica** os resultados em `InvestmentResultsContext` e o `WealthPlatformModule`
**consome** sem recalcular. Comportamento conforme arquitetura V2.

### Structured Ops — análise pontual

`StructuredOperationsModule` cria N cards de crédito, cada um passa por
`calculateCardResult` (`structuredOpsConstants.ts`), que delega a primitivas
de `core/finance` (parcela, juros, lance, prestamista). Sem motor paralelo.
Persistência local-only via `STORAGE_KEY = 'structured-ops-last-session'`.

### Divergências matemáticas detectadas

**Nenhuma**. As tolerâncias documentadas (`mem://logic/simulador/divergencia-
motores-tolerancias`) entre motor mensal e legado são esperadas (seguro atuarial)
e cobertas por teste.

### Fórmulas redundantes

**Nenhuma duplicação ativa**. Wrappers em `src/utils/calculations/` são finos e
estão sob ESLint warn rumo a deprecação na Onda 5 (alvo planejado).

### Arredondamento / inputs / outputs

- Todas as moedas via `formatCurrency` (`@/core/finance`).
- Taxas anuais → mensais via composta `((1+i)^(1/12)-1)` (core memory rule).
- TR/INCC/IPCA injetados como parâmetros explícitos (`annualAdjustmentPercent`,
  `trMonthlyRate`), nunca hardcoded.

---

## Integration Audit

### Estado compartilhado — sincronia

| Sincronização                         | Status | Notas |
|---------------------------------------|--------|-------|
| Simulador → Cockpit                   | ✅     | `useSimulatorResult` consumido direto |
| Simulador → WealthPlatform            | ✅     | via `InvestmentResultsContext` |
| Simulador → Comparator                | ✅     | mesmo motor mensal |
| Simulador → Bids (parâmetros)         | ✅     | `applyBidFromStudy` integra |
| Bids → Simulador (deep-link)          | ✅     | `applyBidFromStudy` + `journey.updateSlots` |
| Bids ↔ Assemblies                     | ✅     | via `SelectedGroupContext` |
| Diagnostic → Cockpit                  | ✅     | `useDiagnosticContextSafe` em `buildSuggestions` |
| ClientJourney slots                   | ✅     | `bidStrategy` atualizado em apply |
| InvestmentResults → Wealth            | ✅     | consumer-only |

### Pontos de atenção

- **`Cockpit` e `WealthPlatform` não conversam diretamente**: o Cockpit sugere
  "Avaliar operação patrimonial" mas direciona para `INVESTMENT` (legado headless)
  em vez de `WEALTH`. Inconsistência narrativa — não funcional (a aba INVESTMENT
  permanece roteável), mas merece ser corrigida em onda futura.
- **`Comparator` (consórcio×financiamento)** e o **Compare Workspace** (estratégias
  patrimoniais) usam o termo "Comparar" com semânticas diferentes — ver Redundancy.

### Módulos isolados

- `AssembliesModule` está **duplamente integrado** (subaba + embed em Bids).
  Não há context drift — `SelectedGroupContext` é fonte única.

### Integrações quebradas

**Nenhuma detectada**.

---

## Redundancy Audit

### Classificação por categoria

| Item                                     | Tipo          | Severidade |
|------------------------------------------|---------------|------------|
| `InvestmentModule` legado vs `WealthPlatformModule` | UX/produto | **Problemática** |
| `PatrimonialModule` legado vs `WealthPlatformModule` | UX/produto | **Problemática** |
| `AssembliesModule` em 2 lugares (subaba + embed Bids) | Navegação | **Aceitável** |
| `Comparator` (consórcio×financ.) vs `Compare Workspace` (estratégias) | Léxico | **Aceitável** (semânticas diferentes; merece label distinto) |
| `AIInsightsPanel` no Cockpit (details) + `AnalysisCopilot` proativo | Narrativa | **Saudável** (já anti-duplicado por `triggers.fired`) |
| Cards de KPI (Cockpit) vs KPIs do Simulador | UX | **Saudável** (Cockpit não replica KPIs — link "Ver simulação completa") |
| Cálculo financeiro fora de `core/finance` | Cálculo | **Inexistente** |

### Detalhes da redundância problemática

**`InvestmentModule` (850 LOC) é o maior risco arquitetural restante.** Foi
**absorvido visualmente** por `WealthPlatformModule` mas continua:
1. Sendo a única fonte produtora do `InvestmentResultsContext` (necessário).
2. Vivendo como rota acessível via deep-link (`ANALYSIS_HEADLESS_ALLOWLIST`).
3. Mantendo UI completa própria (`InvestmentStrategyTab`, `InvestmentScenariosV2`,
   `StrategicNicheCards`, `CashComparisonTab`, `ConsortiumDataCard`,
   `InvestmentPdfActions`, `InvestmentPrintBlock`, etc).

O *produtor de dados* (use of `useInvestmentCalculations` + publish no Context)
**precisa permanecer**. A **UI integral** do `InvestmentModule` é o que está
duplicado — eventualmente pode ser reduzido a um "headless data producer"
+ uma página fina de fallback para deep-links.

`PatrimonialModule` sofre da mesma condição com perfil mais leve.

---

## Consultive Value Audit

| Submódulo               | Utilidade consultiva | Profundidade | Valor único |
|-------------------------|----------------------|--------------|-------------|
| Cockpit Consultivo      | **Alta** (entrada) | Média | Roteamento + 1ª frase para o cliente |
| Estratégias Patrimoniais (Wealth) | **Crítica** | **Alta** | Curadoria editorial + compare cross-intent |
| Comparador (consórcio×financ.) | **Alta** | Alta | Único lugar que faz a conta justa lado a lado |
| Estudo de lances        | **Crítica** | **Alta** | Diferencial competitivo do produto |
| Assembleias             | **Alta** | Alta | Prova social (histórico real) |
| Op. Estruturadas        | **Nichada** | Muito alta | Carta ≥ R$500k — vale CTA |
| Investimento (legado)   | Baixa percebida (visível só via deep-link) | Alta | Duplicada por Wealth |
| Patrimonial (legado)    | Baixa percebida (visível só via deep-link) | Média | Duplicada por Wealth |

**Módulos fracos / sem propósito autônomo perceptível**: `InvestmentModule`
e `PatrimonialModule` enquanto experiências independentes.

**Módulos fortes**: Wealth, Estudo de lances, Comparador, Op. Estruturadas.

---

## Cockpit Consultivo Audit

### Diagnóstico brutal

Perguntas-resposta:

| Pergunta                                    | Resposta |
|---------------------------------------------|----------|
| Ainda tem utilidade real?                   | **Sim** |
| Ainda agrega guidance?                      | **Sim** (próximo passo determinístico) |
| Ainda agrega profundidade?                  | Não — e está certo assim |
| Ainda agrega inteligência consultiva?       | Sim — via `buildSuggestions` + `useCopilotTriggers` |
| Ainda possui função estratégica?            | Sim — é a **entrada** narrativa do módulo Análise |
| Virou redundante?                           | **Parcialmente** — recomenda INVESTMENT que vive em WEALTH |
| Conflita com a V2?                          | Não |
| Duplica Compare?                            | Não |
| Duplica Capítulos?                          | Não |
| Duplica Strategy Panels?                    | Não (panel só abre em Wealth) |
| Ainda merece existir?                       | **Sim — classificação: ÚTIL (não-essencial mas valioso)** |

### Função exclusiva

O Cockpit entrega 3 coisas que **nenhum outro submódulo entrega**:
1. **Próximo passo recomendado** (determinístico, 1 hero único).
2. **Frase pronta** para enviar ao cliente (`pitch` + botão "Copiar frase").
3. **Pontos de atenção** com CTA cirúrgico (suprimido quando Copilot proativo
   está disparado — anti-duplicação já implementada).

Não é dashboard. Não calcula. Não decide. **Indica.** Mantra registrado em
memória: *"Eu não resolvo. Eu indico onde resolver."*

### Risco de mantê-lo

Baixo. O risco aumenta apenas se:
- Cockpit começar a sugerir `INVESTMENT` legado em vez de `WEALTH` (já acontece —
  ver Critical Risks #2 abaixo).
- Cockpit ganhar KPIs próprios (já registrado como proibido).

### Classificação final

**ÚTIL** — não essencial, mas perceptivamente valioso. Mantenha como está.

---

## UX + Narrative Consistency Audit

### Continuidade narrativa

A jornada *Simulador → Análise → Abordagem → Proposta* é coerente. Dentro de
Análise, a continuidade entre **Cockpit → Wealth → Comparador → Lances →
Assembleias** funciona, mas tem **uma quebra léxica** já mapeada:

- "Comparador" (sidebar) sugere a mesma coisa que "Comparar estratégias" (botão
  no Wealth). Para o usuário consultivo são experiências diferentes (consórcio×
  financiamento vs estratégias patrimoniais).

### Fluxos desconectados

**Nenhum**. Cockpit ↔ Wealth ↔ Bids ↔ Assemblies ↔ Comparator ↔ Simulator
todos compartilham contexts. Persistência (`usePersistLastTab`) funciona.

### Módulos órfãos

`PatrimonialModule` e `InvestmentModule` são acessíveis apenas via deep-link
hoje — tecnicamente "órfãos" na sidebar (intencional). Não causam confusão
porque não estão visíveis.

### Excesso de profundidade

`InvestmentModule` (850 LOC, 6 paths, múltiplas tabs internas, storytelling IA,
nicho cards, cash comparison, summary cards, KPI strip) **é hoje o ponto de
maior densidade da plataforma** — porém está escondido. Quando exposto via
deep-link, quebra a calma editorial da V2.

---

## Performance + Maintainability Audit

### Estrutural

- `AnalysisModule` é puro orquestrador (223 LOC) — bom.
- Lazy + idle preload bem implementados.
- Renderização condicional via `hidden` preserva estado entre trocas.
- Manual chunks (vite) garantem code-split por engine pesado.

### Maintainability

| Submódulo               | LOC  | Mantenabilidade |
|-------------------------|------|------------------|
| AnalysisModule          | 223  | ⭐⭐⭐⭐⭐ |
| AnalysisOverview        | 341  | ⭐⭐⭐⭐  |
| WealthPlatformModule    | 483  | ⭐⭐⭐⭐  |
| InvestmentModule        | 850  | ⭐⭐    (gordo, mesclando produção+UI) |
| ComparatorModule        | 406  | ⭐⭐⭐⭐  |
| BidsModule              | 292  | ⭐⭐⭐⭐  |
| StructuredOperations    | 266  | ⭐⭐⭐⭐  |
| AssembliesModule        | 104  | ⭐⭐⭐⭐⭐ |

### Acoplamento

Aceitável. `WealthPlatformModule` é consumer puro de `InvestmentResultsContext`
— mas isso cria **dependência implícita**: se `InvestmentModule` não montar,
`Wealth` fica sem dados. Mitigado pelo preload + lazy idle, mas é uma frágil
arquitetural latente que merece nota.

### Debt escondida

1. `InvestmentModule` UI duplicada (ver Redundancy).
2. Wrappers em `src/utils/calculations/{investimento,lances}.ts` aguardando
   deprecação (Onda 5).
3. `ANALYSIS_HEADLESS_ALLOWLIST` cresce silenciosamente — falta governance.

---

## Weak Modules

1. **`InvestmentModule`** (autônomo) — sobrevive como produtor de contexto +
   página headless para deep-links. UI integral é redundante com Wealth.
2. **`PatrimonialModule`** (autônomo) — mesma condição, escala menor.

> Nenhum deles é "fraco" funcionalmente. Eles são **fracos perceptivamente
> enquanto experiências independentes**. Como produtores de dados, são fortes.

---

## Strong Modules

1. **WealthPlatformModule** — referência arquitetural da V2.
2. **BidsModule** — diferencial competitivo, narrativa em 3 blocos, dados reais.
3. **ComparatorModule** — único lugar onde a "conta justa" acontece.
4. **AnalysisOverview (Cockpit)** — disciplina exemplar: hub, não dashboard.
5. **AssembliesModule** — pequeno (104 LOC), prova social, sem fricção.

---

## Redundant Areas

| Área                                              | Severidade   |
|---------------------------------------------------|--------------|
| UI completa do `InvestmentModule` vs Wealth       | Problemática |
| UI completa do `PatrimonialModule` vs Wealth      | Problemática |
| `AssembliesModule` (subaba + embed em Bids)       | Aceitável    |
| Label "Comparador" (consórcio×fin.) vs "Comparar" (Wealth) | Aceitável (léxica) |
| Wrappers em `src/utils/calculations/*`            | Tolerável (ESLint warn, alvo Onda 5) |

---

## Critical Risks

**Nenhum risco financeiro crítico.** Riscos arquiteturais/UX classificados:

1. **[Médio] Cockpit recomenda `INVESTMENT` legado** em `buildSuggestions`
   quando o usuário deveria ir para `WEALTH` (mesma intenção, surface canônica).
   Ver `analysis/AnalysisOverview.tsx` linhas 73, 88, 91, 95.
2. **[Baixo] `WealthPlatformModule` depende implicitamente** do `InvestmentModule`
   ter montado para popular `InvestmentResultsContext`. Mitigação atual: preload
   idle. Não é falha — é acoplamento documentável.
3. **[Baixo] `ANALYSIS_HEADLESS_ALLOWLIST`** cresce sem governance. Hoje tem 3
   entradas — vale registrar política antes que vire 10.

---

## Recommended Rationalizations

> Recomendações para **uma próxima onda** — **NÃO executar agora**.

### R1 — Cockpit alinhado ao canônico (custo: baixo)

Atualizar `buildSuggestions` em `analysis/AnalysisOverview.tsx` para sugerir
`ANALYSIS_TABS.WEALTH` no lugar de `ANALYSIS_TABS.INVESTMENT` nas 2 ramificações
("Avaliar operação patrimonial" e "Posicionar como planejamento"). Mantém o
hero do Cockpit consultivo apontando para a surface canônica V2.

### R2 — InvestmentModule → "Headless Data Producer" + página fallback fina
(custo: médio)

Reduzir `InvestmentModule` a:
- `useInvestmentCalculations()` + publish em `InvestmentResultsContext`.
- Página fina de fallback para deep-links (link para WEALTH como redirect
  recomendado, ou versão minimalista da UI).

Mover componentes específicos (`InvestmentStrategyTab`, `InvestmentScenariosV2`,
`StrategicNicheCards`, `CashComparisonTab`, `KpiEducationCard`) para a camada
V2 — quando ainda fizerem sentido. Já estão parcialmente lá.

### R3 — Renomear "Comparador" para evitar ambiguidade léxica (custo: baixo)

Opções:
- Manter "Comparador" e renomear o botão do Wealth para "Comparar teses".
- Renomear sidebar "Comparador" → "Consórcio × Financiamento".

Decisão é editorial — não funcional.

### R4 — Política para `ANALYSIS_HEADLESS_ALLOWLIST` (custo: trivial)

Documentar em `docs/governance/headless-routes-policy.md` quando uma rota pode
entrar/sair da allowlist + ownership. Já existe `console.error` em dev — só
falta o documento.

### R5 — Onda 5 ESLint error em `utils/calculations/*` (custo: trivial)

Promover `warn → error` conforme planejado em `mem://arch/core-finance-fachada`.

---

## Areas Explicitly NOT Recommended To Change

- **`src/core/finance/*`** — locked. Não tocar.
- **`WealthPlatformModule.tsx`** — locked. Não tocar.
- **`ConsultiveStrategyPanel.tsx`** — locked.
- **`CompareWorkspace.tsx`** (COMPARE_MAX=3) — locked.
- **`AnalysisOverview` arquitetura** (hero único, anti-duplicação Copilot,
  link "Ver simulação completa" no lugar de KPIs) — locked.
- **Embed de `AssembliesModule` em `BidsModule`** — não desfazer. É continuidade
  narrativa intencional.
- **Lazy + idle preload** em `AnalysisModule` — não substituir por eager.
- **Renderização condicional via `hidden`** em vez de unmount — preserva estado
  entre trocas; não converter para `if/else`.
- **`SelectedGroupContext` como fonte única tipo+grupo** — não duplicar.
- **`InvestmentResultsContext` como ponte Investment→Wealth** — não bypass.

---

## Final Strategic Verdict

| Critério                              | Avaliação |
|---------------------------------------|-----------|
| Coeso?                                | **Sim** |
| Excessivamente complexo?              | Não — `InvestmentModule` é o único ponto de preocupação |
| Elegante?                             | **Sim** |
| Redundante?                           | Parcialmente (Investment/Patrimonial vs Wealth — gerenciável) |
| Escalável?                            | **Sim** |
| Consistente?                          | **Sim** (matemática, contexts, navegação) |
| Consultivo?                           | **Sim** |
| Premium?                              | **Sim** |
| Financeiramente confiável?            | **Sim** (motor único, testes verdes, fórmulas auditadas) |

### O que realmente deveria continuar existindo

**Essenciais**: Wealth · Comparador · Bids · Assembleias · Op. Estruturadas
(CTA contextual) · Cockpit Consultivo.

**Necessários como produtor de dados**: `InvestmentModule` (produtor do context),
`PatrimonialModule` (produtor de `usePatrimonialKpis`).

**Candidatos a rationalization futura**: UI integral de `InvestmentModule` e
`PatrimonialModule` enquanto experiências autônomas — não a lógica.

### Veredito

**Módulo Análise APROVADO**. Estrutura V2 sustenta o produto. Recomendações
R1–R5 ficam registradas para uma próxima onda de rationalization — nenhuma é
urgente, nenhuma é crítica, e nenhuma altera matemática, motor financeiro ou
áreas locked da V2 Constitution.

**Status**: ANALYSIS MODULE · AUDITED · NO ACTION REQUIRED IMMEDIATELY.
