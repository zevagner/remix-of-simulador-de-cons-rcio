# Deep Consultive Flow Review

> Wave type: **pure audit** — zero code changes, zero dependency changes, zero motor changes.
> Scope: validar o fluxo consultivo end-to-end da `Plataforma Patrimonial · Edição Consultiva` (V2 unificada).
> Invariantes preservadas: `src/core/finance/*`, `WealthPlatformModule.tsx`, `intents.ts`, telemetria U8.

---

## Executive Summary

A V2 entrega, hoje, uma **experiência consultiva real** — não um dashboard. O usuário é conduzido por uma narrativa editorial (Hero → Recomendado → Capítulos → Card → Painel → Compare), com guidance suficiente para decidir sem precisar inventar caminhos. O sistema **fala como consultor**, não como catálogo.

**Veredito:** **A. APROVADO** para produção real.
- 🔴 Críticos: **0**
- 🟡 Altos: **3** (CG-1, CG-2, CG-3) — todos cirúrgicos, sem mexer em motor/arquitetura.
- 🟢 Polimentos: **4**

A sensação dominante é **"consultoria patrimonial premium"**, não "simulador bancário". Os resquícios de V1 (catálogo de estratégias, dashboard de KPIs) foram eliminados; o que resta são fricções pontuais de guidance e densidade — corrigíveis em janela curta.

---

## Global Consultive Experience Analysis

**Sensação dominante:** consultoria editorial guiada.

| Dimensão | V1 (legado) | V2 (atual) |
|---|---|---|
| Metáfora mental | Dashboard / catálogo | Edição consultiva / publicação |
| Voz do sistema | Funcional ("Simule X") | Consultiva ("Para seu objetivo, recomendamos…") |
| Densidade inicial | Alta (todos os módulos visíveis) | Baixa (Hero + 1 recomendado) |
| Autoridade percebida | Ferramenta | Conselho |
| Continuidade | Modular fragmentada | Capítulos encadeados |

**Vitórias claras:**
- Hero institucional ancora a tese antes de qualquer dado.
- "Recomendado para você" age como **primeira fala do consultor** — não como CTA de feature.
- Capítulos patrimoniais substituem a tab-soup do V1 sem perder profundidade.
- Compare Workspace fecha o ciclo decisório dentro da mesma narrativa.

**Risco residual:** a transição **Recomendado → Capítulos** ainda parece "duas seções" em vez de "um próximo passo" (ver CG-1).

---

## Consultive Guidance Analysis

**Pontos fortes:**
- Cada capítulo tem um *macro thesis* curto antes dos cards — o usuário entende **por que** está vendo aquele bloco.
- O painel da estratégia abre com narrativa antes dos números — guidance > raw data.
- CTAs são consultivos ("Comparar com…", "Ver detalhe consultivo"), não funcionais ("Simular", "Calcular").

**Fricções detectadas:**
- 🟡 **CG-1 — Hand-off entre "Recomendado" e "Capítulos":** após o card recomendado, não há frase de transição ("Explore outras teses abaixo"). O usuário interpreta como "fim" e não como "continue a leitura".
- 🟡 **CG-2 — Painel da estratégia não oferece guidance pós-leitura:** ao final do panel, falta um *next-step consultivo* explícito ("Comparar com 2 outras teses" como ação principal vs. genérico "Voltar").
- 🟢 Compare guidance é bom mas o "Winners" poderia carregar uma microfrase consultiva ("Para perfil X, esta tese conduz melhor").

**Veredito guidance:** **forte**, com 2 gaps pequenos de continuidade.

---

## Narrative Flow Analysis

**Sequência atual (validada):**

```
Hero (tese global)
  ↓
Recomendado (1 estratégia âncora)
  ↓
Capítulos patrimoniais (teses agrupadas)
  ↓
Card de estratégia (resumo + intent)
  ↓
Painel consultivo (narrativa + números)
  ↓
Compare Workspace (decisão)
```

**Avaliação:**
- ✅ Progressão lógica clara: tese → recomendação → exploração → profundidade → decisão.
- ✅ Sem repetição estrutural entre capítulos (cada um carrega seu intent e cor).
- ✅ Sem seções "órfãs" — todo bloco tem função narrativa.
- 🟡 **CG-3 — Quebra sutil entre Capítulos e Compare:** o usuário entra no Compare via CTA dentro do painel, mas ao voltar perde o "marcador de leitura" do capítulo. Falta âncora de retorno.

---

## Discovery Experience Analysis

**Pontos fortes:**
- Densidade inicial baixa força exploração gradual — discovery é **convite**, não **obrigação**.
- Cores semânticas (barras `w-[2px]` por intent) servem de mapa cognitivo durante o scan.
- Capítulos colapsam complexidade sem esconder profundidade.

**Riscos:**
- 🟢 Usuários muito autônomos podem **não perceber** que cada capítulo tem múltiplas teses — chips de capítulo precisam de fade-edge mais visível em mobile (já listado em F3 da wave mobile).
- ✅ Sem labirinto: sempre 1 caminho dominante + 1–2 alternativos. Sem decision-tree explosiva.

**Veredito discovery:** **fluido**, sem fadiga de exploração.

---

## Consultive Confidence Analysis

**Sinais de autoridade presentes:**
- Linguagem editorial ("Edição Consultiva", "tese patrimonial", "recomendamos").
- Disclaimers institucionais sem poluir a narrativa.
- Compare Winners apresenta vantagem quantificada ("+X% vs 2nd") — autoridade com lastro.
- Insights consultivos limitados a 4 — evita verborragia.

**Riscos de confiança:**
- ✅ Sem ambiguidade nas recomendações (1 winner claro por dimensão).
- ✅ Sem excesso técnico exposto no hero/cards — tecnicidade só no painel sob demanda.
- 🟢 Microcopy do "Recomendado" poderia explicitar **por que** foi recomendado (1 linha de racional consultivo).

**Veredito confidence:** **alta**. O sistema soa como consultor sênior, não como assistente.

---

## Decision Journey Analysis

**Mapa decisório:**

```
Entendimento (Hero + Recomendado)
  → Exploração (Capítulos)
    → Aprofundamento (Painel)
      → Comparação (Workspace)
        → Decisão (Winner + Insights)
```

**Pontos fortes:**
- Cap institucional de 3 estratégias no Compare elimina paralisia.
- "Winners" condensa a decisão em 1 olhada.
- Sticky CTA mobile reduz fricção de avanço.

**Fricções:**
- 🟡 Já capturado em CG-2 (falta next-step pós-painel).
- 🟢 Ao chegar no Compare com apenas 1 estratégia selecionada, o sistema poderia sugerir consultivamente as 2 melhores para comparar (hoje exige seleção manual).

**Veredito decision journey:** **clara**, com decision fatigue controlada.

---

## Context Preservation Analysis

**Validado:**
- Estado de capítulo expandido persiste durante navegação no painel.
- Compare carrega contexto do capítulo de origem.
- Hero não "reseta" ao voltar de uma exploração profunda.

**Riscos:**
- 🟡 Já em CG-3 (marcador de leitura ao voltar do Compare).
- 🟢 Em mobile, scroll longo perde âncora de capítulo — sticky mini-nav (F4 da wave mobile) resolveria.

**Veredito context preservation:** **boa**, com 2 pontos de melhoria já mapeados em waves anteriores.

---

## Progressive Disclosure Analysis

**Camadas validadas:**

| Camada | Conteúdo | Densidade |
|---|---|---|
| L0 Hero | Tese + chips | Mínima |
| L1 Recomendado | 1 card âncora | Baixa |
| L2 Capítulos | N teses agrupadas | Média |
| L3 Card | Resumo + intent | Média |
| L4 Painel | Narrativa + números | Alta (sob demanda) |
| L5 Compare | Decisão multidimensional | Alta (sob demanda) |

**Avaliação:**
- ✅ Timing correto: profundidade só após interesse explícito.
- ✅ Sem ocultação excessiva — todos os pontos de entrada são visíveis.
- ✅ Sem dump precoce de números no Hero/Cards.
- 🟢 Insights do Compare poderiam ser revelados em 2 ondas (2 imediatos + "Ver mais 2") para reduzir parede de texto em mobile.

**Veredito progressive disclosure:** **bem calibrado**.

---

## Mobile Consultive Flow Analysis

**Scroll longo testado mentalmente (Hero → Compare):**

- ✅ Narrativa sobrevive ao scroll — cada seção tem âncora visual (eyebrow + título + cor).
- ✅ Cards mobile mantêm intent bar lateral — scanning consultivo preservado.
- 🟡 Hero ainda consome viewport demais em mobile (já listado em F2 da wave mobile).
- 🟡 Falta sticky mini-nav de capítulos (já listado em F4).
- ✅ Compare em mobile usa cards semânticos (`dl/dt/dd`) — sem regressão a tabela densa.

**Fadiga consultiva mobile:** **moderada-baixa**. O ritmo editorial e o cap de 3 estratégias evitam exaustão. Os 4 fixes da `brutal-mobile-experience-review.md` resolvem o que resta.

---

## Premium Consultive Perception Analysis

**Sinais premium presentes:**
- Tipografia editorial (`tracking-[0.18em]` em eyebrows, `tracking-tight` em headers).
- Whitespace orquestrado (`space-y-10 md:space-y-14`).
- Cores semânticas sutis (barras `w-[2px]`, não blocos saturados).
- Voz consultiva consistente em todas as camadas.
- Cap institucional em todo lugar (3 estratégias, 4 insights).

**Resquícios de V1 procurados — não encontrados:**
- ❌ Sem KPIs hero-style ("R$ X economizados").
- ❌ Sem grid de features.
- ❌ Sem tabs de módulos.
- ❌ Sem "dashboard de cards" fragmentado.
- ❌ Sem CTAs funcionais agressivos.

**Veredito perception:** **premium consultivo**. A plataforma se posiciona como **edição**, não como **app**.

---

## Consultive Flow Risks

| ID | Risco | Severidade | Mitigado por |
|---|---|---|---|
| R1 | Quebra de continuidade Recomendado → Capítulos | 🟡 | CG-1 |
| R2 | Painel sem next-step consultivo | 🟡 | CG-2 |
| R3 | Perda de marcador ao voltar do Compare | 🟡 | CG-3 |
| R4 | Hero pesado em mobile | 🟡 | F2 (wave mobile) |
| R5 | Falta de sticky chapter nav mobile | 🟡 | F4 (wave mobile) |
| R6 | "Por que recomendado" não explícito | 🟢 | Polimento de copy |
| R7 | Compare exige seleção manual quando só há 1 selecionado | 🟢 | Sugestão consultiva |

Nenhum 🔴.

---

## High Priority Consultive Fixes

### 🟡 CG-1 — Frase de transição "Recomendado → Capítulos"
- **Onde:** `WealthPlatformModule.tsx`, logo após o bloco recomendado.
- **O quê:** 1 linha consultiva ("Continue a leitura abaixo para explorar outras teses patrimoniais.").
- **Impacto:** elimina sensação de "fim de seção", restaura continuidade narrativa.
- **Risco:** zero. Apenas copy.

### 🟡 CG-2 — Next-step consultivo no rodapé do painel
- **Onde:** painel de estratégia (rodapé).
- **O quê:** substituir "Voltar" genérico por par consultivo: **"Comparar com 2 teses"** (primário) + "Voltar à leitura" (secundário).
- **Impacto:** reduz decision fatigue, conduz para Compare.
- **Risco:** zero. Apenas hierarquia de botões.

### 🟡 CG-3 — Marcador de leitura ao retornar do Compare
- **Onde:** transição Compare → capítulo de origem.
- **O quê:** preservar scroll anchor + leve highlight no capítulo de origem por 1.5s ao voltar.
- **Impacto:** continuidade contextual; usuário não se sente "perdido".
- **Risco:** baixo. Apenas scroll/visual cue, sem mudar estado.

---

## Safe Surgical Improvements

- 🟢 **S1** — Microcopy de racional no card "Recomendado" ("Selecionada por alinhar liquidez + horizonte").
- 🟢 **S2** — Insights do Compare em 2 ondas (2 + "Ver mais") em mobile.
- 🟢 **S3** — Sugestão consultiva no Compare quando só 1 estratégia foi selecionada ("Sugerimos comparar com X e Y").
- 🟢 **S4** — Microfrase consultiva no "Winner" do Compare ("Conduz melhor para perfil X").

Todos opcionais; nenhum bloqueia produção.

---

## Improvements Explicitly NOT Recommended

- ❌ Adicionar wizard/stepper guiando capítulo a capítulo — quebraria o caráter editorial.
- ❌ Expandir número de teses por capítulo — diluiria autoridade.
- ❌ Adicionar painel "Resumo da consultoria" global — redundante com Hero + Recomendado.
- ❌ Introduzir progresso "X de Y capítulos lidos" — gamifica e degrada percepção premium.
- ❌ Voltar tabs entre Investimentos / Engenharia — regrediria à V1.
- ❌ Aumentar densidade do Hero com números — quebraria progressive disclosure.
- ❌ Aumentar `COMPARE_MAX` acima de 3 — destruiria decisão clara.
- ❌ Adicionar tooltips por toda parte — sintoma de UI fraca, não de profundidade.

---

## Final Consultive Flow Verdict

**A. APROVADO PARA PRODUÇÃO REAL.**

A `Plataforma Patrimonial · Edição Consultiva` entrega, no estado atual, um **fluxo consultivo premium coerente**: o usuário é conduzido por uma narrativa editorial, com guidance suficiente, autoridade percebida, decisão clara e fadiga controlada. Os resquícios de V1 (dashboard, catálogo, features fragmentadas) foram eliminados.

**Recomendação:**
1. **Default ON imediato.**
2. Janela curta de polimento para CG-1, CG-2, CG-3 (todos copy/UX, sem motor).
3. Combinar com F1–F4 da `brutal-mobile-experience-review.md` e H1–H3 da `deep-hierarchy-review.md` em uma única "polish window" consultiva.
4. S1–S4 ficam como backlog opcional.

**Percepção dominante atingida:** ✅ consultoria patrimonial premium.
**Percepção a evitar:** ❌ dashboard bancário tradicional — confirmado ausente.
