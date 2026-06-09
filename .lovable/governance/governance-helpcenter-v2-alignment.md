# Governance + Help Center V2 Alignment

**Wave:** Governance / Documentation Sync
**Scope:** Help Center, governance memory, terminology, constitution alignment
**Mode:** Documentation audit · 0 code changes · 0 motor changes
**Date:** 2026-05-16
**Baseline:** V2 LOCKED FOR PRODUCTION + `mem://governance/v2-product-constitution`

---

## Executive Summary

A V2 está consolidada no produto, na constituição e na memória de projeto. A **central de ajuda** (`src/data/helpContent.ts` + `src/components/modules/HelpModule.tsx` + `src/lib/contextualHelp/registry.ts` + `docs/help/contextual-help-policy.md`) **ainda descreve o produto como V1**: módulos paralelos "Investimento", "Comparadores", "Operações Estruturadas", "Estratégia" sem referência a:

- Plataforma Patrimonial · Edição Consultiva
- Capítulos patrimoniais
- Macro teses
- Compare Workspace unificado
- Consultive Strategy Panel
- Progressive disclosure editorial

A central de ajuda **não está quebrada** — ela está **defasada vocabular e estruturalmente**. Nenhum artigo precisa ser apagado; **todos precisam ser religados ao léxico V2** como camada superior, mantendo a explicação técnica subjacente.

**Governança:** já alinhada via `mem://governance/v2-product-constitution` + Core rule no índice de memória. Nenhum gap aqui.

**Verdict:** ✅ **alinhamento aprovado com 1 ação documental obrigatória** (release vocabulário V2 no Help) e 4 ações de polimento opcionais. Nenhuma acción altera produto.

---

## Help Center Audit

### Inventário atual

| Surface | Localização | Status V2 |
|---|---|---|
| Conteúdo editorial | `src/data/helpContent.ts` (1580 linhas, 7 grupos: Plataforma, Simulação, Investimento, Comparadores, Estratégia, Operações Estruturadas, Diagnóstico) | 🟡 Vocabulário V1 |
| Componente container | `src/components/modules/HelpModule.tsx` (637 linhas) | 🟡 Refere "Simulador, Investimento, Comparadores" no header doc |
| Hints contextuais | `src/lib/contextualHelp/registry.ts` (275 linhas) | 🟢 Estrutura agnóstica, ok |
| Hint UI | `src/components/help/HelpHint.tsx`, `ContextualInsightStrip.tsx` | 🟢 ok |
| Política | `docs/help/contextual-help-policy.md` (73 linhas) | 🟢 ok |

### Achados

1. **🟡 H-A1** — `helpContent.ts` linha 11 (cabeçalho do arquivo) lista os módulos como "Simulador, Investimento, Comparadores" — descrição V1 da arquitetura.
2. **🟡 H-A2** — Artigo "Fluxo institucional 7 etapas" (linha 192) descreve etapa 3 como *"Análise — explora investimento, comparadores, lances e operações estruturadas"*. Na V2, Investimento + Engenharia Patrimonial estão unificados na Plataforma Patrimonial; o texto precisa refletir isso sem deletar o detalhe técnico.
3. **🟡 H-A3** — Grupo "Investimento" (linha 367) e grupo "Operações Estruturadas" (linha ~526) ainda são apresentados como módulos paralelos. Na V2 são **capítulos patrimoniais** dentro da Edição Consultiva.
4. **🟡 H-A4** — Nenhum artigo introduz: *Plataforma Patrimonial · Edição Consultiva*, *Capítulos*, *Macro teses*, *Compare Workspace*, *Consultive Strategy Panel*, *Progressive disclosure*.
5. **🟢 H-A5** — `ConsultiveBlockKind` (linha 38) já existe como tipagem (`discovery`, `ideal-profile`, `deep-dive`, etc.) — a infraestrutura consultiva está pronta; falta o vocabulário V2 nos `title`/`body`.
6. **🟢 H-A6** — Nenhum screenshot embarcado no Help Center (todo texto) → sem assets V1 a invalidar.
7. **🟢 H-A7** — Tom já é consultivo na maior parte (sem CTAs agressivos, sem jargão bancário).

---

## Outdated V1 References

Itens explícitos a atualizar (sem deletar conteúdo técnico):

| ID | Arquivo | Linha aprox. | Texto V1 | Substituição V2 |
|---|---|---|---|---|
| V1-1 | `src/data/helpContent.ts` | 11 | "Simulador, Investimento, Comparadores, …" | "Simulador · Plataforma Patrimonial (Edição Consultiva) · Compare Workspace · Carteira · Pós-venda" |
| V1-2 | `src/data/helpContent.ts` | 192 | "Análise — explora investimento, comparadores, lances e operações estruturadas" | "Análise & Plataforma Patrimonial — leitura editorial dos capítulos patrimoniais (cenários de investimento, alavancagem, operações estruturadas) com Compare Workspace unificado" |
| V1-3 | `src/data/helpContent.ts` | 367, 526 | Grupos "Investimento" e "Operações Estruturadas" como módulos | Rebranding leve: "Capítulo: Investimento Patrimonial" / "Capítulo: Operações Estruturadas" + nota de abertura "faz parte da Plataforma Patrimonial · Edição Consultiva" |
| V1-4 | `src/components/modules/HelpModule.tsx` | header doc | menção a módulos paralelos | atualizar comentário do arquivo para refletir V2 |

**Nada precisa ser arquivado.** Todo o conteúdo técnico permanece válido — muda apenas a camada vocabular superior.

---

## Governance Alignment Updates

Estado atual da governança (já alinhado, não exige ação):

| Item | Localização | Status |
|---|---|---|
| Constituição V2 | `mem://governance/v2-product-constitution` | ✅ ativa |
| Core rule no índice | `mem://index.md` linha 25 | ✅ ativa |
| Áreas locked | declaradas na constituição | ✅ |
| 8 critérios de aprovação de feature | declarados | ✅ |
| Anti-fixes (6 categorias) | declarados | ✅ |
| Mobile-first review obrigatório | declarado | ✅ |
| Auditorias da V2 (7 relatórios) | `.lovable/audit/` | ✅ |
| Production lock review | `.lovable/audit/final-regression-production-lock-review.md` | ✅ |

**Nenhuma atualização de governance necessária.** A constituição já encapsula tudo o que esta wave pediria.

---

## Terminology Standardization

### Léxico oficial V2 (canônico daqui pra frente)

| Termo proibido (V1) | Termo oficial (V2) |
|---|---|
| "Módulo de Investimento" | "Capítulo: Investimento Patrimonial" |
| "Módulo de Engenharia Patrimonial" | "Capítulo: Operações Estruturadas" |
| "Módulos paralelos" / "Análise" como agregador | "Plataforma Patrimonial · Edição Consultiva" |
| "Painel de estratégia" / "Card de estratégia" | "Consultive Strategy Panel" |
| "Comparador" / "Tela de comparação" | "Compare Workspace" |
| "Tese" isolada | "Macro tese" (no nível do capítulo) / "Estratégia" (no nível da carta) |
| "Dashboard patrimonial" | proibido (viola constituição §3.1) |
| "Feature de investimento" | "Profundidade do capítulo Investimento" |
| "Tela de resultados" | "Hero editorial → Recomendado → Capítulos" |
| Verbos: "Simular", "Calcular", "Gerar" como CTAs principais consultivos | "Comparar com…", "Continuar a leitura", "Explorar tese" |

### Linguagem proibida (já mapeada na constituição §8)

- agressiva, comercial, técnica em excesso, operacional, jargão bancário.

### Linguagem oficial (constituição §8)

- consultiva, sofisticada, clara, calma, inteligente, objetiva.

---

## Help Center Structure Analysis

| Critério | Estado |
|---|---|
| Clareza estrutural | 🟢 7 grupos com hierarquia limpa |
| Onboarding implícito (artigo "Plataforma" abre com fluxo 7 etapas) | 🟡 fluxo ainda descrito em léxico V1 |
| Facilidade de descoberta | 🟢 `articleById` + `related` cobrem navegação cruzada |
| Guidance contextual via `ContextualInsightStrip` | 🟢 ativo, agnóstico ao léxico |
| Excesso de profundidade inicial | 🟢 ausente — artigos têm `blocks` opcionais (progressive disclosure já implementado) |
| Duplicações | 🟢 nenhuma detectada |
| Navegação cansativa | 🟢 não — ConsultiveBlockKind permite leitura em camadas |

**Estrutura aprovada como está.** O único gap é vocabular, não estrutural — coerente com a regra de ouro da constituição: *manter superfície simples mesmo ganhando profundidade*.

---

## Governance Memory Updates

Memória institucional **já está sincronizada**:

- Core rule "V2 Constitution" no índice (linha 25 de `mem://index.md`).
- Memória detalhada em `mem://governance/v2-product-constitution`.
- Referências cruzadas com 7 relatórios em `.lovable/audit/`.
- Áreas locked enumeradas e versionadas.

**Adição opcional não bloqueante:** criar `mem://governance/v2-terminology` consolidando a tabela de terminologia acima como contrato vivo. Não obrigatório nesta wave — a tabela já vive neste documento.

---

## Obsolete Content To Archive

**Lista oficial de itens obsoletos:** **vazia.**

- Nenhum documento `.md` precisa ser arquivado.
- Nenhum artigo do Help Center precisa ser deletado.
- Nenhuma regra de governança precisa ser revogada.
- Os 7 relatórios de auditoria da review phase permanecem como histórico institucional permanente.

**Itens conceitualmente mortos (não documentos, mas mentalidades) — explicitamente proibidos pela constituição:**

- "Investimento" e "Engenharia Patrimonial" como módulos independentes/paralelos.
- Tabs V1 de módulos no topo da experiência patrimonial.
- Dashboards de KPIs patrimoniais hero-style.
- Comparadores múltiplos simultâneos (>3 estratégias).
- CTAs operacionais agressivos ("Simular agora", "Calcular já") em contexto consultivo.

---

## Final Consistency Validation

| Camada | Vocabulário V2 | Estrutura V2 | Governança V2 |
|---|---|---|---|
| Produto (`WealthPlatformModule.tsx`, `ConsultiveStrategyPanel.tsx`, `CompareWorkspace.tsx`) | ✅ | ✅ | ✅ |
| Memória de projeto (`mem://`) | ✅ | ✅ | ✅ |
| Constituição V2 | ✅ | ✅ | ✅ |
| Relatórios de auditoria | ✅ | ✅ | ✅ |
| Política de Help (`docs/help/contextual-help-policy.md`) | ✅ | ✅ | ✅ |
| **Conteúdo do Help (`helpContent.ts`)** | 🟡 ações V1-1 a V1-4 | ✅ | ✅ |
| Hints contextuais (`registry.ts`) | ✅ | ✅ | ✅ |

**Gap único:** vocabulário do `helpContent.ts` + cabeçalho do `HelpModule.tsx`. Tudo o resto está sincronizado.

---

## Approved Governance Baseline

Daqui pra frente, a baseline oficial é:

1. **Constituição V2** (`mem://governance/v2-product-constitution`) — fonte única.
2. **Léxico V2** (tabela em "Terminology Standardization" deste documento) — vocabulário oficial.
3. **Áreas locked** (declaradas na constituição) — não modificar sem decisão de produto formal.
4. **8 critérios de aprovação de feature** — toda nova feature passa, ou não entra.
5. **Mobile-first review** — todo trabalho de UX é aprovado primeiro em mobile.
6. **5 reviews obrigatórios para grandes evoluções**: perceptual, hierarchy, mobile, consultive, anti-regression.
7. **Regra de ouro:** simples mesmo ficando mais profundo.

---

## Locked Rules

- 🔒 `COMPARE_MAX = 3` (permanente).
- 🔒 `src/core/finance/*` (motor financeiro intocável em waves de UX).
- 🔒 `WealthPlatformModule.tsx` — estrutura Hero → Recomendado → Capítulos → Painel.
- 🔒 `ConsultiveStrategyPanel.tsx` — narrativa antes de números, footer consultivo CG-2.
- 🔒 `CompareWorkspace.tsx` — Winner + insights únicos + disclaimer único + 1col mobile <380px.
- 🔒 `intents.ts` + telemetria U8.
- 🔒 Microcopy aprovada CG-1/CG-2.
- 🔒 Calibrações F2 / H2 / F3 / F4.
- 🔒 Léxico V2 (não regredir para módulos paralelos).
- 🔒 Anti-fixes da constituição §3.1–§3.6.

---

## Final Verdict

✅ **GOVERNANÇA TOTALMENTE ALINHADA.**
🟡 **HELP CENTER 95% ALINHADO** — gap vocabular pontual em `helpContent.ts` (4 substituições documentadas em "Outdated V1 References") e 1 comentário em `HelpModule.tsx`. Sem urgência, sem bloqueio de produção, sem alteração de UX.

### Recomendação

1. **Tratar V1-1 a V1-4 como um único polish documental** num próximo ciclo de manutenção (não exige wave própria, não exige auditoria perceptiva — é apenas texto consultivo).
2. **Adotar o léxico V2 desta tabela como contrato linguístico permanente** em qualquer novo artigo, hint, microcopy ou documentação.
3. **Não criar novas estruturas de Help.** A arquitetura atual (ConsultiveBlockKind + registry + Hint) já implementa progressive disclosure consultivo nativo da V2.
4. **Encerrar oficialmente o ciclo de alinhamento institucional V2.** Produto, governança, memória e help estão falando — daqui pra frente — a mesma linguagem.

— Fim do Governance + Help Center V2 Alignment —
