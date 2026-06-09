# Patrimonial Decision Desk — Wave Report

**Data:** 2026-05-15
**Escopo:** Submódulo Engenharia Patrimonial → mesa consultiva de decisão patrimonial.

---

## 1. Objetivo

Transformar Investimentos / Engenharia Patrimonial em **mesa executiva de decisão**:
o consultor compara 6 estratégias em segundos, identifica a melhor por perfil,
acessa comparação temporal e racional consultivo — sem virar dashboard corporativo.

---

## 2. Arquitetura entregue

### `src/core/finance/investment/decisionDeskInsights.ts` (novo)

- `buildDecisionDesk({ creditValue, ownCapitalInvested, preservedCapital })` →
  - **byProfile**: 6 vencedores qualificados (conservador, crescimento, renda, multiplicação, equilíbrio, longo prazo).
  - **insights**: 5 callouts curados (maior multiplicação, melhor preservação, maior aceleração, menor capital imobilizado, melhor equilíbrio).
  - **aggregates**: marcos Y5/Y10/Y15 + scores derivados (`accelerationRatio`, `liquidityScore`, `balanceScore`).
- Determinístico, idempotente, **consumer-only** sobre `projectPatrimonialTimeline`.
- Escolha qualificada (não puro argmax) — ex.: conservador filtra arquétipos não-alavancados;
  multiplicação filtra apenas alavancados — protege contra "ranking milagroso".

### `src/components/modules/patrimonial/PatrimonialDecisionDesk.tsx` (novo)

3 camadas em **progressive disclosure**:

| Camada | Conteúdo | Estado inicial |
|---|---|---|
| **A · Resumo Executivo** | Grid de 6 chips "Melhor para X" + headline metric + nome da estratégia | sempre visível |
| **B · Comparação patrimonial** | Reuso do `PatrimonialTimelineComparator` (5/10/15a) | colapsável, **aberto** |
| **C · Racional consultivo** | Grid 2 colunas com 5 insights executivos curados | colapsável, **fechado** |

- Header institucional com badge `Estimativa`.
- Disclaimer rodapé: premissas explícitas + "não constitui promessa de retorno".
- Zero charts, zero animações pesadas, zero motor financeiro novo.

### `src/components/modules/PatrimonialModule.tsx` (edit)

- Substituído `PatrimonialTimelineComparator` por `PatrimonialDecisionDesk` (que embute o comparator dentro da seção B).
- Posicionado entre as 6 estratégias curadas e o `PatrimonialJourneyStepper`.

---

## 3. Princípios preservados

| Princípio | Status |
|---|---|
| Sem motor financeiro novo | ✅ Reusa `projectPatrimonialTimeline` |
| Consumer-only sobre `usePatrimonialKpis` | ✅ |
| Tom institucional CAIXA, sem promessas | ✅ Disclaimer + "Estimativa" badge |
| Sem ranking-milagroso | ✅ Pools qualificados por perfil |
| Densidade curada (≤ 6 chips + ≤ 5 insights) | ✅ |
| Progressive disclosure | ✅ 2 seções colapsáveis |
| Zero alteração em providers/Supabase/edges | ✅ |
| Performance: sem recharts/canvas pesados | ✅ Apenas tabela HTML + grid |
| Tailwind semantic tokens | ✅ `primary`, `border-border`, `bg-card` |
| Acessibilidade | ✅ `aria-expanded`, `aria-labelledby`, `aria-hidden` em ícones |

---

## 4. Cobertura "EXECUTAR"

| Item | Entrega |
|---|---|
| Comparação rápida | Resumo executivo escaneável em <5s |
| Comparação executiva (KPIs) | Tabela longitudinal Y5/Y10/Y15 (Patrimônio, Preservado, Renda, Multiplicador) |
| Comparação por perfil | 6 winners qualificados |
| Hierarchy de decisão (A/B/C) | Resumo → Comparação → Racional |
| Scanning premium | Chips compactos com headline metric |
| Sinais visuais curados | Ícones consistentes + cor primary apenas em destaques |
| Comparação temporal | Marcos Y5/Y10/Y15 + insight "maior aceleração" |
| Insights executivos | 5 callouts com métrica + racional |
| Responsabilidade consultiva | Disclaimer explícito + premissas |
| Aderência CAIXA | Tom + paleta primary + sem gamificação |
| Coerência visual | Reusa Card/Badge do design system |
| Densidade inteligente | Sem explosão de tabelas — 1 mesa, 3 camadas |
| Performance | 0 dependências novas, 0 charts |
| Arquitetura | 0 mudanças em runtime/providers/Supabase/motores |
| Progressive disclosure | Camadas B e C colapsáveis |

---

## 5. Validações

- **Scanning executivo**: 6 chips com headline metric + nome de estratégia → o consultor identifica a melhor opção por perfil em <10s sem expandir nada.
- **Clareza patrimonial**: cada chip indica perfil → estratégia → métrica de desempate (ex.: "Multiplicador 3,4× em 15a"). Decisão sai do "comparar individualmente" para "comparar globalmente".
- **Premium feel**: card único com gradient suave, padding consultivo, badge institucional, hierarquia de tipografia. Não é tabela corporativa.
- **Zero poluição**: tabela longitudinal continua única (não duplicada). Insights ficam atrás de toggle (default fechado).

---

## 6. Tradeoffs / Diferimentos

- Insights são **estáticos** por arquétipo (ex.: "menor capital imobilizado" é sempre `multiplicacao-ativos`). Métricas são dinâmicas, ranking subjacente é determinístico — coerente com tom consultivo "não-milagroso".
- `balanceScore` usa pesos fixos (40/30/30) — ajustar se telemetria mostrar viés.
- Sem export para PDF nesta onda (a Wave 2 do Investments KPI Layer já listou isso).

---

## 7. Memory hooks

Não há mudança de regra global; padrão "consumer-only sobre projectPatrimonialTimeline + buildDecisionDesk" segue as constraints já registradas em:

- `mem://logic/investimento/hook-split-cenarios`
- Convenção de "tom institucional CAIXA + sem promessas" (Core).

Sem necessidade de novo bloco no índice de memória.
