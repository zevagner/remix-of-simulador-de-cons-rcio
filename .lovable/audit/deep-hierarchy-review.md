# Deep Hierarchy Review
**Surface:** Plataforma Patrimonial · Edição Consultiva (`WealthPlatformModule`)
**Escopo:** Hierarchy perceptiva — global, tipográfica, seccional, capítulos, consultiva, ritmo, whitespace, scanning, premium
**Modo:** Auditoria pura — 0 alterações de código, 0 dependências, 0 motor, 0 schema
**Data:** 2026-05-16

---

## Executive Summary

A V2 estabeleceu uma **hierarchy editorial real** — não um "design system aplicado a um dashboard", mas uma **estrutura narrativa em camadas**: Hero → Recomendada → Capítulos por Intenção → Card → Panel → Compare. Cada nível tem peso visual distinto, eyebrow editorial, anchor próprio (barra vertical colorida) e ritmo de leitura calibrado.

A hierarchy **não colapsa em nenhum ponto crítico**. Os 3 níveis de H (H1 hero, H2 capítulos, títulos de cards) são **diferenciados em peso, escala e tracking**. Não há competição entre eyebrow uppercase + H1 + body — cada um ocupa um plano perceptivo distinto.

**Pontos de fricção residuais (todos cirúrgicos):**
1. **Equivalência visual entre cards** dentro de capítulos longos — `ExecutiveStrategyCard` é uniforme; bom para consistência, neutro para hierarchy intra-capítulo (não há "card primário vs secundário").
2. **Recomendada compete sutilmente com 1º capítulo** — separação de gradiente é elegante mas pode ser perdida em scroll rápido.
3. **Sticky compare CTA** introduz um plano hierárquico flutuante que, embora útil, **adiciona um anchor competitivo** quando >2 estratégias selecionadas durante leitura editorial.

**Veredicto:** **A. APROVADO** — hierarchy premium real, 0 🔴, 3 🟡 priority, 5 🟢 surgical. **Zero resíduo V1 detectado em hierarchy.**

---

## 1. Global Hierarchy Analysis

**Estrutura perceptiva top-down:**

```
NÍVEL 1 — HERO EDITORIAL                   [domínio absoluto]
   ├─ Eyebrow institucional
   ├─ H1 (text-3xl/5xl)
   ├─ Lead paragraph (text-15/lg)
   └─ Chips de capítulo (anchors navegáveis)

NÍVEL 2 — TESE RECOMENDADA                 [destaque institucional]
   ├─ Separador editorial (gradient-via-primary/30)
   ├─ Eyebrow "Em destaque"
   ├─ H2 "Tese recomendada"
   └─ ExecutiveStrategyCard centralizado (max-w-md/lg)

NÍVEL 3 — CAPÍTULOS POR INTENÇÃO           [exploração curada]
   ├─ Eyebrow + ícone (intent.eyebrow)
   ├─ H2 (text-2xl/[28px])
   ├─ Lead paragraph (text-13.5/15)
   └─ Grid de cards (1/2/3 col)

NÍVEL 4 — CARD                             [unidade exploratória]
NÍVEL 5 — PANEL CONSULTIVO                 [profundidade controlada]
NÍVEL 6 — COMPARE WORKSPACE                [decisão final]
```

**6 níveis perceptivos, todos distintos.** Nenhum compete com outro porque cada um tem:
- Tipografia própria
- Spacing próprio (`space-y-10 md:space-y-14` entre seções)
- Acionamento próprio (scroll, click, sheet)

**Hierarchy collapse?** Não detectado.
**Competição entre elementos?** Apenas residual no Nível 2 vs Nível 3 (ver §3).
**Excesso de equivalência?** Apenas dentro do grid de cards de um mesmo capítulo (ver §4).

---

## 2. Typography Hierarchy Analysis

**Escala canônica observada:**

| Nível | Token | Peso | Tracking | Função perceptiva |
|---|---|---|---|---|
| Eyebrow institucional | `text-[10px] uppercase tracking-[0.18em]` | medium | wide | **Anchor de categoria** |
| H1 hero | `text-3xl md:text-5xl font-semibold tracking-tight` | semibold | tight | **Domínio absoluto** |
| Lead hero | `text-[15px] md:text-lg leading-relaxed` | regular | normal | **Contextualização** |
| H2 capítulo | `text-2xl md:text-[28px] font-semibold tracking-tight` | semibold | tight | **Abertura de seção** |
| Eyebrow capítulo | `text-[10px] uppercase tracking-[0.18em]` | medium | wide | **Identificador de intent** |
| Lead capítulo | `text-[13.5px] md:text-[15px] leading-relaxed` | regular | normal | **Tese narrativa** |
| Card title | (no `ExecutiveStrategyCard`) | semibold | normal | **Identidade da estratégia** |

**Diferenciação entre níveis:** ✅ **Forte e consistente.**

- H1 vs H2: diferença de ~30% em escala desktop (5xl vs 28px) e 20% em mobile (3xl vs 2xl) — **legível, não brutal**.
- Eyebrow vs body: diferença de tracking dramática (0.18em vs normal) — **cria respiração editorial**, não apenas tamanho.
- Lead vs body de card: hierarquia por **comprimento de linha** (max-w-3xl no capítulo, mais curto no card) — sofisticado.

**Uniformidade excessiva?** Não.
**Excesso de peso?** Não — apenas `font-semibold` nos H, sem `font-bold`.
**Baixa diferenciação?** Não — eyebrow + H1 + lead têm 3 tratamentos visualmente distintos.

**Sensação premium tipográfica:** ✅ **Editorial real.** O uso de `tracking-[0.18em]` em eyebrow uppercase é a assinatura visual que separa "produto editorial" de "dashboard SaaS".

---

## 3. Section Dominance Analysis

**Mapa de dominância visual em scroll vertical:**

| Seção | Dominância | Justificativa |
|---|---|---|
| Hero | 🔵🔵🔵🔵🔵 | Gradiente + blurs + H1 5xl + altura ~360px |
| Recomendada | 🔵🔵🔵🔵 | Separador gradient + eyebrow "Em destaque" + card centralizado |
| Capítulo (hero) | 🔵🔵🔵 | Barra vertical colorida + H2 + lead |
| Capítulo (grid de cards) | 🔵🔵🔵 | Cards uniformes, dominância distribuída |
| Sticky compare CTA | 🔵🔵 (flutuante) | Aparece apenas com 2+ selecionados |
| Empty state | 🔵🔵 | Editorial, dashed border, não compete |

**Áreas que dominam:** Hero e Recomendada — **correto**, são os dois âncoras de orientação.
**Áreas que desaparecem:** Nenhuma. O empty state é editorial, não invisível.
**Competição entre blocos:**

- 🟡 **Recomendada vs 1º capítulo:** o separador gradient da Recomendada é elegante, mas em scroll rápido a transição "Recomendada (centralizada) → Capítulo (grid)" pode ser lida como "card destacado + outros cards". O eyebrow "Em destaque" mitiga, mas não elimina.
- 🟢 **Sticky CTA vs lead de capítulo:** o CTA flutuante adiciona um plano hierárquico **acima** do conteúdo editorial. Em desktop é discreto; em mobile, com 2+ seleções, ocupa atenção competitiva durante leitura de novos capítulos.

**Excesso de destaque simultâneo?** Não — apenas 1 capítulo em foco por viewport.

---

## 4. Chapter Hierarchy Analysis

**Anatomia de um capítulo:**

```
┌─[barra vertical colorida w-[2px]]────────────
│  ▣ EYEBROW + ícone
│  H2 Title
│  Lead paragraph (max-w-3xl)
│
│  [Card] [Card] [Card]    ← grid 1/2/3 col
└──────────────────────────────────────────────
```

**Identidade visual por capítulo:**
- ✅ Barra vertical colorida (`accent.dot`) — **anchor mobile-first canônico**
- ✅ Eyebrow com ícone próprio do intent
- ✅ H2 + lead diferenciados
- ❌ Cards **não variam** entre capítulos — todos usam o mesmo `ExecutiveStrategyCard` com mesmo template

**Continuidade narrativa:** ✅ Forte — cada capítulo tem `eyebrow → H2 → lead → cards`, padrão repetido por design (ritmo institucional).

**Repetição estrutural:** 🟡 **Presente intencionalmente.**

Esse é o **trade-off editorial canônico**: consistência institucional vs variação rítmica.

- **Pró-consistência:** o leitor sabe ler qualquer capítulo em <2s após o primeiro. Sensação de "produto editado".
- **Contra-consistência:** após 4+ capítulos, a estrutura vira "wallpaper rítmico" — o usuário escaneia em piloto automático.

**Veredicto:** A repetição estrutural **é a escolha correta** para a maturidade atual do produto. Quebrá-la introduziria fragmentação V1.

**Collapse narrativo?** Não.
**"Blocos iguais"?** Sim, intencionalmente — é o pilar de consistência.

---

## 5. Consultive Hierarchy Analysis

**Progressão consultiva em camadas:**

```
Camada 0 — HERO          "O que é esta plataforma"
Camada 1 — RECOMENDADA   "O que recomendamos para este cliente"
Camada 2 — CAPÍTULOS     "Outras intenções que você pode explorar"
Camada 3 — CARD          "O que esta tese específica oferece"
Camada 4 — PANEL         "Como ela se aplica em profundidade"
Camada 5 — COMPARE       "Como ela se compara com outras"
```

**Clareza consultiva:** ✅ **Excelente.** Cada camada responde uma pergunta consultiva real.

**Autoridade percebida:**
- ✅ Linguagem ("curadoria", "tese", "edição consultiva") — institucional sem ser arrogante
- ✅ Recomendada destacada com eyebrow "Em destaque" — sinaliza opinião editorial
- ✅ Compare como **decisão final**, não como tabela técnica

**Excesso técnico em hierarchy?** Não — números e métricas estão **dentro** do card, nunca no nível de seção.
**Perda de condução?** Não — cada camada termina com um affordance claro (chip, scroll, click, sheet).
**Sensação de orientação premium:** ✅ Alta.

---

## 6. Visual Rhythm Analysis

**Cadência espacial:**

```
HERO (denso)            ████████████  ← peso
                        ░░░░          ← respiro space-y-10/14
RECOMENDADA (leve)      ████
                        ░░░░
CAP 1 hero (leve)       ███
CAP 1 cards (médio)     █████
                        ░░░░
CAP 2 hero (leve)       ███
CAP 2 cards (médio)     █████
                        ░░░░
...
```

**Alternância de densidade:** ✅ Boa — hero denso, recomendada leve, capítulos com hero-leve + cards-médios.

**Pausas perceptivas:**
- ✅ `space-y-10 md:space-y-14` entre seções — respiro generoso e consistente
- ✅ `space-y-6` interno aos capítulos — agrupa hero + grid sem soltar

**Cadência editorial:** ✅ Real — segue padrão "abertura → respiro → conteúdo → respiro".

**Ritmo quebrado?** Não.
**Densidade acumulada?** Detectada apenas a partir do 4º capítulo (já mapeado em audit mobile).
**Peso visual contínuo?** Não — os blurs do hero não se repetem nos capítulos, evitando "fadiga de gradiente".

---

## 7. Whitespace Analysis

**Tokens canônicos observados:**

| Contexto | Token | Veredicto |
|---|---|---|
| Entre seções | `space-y-10 md:space-y-14` | ✅ Generoso, editorial |
| Hero padding | `px-6 py-10 md:px-12 md:py-16` | 🟡 Mobile leve excesso (ver audit mobile §2) |
| Capítulo interno | `space-y-6` | ✅ Agrupa sem soltar |
| Grid de cards | `gap-4 md:gap-5` | ✅ Adequado para cards de média densidade |
| Lead max-width | `max-w-2xl` (hero), `max-w-3xl` (capítulo) | ✅ Linha de leitura ótima (~70 chars) |

**Sensação de calma:** ✅ Alta. Whitespace não é "vazio sem propósito" — é **separação narrativa**.

**Whitespace insuficiente?** Não — exceto micro-ajustes mobile no hero.
**Excessivo?** Não — `space-y-14` desktop é editorial, não desperdício.
**Colapso de agrupamento?** Não — `space-y-6` interno aos capítulos mantém hero+grid coesos.

**Whitespace orchestration:** ✅ **Estratégica e consistente.** É um dos pilares que mais distancia a V2 da V1.

---

## 8. Scanning Priority Analysis

**Eye flow esperado vs real:**

| Ordem | Elemento | Anchor visual |
|---|---|---|
| 1 | Eyebrow hero | Tracking + uppercase + sparkles icon |
| 2 | H1 "Estratégias Patrimoniais" | text-5xl + tracking-tight |
| 3 | Lead paragraph | leading-relaxed |
| 4 | Chips de capítulo | scroll-x affordance |
| 5 | Recomendada (após scroll) | Separador gradient + eyebrow "Em destaque" |
| 6 | Capítulo 1 eyebrow | Barra vertical colorida + ícone |
| 7 | Capítulo 1 H2 + lead | Hierarquia tipográfica |
| 8 | Cards do capítulo 1 | Grid uniforme |
| 9 | Próximo capítulo | Repete padrão |

**Scanning é linear vertical.** ✅ Correto — não há "L-shape" forçado nem grid Z-pattern competindo.

**Múltiplos focos simultâneos?** 🟡 **Sutil:**
- Sticky compare CTA + capítulo em leitura = 2 focos quando 2+ selecionados.
- Recomendada (centralizada, max-w-lg) + capítulo seguinte (grid full-width) = transição visual abrupta.

**Anchors visuais canônicos:**
- ✅ Barra vertical colorida nos capítulos — assinatura mobile-first
- ✅ Eyebrow uppercase tracking-wide — assinatura editorial
- ✅ Separador gradient na Recomendada — assinatura institucional

**Perda de orientação?** Não em scroll <2000px. Após 3500px, o usuário perde referência (já mapeado em audit mobile §8).

---

## 9. Premium Perception Analysis

**Checklist editorial premium:**

| Critério | V2 | Justificativa |
|---|---|---|
| Sofisticação tipográfica | ✅ | Tracking-wide eyebrow + tracking-tight H + scale ratio editorial |
| Inteligência hierárquica | ✅ | 6 níveis perceptivos distintos sem competição |
| Calma visual | ✅ | space-y-10/14, blurs sutis, gradients institucionais (primary/[0.09]) |
| Editorial premium | ✅ | "Curadoria", "edição consultiva", "tese", "em destaque" |
| Confiança | ✅ | Sem CTAs gritantes, sem badges piscantes, sem cores saturadas |
| Profundidade controlada | ✅ | 3 níveis de drill-down (card → panel → compare) |

**Resíduos V1 detectados em hierarchy:**

| Resíduo procurado | Detectado? |
|---|---|
| Múltiplos H1 competindo | ❌ |
| Cards com mesma escala visual de H2 | ❌ |
| Badges/pills disputando atenção com eyebrows | ❌ |
| Grids sem capítulo introdutório | ❌ |
| Tabs internas competindo com chips | ❌ |
| Cores saturadas como anchor primário | ❌ |
| Ícones decorativos sem função hierárquica | ❌ |
| Numerais SaaS soltos em headers | ❌ |
| "Card de boas-vindas" / banners promocionais | ❌ |
| Hierarchy por cor em vez de tipografia | ❌ |

**Resíduo V1 em hierarchy:** **ZERO.** ✅✅✅

---

## 10. Hierarchy Risks

**🔴 Riscos bloqueantes:** **NENHUM.**

Não há pontos onde a hierarchy:
- Quebra em mobile
- Confunde scanning
- Esconde valor
- Compete com motor financeiro
- Cria ambiguidade de prioridade

**🟡 Riscos cirúrgicos identificados:**

| # | Risco | Impacto | Onde |
|---|---|---|---|
| R1 | Recomendada e 1º capítulo podem ser lidos como continuum em scroll rápido | Médio | §3 |
| R2 | Sticky CTA introduz plano hierárquico flutuante competitivo | Baixo | §3, §8 |
| R3 | Equivalência visual de cards dentro de um capítulo longo (>5 cards) | Baixo | §4 |

---

## 11. High Priority Hierarchy Fixes (🟡 — janela 2–3 dias)

| # | Fix | Arquivo | Esforço | Impacto |
|---|---|---|---|---|
| **H1** | Reforçar separação Recomendada → 1º capítulo: aumentar `space-y` específico após Recomendada (ex.: wrapper `mt-14 md:mt-20` no 1º capítulo) ou adicionar mini-divider editorial textual ("Outras intenções para explorar") | `WealthPlatformModule.tsx` | XS | Médio — resolve R1 |
| **H2** | Sticky CTA: reduzir prominência visual quando seção em foco é capítulo (ex.: `opacity-90` ou `scale-95` durante scroll ativo, restaurar em pause >800ms) | `WealthPlatformModule.tsx` | S | Baixo-Médio — resolve R2 |
| **H3** | Em capítulos com **1 card único**, centralizar com `max-w-md` + eyebrow expandido (mesmo tratamento da Recomendada, sem o separador) — elimina "card órfão" | `WealthPlatformModule.tsx` `IntentSection` | XS | Médio — resolve fricção mapeada em audits anteriores |

**Todas as fixes:** zero impacto em motor, contexts, telemetria, desktop crítico.

---

## 12. Safe Surgical Improvements (🟢 — backlog opcional)

1. **S1.** Mini-nav sticky de capítulos em mobile após scroll >800px — reforça hierarchy de seção (já mapeado em audit mobile como F4).
2. **S2.** `view-transition-name` no eyebrow + H2 do capítulo → eyebrow + H2 do panel — cria continuidade hierárquica entre níveis 3 e 5.
3. **S3.** Micro-anim no eyebrow do capítulo ao entrar em viewport (`fade-up` 200ms, dismiss após 1ª animação) — ressalta o anchor sem agitar.
4. **S4.** Em desktop xl+, considerar **lead paragraph do capítulo em coluna lateral** (asymmetric grid 1/3 + 2/3) para variação rítmica em catálogos longos — apenas se >3 capítulos.
5. **S5.** Reduzir `py-10` → `py-7` no hero em mobile (já mapeado em audit mobile como F2) — libera dobra inicial.

---

## 13. Improvements Explicitly NOT Recommended

| ❌ NÃO fazer | Por quê |
|---|---|
| Adicionar mais variantes tipográficas | A escala atual (eyebrow/H1/H2/lead/body) é suficiente; mais níveis introduzem hierarchy collapse |
| Usar cor saturada como anchor primário | Quebra "calma visual"; barra vertical colorida (`accent.dot`) já é o anchor canônico |
| Diferenciar cards por tamanho dentro de um capítulo (1 grande + 2 pequenos) | Reintroduz "dashboard SaaS feel"; quebra consistência institucional |
| Adicionar números nos capítulos ("01 Crescer", "02 Proteger") | Hierarchy editorial premium evita numeração explícita; eyebrow + barra colorida já segmentam |
| Animar entrada de cards stagger | Quebra a calma; introduz custo perceptivo sem ganho hierárquico |
| Substituir `space-y-10/14` por divisores `<hr>` | Whitespace é o divisor; linhas explícitas dão "documento técnico", não "edição" |
| Aplicar background diferenciado por capítulo | Quebra "identidade temática sem virar página colorida" — a barra vertical colorida já cumpre |
| Reordenar dinamicamente os capítulos por scoring | Quebra mapa mental do leitor; hierarchy de capítulo é narrativa, não algorítmica |
| Acordeon nos capítulos para "limpar" | Esconde valor; volta ao fluxo de descoberta da V1 |
| Tabs internas dentro de capítulos | Reintroduz fragmentação V1 — explicitamente abandonado |

---

## 14. Final Hierarchy Verdict

### **A. APROVADO — Hierarchy Editorial Premium Real**

**Resumo:**
- 🔴 **Bloqueantes:** 0
- 🟡 **High priority (cirúrgicos):** 3 (H1–H3)
- 🟢 **Safe surgical (backlog):** 5 (S1–S5)
- ❌ **Não recomendados:** 10 (documentados §13)
- 🚫 **Resíduos V1 em hierarchy:** ZERO

**A hierarchy V2 entrega:**
- ✅ Calma visual real (whitespace estratégico, sem ruído)
- ✅ Scanning rápido (6 níveis distintos, anchors canônicos)
- ✅ Fluidez editorial (cadência, respiro, alternância de densidade)
- ✅ Profundidade elegante (drill-down em 3 camadas)
- ✅ Narrativa consultiva (eyebrow → H2 → lead → grid → card → panel → compare)
- ✅ Percepção premium (tipografia editorial, gradientes institucionais, ícones funcionais)

**Comparação V1 vs V2 em hierarchy:**

| Dimensão | V1 | V2 |
|---|---|---|
| Níveis perceptivos distintos | 2–3 (planos) | 6 (camadas) |
| Anchors visuais canônicos | Cores saturadas, badges | Eyebrow tracking-wide + barra vertical colorida |
| Whitespace orchestration | Inconsistente (densidade variável) | Sistemático (`space-y-10/14`) |
| Tipografia editorial | Uniforme (apenas escala) | Editorial real (tracking + escala + função) |
| Competição entre seções | Frequente (múltiplos H1, badges) | Residual (R1, R2 cirúrgicos) |
| Sensação premium | Dashboard SaaS | Edição consultiva |

**V2 vence 6/6 dimensões hierárquicas.**

---

**Recomendação executiva:**
- ✅ **Default ON imediato** — hierarchy production-ready
- 🔧 **Janela curta (2–3 dias)** para H1–H3
- 📋 **S1–S5 como backlog** sem urgência
- ❌ **Bloquear iniciativas que reintroduzam fragmentação** (lista §13)

**A hierarchy da V2 não parece um dashboard, não parece uma UI corporativa, não parece a V1. Parece o que foi prometido: uma plataforma patrimonial editorial premium com profundidade controlada e narrativa consultiva real.**

---

**Invariantes preservadas (zero alterações nesta wave):**
- `src/core/finance/*` intacto
- `WealthPlatformModule`, `intents.ts`, `ConsultiveStrategyPanel`, `CompareWorkspace` intactos
- Telemetria U8 intacta
- Contexts intactos
- Zero novos chunks, deps, renders, queries, motor
