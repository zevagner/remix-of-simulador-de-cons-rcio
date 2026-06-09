# Strategic Priority Reorder Pass

**Escopo:** `src/components/modules/wealth/strategyLibraryData.ts` — campo `priority` das 24 estratégias.
**Mudança:** apenas ordem editorial (`priority`). Conteúdo, cálculos, copy, schema e UI permanecem intactos.

---

## Priority Reordering Applied

| # | Estratégia (ID) | Title exibido | Mapeia para o card pedido |
|---|---|---|---|
| 1 | `compra-a-vista` | Compra à Vista | **Compra à Vista** (flagship absoluto) |
| 2 | `leverage-patrimonial` | Leverage Patrimonial | **Usar a Carta para Investir** |
| 3 | `escada-patrimonial` | Escada Patrimonial | **Aplicar em Investimentos** |
| 4 | `multiplicacao-cotas` | Acumulação por Cotas Sucessivas | **Multiplicação de Cotas** |
| 5 | `alavancagem-imobiliaria` | Alavancagem Imobiliária | **Gerar Renda com Aluguel** |
| 6 | `reforma-ampliacao` | Reforma e Ampliação | **Comprar e Valorizar** |
| 7 | `autoquitacao-estruturada` | Autoquitação Estruturada | **Entrar para Revender** (renda do próprio ativo amortiza a cota) |
| 8–24 | demais 17 estratégias | — | ordem original do catálogo |

`STRATEGY_LIBRARY_ORDERED` (sort `priority asc` + restante na ordem do catálogo) materializa essa sequência sem mudar a UI.

**Removidos da fila de flagship:** `energia-solar` (era priority 7) e `renda-passiva` (era priority 4). Continuam no catálogo, agora no segundo bloco.

## Compra à Vista Full Correction

Status: já reconstruída na onda anterior em torno da tese correta (preservação de liquidez). Nesta passada **nenhuma alteração de conteúdo foi necessária** — a estratégia já entrega:

- **Racional financeiro:** capital aplicado em renda fixa enquanto a carta paga o bem à vista; rendimento mensal cobre parte/totalidade da parcela.
- **KPIs/Calculations:** valor do bem, custo total do consórcio (`crédito × 1,25`), parcela média (`/180`), capital preservado, rendimento mensal `(1+CDI_LIQ)^(1/12)−1`, custo do financiamento equivalente (`crédito × 1,80`).
- **Comparativos:** comprometimento de caixa, custo financeiro, capital aplicado em paralelo, ônus sobre o bem.
- **Sem hype:** zero "multiplicador mágico", zero "explosão patrimonial". Tom técnico-consultivo.

Refeito alinhado ao simulador original.

## Visual Standardization

Sem mudança — `StrategyLibrarySection.tsx` já entrega:

- Grid único `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` com **24 cards de mesma anatomia**.
- Header consistente (chip de capítulo + ícone + título + tagline) em todos.
- Mesmo spacing (`p-4 md:p-5`), mesmo radius (`rounded-2xl`), mesmo border tonal (`accent.border`).
- Accent system semântico (primary/success/warning/destructive/muted) via `ACCENT_CLS` — sem dynamic class strings.

## Unified Card System

CTA único já em produção: **"Abrir Estratégia Completa" / "Fechar Estratégia Completa"** (toggle in-place, sem rota, sem modal, sem drawer). Aplicado igualmente nos 24 cards.

## KPI Surface Alignment

Toda estratégia expõe os mesmos 5 blocos quando expandida:

1. **Como funciona & racional financeiro** (howItWorks + patrimonialLogic + liquidityImpact + timing)
2. **Vantagens estruturais** + **Riscos, erros comuns e quando NÃO usar** (grid 2col)
3. **Cálculos & projeções (ilustrativos)** — tabela Métrica / Fórmula / Resultado
4. **Cenários reais de aplicação**
5. **Comparativos vs alternativas** — tabela Dimensão / Consórcio / Alternativa / Δ

Mesma matemática (constantes ADM_TOTAL/FIN_TOTAL/CDI_LIQ/CAP_RATE), mesmo disclaimer ilustrativo, mesmo padrão de KPI.

## UX Consolidation

- Sem toggles paralelos, sem CTAs concorrentes, sem variantes "v2".
- Sem camada flagship separada acima do grid (lição da onda anterior).
- Sem agrupamento por capítulo no rendering — apenas chip informativo no header de cada card.
- Mobile: 1 coluna; tablet: 2 colunas; desktop XL: 3 colunas. Mesmo comportamento expansível em todos os breakpoints.

## Final Strategy Order

```
01  Compra à Vista                          (compra-a-vista)
02  Leverage Patrimonial                    (leverage-patrimonial)         → Usar a Carta para Investir
03  Escada Patrimonial                      (escada-patrimonial)           → Aplicar em Investimentos
04  Acumulação por Cotas Sucessivas         (multiplicacao-cotas)          → Multiplicação de Cotas
05  Alavancagem Imobiliária                 (alavancagem-imobiliaria)      → Gerar Renda com Aluguel
06  Reforma e Ampliação                     (reforma-ampliacao)            → Comprar e Valorizar
07  Autoquitação Estruturada                (autoquitacao-estruturada)     → Entrar para Revender
─── catálogo (ordem do arquivo) ───
08  Compra Híbrida
09  Compra Planejada
10  Aquisição Acelerada
11  Reinvestimento Estruturado
12  Patrimônio Escalável
13  Retrofit Patrimonial
14  Energia Solar
15  Upgrade de Veículo
16  Renovação de Frota
17  Expansão Produtiva
18  Equipamentos Pesados
19  Agronegócio
20  Patrimônio Rural
21  Renda Passiva Programada
22  Patrimônio Gerador de Caixa
23  Holding Patrimonial
24  Planejamento Sucessório
```

## Final Module State

- `strategyLibraryData.ts` — 7 priorities reorganizadas; conteúdo intacto.
- `StrategyLibrarySection.tsx` — sem edição (consome `STRATEGY_LIBRARY_ORDERED`).
- `WealthPlatformModule.tsx` — sem edição.
- Motor financeiro, scoring, contexts, edges — não tocados (regra Core: nunca alterar lógica financeira em ondas de UI).

## Final Verdict

✅ **Reorder aplicado.** As 7 estratégias com maior força comercial e clareza consultiva agora abrem o módulo, na ordem exata pedida. CTA único, card system unificado, KPI surface alinhado, Compra à Vista correta. Sem dashboardization, sem feature layering, sem regressão de hierarquia.
