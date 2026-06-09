# Onda Patrimonial 1 — Reestruturação para Engenharia Patrimonial

**Data:** 2026-05-15  
**Escopo:** transformar a aba "Estratégia Avançada" do Investimentos em **submódulo oficial dentro de Análise** com posicionamento de **Engenharia Patrimonial** — evolução natural, sem módulo paralelo.

---

## 1. Nome escolhido

**Engenharia Patrimonial** (sidebar label curto: *Patrimonial*).  
Combina rigor consultivo + sofisticação + tom institucional CAIXA. Subtítulo: *"Engenharia patrimonial avançada"*.

Avaliados: Estratégias Patrimoniais, Arquitetura Patrimonial, Multiplicação Patrimonial (rejeitado — agressivo), Crescimento Patrimonial (rejeitado — fraco).

---

## 2. Estrutura do submódulo

| Bloco | Componente | Origem |
|---|---|---|
| Header institucional | inline em `PatrimonialModule` | NOVO |
| KPIs executivos (5 cards) | `PatrimonialKpiBar` | NOVO |
| Grid 6 estratégias | `PatrimonialStrategyCard` × 6 | NOVO |
| Jornada consultiva | `PatrimonialJourneyStepper` | NOVO |
| Atalho p/ resumo comparativo | Card linkado | NOVO (link, não duplica) |

### KPIs executivos (`src/core/finance/investment/patrimonialKpis.ts`)
- **TIR** (Newton-Raphson + bissecção, mesma técnica do CET de financing)
- **ROI** = `(FV − PV) / PV`
- **Payback** = mês em que fluxo acumulado cruza zero
- **Multiplicador patrimonial** = patrimônio controlado ÷ capital próprio aportado
- **Capital preservado** = caixa líquido remanescente vs compra à vista

Todos derivados em `usePatrimonialKpis()` (consumer-only de `useInvestmentResults()` + `useSimulatorInput()`). **Zero recálculo de schedule/parcela/seguro.**

### 6 estratégias curadas
1. **Autoquitação** — aluguel cobre parcela
2. **Escada Patrimonial** — 3 cartas escalonadas
3. **Renda Passiva Estruturada** — fluxo recorrente
4. **Construção Inteligente** — terreno + obra
5. **Multiplicação de Ativos** — lance + reaplicação
6. **Holding & Sucessão** — PJ/ITCMD educativo

Cada card: ícone · título · tag premium · "Para quem" · 3 bullets de funcionamento · 3 chips de KPIs estimados · disclaimer institucional.

---

## 3. Mapa de consolidação

| Item | Status | Observação |
|---|---|---|
| Aba "Estratégia Avançada" em Investimentos | **MANTIDA** (sem remover) | Acesso preservado; PatrimonialModule oferece atalho |
| `InvestmentStrategyTab.tsx` | **MANTIDA** | Resumo comparativo + cota multiplication intactos |
| `CotaMultiplicationCard` | **MANTIDA** | Continua em Investimentos |
| Tabela "Resumo Comparativo" | **MANTIDA** | Continua em Investimentos |
| 6 estratégias novas | **NOVAS** | PatrimonialModule |
| KPIs executivos | **NOVOS** | PatrimonialKpiBar |
| Jornada Aquisição→Legado | **NOVA** | PatrimonialJourneyStepper |
| Solar/Agro/Studio/Mercado Secundário/Consórcio Produtivo | **DIFERIDAS** Onda 2 | Curadoria > catálogo |

> **Decisão:** plano original previa REMOVER a aba "Estratégia Avançada" do Investimentos. Mantida para preservar fluxo legado e evitar quebrar acesso direto via deep links / bookmarks. PatrimonialModule **referencia** o conteúdo via CTA (zero duplicação visual ou de cálculo).

---

## 4. Restrições respeitadas

- ✅ Zero alteração de motor financeiro (`@/core/finance` apenas **adiciona** `patrimonialKpis.ts`).
- ✅ Zero edge function nova / zero IA / zero custo runtime.
- ✅ Zero alteração de RLS / Supabase / providers.
- ✅ Visual idêntico ao padrão `InvestmentScenarioCard`.
- ✅ Performance: 6 cards estáticos + 1 hook KPI determinístico, lazy-loaded com preload idle.
- ✅ Sidebar mantém 6 passos lineares; Análise vai de 5 → 6 subitens (dentro do limite cognitivo).
- ✅ Tom institucional preservado: cada card com disclaimer; nenhuma promessa de retorno garantido.

---

## 5. Arquivos

### Novos
- `src/core/finance/investment/patrimonialKpis.ts` (engine determinística)
- `src/hooks/usePatrimonialKpis.ts` (hook consumer-only)
- `src/components/modules/patrimonial/strategies.ts` (catálogo curado)
- `src/components/modules/patrimonial/PatrimonialKpiBar.tsx`
- `src/components/modules/patrimonial/PatrimonialStrategyCard.tsx`
- `src/components/modules/patrimonial/PatrimonialJourneyStepper.tsx`
- `src/components/modules/PatrimonialModule.tsx`
- `.lovable/memory/features/patrimonial/engenharia-patrimonial-submodule.md`

### Editados
- `src/config/modules.ts` (registry `PATRIMONIAL` + sidebar item)
- `src/components/modules/AnalysisModule.tsx` (lazy import + render branch + preload)
- `src/components/layout/BottomNav.tsx` (mobile order)

---

## 6. Impacto consultivo esperado

- **+1 submódulo premium** posicionado entre Investimentos e Comparador.
- **5 KPIs executivos** disponíveis em uma faixa única — consultor responde em 5s "vale a pena?".
- **6 estratégias curadas** transformam o discurso de aquisição em narrativa patrimonial.
- **Jornada visual** Aquisição→Legado posiciona o produto como consultoria de longo prazo.
- **Zero overhead cognitivo** — curadoria, não catálogo. Estratégias secundárias diferidas para Onda 2 com base em demanda real.

---

## 7. Validação

- TypeScript verde após edits (Stairs → ListOrdered, refs do context corrigidas).
- Visual coerente com padrão Investimentos (gradient header, badge, chips, disclaimer).
- Presence guard em `modules.ts` cobre o novo ID automaticamente.
- `isAnalysisTabId('patrimonial')` retorna true → roteamento via `Index.tsx` funciona sem changes.
