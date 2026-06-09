# Wealth Parametric Engine Reunification Pass

## Dados do Consórcio Restore
Card readonly no topo da Plataforma Patrimonial (`WealthOperationalBar` → `ConsortiumDataCard`). Fonte exclusiva: `useSimulatorInput()` + `useSimulatorResult()`. Exibe carta, prazo, taxa adm. efetiva, FR, seguro prestamista, parcela estimada, mês de contemplação, custo total. Collapsible default-fechado; chip status com resumo "R$ X · Nm · Y% adm" visível mesmo fechado. Zero recálculo.

## Premissas da Simulação Restore
Card editável (`AssumptionsCard`) com presets **Conservador / Realista / Otimista** + reset para defaults canônicos. Campos: CDI a.a., % do CDI, valorização, yield aluguel, mês de contemplação, prazo da análise, tipo de venda, % recebido / deságio. Chip status mostra preset ativo ou "Personalizado". Persistido em `localStorage:wealth:assumptions:v1`.

## Central Parametric State
`src/contexts/WealthAssumptionsContext.tsx` — fonte única. Defaults derivados de `DEFAULT_CDI_RATE` e `DEFAULT_TERM_MONTHS.imobiliario` (mesma origem do Simulador). Expõe `assumptions`, `calcContext` (derivado memoizado), `setAssumption`, `applyPreset`, `reset`, `isDirty`, `activePreset`. Provider montado em `WealthPlatformModule`.

`StrategyCalcContext` é tipado estruturalmente em ambos os módulos (sem ciclo de import) e entrega valores prontos para as primitivas canônicas: `cdiAnnualLiq`, `cdiMonthlyLiq`, `contemplationMonth`, `monthsAfterContemplation`, `propertyAppreciation`, `rentalYield`, `agioOnSale`, `discountOnSale`, `tipoVendaCarta`.

## Full Strategy Dependency Audit

| Estratégia | Premissas que afetam | Status migração |
|---|---|---|
| `compra-hibrida` | CDI %, CDI a.a. | ✅ migrada |
| `usar-carta-investir` | CDI %, CDI a.a., contemplação, prazo análise | ✅ migrada |
| `alavancagem-imobiliaria` | yield aluguel | ✅ migrada |
| `escada-patrimonial` | valorização, % venda | ⏳ próxima onda |
| `multiplicacao-cotas` | valorização, contemplação | ⏳ próxima onda |
| `reinvestimento-estruturado` | CDI %, prazo | ⏳ próxima onda |
| `patrimonio-gerador-caixa` | yield, valorização | ⏳ próxima onda |
| Demais 17 estratégias | usam constantes canônicas (custo, parcela, lance %) — invariantes a CDI/yield/valorização | ➖ não dependem da matriz viva |

**Assinatura backward-compatível:** `result: (credit: number, ctx?: StrategyCalcContext) => string`. Estratégias não-migradas ignoram `ctx` e seguem usando `CDI_LIQ`/`REF_TERM_M`/`CAP_RATE` canônicos (que coincidem com os defaults do context). Zero regressão para snapshots de PDF e callsites legados.

## Live Propagation Validation
4 callsites de `result()` em `StrategyLibrarySection.tsx` agora recebem `calcCtx` via `useWealthAssumptionsSafe()`:
1. `ViabilityPreview` — KPIs canônicos por card (hero + secundários)
2. `ViabilityPreview` — fallback (últimas 3 calculations)
3. `CalculationsBlock` — tabela mobile
4. `CalculationsBlock` — tabela desktop

`getKpiNumericValue()` em `strategyFlagships.ts` aceita `ctx` opcional → `executiveCompare` propaga, garantindo que a **ordenação executiva** (Maior lucro / ROI / Patrimônio) reordena ao alterar premissas. `calcCtx` está nas deps do `useMemo` de `chaptersGrouped`.

## Canonical Financial Integrity
Zero matemática nova. `toCalcContext()` usa apenas `annualToMonthlyRate` + aritmética de unidade. Cards migrados continuam chamando `compoundGrowthAnnualMonthly` e usando `ADM_TOTAL` (derivado de `computeBaseCost`). Nenhuma constante divergente foi introduzida.

## UX Integrity Validation
Dois cards default-fechados → preserva hierarquia editorial (header hero → flagship → recommended → capítulos). Chip status reduz fricção: consultor enxerga "CDI 110% · contemplação mês 24 · análise 200m" sem expandir. Border + ring sutis em `primary/30` quando `isDirty`. Sem badges agressivas, sem dashboardization.

## Performance Validation
- `calcContext` é `useMemo` por `assumptions` → 1 recálculo por mudança de premissa.
- `useWealthAssumptionsSafe()` é leitura barata (context com valor memoizado).
- Estratégias não-migradas ignoram `ctx` → custo zero para 21 dos 24 cards.
- Sem novas subscriptions, sem polling, sem effects derivados.

## Zero Regression Validation
- Engine financeira (`@/core/finance`) intocada.
- Simulador intocado (apenas leitura).
- PDF / Proposta / Comparator continuam usando `result(credit)` sem ctx — comportamento idêntico ao snapshot anterior (defaults canônicos do context = constantes hardcoded antigas).
- V2 Constitution: Compare/Wealth lock preservado — nenhum drawer, nenhuma sub-rota, nenhuma duplicação de hierarquia.
- Flagship + ordering executivo + capítulos editoriais + modalidade: intactos.

## Final Consultive Engine State
O módulo **voltou a ser uma engine patrimonial viva unificada** para as 3 estratégias mais paramétricas (Usar a Carta, Alavancagem Imobiliária, Compra Híbrida) — as que reagem semanticamente a CDI/yield/contemplação. As demais permanecem corretas usando os defaults canônicos (mesma matriz) e podem ser migradas incrementalmente sem refactor estrutural.

## Final Verdict
✅ Restore concluído sem regressão. Camada paramétrica viva reintegrada via context central, dois cards operacionais no topo, propagação validada, math canônica preservada. Migração das estratégias restantes é incremental (1 linha por `result()`).
