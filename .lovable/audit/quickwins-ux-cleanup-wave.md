# Quick Wins UX Cleanup Wave

**Data:** 2026-05-14
**Escopo:** Execução da camada **Quick Wins** identificada em `.lovable/audit/global-ux-simplification-information-architecture-audit.md`.
**Restrição:** zero alteração em lógica financeira, hooks, providers, runtime, Supabase. Apenas presentation/JSX/Tailwind/copy.

---

## Quick Wins executados

### QW-A · PostSale — remoção do "editorial mark" decorativo

**Antes:** acima dos 6 KPIs havia um bloco editorial fixo:
```
01 · Carteira pós-venda
Relacionamento consultivo em curso
[6 KPIs]
```
- 1 contador decorativo, 1 eyebrow, 1 headline italicizada — **3 linhas** que não agregavam dado, redundantes com o `ModuleHeader` ("Pós-venda · Acompanhe clientes ativos…") logo acima.

**Depois:** `metric-row` direta com os 6 KPIs. ModuleHeader continua sendo a única introdução do módulo.

**Impacto:** -3 linhas verticais no fold inicial; primeiro KPI "Ativos" agora aparece sem scroll em viewports 800px+.

---

### QW-B · Proposal — remoção da concorrência visual entre 2 surfaces primary consecutivas

**Antes:** dois cards consecutivos competiam pela atenção primary:
1. Banner "Estratégia recomendada" — `border-2 border-primary/40 bg-gradient-to-r from-primary/10`
2. Quick Summary (Carta · Parcela · Prazo) — `border-primary/20 bg-gradient-to-r from-primary/5 to-transparent`

Ambos azuis, gradiente primary, bordas primary. **AP-7** clássico ("tudo primary = nada primary").

**Depois:** Quick Summary recebe chrome neutro (`border-border bg-card`). O **banner de estratégia recomendada** passa a ser a única superfície primary do topo, ganhando protagonismo real.

**Impacto:** hierarquia visual restabelecida — quando a recomendação chega da Análise, ela domina; o resumo de simulação fica como suporte calmo.

---

### QW-C · Investment — eliminação da intro redundante com o ModuleHeader

**Antes:** logo abaixo do `ModuleHeader` ("Investimento · Analise o consórcio como estratégia financeira") havia:
```
Nesta análise, o consórcio é avaliado como estratégia financeira e patrimonial
Os resultados apresentados são estimativas baseadas nas premissas configuradas.
Não representam promessa de rentabilidade ou garantia de contemplação em prazo específico.
```
A primeira linha **parafraseava o subtítulo do header**. Pura repetição.

**Depois:** apenas o disclaimer legal compactado em **uma linha** (`text-xs`):
> Os resultados são estimativas baseadas nas premissas configuradas. Não representam promessa de rentabilidade ou garantia de contemplação.

**Impacto:** -1 parágrafo redundante; disclaimer legal **preservado integralmente**.

---

## Quick Wins reavaliados (não executados)

Durante a execução, alguns itens da auditoria foram **revisados contra o código real** e reclassificados:

| ID | Status | Motivo |
|---|---|---|
| QW-1 (Diagnostic intro duplicada) | **Não aplicável** | Wizard tem 1 título por step + 1 subtítulo (`Identifique o cliente para personalizar...`). Não há duplicação real — auditoria havia sido conservadora. |
| QW-2 (PostSale AI banner) | **Já correto** | PostSale **não** tem banner IA — usa apenas badges `<Sparkles>` discretos por sugestão (`suggestion.text` line 714). Padrão correto. |
| QW-2 (Objections AI repetitivo) | **Adiado para Medium Change MC-4** | Reorganizar IA por aba exige refactor de estado entre `Storytelling/Triggers/Objeções` — fora de Quick Win seguro. |
| QW-3 (Bids collapse default) | **Já correto** | `BidsModule` (312 linhas, 0 cards diretos) já delega tudo a sub-componentes com defaults conservadores. |
| QW-5 (Kanban badges) | **Adiado** | Carteira é módulo grande (775 linhas + sub-componentes); requer audit dedicado de cada badge antes de remover. Risco > benefício para Quick Win. |
| QW-6 (Help v2.4.0 strip) | **Já correto** | `HelpModule` tem **1** seção de versão (`VERSION_HISTORY` mapeado), não 4 cards. Auditoria havia superestimado. |

**Lição:** auditoria global é direcionalmente correta, mas execução cirúrgica precisa validar contra o código antes de cortar — alguns problemas já tinham sido resolvidos em waves anteriores e ainda estavam listados.

---

## O que foi removido

- 1 bloco editorial decorativo no PostSale (3 linhas).
- 1 parágrafo de intro redundante no Investment.
- 2 surfaces primary consecutivas no Proposal (uma volta a ser neutra).

## O que foi consolidado

- **Hierarquia primary do Proposal:** banner de estratégia recomendada agora é o único protagonista azul; Quick Summary virou suporte neutro.
- **Disclaimer do Investment:** 2 linhas → 1 linha compacta, sem perder texto legal.

## O que foi preservado integralmente

- Todos os KPIs, métricas, valores e cálculos do PostSale.
- Disclaimer legal completo do Investment (rentabilidade + contemplação).
- Banner de estratégia recomendada do Proposal (incluindo source label e botão Limpar).
- Quick Summary do Proposal (Carta · Parcela · Prazo + badges) — só mudou o chrome.
- Toda a inteligência consultiva, hooks, providers, lógica financeira, IA e Supabase.

---

## Impacto visual esperado

| Módulo | Antes | Depois |
|---|---|---|
| **PostSale** | 3 linhas editoriais decorativas + KPIs | KPIs no topo, sem ornamento |
| **Proposal** | 2 azuis competindo no topo | 1 azul protagonista (recomendação) + neutro |
| **Investment** | Intro paralela ao header + disclaimer longo | Apenas disclaimer compacto |

**Sensação geral:** menos chrome decorativo, hierarquia primary respeitada, mais respiração imediata abaixo do `ModuleHeader`.

---

## Validação

- ✅ Lógica financeira / hooks / providers / runtime / Supabase: **intactos** (zero edits fora de JSX/className).
- ✅ KPIs, valores e badges preservados pixel-a-pixel em conteúdo.
- ✅ Disclaimers legais mantidos.
- ✅ IA continua presente (CentralAI no Investment, sugestões em PostSale, ContextualSalesScript no Proposal).
- ✅ Builds via Lovable (sem alterações de import/types).
- ✅ Responsividade preservada (changes não tocaram breakpoints).

---

## Próximos Medium Changes recomendados

Em ordem de impacto/esforço (do mais barato ao mais arquitetural):

1. **MC-1 · Card consolidado por cliente em PostSale** — fundir `status + próxima ação + sinais` em 1 card por cliente com expansão progressiva. Hoje são 3 áreas visuais por linha.
2. **MC-2 · KPI strip executivo na Carteira** — substituir `SalesForecastCard` + `PortfolioInsightsBar` no topo por 1 strip horizontal de 4 números (sem cards).
3. **MC-3 · Toolbar horizontal de filtros na Comunidade** — colapsar a coluna de filtros laterais em uma toolbar superior; libera o feed para ocupar o canvas.
4. **MC-4 · Painel IA contextual único em Abordagem (Objections)** — IA por aba → 1 painel contextual que muda conforme objeção/storytelling/trigger selecionado.
5. **MC-5 · Wizard Diagnóstico 1-viewport-por-passo** — auditar cada step para garantir que cabe em 800px sem scroll.
6. **MC-6 · Tooltip de disclaimer no Investment** — italics permanente "* Cenários consideram lance…" → tooltip do `InvestmentSummaryCards`.

Cada MC merece audit dedicado em `.lovable/audit/` antes da execução, conforme padrão.

---

## Arquivos alterados nesta wave

- `src/components/modules/PostSaleModule.tsx` — bloco editorial removido (linhas 289–306).
- `src/components/modules/ProposalModule.tsx` — chrome do Quick Summary neutralizado (linha 244).
- `src/components/modules/InvestmentModule.tsx` — intro redundante removida (linhas 416–419).
- `.lovable/audit/quickwins-ux-cleanup-wave.md` — este relatório.

**Nenhum hook, contexto, edge function, migration, schema, rota ou estilo global foi tocado.**
