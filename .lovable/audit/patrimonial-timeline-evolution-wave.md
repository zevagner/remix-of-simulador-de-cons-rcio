# Patrimonial Timeline Evolution Wave

**Data:** 2026-05-15 · **Wave:** Patrimonial Timeline Evolution · **Owner:** Engenharia Patrimonial

---

## 1. Objetivo

Transformar as 6 estratégias do submódulo **Engenharia Patrimonial** de fotografias estáticas em **narrativas temporais de construção de patrimônio**. O tempo passa a ser o protagonista da estratégia — não apenas o prazo do consórcio.

---

## 2. Princípio absoluto

- **Tempo = maior ativo da estratégia**, não premissa secundária.
- Toda projeção é **estimativa institucional**, nunca promessa.
- Visual leve, **scanning executivo** em segundos — sem terminal financeiro poluído.

---

## 3. Entregas

### 3.1 Motor determinístico — `src/core/finance/investment/patrimonialTimeline.ts`

Função pura `projectPatrimonialTimeline(input)` retorna marcos **0/5/10/15a** por arquétipo. Consumer-only (não recalcula schedule/parcela/seguro). Premissas conservadoras explícitas no header do arquivo:

| Premissa | Valor |
|---|---|
| Valorização imobiliária | 2,0% a.a. |
| Aluguel bruto / valor imóvel | 0,45% a.m. (~5,5% a.a.) |
| CDI líquido (capital preservado) | 9,0% a.a. |
| Reinvestimento da renda | 80% do fluxo |

Cada marco devolve: `controlledAsset`, `preservedCapital`, `annualIncome`, `multiplier`, `phase` (entrada/consolidacao/expansao/estabilizacao), `narrative` consultiva curta.

Modelagem por arquétipo (lógica diferenciada, não números mágicos):

| Arquétipo | KPI dominante temporal | Lógica |
|---|---|---|
| `autoquitacao` | Payback acelerado | 1 ativo locado, valoriza, fluxo líquido cresce ao quitar |
| `escada-patrimonial` | Multiplicador acumulado | 3 cartas em y2/y5/y8 → escala patrimonial |
| `renda-passiva` | Renda anual | Fluxo recorrente alto, reinvestimento agressivo |
| `construcao-inteligente` | Valorização (premium 1,25×) | Imóvel pronto vale mais que custo total |
| `multiplicacao-ativos` | Capital preservado + multiplicador | Lance embutido preserva capital, CDI em paralelo |
| `holding-sucessao` | Preservação patrimonial | Foco em estrutura sucessória, valorização levemente maior |

### 3.2 Componente visual — `PatrimonialTimeline.tsx`

- **4 marcos lado a lado** (Ano 0/5/10/15) com stacked bars CSS-only (sem Recharts/SVG complexo).
- **Cores semânticas:** `bg-primary/80` (patrimônio) + `bg-secondary/70` (preservado).
- **Scanning executivo:** valor total formatado curto + multiplicador + fase em ≤ 4 linhas por marco.
- **Tooltip rico** por marco: narrativa + breakdown (patrimônio/preservado/renda anual/multiplicador).
- **Performance:** zero animação custosa, zero state, ~50 LOC de markup.
- **Disclaimer:** badge "Estimativa" + tooltip de premissas no header.

Integrado em `PatrimonialStrategyCard` como **collapsible** (default fechado para não inflar densidade) com CTA `"Ver trajetória patrimonial (5 / 10 / 15 anos)"`.

### 3.3 Comparador longitudinal — `PatrimonialTimelineComparator.tsx`

- **Picker de chips** (até 3 estratégias simultâneas, default: Autoquitação · Escada · Multiplicação).
- **Tabela densa** — cada estratégia × 4 métricas (Patrimônio / Preservado / Renda anual / Multiplicador) × 3 colunas (Y5/Y10/Y15).
- **Hierarquia visual:** linha de separação em primary/20 entre estratégias, métrica em mute.
- Disclaimer institucional explicitando todas as premissas.

Posicionado entre o grid de cards e o `PatrimonialJourneyStepper` no `PatrimonialModule`.

---

## 4. Hierarquia temporal implementada

| Marco | Fase | Sinal visual |
|---|---|---|
| Ano 0 | Entrada | Stack mínima — entrada estratégica |
| Ano 5 | Consolidação | Stack começa a crescer — primeira contemplação digerida |
| Ano 10 | Expansão | Stack significativamente maior — ativos compostos |
| Ano 15 | Estabilização | Stack plena — patrimônio maduro |

Cada marco tem **narrativa consultiva por arquétipo** (≤ 14 palavras) — ex.: "2 cartas contempladas — começa a escalada patrimonial."

---

## 5. Salvaguardas confirmadas

| Pilar | Confirmação |
|---|---|
| **Arquitetura** | Zero alteração em motores financeiros, providers, Supabase, RLS |
| **Performance** | Sem libs novas; CSS-only bars; tooltip nativo do shadcn |
| **Falsa precisão** | Valores arredondados a R$ 100; premissas explícitas |
| **Linguagem** | Tom consultivo CAIXA — "estimativa", "cenário", "projeção" |
| **Densidade** | Timeline collapsible por padrão; comparador único no módulo |
| **Responsabilidade** | Disclaimer em header + footer; nunca "promessa" ou "garantia" |
| **Aderência visual** | Reusa primary/secondary/border/muted; consistente com KpiBar e StrategyCard |

---

## 6. Arquivos

**Novos:**
- `src/core/finance/investment/patrimonialTimeline.ts` (motor determinístico)
- `src/components/modules/patrimonial/PatrimonialTimeline.tsx` (visual por estratégia)
- `src/components/modules/patrimonial/PatrimonialTimelineComparator.tsx` (comparador)

**Editados:**
- `src/components/modules/patrimonial/PatrimonialStrategyCard.tsx` (CTA collapsible + integração)
- `src/components/modules/PatrimonialModule.tsx` (wiring do comparador)

---

## 7. Impacto consultivo esperado

- **Encantamento:** o gerente vê o tempo trabalhando a favor do cliente em segundos.
- **Profundidade percebida:** estratégias deixam de parecer "simulações estáticas" e passam a parecer **planejamento patrimonial real**.
- **Diferenciação:** narrativa longitudinal eleva o produto ao patamar de wealth-management consultivo.
- **Confiança:** disclaimers e premissas explícitas reforçam responsabilidade institucional.

---

## 8. Itens deferidos (próximas ondas)

- Exportar timeline para o PDF da proposta (bloco visual em A4).
- Sliders de premissas (valorização / CDI / aluguel) com badge "Sensibilidade".
- Comparação de Y20 quando o usuário pedir explicitamente "longo prazo".
- Marcos customizados por evento de vida (filho na faculdade, aposentadoria).
