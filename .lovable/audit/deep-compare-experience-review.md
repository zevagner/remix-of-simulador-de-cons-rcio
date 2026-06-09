# Deep Compare Experience Review
**Surface:** `CompareWorkspace` (Layer 3 — Wave U3) montado em `<Sheet>` lateral via `WealthPlatformModule`
**Escopo:** Compare unificado cross-intent — decision support, hierarchy, scanning, cognitive load, mobile, premium perception
**Modo:** Auditoria pura — 0 alterações de código, 0 dependências, 0 motor, 0 schema
**Data:** 2026-05-16

---

## Executive Summary

O `CompareWorkspace` da V2 **não é uma tabela** — é um **workspace de decisão consultiva em 4 blocos respirados**: Winners → Insights → Matriz → Perfis ideais. Cada bloco tem eyebrow editorial, separator próprio, hierarchy independente. A comparação **não despeja informação** — ela **conduz**.

A grande conquista vs V1: a comparação **não acontece dentro dos cards** (princípio U3). O usuário só compara quando explicitamente seleciona estratégias e abre o workspace. Isso elimina o "compare implícito" caótico da V1.

**Pontos fortes inquestionáveis:**
- ✅ **Winners por KPI com edge "+X% vs 2ª"** — decision support real, não decoração
- ✅ **Insights consultivos derivados** (zero recálculo) que detectam *tradeoffs* automáticos ("X acelera; Y protege")
- ✅ **Matriz desktop + cards stack mobile** — dois layouts, mesma data, hierarchy preservada
- ✅ **Cap institucional de 3 estratégias** — bloqueia paralisia decisória
- ✅ **Empty states e single-selection states** dedicados — não há "tela vazia técnica"
- ✅ **Insights cap de 4** — "visual silence" intencional

**Pontos de fricção residuais:**
1. **Mobile: ausência de `ScrollAffordance` nos chips e na matriz interna** (já mapeado em audit mobile como F1).
2. **Winners + Insights podem repetir informação** — o mesmo "vencedor de payback" aparece em Winner block E em Insight block.
3. **Trophy 🏆 emoji-icon dentro da célula** da matriz é o único elemento visualmente "saas-ish" — todo o resto é editorial.
4. **Disclaimer no rodapé** usa apenas o `disclaimer` da 1ª estratégia — se as 3 tiverem disclaimers diferentes, há perda silenciosa.

**Veredicto:** **A. APROVADO** — compare premium real, 0 🔴, 4 🟡 priority, 5 🟢 surgical. **Zero resíduo de "tabela corporativa" detectado.**

---

## 1. Global Compare Analysis

**Estrutura observada (linhas 119–325):**

```
┌─ HEADER (Eyebrow + H2 + sub + close)
├─ CHIP ROW (estratégias selecionadas + remove + N/3)
├─ A. WINNERS         [Trophy icon]
│   └─ Grid 1/2 col com 1 card por KPI vencido + edge "+X% vs 2ª"
├─ ─── separator ───
├─ B. INSIGHTS        [Sparkles icon]
│   └─ Lista consultiva (cap 4) com tags e tradeoffs detectados
├─ ─── separator ───
├─ C. MATRIZ          [Scale icon]
│   ├─ Desktop: <table> com winners marcados (Trophy + bold)
│   └─ Mobile: cards stack, 1 por estratégia, dl/dt/dd
├─ ─── separator ───
├─ D. PERFIL & LIMITAÇÕES  [Target icon]
│   └─ Grid 1/2 col com "Para quem" + "Limitação principal"
└─ Disclaimer institucional (italic 10px)
```

**Clareza geral:** ✅ Excelente — 4 blocos nomeados, separadores visíveis, eyebrow editorial.
**Velocidade de comparação:** ✅ Alta — Winners no topo entrega decisão em <3s.
**Fluidez perceptiva:** ✅ Boa — `space-y-5` entre blocos é editorial sem ser desperdício.
**Organização visual:** ✅ Forte — Block component canônico (eyebrow + icon + content) cria ritmo.

**Overload?** Não.
**Comparação cansativa?** Apenas residual no mobile (matriz horizontal stress mitigável).

---

## 2. Decision Support Analysis

**O `CompareWorkspace` é decision support real, não viewer.**

Evidências de decision support genuíno:

| Recurso | Implementação | Valor |
|---|---|---|
| Winners por KPI | `computeWinners` com `HIGHER_IS_BETTER`/`LOWER_IS_BETTER` semânticos | ✅ Sistema "sabe" qual KPI é melhor maior/menor |
| Edge "+X% vs 2ª" | Diff vs runner-up, threshold ≥1% | ✅ Quantifica vantagem real, não declara "ganhador" |
| Tradeoff detection | "X acelera; Y protege" automático em pares conflitantes | ✅ Confronta o usuário com o dilema real |
| Cap em 4 insights | `insights.slice(0, 4)` | ✅ Combate paralisia |
| Perfil ideal por estratégia | `consultive.forWho` + `risks[0]` | ✅ Conduz à escolha por contexto, não por "vencedor absoluto" |

**Falta de condução consultiva?** Não.
**Excesso técnico?** Não — KPIs são `formatted` (R$, %), nunca raw.
**Esforço excessivo para decidir?** Não — Winners + 1 Tradeoff = decisão em 2 olhadas.
**Ambiguidade?** Apenas quando `winners.length === 0` (KPIs insuficientes), tratada com `EmptyHint`.

**Decision support score:** **9/10**.

---

## 3. Compare Hierarchy Analysis

**Hierarchy em camadas:**

| Camada | Elemento | Peso visual | Função |
|---|---|---|---|
| Camada 1 | Header (eyebrow + H2 "Comparando N estratégias") | Alto | Orientação |
| Camada 2 | ChipRow com remove + N/3 | Médio | Estado da seleção |
| Camada 3 | Winners (cards bold + edge verde) | **Dominante** | **Decisão imediata** |
| Camada 4 | Insights (lista respirada) | Médio | Narrativa consultiva |
| Camada 5 | Matriz (denso, mas tabular-nums) | Médio-Alto | Verificação detalhada |
| Camada 6 | Perfis ideais (grid 1/2) | Médio | Contexto qualitativo |
| Camada 7 | Disclaimer | Mínimo | Compliance silenciosa |

**Foco principal:** Winners ✅ — é a primeira coisa que o olho captura.
**Hierarchy collapse?** Não — cada bloco tem eyebrow uppercase tracking-wide próprio.
**Foco correto da atenção?** Sim — Winners → Insights → Matriz é o caminho consultivo natural.

**Risco residual:** o **Block "Matriz"** tem o maior peso visual após Winners (tabela com headers, tbody, trophies). Em sessões longas, o olho pode pular Winners → Matriz, ignorando Insights. **Mitigação atual:** separators e eyebrow icons. **Risco real:** baixo.

---

## 4. Scanning Speed Analysis

**Tempo de scanning estimado (desktop):**

| Bloco | Tempo até entendimento |
|---|---|
| Winners | ~2s (cards com KPI + edge + título do vencedor) |
| Insights | ~3s (4 itens curtos) |
| Matriz | ~5–8s (depende do nº de KPIs) |
| Perfis | ~4s (2 cards com "Para quem" + 1 limitação) |

**Total para decisão informada:** ~14–17s. **Excelente para uma decisão patrimonial.**

**Anchors visuais:**
- ✅ Eyebrow uppercase tracking-[0.14em] em cada Block
- ✅ Trophy icon amber-500 nas células vencedoras
- ✅ Edge "+X% vs 2ª" em verde emerald (semântica de "melhor")
- ✅ tabular-nums em todos os números — alinhamento perfeito

**Scanning confuso?** Não.
**Múltiplos focos simultâneos?** Apenas se o usuário escolher 3 estratégias com 8+ KPIs únicos — a matriz fica longa mas não confusa (linhas alternadas com border-b).
**Esforço ocular?** Baixo — `text-sm` na matriz, `text-xs` em labels. Sem texto <11px crítico.

---

## 5. Cognitive Load Analysis

**Carga cognitiva calibrada:**

| Bloco | Itens simultâneos | Carga |
|---|---|---|
| Winners | até ~7 KPIs únicos × 1 vencedor cada | Média |
| Insights | cap 4 | Baixa ✅ (combate explícito) |
| Matriz | KPIs × 3 colunas = até 21 células | Média-alta |
| Perfis | 2–3 cards × 2 fields | Baixa |

**Fadiga cognitiva controlada por:**
- Cap de 3 estratégias (`COMPARE_MAX`)
- Cap de 4 insights (`insights.slice(0, 4)`)
- `uniqueKpiOrder` evita duplicatas de label
- `hidden md:block` / `md:hidden` evita renderizar matriz tabular em mobile

**Overload?** Não — caps explícitos previnem.
**Compare fatigue?** Apenas se 3 estratégias × muitos KPIs únicos. Mitigado pela ordem (Winners primeiro = decisão antes de fadiga).
**Dense clusters?** A matriz desktop é o cluster mais denso, mas com `border-b border-border/30` e `py-2 px-3` respira o suficiente.
**Esforço para decidir?** Mínimo se o usuário parar nos Winners; opcional se ele quiser auditar.

---

## 6. Consultive Compare Flow Analysis

**Progressão narrativa interna:**

1. **"Estamos comparando N estratégias"** → ChipRow com remove (controle)
2. **"Quem ganha em quê?"** → Winners (decisão objetiva)
3. **"O que isso significa?"** → Insights consultivos (interpretação)
4. **"Quero ver os números"** → Matriz (auditoria)
5. **"Qual se encaixa em quem?"** → Perfis ideais (contextualização)
6. **"Lembre-se das limitações"** → Disclaimer

**Esta é uma narrativa consultiva real**, não um info-dump. Cada bloco responde uma pergunta consultiva específica.

**Compare ajuda a decidir** ou **apenas despeja informação**? **Decididamente o primeiro.**

**Sensação de orientação premium:** ✅ Alta — eyebrows + ícones temáticos (Trophy/Sparkles/Scale/Target) + tradeoff detection.

**Risco residual:** Insights podem **repetir** o que Winners já mostrou (ex.: "Maior payback" no Winner E "Payback mais rápido" no Insight). Para 1 estratégia dominante, parece eco. Mitigável com micro-ajuste de copy condicional.

---

## 7. Mobile Compare Analysis

**O `<Sheet side="right" className="w-full sm:max-w-3xl">` em <sm vira full-screen** — correto.

**Mobile-first elegantemente resolvido:**
- ✅ Matriz tabular **escondida** (`hidden md:block`)
- ✅ Substituída por **cards stack** (`md:hidden space-y-2.5`) — 1 card por estratégia, `dl/dt/dd` semântico
- ✅ Trophy preservado nas células vencedoras
- ✅ ChipRow com `flex-wrap` — sem overflow
- ✅ Winners em `grid grid-cols-1 sm:grid-cols-2` — empilha em mobile

**Pontos de fricção mobile:**

| # | Problema | Severidade |
|---|---|---|
| M1 | ChipRow com 3 estratégias + remove em telas <360px pode quebrar | 🟢 Baixo (flex-wrap mitiga) |
| M2 | Cards stack mobile da matriz mostra TODOS os KPIs por card → scroll vertical longo | 🟡 Médio |
| M3 | Ausência de affordance horizontal nos chips quando >5 itens | 🟢 Baixo |
| M4 | Trophy 🏆 inline com valor pode quebrar linha em telas estreitas | 🟢 Baixo |

**Collapse mobile?** Não.
**Compare cansativo mobile?** Moderado em catálogo grande (>5 KPIs × 3 estratégias = 15 itens scroll por estratégia × 3 cards).

**Switching cost mobile:** baixo — não há scroll horizontal na matriz mobile (substituída por cards verticais). **Esta é a decisão arquitetural mais inteligente do componente.**

---

## 8. Information Orchestration Analysis

**Chunking observado:**

| Chunk | Tamanho | Justificativa |
|---|---|---|
| Header | 1 unidade | Orientação |
| ChipRow | N estratégias (cap 3) | Estado |
| Winners | até ~7 cards | Decisão |
| Insights | cap 4 | Narrativa |
| Matriz | KPIs × N cols | Auditoria |
| Perfis | N cards | Contexto |

**Separadores:**
- `<Separator className="opacity-60" />` entre Winners–Insights, Insights–Matriz, Matriz–Perfis
- `Block` component com eyebrow + space-y-5 entre seções
- Sem separator entre Header e ChipRow (corretamente — são uma unidade)

**Progressive disclosure:**
- Insights cap 4 → "visual silence" intencional
- Matriz só mostra KPIs presentes em pelo menos 1 estratégia (`uniqueKpiOrder`)
- Tradeoffs só aparecem quando winners conflitam (`wTir.winnerId !== wPay.winnerId`)

**Clusters pesados?** Apenas a matriz desktop, mas balanceada por `border-b/30` e `tabular-nums`.
**Excesso de proximidade?** Não.
**Baixa organização?** Oposto — orquestração editorial real.

---

## 9. Premium Perception Analysis

**Checklist editorial premium:**

| Critério | Status | Justificativa |
|---|---|---|
| Inteligência | ✅ | Tradeoff detection automático, edge quantificado |
| Sofisticação | ✅ | Eyebrow uppercase tracking, tabular-nums, semantic colors |
| Calma | ✅ | space-y-5, separators opacity-60, blocks respirados |
| Confiança | ✅ | Trophy + edge + KPI label = decisão fundamentada |
| Consultoria premium | ✅ | "Workspace de decisão", não "tabela", insights, perfis |
| Clareza elegante | ✅ | 4 blocos nomeados, sem competição, disclaimer mínimo |

**Resíduos V1 procurados:**

| Resíduo | Detectado? |
|---|---|
| Tabela corporativa | ❌ — matriz é só 1 bloco entre 4, com border `border/60` discreta |
| Planilha visual | ❌ — sem zebra striping agressivo, sem totais, sem sort |
| Dashboard financeiro | ❌ — sem KPI cards genéricos no topo |
| Comparação bancária | ❌ — sem checkbox/radio, sem "selecionar plano" |
| Cores saturadas como anchor | ⚠️ Trophy `amber-500` e edge `emerald-600` — semânticas, não decorativas |
| Badges promocionais | ❌ — apenas "Recomendada" institucional, opcional |
| Excesso de ícones | 🟡 Trophy + Scale + Target + Sparkles + Trophy nas células — 5 famílias diferentes |

**Resíduo V1 em compare:** **ZERO bloqueante.** Apenas o uso de Trophy nas células da matriz é levemente "gameficação" — vide §3 e fix C3 abaixo.

---

## 10. Decision Confidence Analysis

**O usuário sai do compare com confiança para decidir?**

**Sim, por 5 motivos arquiteturais:**

1. **Winners explicitam quem ganha em quê** — sem ambiguidade
2. **Edge "+X% vs 2ª"** — quantifica a vantagem (não é "ganhou de pouco" vs "ganhou de muito")
3. **Tradeoffs forçam o reconhecimento do dilema** — "X acelera; Y protege" elimina ilusão de "estratégia perfeita"
4. **Perfis ideais conectam estratégia → cliente** — "Para quem" + "Limitação principal" = decisão por contexto
5. **Cap de 3 estratégias** — bloqueia paralisia (psicologia de escolha de Iyengar)

**Insegurança perceptiva?** Não.
**Excesso de análise?** Não — caps explícitos e narrativa em camadas.
**Paralisia decisória?** Bloqueada pelo cap institucional.
**Complexidade aparente?** Baixa — eyebrows nomeiam cada bloco; o usuário sabe o que é cada coisa.

**Decision confidence score:** **9.5/10.**

---

## 11. Compare Risks

**🔴 Riscos bloqueantes:** **NENHUM.**

**🟡 Riscos cirúrgicos identificados:**

| # | Risco | Severidade | Onde |
|---|---|---|---|
| C1 | Cards stack mobile da matriz com KPIs em 2 colunas pode estourar em telas <360px com labels longos | Médio | §7 M2 |
| C2 | Insights podem repetir Winners quando há 1 estratégia dominante | Baixo-Médio | §6 |
| C3 | Trophy icon inline em todas as células vencedoras → "ruído de gamificação" em catálogos com 10+ KPIs | Baixo | §3, §9 |
| C4 | Disclaimer assume `limited[0].blueprint.consultive.disclaimer` — se estratégias têm disclaimers diferentes (cross-intent), há perda silenciosa | Baixo (compliance) | linha 322–324 |

---

## 12. High Priority Compare Fixes (🟡 — janela 2–3 dias)

| # | Fix | Arquivo | Esforço | Impacto |
|---|---|---|---|---|
| **CF1** | Wrap `ChipRow` e cards stack mobile em `<ScrollAffordance>` quando >2 estratégias OU labels longos (já existe primitivo em `src/components/ui/ScrollAffordance.tsx`) | `CompareWorkspace.tsx` | XS | Médio — resolve M3, M4 |
| **CF2** | Em telas <380px, reduzir cards stack mobile para 1 coluna de KPIs (`grid-cols-1` em vez de `grid-cols-2`) com `@container` query ou breakpoint manual | `CompareWorkspace.tsx` linha 262 | XS | Médio — resolve C1 |
| **CF3** | Suprimir Insight quando duplica exatamente o Winner (ex.: se `wTir` existe e único insight é "Maior TIR", não renderizar Insight redundante; manter apenas tradeoffs) | `CompareWorkspace.tsx` linhas 407–411 | XS | Baixo-Médio — resolve C2 |
| **CF4** | Disclaimer: concatenar disclaimers únicos de todas as estratégias selecionadas com `Array.from(new Set(...))` e `· ` separator | `CompareWorkspace.tsx` linhas 322–324 | XS | Baixo (compliance) — resolve C4 |

**Todas:** zero impacto em motor, contexts, telemetria, desktop crítico.

---

## 13. Safe Surgical Improvements (🟢 — backlog opcional)

1. **CS1.** Reduzir Trophy nas células da matriz para apenas a 1ª linha por estratégia vencedora (mostrar "X é vencedora em N KPIs" no header da coluna em vez de 🏆 em cada célula).
2. **CS2.** Adicionar `view-transition-name` na transição card → workspace (continuidade hierárquica).
3. **CS3.** Em desktop xl+, dispor Winners + Insights lado a lado em grid 2/3 + 1/3 (variação rítmica para reduzir altura total).
4. **CS4.** Adicionar `aria-live="polite"` no Header quando ChipRow muda — screen readers ouvem "Comparando agora 3 estratégias".
5. **CS5.** Permitir colapsar a Matriz com `<details open>` em mobile — usuário escolhe ver ou não a auditoria detalhada (progressive disclosure explícita).

---

## 14. Improvements Explicitly NOT Recommended

| ❌ NÃO fazer | Por quê |
|---|---|
| Adicionar sort/filter nas colunas da matriz | Vira planilha; quebra o "workspace consultivo" |
| Permitir comparar >3 estratégias | Cap institucional combate paralisia decisória |
| Adicionar gráfico (radar/bar) automático | Compare é narrativo + tabular; gráfico introduz interpretação ambígua |
| Adicionar export CSV/Excel da matriz | Reposiciona o componente como "tabela", não "decisão" |
| Adicionar checkbox "selecionar vencedor final" | Não é função do compare — decisão é off-platform com cliente |
| Substituir Trophy por estrelas/medalhas | Aumenta gamificação; semântica fica pior |
| Animar entrada dos Winners | Quebra calma; introduz custo perceptivo |
| Adicionar tabs internas (Winners / Detalhes / Perfis) | Reintroduz fragmentação V1 — todos os blocos devem ser visíveis em scroll |
| Mover Compare para inline dentro do card | Quebra o princípio U3: comparação NÃO acontece dentro dos cards |
| Adicionar "AI explica esta comparação" | Insights consultivos determinísticos já cumprem; AI introduz custo, latência, e potencial drift |
| Cores diferentes por estratégia (column tint) | Quebra "calma editorial"; transforma em dashboard |
| Mostrar TODOS os secondaryKpis em vez de uniqueKpiOrder | Aumenta densidade sem ganho — auditoria detalhada já é função do panel consultivo |

---

## 15. Final Compare Verdict

### **A. APROVADO — Compare Workspace Premium Real**

**Resumo:**
- 🔴 **Bloqueantes:** 0
- 🟡 **High priority (cirúrgicos):** 4 (CF1–CF4)
- 🟢 **Safe surgical (backlog):** 5 (CS1–CS5)
- ❌ **Não recomendados:** 12 (documentados §14)
- 🚫 **Resíduos V1:** ZERO bloqueante

**O `CompareWorkspace` da V2 entrega:**
- ✅ Clareza (4 blocos nomeados, eyebrow editorial)
- ✅ Confiança (Winners + edge + tradeoffs)
- ✅ Fluidez (separadores opacity-60, space-y-5, sem competição)
- ✅ Scanning rápido (~3s para decisão objetiva via Winners)
- ✅ Suporte consultivo (Insights determinísticos + Perfis ideais)
- ✅ Profundidade controlada (Matriz como auditoria opcional, não obrigatória)
- ✅ Percepção premium (não é tabela, não é planilha, não é dashboard)

**Comparação V1 vs V2:**

| Dimensão | V1 | V2 |
|---|---|---|
| Forma | Tabela densa única | Workspace em 4 blocos respirados |
| Decision support | Inexistente (usuário compara olhando) | Winners + edge + tradeoffs determinísticos |
| Caps explícitos | Nenhum | 3 estratégias + 4 insights + 1 limitação |
| Mobile | Tabela horizontal scroll | Cards stack semântico (`dl/dt/dd`) |
| Hierarchy | Plana (linhas iguais) | 4 níveis com eyebrow + separator |
| Consultive flow | Ausente | Winners → Insights → Matriz → Perfis |
| Sensação | Planilha | Workspace de decisão consultiva |

**V2 vence 7/7 dimensões.**

---

**Recomendação executiva:**
- ✅ **Default ON imediato** — compare production-ready
- 🔧 **Janela curta (2–3 dias)** para CF1–CF4
- 📋 **CS1–CS5 como backlog** sem urgência
- ❌ **Bloquear iniciativas que reposicionem como "tabela"** (lista §14)

**O `CompareWorkspace` não parece uma planilha, não parece um dashboard, não parece uma comparação bancária. Parece o que foi prometido na Wave U3: um workspace de decisão consultiva premium com narrativa em camadas, decision support real e profundidade controlada.**

---

**Invariantes preservadas (zero alterações nesta wave):**
- `src/core/finance/*` intacto
- `CompareWorkspace`, `WealthPlatformModule`, contracts intactos
- Telemetria U8 intacta (`emitCompareOpen`, `emitCompareRemove`, `emitCompareClose`)
- Caps institucionais (`COMPARE_MAX = 3`, `insights.slice(0, 4)`) preservados
- Zero novos chunks, deps, renders, queries, motor
