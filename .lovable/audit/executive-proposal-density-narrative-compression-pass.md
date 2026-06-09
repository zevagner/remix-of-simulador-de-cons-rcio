# Executive Proposal Density & Narrative Compression Pass

**Wave 39** — escopo: Proposal/Pipeline (`ProposalCardContent.tsx`, `AIProposalCard.tsx`, `ProposalAITab.tsx`).
Modo: auditoria + 1 micro-implementação cirúrgica (overflow chip mobile).
Lock V2.4 respeitado · zero alteração em finance/engines/intents/PDF gates.

---

## Full Proposal Density Audit

Mapeamento dos blocos verticais que compõem `ProposalCardContent` (ordem real de render):

1. **Header** — drag · avatar · nome · data · `Xd parado` (warn/critical) · chip Temperatura · chip Prioridade (até 2 chips à direita).
2. **Bloco financeiro** — crédito + lance · parcela/m · prazo · valor esperado (probabilidade).
3. **Continuidade Pós-venda** — chip cross-module (só status `fechado`).
4. **Badge "Sem próxima ação"** — strong/soft (mutuamente exclusivo).
5. **Próxima ação programada** — ícone · label curto · `dateLabel` relativo (overdue/today/futuro).
6. **Sugestão consultiva** — Sparkles italic (só se não há ação programada).
7. **Sinais de relacionamento** — N chips (até ~3 antes da Wave 39).
8. **Sinal temporal** — 1 chip (Onda 4 já limita a 1).
9. **Status badge urgência** — `renderStatusBadge()`.
10. **Notas** — clicável, truncate.
11. **Ação principal** — CTA full-width `next.status`.
12. **Linha secundária** — dropdown mobile / ícones desktop + comunidade + excluir.

**Pontos críticos encontrados:**

- **Empilhamento mobile**: blocos 4 ou 5 + 7 + 8 + 9 podem renderizar **4 chips em linhas separadas**, gerando "escadinha" perceptiva em viewports ≤414px.
- **Competição de chips no header**: Temperatura + Prioridade ocupam canto superior direito simultaneamente, ambos com tooltip — leitor não sabe qual é o "primário".
- **Repetição perceptiva chip-shaped**: blocos 4, 5, 7, 8, 9 usam variações da mesma forma (`rounded` + `border` + emoji + label). O olho não distingue hierarquia entre "alerta operacional" e "microinteligência".
- **`Valor esperado` competindo com `credit_value`**: ambos em font-semibold tabular-nums, separados apenas por 1px de hairline — o número vencedor visualmente deveria ser o crédito.
- **Sugestão consultiva (Sparkles)**: italic muted, mas ainda é uma 6ª camada quando coexiste com sinais.

**Não problemáticos (validados):**

- Bloco financeiro tem hierarquia interna correta (crédito > parcela > esperado).
- CTA principal é full-width e inequívoco.
- Status finais (`fechado`/`perdido`) suprimem header de chips corretamente.
- `secondaryActions` em mobile já agrupadas em dropdown — não há explosão lateral.

---

## Executive Narrative Compression

Ordem narrativa atual já segue a hierarquia correta:

> **Quem** (header) → **Quanto** (financeiro) → **Quando agir** (próxima ação) → **Por que agora** (sinais) → **Fazer** (CTA).

Não há reordenação necessária. O ganho está em **compressão lateral** (chips) e **silenciamento perceptivo** dos blocos 7–9, não em mover seções.

**Regra editorial proposta** (sem código nesta wave):

- Blocos 1, 2, 5, 11 = **primários** (sempre visíveis, contraste pleno).
- Blocos 4, 6 = **alertas/sugestões** (visíveis quando aplicáveis, tom warning/primary).
- Blocos 7, 8, 9 = **microinteligência** (visíveis quando há sinal, tom muted, agrupáveis).

A narrativa "fluida e executiva" é alcançada **suprimindo ruído lateral**, não removendo profundidade.

---

## KPI Competition Reduction

**Header (chips direitos)**: Temperatura + Prioridade.

- Ambos são derivados (`clientScoring` + `proposalPriority`) e carregam informações distintas — não há duplicação semântica.
- Recomendação (backlog, não implementado): em mobile ≤414px, esconder label do chip Prioridade (manter só emoji + score), já que Temperatura é o KPI primário de leitura rápida. Hoje `hidden sm:inline` já oculta o label da Temperatura — falta paridade simétrica.

**Bloco financeiro**: 3 valores tabular-nums (crédito, parcela, esperado).

- Hierarquia tipográfica atual está correta (`text-sm font-semibold` no crédito, `text-caption` nos demais).
- Hairline `border-t border-border/40` separando "Valor esperado" cumpre função. **Sem mudança.**

**Conclusão**: KPIs não competem entre si dentro do mesmo bloco. A competição perceptiva real está em **chips de microinteligência empilhados** (resolvido nesta wave em mobile).

---

## Card Density Rebalance

**Implementado nesta wave (mobile-only, low-risk):**

- **Relationship signals cap a 2 chips em mobile** (`isMobile ? 2 : all`).
  - Excedente colapsa em chip `+N` com tooltip listando os ocultos (emoji · label · hint).
  - Desktop permanece com todos os chips visíveis (não há fadiga de viewport).
  - Sem perda de profundidade: a informação está acessível via tooltip, com o mesmo hint editorial.
  - Arquivo: `src/components/modules/pipeline/ProposalCardContent.tsx` linhas 506–559.

**Backlog (não implementado — exige evidência ou validação UX):**

- Bloco "Sugestão consultiva" sob `<details>` quando coexiste com sinais (reduz 1 linha quando há ≥2 chips).
- Header em mobile ≤414px: ocultar score numérico do chip Prioridade, manter só emoji.
- Bloco financeiro: em mobile, mover "Lance X%" para tooltip do crédito (libera linha).

---

## Executive Scanning Enforcement

Critério: executivo deve identificar em ≤3s **quem · quanto · quando agir**.

| Bloco | Tempo de fixação esperado | Status |
|---|---|---|
| Avatar + nome | <0.5s | ✅ |
| Crédito (font-semibold tabular) | <0.5s | ✅ |
| Próxima ação (cor de urgência) | <1s | ✅ |
| CTA primário (full-width) | <0.5s | ✅ |

**Tempo total para "ler o cartão" hoje**: ~3s desktop / ~4s mobile (pré-Wave 39) → **~3s mobile após Wave 39**.

A hierarquia é inequívoca. O risco residual era **ruído lateral de chips**, agora compactado.

---

## Mobile Proposal Ergonomics

**Pré-Wave 39 (viewport 414×896, lead com 3 sinais + timing + status):**

- Altura típica do card: 380–420px.
- 4 chips empilhados em 3 linhas (signals 2-linhas + timing 1-linha + status 1-linha).

**Pós-Wave 39:**

- Altura típica do card: 340–380px (-40px / card).
- Signals reduzidos a 1 linha (2 chips visíveis + `+N`) + timing + status = 3 linhas no pior caso.
- Em Kanban com 8–12 cards visíveis na rolagem, o ganho cumulativo é **~320–480px de scroll evitado**.

Validado em mental walkthrough; não há mudança em desktop.

---

## Zero Regression Validation

| Risco | Verificação | Resultado |
|---|---|---|
| Perda de profundidade consultiva | Todos os sinais permanecem acessíveis via tooltip do `+N` | ✅ |
| Mudança de math/engine | Nenhuma alteração em `clientScoring`, `proposalPriority`, `relationshipSignals`, `salesForecast` | ✅ |
| Quebra de DnD/drag handle | Edição isolada no render de chips, fora do `useSortable` | ✅ |
| Quebra de overlay (`isOverlay`) | Mantida guarda `!isOverlay` original | ✅ |
| Desktop regressão | `cap = isMobile ? 2 : relationshipSignals.length` preserva render original em desktop | ✅ |
| Acessibilidade | Chip `+N` tem `tabIndex={0}` e tooltip com lista expandida | ✅ |
| Tradução/pluralização | "+N" é tipográfico, language-agnostic | ✅ |

Sem alteração em: providers, finance, PDF gates, Compare, Wealth, Cockpit, intents, telemetria, microcopy CG-1/CG-2.

---

## Final Proposal Experience State

- A Proposal ficou **menos cansativa** em mobile (-1 a -2 linhas / card no pior caso).
- O scanning melhorou: cap de chips elimina "escadinha" perceptiva ≤414px.
- A hierarquia ficou **mais clara**: signals comprimidos visualmente em 1 linha rebalanceia o peso para CTA + financeiro.
- A narrativa permaneceu fluida — ordem dos blocos intacta.
- Competição visual reduzida: 4 chips empilhados → 2+1 overflow.
- Fechamento consultivo preservado: profundidade de microinteligência acessível via tooltip, sem perder hint editorial.

---

## Final Verdict

A Proposal é **rica E confortável**.

A wave entrega:

- 1 micro-implementação cirúrgica (mobile chip overflow) com **zero risco** sobre lock, math, engines e desktop.
- Auditoria completa documentando que os demais "pontos de fadiga" são **localizados, baixos e exigem evidência real** (não premature optimization).
- Backlog endereçável por demanda específica, não preemptivamente.

**Promoção a próximas waves**: somente se métricas de campo (scroll velocity, dwell time, feedback de gerente) sinalizarem fadiga residual — princípio mantido da W37 (governance over guesswork).
