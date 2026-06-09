# Micro Copy + Terminology Cleanup Pass

**Wave:** Linguistic Cleanup · Terminology Lock
**Scope:** Resíduos vocabulares V1-1 a V1-4 identificados em `.lovable/governance/governance-helpcenter-v2-alignment.md`
**Mode:** Micro-copy only · 0 alteração de UX/flow/hierarquia/estrutura · 0 alteração de motor
**Date:** 2026-05-16

---

## Executive Summary

Limpeza linguística final da V2. Os 4 resíduos V1 (V1-1 a V1-4) foram eliminados via substituições textuais cirúrgicas em **2 arquivos**, exclusivamente em cabeçalhos de documentação interna, títulos de categorias do Help e descrições textuais.

- Nenhuma estrutura, hierarquia, layout, componente, fluxo, telemetria ou comportamento foi alterado.
- Nenhum artigo foi removido; apenas o léxico superior foi religado à V2.
- O conteúdo técnico subjacente (matemática, regras, blocos consultivos) permanece intacto.

**Verdict:** ✅ **CONCLUÍDO — V2 LINGUISTIC LOCK.**

---

## Official Approved Terminology

Léxico oficial e único da plataforma daqui pra frente:

| Categoria | Termo oficial V2 |
|---|---|
| Experiência consultiva principal | **Plataforma Patrimonial · Edição Consultiva** |
| Unidade narrativa interna | **Capítulo patrimonial** (ex.: "Capítulo: Investimento Patrimonial", "Capítulo: Operações Estruturadas") |
| Tese central de um capítulo | **Macro tese** |
| Recomendação destacada na abertura | **Recomendado** |
| Painel de detalhe de uma estratégia | **Consultive Strategy Panel** |
| Comparação lado a lado | **Compare Workspace** (máx. 3 estratégias) |
| Cartão executivo de estratégia | **Executive Strategy Card** |
| Revelação gradual de profundidade | **Progressive disclosure** / **leitura editorial** |
| CTAs consultivos canônicos | "Comparar com…", "Voltar à leitura", "Continuar a leitura", "Explorar tese" |
| Tom narrativo | **Editorial · consultivo · calmo** |

---

## Deprecated V1 Terminology

Termos **proibidos** em qualquer artefato novo (código, documentação, copy, microcopy, IA, PDF, help):

| V1 deprecado | Substituir por |
|---|---|
| "Módulo de Investimento" / "Investimento" como módulo isolado | "Capítulo: Investimento Patrimonial" |
| "Módulo de Engenharia Patrimonial" / "Operações Estruturadas" como módulo isolado | "Capítulo: Operações Estruturadas" |
| "Análise" como agregador de Investimento + Comparadores + Lances + OE | "Plataforma Patrimonial · Edição Consultiva" |
| "Comparador" / "Tela de comparação" | "Compare Workspace" |
| "Painel de estratégia" / "Card de estratégia" (genérico) | "Consultive Strategy Panel" / "Executive Strategy Card" |
| "Dashboard patrimonial" | **proibido** (viola constituição §3.1) |
| "Tela de resultados" patrimonial | "Hero editorial → Recomendado → Capítulos" |
| CTAs "Simular agora", "Calcular já", "Gerar agora" em contexto consultivo | CTAs consultivos da tabela acima |
| "Tese" isolada ambígua | "Macro tese" (capítulo) ou "Estratégia" (carta) |

---

## V1 Vocabulary Cleanup — Execução

| ID | Arquivo | Antes (V1) | Depois (V2) |
|---|---|---|---|
| **V1-1** | `src/data/helpContent.ts` (linhas 9-13, cabeçalho) | "Primeiros Passos, Simulador, Investimento, Comparadores, Operações Estruturadas, Nichos, Comunidade, Governança & Segurança" | "Primeiros Passos, Simulador, Plataforma Patrimonial · Edição Consultiva — capítulos Investimento Patrimonial e Operações Estruturadas — Compare Workspace, Nichos, Comunidade, Governança & Segurança" |
| **V1-2** | `src/data/helpContent.ts` (linha 192, artigo "Fluxo ideal") | Etapa 3 = "Análise — explora investimento, comparadores, lances e operações estruturadas." | Etapa 3 = "Plataforma Patrimonial · Edição Consultiva — leitura editorial dos capítulos patrimoniais (Investimento Patrimonial, Operações Estruturadas, estudo de lances) com Compare Workspace unificado." |
| **V1-3a** | `src/data/helpContent.ts` (linha 367-374, grupo C) | Comentário "C. Investimento" · title "Investimento" · executiveSummary genérico | Comentário "C. Capítulo: Investimento Patrimonial (parte da Plataforma Patrimonial · Edição Consultiva)" · title "Capítulo: Investimento Patrimonial" · executiveSummary com religação institucional |
| **V1-3b** | `src/data/helpContent.ts` (linha 520-526, grupo Operações Estruturadas) | title "Operações Estruturadas" · executiveSummary sem ancoragem V2 | Comentário "E. Capítulo: Operações Estruturadas (parte da Plataforma Patrimonial · Edição Consultiva)" · title "Capítulo: Operações Estruturadas" · executiveSummary com religação institucional |
| **V1-4** | `src/components/modules/HelpModule.tsx` (cabeçalho, linhas 1-10) | Comentário descrevia "categorias, resumos executivos, blocos consultivos…" sem âncora arquitetural V2 | Comentário lista explicitamente Simulador · Plataforma Patrimonial · Edição Consultiva (capítulos) · Compare Workspace · Carteira · Pós-venda + referência ao léxico oficial |

**O que NÃO foi tocado:**
- Nenhum `id` de categoria/artigo (`investimento`, `operacoes-estruturadas`, `op-estruturadas`, etc.) — manter ids preserva navegação, deep-links, `related`, `articleById`, hints e analytics.
- Nenhum bloco `kind` consultivo.
- Nenhum corpo técnico de artigo (matemática, regras, deep-dives).
- Nenhum subtitle (`Pensar como capital`, `Multiplicar patrimônio`) — já consultivos.
- Nenhum componente React, estrutura de Tabs, layout, hierarquia ou ordem de categorias.
- Nenhum hint contextual em `src/lib/contextualHelp/registry.ts` (já agnóstico).
- Nenhum item do `glossary`, `trails` ou `practicalTips`.

---

## Consultive Language Validation

Após a limpeza, varredura confirma:

| Critério | Estado |
|---|---|
| Vocabulário V1 residual em cabeçalhos visíveis ao usuário | ✅ eliminado |
| Ancoragem dos capítulos à Plataforma Patrimonial · Edição Consultiva | ✅ explícita |
| Tom consultivo nos `executiveSummary` ajustados | ✅ preservado e reforçado |
| CTAs agressivos / jargão bancário / linguagem operacional excessiva | ✅ ausentes |
| Nomenclaturas duplicadas ou ambíguas | ✅ ausentes |
| Aliases V1 ainda presentes em copy técnica subjacente | 🟢 aceitos (referem-se ao motor / engine, não ao léxico de produto) |

**Nota técnica:** menções a "módulo Investimento" / "módulo OE" dentro de corpos de artigos (`explanation`) que se referem ao **componente técnico/engine** foram preservadas por descreverem implementação, não a arquitetura de produto exposta ao usuário. O cabeçalho de capítulo, agora explicitamente "Capítulo: …", contextualiza qualquer leitor de que se trata de uma camada da Edição Consultiva.

---

## Help Center Micro Alignment

- ✅ Estrutura preservada (7 grupos · ordem original · hierarquia visual idêntica).
- ✅ Onboarding implícito ("Fluxo ideal de uso") agora cita a Plataforma Patrimonial · Edição Consultiva como etapa 3.
- ✅ Capítulos "Investimento Patrimonial" e "Operações Estruturadas" agora se autoidentificam como partes da Edição Consultiva no executiveSummary.
- ✅ Nenhuma alteração de `id`, `related`, `modules`, `trails`, `glossary` → zero risco de quebra de navegação.
- ✅ Nenhuma alteração de componente React → zero risco de regressão visual.

---

## Governance Terminology Lock

Baseline oficial congelada:

1. **Léxico V2** desta wave = contrato linguístico permanente.
2. Toda nova surface, microcopy, artigo, hint, prompt de IA, mensagem WhatsApp consultiva e bloco de PDF deve usar **exclusivamente** os termos oficiais V2.
3. Aliases V1 são proibidos em qualquer artefato com superfície ao usuário a partir desta data.
4. Termos técnicos internos (nomes de hooks, contextos, arquivos `*.tsx`) **podem manter** nomes herdados — eles descrevem implementação, não vocabulário de produto.
5. Esta wave fecha oficialmente o ciclo de alinhamento linguístico V2 iniciado em `.lovable/governance/governance-helpcenter-v2-alignment.md`.

---

## Final Consistency Validation

| Camada | Léxico V2 |
|---|---|
| Produto (`WealthPlatformModule.tsx`, `ConsultiveStrategyPanel.tsx`, `CompareWorkspace.tsx`) | ✅ |
| Memória de projeto (`mem://index.md`, `mem://governance/v2-product-constitution`) | ✅ |
| Auditorias (`.lovable/audit/*`) | ✅ |
| Relatório de alinhamento (`.lovable/governance/governance-helpcenter-v2-alignment.md`) | ✅ |
| Política de Help (`docs/help/contextual-help-policy.md`) | ✅ |
| **Conteúdo do Help (`src/data/helpContent.ts`)** | ✅ (limpo nesta wave) |
| **Cabeçalho do `HelpModule.tsx`** | ✅ (limpo nesta wave) |
| Hints contextuais (`src/lib/contextualHelp/registry.ts`) | ✅ |

**Toda a plataforma fala oficialmente uma única linguagem.**

---

## Frozen Terminology Rules

🔒 **Termos congelados (oficiais — não modificar sem nova decisão de produto formal):**
- "Plataforma Patrimonial · Edição Consultiva"
- "Capítulo: Investimento Patrimonial"
- "Capítulo: Operações Estruturadas"
- "Compare Workspace"
- "Consultive Strategy Panel"
- "Executive Strategy Card"
- "Macro tese"
- "Recomendado"
- "Progressive disclosure" / "leitura editorial"

🚫 **Termos proibidos (qualquer reintrodução deve ser bloqueada em revisão):**
- "Análise" como agregador patrimonial
- "Módulo de Investimento" / "Módulo de Engenharia Patrimonial" (em surface de usuário)
- "Dashboard patrimonial"
- "Tela de comparação" / "Comparador" como nome de surface
- CTAs "Simular agora", "Calcular já", "Gerar agora" em contexto consultivo

🔒 **Constituição V2** (`mem://governance/v2-product-constitution`) permanece como fonte única de governança.

---

## Final Verdict

✅ **MICRO COPY + TERMINOLOGY CLEANUP PASS — CONCLUÍDA.**

- 4 substituições cirúrgicas executadas (V1-1, V1-2, V1-3a, V1-3b, V1-4).
- 2 arquivos tocados: `src/data/helpContent.ts`, `src/components/modules/HelpModule.tsx`.
- 0 alteração de estrutura, UX, hierarquia, fluxo, telemetria, componentes ou comportamento.
- 0 risco de regressão (mudanças apenas em strings de cabeçalho/título/executiveSummary; ids preservados).
- Léxico V2 oficialmente congelado.
- Produto, help, governança, memória e auditorias falam agora a mesma linguagem consultiva premium.

**A V2 está linguisticamente travada. Ciclo de alinhamento institucional encerrado.**

— Fim do Micro Copy + Terminology Cleanup Pass —
