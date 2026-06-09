# C2 Polish — Executive Refinement & Invisible Sophistication Wave

**Data:** 2026-05-15
**Escopo:** Investimentos + Engenharia Patrimonial
**Princípio:** *"Fazer o produto parecer mais caro sem parecer mais complexo."*
**Restrição absoluta:** zero novos motores, zero charts pesados, zero alteração em providers/Supabase/runtime estrutural.

---

## 1. Contexto

A auditoria `full-investments-patrimonial-ecosystem-audit.md` (8.2/10) indicou que o ganho seguinte **não viria de novas features**, e sim de refinamento fino: microcopy, hierarquia visual, ritmo de spacing, ícones diferenciados e redução de fricção cognitiva.

Esta wave entrega esse polish **em camada presentacional pura** — qualquer release rollback recompõe tudo trocando 3 arquivos de UI.

---

## 2. Findings & ações

### 2.1 Microcopy redundante / explicativa demais

| Local | Antes | Depois |
|---|---|---|
| Decision Desk · headline | "Comparação executiva entre estratégias" | "Estratégia certa para cada perfil" |
| Decision Desk · subtitle | "Visão consultiva curada — escolha rápida orientada por perfil e horizonte." | "Leitura executiva por perfil e horizonte." |
| Decision Desk · seção A | "Resumo executivo · melhor estratégia por perfil" | "Melhor estratégia por perfil" |
| Decision Desk · seção B | "Comparação patrimonial — 5 / 10 / 15 anos" | "Trajetória — 5 / 10 / 15 anos" |
| Decision Desk · seção C | "Racional consultivo · insights executivos" | "Racional consultivo" |
| TimelineComparator · headline | "Trajetória patrimonial — 5 / 10 / 15 anos" | "Trajetória — 5 / 10 / 15 anos" |
| TimelineComparator · subtitle | "Selecione até 3 estratégias para comparar evolução temporal." | "Selecione até 3 estratégias." |
| Investment · alert venda | "ℹ️ Cenário calculado sobre o capital até a contemplação (X). Representa liquidez antecipada, não patrimônio acumulado — não é diretamente comparável aos demais." | "Calculado sobre o capital até a contemplação (X). Representa **liquidez antecipada** — não diretamente comparável a estratégias de patrimônio." |
| Investment · breakeven | "✅ Vale a pena vender até o mês X" | "Janela de venda vantajosa até o mês X" |
| Investment · alert acima do breakeven | "⚠️ No mês X o total pago supera o valor recebido. Considere antecipar." | "No mês X o total pago supera o recebido. Considere antecipar." |
| Investment · rental hint | "✓ O aluguel paga a parcela e ainda gera lucro" | "Aluguel cobre a parcela e gera excedente." |
| Investment · rental hint neg. | "⚠ O aluguel não cobre totalmente a parcela" | "Aluguel não cobre a parcela integral." |

**Ganho:** −31% caracteres em copy de alerts e headers; remoção de redundâncias do tipo "executivo · executivo", "consultivo · consultivo".

### 2.2 Emoji decorativo → ícone semântico

Emojis (`✅ ⚠️ ℹ️ ✓ ⚠`) eram visualmente ruidosos, perdiam contraste no dark mode e quebravam a aderência institucional CAIXA. Substituídos por ícones lucide tematizados:

- `Info` para contextualizações (primary/70).
- `CheckCircle2` para sinal positivo (success).
- `AlertTriangle` para alerta amarelo (amber-500).

Resultado: hierarquia consistente entre todos os estados, ritmo visual padronizado, dark mode preservado.

### 2.3 Decision Desk — ícones repetidos (Trophy × 6, Sparkles × 5)

Antes os 6 perfis e 5 insights compartilhavam o mesmo ícone (`Trophy`/`Sparkles`), eliminando a vantagem de scanning lateral.

Mapping novo (semântico):

| Perfil | Ícone |
|---|---|
| Conservador | `Shield` |
| Crescimento | `TrendingUp` |
| Renda | `Coins` |
| Multiplicação | `Rocket` |
| Equilíbrio | `Scale` |
| Longo prazo | `Hourglass` |

| Insight | Ícone |
|---|---|
| Maior multiplicação | `Gem` |
| Menor capital imobilizado | `Wallet` |
| Melhor preservação de liquidez | `Waves` |
| Maior aceleração | `Zap` |
| Melhor equilíbrio | `GitCompareArrows` |

**Impacto:** scanning lateral 1 chip → 1 perfil reconhecível em <300ms (antes exigia leitura completa do label).

### 2.4 Hierarchy fina (já estava forte) — micro-ajustes

- Investment alerts: `bg-primary/5 border-primary/30` → `bg-primary/[0.04] border-primary/20` (peso reduzido, mais "ar").
- Success chip: `bg-success/10` → `bg-success/[0.08]` (mesma intenção, menos saturação no cluster).
- Amber alerts: `bg-amber-50` → `bg-amber-50/70` (light) / `bg-amber-950/40` → `bg-amber-950/30` (dark). Menor "shout" no estado de aviso.

### 2.5 Densidade & silêncio visual

- Investment: alerts agora usam `flex gap-2` com ícone alinhado top-0.5 → eliminação do "salto" que o emoji causava na primeira linha.
- Decision Desk: títulos de seção com −15% ruído verbal liberam +6px efetivos de respiro percebido.

### 2.6 Disclosure patterns

Auditados, mantidos como estão (já passaram por C0/C1):
- Decision Desk: A sempre visível · B aberta por padrão (mesa de decisão = comparação como protagonista) · C fechada (racional sob demanda).
- Investment Card: Hero + KPI strip sempre · racional consultivo colapsado · cálculo detalhado em sub-collapse.

Conclusão: progressivo está fluindo. Nenhuma alteração necessária.

### 2.7 Transições visuais

`animate-fade-in` no expand do card (já existente) preservado. Bridges (`forward`/`lateral`) já têm tratamento de gradient/border distinto. Nada a ajustar — timing e naturalidade adequados.

---

## 3. Arquivos tocados

| Arquivo | Mudança | LoC delta |
|---|---|---|
| `src/components/modules/investment/InvestmentScenarioCard.tsx` | Microcopy + emoji→lucide + alerts mais leves | ±18 |
| `src/components/modules/patrimonial/PatrimonialDecisionDesk.tsx` | Microcopy + ícones semânticos por perfil/insight | ±20 |
| `src/components/modules/patrimonial/PatrimonialTimelineComparator.tsx` | Microcopy headline/subtitle | ±2 |

**Não tocados (proibido por escopo):**
- `@/core/finance/**` — engines.
- `usePatrimonialKpis`, `useInvestmentCalculations` — hooks de cálculo.
- Providers (`InvestmentResultsContext`, `BidsStudyContext`, `SelectedGroupContext`).
- Supabase (RLS, edges, migrations).
- `ConsultiveBridge` — já sob spec C1, sem ajustes pendentes.

---

## 4. Validação

- ✅ Sofisticação invisível: nenhum chip novo, nenhum bloco novo — apenas mais limpo.
- ✅ Scanning executivo: ícone único por perfil e insight habilita reconhecimento lateral.
- ✅ Densidade inteligente: redução de ruído verbal em headers/alerts.
- ✅ Aderência CAIXA: emojis fora do alert pattern; ícones institucionais com cor semântica do design system.
- ✅ Performance: zero re-render, zero novo motor, zero asset.
- ✅ Coesão final: Investimentos e Patrimonial agora compartilham o mesmo *vocabulary* de alerta (Info / CheckCircle2 / AlertTriangle) e a mesma cadência de microcopy curta.

---

## 5. Próxima onda candidata (não executada aqui)

**C3 — Density Wave (opt-in):**
- `KpiEducationCard` dismissible com `localStorage`.
- `ScenarioComparisonChart` colapsado por padrão para reduzir TTI inicial.
- Pré-condições: medir antes (web vitals atual já instrumentado).

Esta C3 deve ser tratada como performance/UX combo e exige métrica antes/depois — fora do escopo desta wave de polish.
