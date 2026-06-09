---
name: Engenharia Patrimonial — Submódulo de Análise
description: Submódulo "patrimonial" dentro de Análise com 6 estratégias curadas (Autoquitação, Escada, Renda Passiva, Construção, Multiplicação, Holding), KPIs executivos (TIR/ROI/Payback/Multiplicador/Capital Preservado) e jornada Aquisição→Legado. Consumer-only do InvestmentResultsContext, zero recálculo.
type: feature
---

# Engenharia Patrimonial — Submódulo

## Posicionamento
Onda Patrimonial 1: evolução do produto de "simulador de aquisição" para "plataforma consultiva de multiplicação patrimonial". O submódulo vive **dentro de Análise** (não cria módulo paralelo), entre Investimentos e Comparador.

## Estrutura
1. **Header consultivo** institucional (não promete retorno).
2. **PatrimonialKpiBar** — TIR (a.a.) · ROI · Payback · Multiplicador · Capital Preservado, derivados em `usePatrimonialKpis()` a partir de `useInvestmentResults()` + `useSimulatorInput()`.
3. **6 estratégias curadas** (`PATRIMONIAL_STRATEGIES` em `src/components/modules/patrimonial/strategies.ts`):
   - Autoquitação · Escada Patrimonial · Renda Passiva Estruturada · Construção Inteligente · Multiplicação de Ativos · Holding & Sucessão.
4. **PatrimonialJourneyStepper** — Aquisição → Estratégia → Patrimônio → Renda → Legado.
5. **Atalho** para "Investimentos → Estratégia Avançada" (resumo comparativo + multiplicação de cotas seguem lá, sem duplicação).

## KPIs determinísticos
Engine `src/core/finance/investment/patrimonialKpis.ts` (consumer-only, sem alterar motor financeiro):
- `calculateTIR` (Newton-Raphson + bissecção)
- `calculateROI`, `calculatePayback`
- `calculatePatrimonialMultiplier`, `calculatePreservedCapital`

## Restrições respeitadas
- Zero alteração em `@/core/finance` (motor mensal, financing, simulação).
- Zero edge function nova / zero IA na onda.
- Zero alteração em RLS/Supabase/providers.
- Visual idêntico a `InvestmentScenarioCard` (gradient header, badge tag, KPIs em chips, disclaimer).

## Estratégias diferidas (Onda 2)
Mercado Secundário · Solar Payback · Agro Produtivo · Studio/Airbnb · Consórcio Produtivo. Não inflar densidade cognitiva agora.

## Navegação
- `ANALYSIS_TABS.PATRIMONIAL = 'patrimonial'` em `src/config/modules.ts`.
- Subitem `Patrimonial` em `ANALYSIS_SUBITEMS` (icon Building2).
- Mobile: incluído em `MOBILE_ANALYSIS_ORDER` no BottomNav.
- Lazy-loaded em `AnalysisModule.tsx`, preload no idle.
