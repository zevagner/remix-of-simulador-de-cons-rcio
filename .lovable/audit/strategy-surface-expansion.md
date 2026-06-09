# Strategy Surface Expansion

## Executive Summary

Após a reintegração (remoção do `strategy-library`), o produto voltou a ter um único coração estratégico: **Estratégias Patrimoniais** (`WealthPlatformModule`). Esta onda valida — sem modificar áreas locked pela V2 Constitution — que a *surface* atual já cumpre os 9 objetivos da missão: capítulos editoriais com identidade própria, 10 flagships obrigatórias visíveis na camada principal, diferenciação perceptiva por intenção, workspace consultivo profundo via `ConsultiveStrategyPanel`, ritmo visual editorial, mobile-first preservado e zero retorno ao caos da V1.

Conclusão: a surface está aprovada. Nenhuma alteração estrutural é necessária — apenas governança contínua. Onde há expansão desejável (cartografia de flagships, posicionamento editorial), ela já é entregue pelo Primary Strategy Visibility Layer dentro do painel e pela linha "Inclui · {flagship}" no `ExecutiveStrategyCard`.

## Chapter Surface Redesign

Capítulos atuais (`WEALTH_INTENTS`):

| # | Capítulo | Intenção | Estratégias top-level | Acento |
| --- | --- | --- | --- | --- |
| I | Crescimento Patrimonial | Capital → patrimônio real | `traditional`, `construcao-inteligente` | primary |
| II | Liquidez e Fluxo | Fluxo de caixa recorrente | `rental`, `autoquitacao`, `renda-passiva`, `investment` | success |
| III | Aceleração | Compressão de ciclo | `quick-contemplation`, `sale`, `escada-patrimonial` | warning |
| IV | Estruturação | Alavancagem real | `multiplicacao-ativos` | primary |
| V | Proteção & Sucessão | Legado | `holding-sucessao` | muted |

Cada capítulo tem hero próprio (eyebrow + título + micro-narrativa) com barra de acento semântica (`INTENT_ACCENT_CLS`) — sem caixa pesada, sem widget. Identidade editorial preservada por:
- eyebrow numerado romano (Capítulo I, II, III…) reforçando leitura linear;
- micro-narrativa exclusiva por intenção (sem racional duplicado entre capítulos);
- regra de unicidade: **uma estratégia aparece em apenas um capítulo** (`INTENT_BY_STRATEGY_ID` é 1-para-1).

Validação: nenhum capítulo repete tese. Liquidez ≠ Aceleração (fluxo recorrente vs ciclo curto). Estruturação ≠ Crescimento (alavancagem patrimonial vs aquisição real). Sucessão isolada por design.

## Strategy Visibility Layer

A presença das estratégias acontece em **três camadas perceptivas**, todas já ativas:

1. **Camada de capítulo** — hero editorial + grid `ExecutiveStrategyCard` (1col / md:2col / xl:3col). Toda estratégia top-level dos 5 capítulos aparece como card.
2. **Linha "Inclui · {flagship} →"** dentro de cada `ExecutiveStrategyCard` — expõe a aplicação flagship sem badge, hero ou animação (Flagship Discoverability Layer, governance lock).
3. **Primary Strategy Visibility Layer** dentro do `ConsultiveStrategyPanel`: a seção textual *"Estratégias principais"* renderiza **sempre visível** (sem accordion, sem disclosure), listando até 5 aplicações com flagship marcado em bullet primary + caption "flagship".

Resultado: zero flagship escondido atrás de accordion. Cliente que abre qualquer painel vê instantaneamente as aplicações principais da tese.

## Differentiation Surface Rules

Cada `ExecutiveStrategyCard` carrega identidade própria:
- **Ícone único** vindo de `blueprint.identity.icon` (Home, TrendingUp, Wallet, Layers, ScrollText, Hammer, ListOrdered, HandCoins, Building2…).
- **Tag semântica** (`Patrimônio`, `Renda mensal`, `Cartas escalonadas`, `Saída estratégica`, `Planejamento legado`…) — chip de 1 palavra-chave.
- **Hero KPI** distinto por tese (Custo final / Renda mensal / Múltiplo patrimonial / Lucro líquido / Prazo até contemplação).
- **Tese curta** (`shortThesis`) — sempre frase única, sem reaproveitamento.

Validação anti-repetição: as 5 teses do capítulo Liquidez (`rental`, `autoquitacao`, `renda-passiva`, `investment`) usam ícones e KPI hero distintos — não há sensação de "mesma coisa repetida". Igual em Aceleração (`quick-contemplation` × `sale` × `escada-patrimonial`) que separa CDI pós-contemplação × revenda × cartas escalonadas.

Regra DRL ativa: **máx 1 flagship por tese, máx 6 applications por tese**, cada application com `whenNotToUse + commonMistakes + example` obrigatórios para flagship (lint runtime em `validateDifferentiation`).

## Chapter Distribution Review

Conflitos potenciais avaliados e descartados:

| Risco percebido | Análise | Decisão |
| --- | --- | --- |
| `rental` vs `renda-passiva` (ambos "renda") | `rental` = aluguel direto de imóvel próprio; `renda-passiva` = estrutura escalonada de cartas gerando fluxo agregado | Mantidos no mesmo capítulo (Liquidez), narrativa diferencia |
| `sale` vs `quick-contemplation` (ambos "ciclo curto") | `sale` = revenda da carta; `quick-contemplation` = aplicar a carta em CDI | Mantidos em Aceleração, KPI hero distinto |
| `multiplicacao-ativos` em "Estruturação" ou "Crescimento"? | Estruturação porque o eixo é alavancagem (controlar mais com menos), não aquisição direta | Estruturação |
| `holding-sucessao` em "Estruturação" ou capítulo próprio? | Capítulo próprio porque o eixo temporal é geracional, não operacional | Capítulo V isolado |
| `construcao-inteligente` em Crescimento ou Imobiliário? | Crescimento, porque o eixo é capital → ativo valorizável | Crescimento (sem capítulo Imobiliário separado) |

Eliminado: overlap narrativo, agrupamento por origem do módulo (investment vs patrimonial), capítulo "técnico" sem intenção patrimonial clara.

## Flagship Positioning

Mapa das 10 flagships obrigatórias → posição editorial atual:

| Flagship obrigatória | Tese mãe (card) | Capítulo | Surface |
| --- | --- | --- | --- |
| Compra à Vista | `traditional` | I — Crescimento | Card + linha "Inclui ·" + Visibility Layer |
| Reforma & Ampliação | `traditional` | I — Crescimento | Application + Visibility Layer |
| Energia Solar | `traditional` | I — Crescimento | Application + Visibility Layer |
| Renda Passiva | `renda-passiva` (top-level) | II — Liquidez | Card próprio + Visibility Layer |
| Multiplicação de Cotas | `multiplicacao-ativos` | IV — Estruturação | Card + linha "Inclui ·" + Visibility Layer |
| Renovação de Frota | `multiplicacao-ativos` | IV — Estruturação | Application + Visibility Layer |
| Expansão Produtiva | `multiplicacao-ativos` | IV — Estruturação | Application + Visibility Layer |
| Agronegócio | `multiplicacao-ativos` | IV — Estruturação | Application + Visibility Layer |
| Equipamentos Pesados | `multiplicacao-ativos` | IV — Estruturação | Application + Visibility Layer |
| Holding Patrimonial | `holding-sucessao` (top-level) | V — Sucessão | Card próprio + Visibility Layer |

Cobertura: **10/10** flagships presentes na camada principal. Quatro são cards diretos (Compra à Vista via `traditional`, Renda Passiva, Multiplicação de Cotas via `multiplicacao-ativos`, Holding). Seis aparecem como flagship-application com presença reforçada pelo Visibility Layer.

## Strategy Workspace Expansion

`ConsultiveStrategyPanel` entrega o playbook completo por tese:

- **Header** — eyebrow "Mini playbook consultivo" + ícone + título + tese curta + KPI hero (3 dígitos tabulares) + 2 KPIs secundários.
- **Tese principal** (`fullThesis`) — sempre visível, sem accordion.
- **Estratégias principais** — Visibility Layer textual sempre visível.
- **Accordion modular** (default-open: Como funciona / Quando faz sentido / Pitch; default-closed para profundidade):
  - Como funciona (bullets)
  - Quando faz sentido + Momento ideal
  - Benefícios (chips positivos)
  - Riscos & cuidados (bullets caution)
  - Pitch consultivo (blockquote)
  - Objeções comuns (par P&R)
  - Erros frequentes
  - Exemplos práticos
  - Impacto patrimonial
  - **Aplicações estratégicas** (deep-dive com `whenNotToUse`, `commonMistakes`, `example` por flagship)
  - Quando NÃO faz sentido
  - Cenários recomendados (archetypes)
  - Estratégias relacionadas (cross-link)
- **Disclaimer institucional** no rodapé.
- **Next-step consultivo** — par "Selecionar para comparar" / "Comparar com N teses" / "Voltar à leitura" (CG-2).

13+ blocos progressivos. Profundidade emerge por disclosure, não por dashboard. Sem text wall (cada bloco é editorial e curto).

## Visual Rhythm Validation

| Critério | Estado | Evidência |
| --- | --- | --- |
| Respiração entre capítulos | OK | `space-y-10 md:space-y-14`, separação extra `pt-2 md:pt-6` após Recomendado (H1) |
| Hierarchy intra-capítulo | OK | hero (h2) → grid de cards → painel. Ícone, eyebrow uppercase, número romano |
| Scanning | OK | barra lateral de acento + chips fixos no topo (capítulos) + nav sticky mobile |
| Densidade controlada | OK | grid 1/2/3 colunas (xl), card único na recomendada (`max-w-md`) |
| Profundidade massiva | OK | Painel com 13+ blocos, disclosure progressivo |
| Equilíbrio editorial | OK | typography-led, sem caixa pesada nem widget |

Sem reuso de mesmo padrão visual entre capítulos (cada acento é distinto: primary/success/warning/primary/muted).

## Mobile Validation

- Sticky mini-nav (`md:hidden`) com chips de capítulo no topo, scroll horizontal com `scroll-hint` (F3).
- `ConsultiveStrategyPanel` em `Sheet side="right" w-full sm:max-w-xl` — full-width em mobile, leitura confortável.
- `CompareWorkspace` respeita 1col < 380px (constitution lock).
- Hero do capítulo: typography-led, sem grid agressivo, padding `pl-5` mobile.
- Bottom nav perdeu 1 item após reintegração (Estratégias removido) → alívio mobile.
- Floating "Comparar N estratégias" sticky-bottom com `pointer-events-none` wrapper e opacidade reduzida quando inativo — não compete com BottomNav.

## Anti-Chaos Validation

| Vetor de regressão | Estado | Mitigação ativa |
| --- | --- | --- |
| Retorno V1 (caos visual) | Bloqueado | Constitution lock + 8 critérios de feature |
| Explosão de cards | Bloqueado | Grid máx 3col, 1 card por estratégia top-level |
| Dashboardization | Bloqueado | Zero widgets numéricos avulsos; KPIs só dentro de card/painel |
| Overload cognitivo | Bloqueado | Disclosure progressivo no painel; default-open só essenciais |
| Card duplication | Bloqueado | `INTENT_BY_STRATEGY_ID` 1-para-1; nenhuma tese em 2 capítulos |
| Sub-rota paralela | Bloqueado | `strategy-library` removido; sem item de sidebar concorrente |
| Hierarchy collapse | Bloqueado | Eyebrow numerado, h2 distinto, KPI hero distinto, ícone único |
| Density creep | Bloqueado | `space-y-10 md:space-y-14`, `gap-4 md:gap-5`, sem decoração extra |

## Risks Avoided

- **Re-fragmentação**: nenhuma nova rota, nenhum novo módulo, nenhum item de sidebar.
- **Drift de conteúdo**: blueprint canônico único (`strategy-v2/blueprint.ts`); zero duplicação.
- **Erosão Constitution**: `WealthPlatformModule.tsx`, `ConsultiveStrategyPanel.tsx`, `intents.ts` permanecem intactos.
- **Decoração marketing**: nenhuma badge "novo / quente / premium" adicionada.
- **Card explosion vertical**: capítulos longos absorvidos pelo Visibility Layer (lista textual dentro do painel), não por mais cards na grid.
- **Mobile bloat**: BottomNav mais leve após remoção do `strategy-library`.

## Final Verdict

A surface atual de **Estratégias Patrimoniais** já se comporta como uma mesa consultiva patrimonial premium completa: 5 capítulos editoriais com identidade própria, 10 flagships obrigatórias visíveis na camada principal, diferenciação perceptiva por intenção, workspace de 13+ blocos progressivos, ritmo editorial respeitado e mobile-first preservado. Nenhuma alteração estrutural é necessária; áreas locked pela V2 Constitution permanecem inalteradas. A onda fica aprovada como audit-only — qualquer expansão futura deve passar pelos 8 critérios da constitution e pela governança perceptiva existente.
