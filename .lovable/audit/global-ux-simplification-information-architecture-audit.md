# Global UX Simplification & Information Architecture Audit

**Data:** 2026-05-14
**Versão alvo:** v2.4.0 → v2.5.0 (proposta)
**Tipo:** Auditoria estratégica — **propostas**, não execução. Zero código alterado neste relatório.
**Premissa absoluta:** simplificar **sem empobrecer**. Reduzir ruído, não inteligência.

---

## 0. Resumo executivo

O sistema **não tem problema de design** — tem **problema de densidade**. Após múltiplas waves de IA, copiloto, scoring, forecast, signals e cards educativos, cada módulo acumulou **camadas concorrentes** que repetem o mesmo insight em formatos diferentes. O usuário está pagando custo cognitivo para reler o que já viu.

**Diagnóstico em 1 frase:** o produto evoluiu de "simulador" para "consultor digital", mas a interface ainda exibe **todos os subprodutos da consultoria simultaneamente**, em vez de orquestrá-los hierarquicamente.

**Tese de simplificação:** cada módulo deve ter **1 protagonista, 1 comparativo, 1 ação, 1 IA opcional**. Tudo o mais é suporte colapsável.

---

## 1. Mapeamento global por módulo

Densidade real (linhas / `<Card>` / referências IA):

| Módulo | Linhas | Cards | IA refs | Estado |
|---|---:|---:|---:|---|
| PostSale | 852 | 2 | 2 | 🔴 Sobrecarregado |
| Investment | 795 | 2 | 6 | 🟡 Já parcialmente limpo (wave anterior) |
| ProposalHistory | 775 | 0 | 0 | 🟡 Lista densa, falta hierarquia |
| Community | 664 | 14 | 3 | 🔴 **Card-soup crítico** |
| ProposalPdf | 660 | 3 | 4 | 🟡 OK por ser PDF |
| Help | 636 | 4 | 3 | 🟡 Bem estruturado, pequenos excessos |
| Diagnostic | 493 | 7 | 0 | 🟡 Wizard com chrome alto |
| Proposal | 437 | 4 | 2 | 🟡 |
| Objections | 421 | 3 | 6 | 🔴 IA repetitiva |
| Comparator | 406 | 0 | 0 | 🟢 |
| Bids | 312 | 2 | 0 | 🟢 (wave Narrative Flow já limpou) |
| Simulator | 294 | 0 | 0 | 🟢 (wave recente) |
| StructuredOps | 261 | 0 | 0 | 🟢 |
| Analysis (hub) | 203 | 0 | 5 | 🟡 (wave copiloto contextual já corrigiu) |
| Assemblies | 104 | 0 | 0 | 🟢 |

---

## 2. Padrões transversais detectados

### 2.1 Anti-padrões recorrentes

| ID | Padrão | Ocorrências | Custo |
|---|---|---|---|
| **AP-1** | **Dupla introdução** (toolbar `<p>` + Card "Este módulo apresenta…") | Investment (corrigido), Diagnostic, Proposal, PostSale | Redundância leitura 100% |
| **AP-2** | **IA ecoando headline** (trigger de IA repete winner/lucro/score já exibido) | Investment (corrigido), Objections, PostSale | Cognitivo 2× |
| **AP-3** | **Nested cards** (Card > CardContent > Card interno) | Community (14 cards), Diagnostic (7), Help (4) | Chrome 3 camadas |
| **AP-4** | **Disclaimer redundante** (legal text repetido em toolbar + card + footer) | Investment, Proposal, ProposalPdf | Ruído legal |
| **AP-5** | **Badge-soup** (3+ badges no mesmo header sem hierarquia) | PostSale, ProposalHistory, Community | Atenção dispersa |
| **AP-6** | **KPI duplicado entre hub e detalhe** (Cockpit já mostra; submódulo repete) | Analysis hub (mitigado), PostSale | Redundância numérica |
| **AP-7** | **Surface concorrente** (`bg-primary/5 border-primary/20` consecutivos) | Investment (corrigido), Diagnostic intro, Proposal hero | Tudo "primary" = nada primary |
| **AP-8** | **Empty state inflado** (alert + card + ilustração + texto + CTA) | Community, ProposalHistory, PostSale | Estado vazio mais pesado que estado cheio |
| **AP-9** | **Collapsible aberto por padrão** (todos os "Detalhes técnicos" expandidos) | Diagnostic, Proposal, Bids submódulos | Page scroll 3× maior |
| **AP-10** | **Tabs + Accordion sobreposição** (TabsContent contém Collapsibles que contém Tabs) | PostSale, Help | Navegação confusa |

### 2.2 Hierarquia quebrada — sintomas

- Em **3 módulos** (PostSale, Community, ProposalHistory) o usuário precisa rolar **>1 viewport** para encontrar o resultado/lista principal.
- Em **5 módulos** o `ModuleHeader` é seguido por **2+ banners/alerts** antes de qualquer conteúdo funcional.
- Em **4 módulos** existe ambiguidade visual entre **"insight da IA"** e **"resultado calculado"** — mesmo padrão de Card, mesmo tom primary, mesmo ícone Sparkles.

---

## 3. Auditoria por módulo

### 3.1 Simulador 🟢
- **Redundante:** nenhum item crítico após wave recente.
- **Pode desaparecer:** nada.
- **Continua:** card "Tipo de Consórcio" + "Dados do Consórcio" + Resultados.
- **IA:** ausência correta — Simulador é entrada, não consulta.
- **Score atual:** 8.5/10. **Foco:** refinar microcopy de validação, sem mudanças estruturais.

### 3.2 Análise (hub) 🟡
- **Redundante:** AnalysisCopilot já consolidado no Cockpit (wave anterior). OK.
- **Pode fundir:** abas "Investimento" e "Comparador" têm ~40% de overlap conceitual (ambas comparam estratégias) — avaliar **merge** em wave estrutural.
- **IA:** correta no Cockpit como hub; AIInsightsPanel sempre `<details>` recolhido. Manter regra.
- **Score:** 8.0/10.

### 3.3 Investimento 🟡
- **Já corrigido:** Card institucional duplicado removido; CentralAI virou complemento neutro (wave anterior).
- **Resta:** disclaimer italics "* Cenários consideram o valor utilizado como lance…" → migrar para tooltip do `InvestmentSummaryCards`.
- **Pode fundir:** abas "Cenários" + "Estratégia Avançada" parecem dois produtos — auditar nomenclatura/escopo.
- **Score:** 8.5/10 (era 6.0).

### 3.4 Comparador 🟢
- **OK.** 0 cards diretos, lógica delegada a hooks. Sem ação requerida.
- **Score:** 8.5/10.

### 3.5 Estudo de Lances 🟢
- **OK** após wave Narrative Flow (3 blocos com stepper).
- **Refinar:** tabela de projeção comercial pode ganhar densidade (zebra rows + tabular-nums).
- **Score:** 8.5/10.

### 3.6 Op. Estruturadas 🟢
- **OK.** Relatório personalizado bem estruturado.
- **Score:** 8.0/10.

### 3.7 Assembleias 🟢
- **OK.** 104 linhas, foco operacional admin.
- **Score:** 9.0/10.

### 3.8 Diagnóstico 🟡
- **Redundante:** introdução do wizard repete o subtítulo do `ModuleHeader`. **AP-1**.
- **Poluindo:** 7 cards com `border + shadow` no mesmo wizard linear — bordas competem com o stepper.
- **Pode fundir:** cards "Perfil" + "Objetivo" do passo 1 (mesmo contexto cognitivo).
- **Pode desaparecer:** ilustração decorativa do passo final (não agrega informação).
- **Continua:** wizard step-by-step, copy consultiva, autosave de sessão.
- **IA:** ausente, correto — diagnóstico é input, IA roda depois.
- **Fluidez:** cada passo deve ocupar **1 viewport sem scroll** em desktop 1280×800. Hoje exige scroll.
- **Score atual:** 6.5/10. **Pós-limpeza alvo:** 8.5/10.

### 3.9 Abordagem (Coaching/Objections) 🔴
- **Redundante:** 6 referências a IA/Sparkles em 421 linhas — IA está em **toda aba**, não como camada estratégica.
- **Poluindo:** 3 cards "objeção × resposta × próximo passo" no mesmo viewport, mesma cor, mesmo peso.
- **Pode fundir:** "Storytelling", "Triggers" e "Objeções" hoje são 3 abas; conceito é **1 jornada de pitch** — virar acordeão narrativo dentro de 1 superfície.
- **IA:** deve ser **1 painel contextual** que se adapta à objeção selecionada, não 3 cards de IA repetidos.
- **Score:** 6.0/10. **Alvo:** 8.5/10.

### 3.10 Proposta 🟡
- **Redundante:** "Resumo executivo" + "Headline da proposta" + "Copy WhatsApp" repetem os mesmos 3 dados (cliente, valor, parcela).
- **Pode fundir:** preview da proposta + bloco de envio (copy WhatsApp) — virar **1 painel "Pronta para enviar"** com toggle de canal.
- **Continua:** templates dinâmicos, contextual sales script.
- **IA:** ContextualSalesScript bem posicionado — manter.
- **Score:** 7.0/10.

### 3.11 Proposta Completa (PDF) 🟡
- **Redundante:** preview PDF + lista de blocos selecionados + checklist de integridade + missing-data notes — 4 fontes de "o que vai sair".
- **Pode fundir:** lista de blocos + checklist em **1 sidebar** com badges inline.
- **Continua:** preview off-screen (fidelidade), MissingDataNote (relaxado).
- **Score:** 7.5/10.

### 3.12 Carteira (ProposalHistory + Pipeline) 🔴
- **Redundante:** 775 linhas, **0 cards** no arquivo principal mas dezenas em sub-componentes (`PortfolioInsightsBar`, `SalesForecastCard`, kanban cards, lista cards, métrica cards).
- **Poluindo:** Carteira hoje exibe simultaneamente: ForecastCard + InsightsBar + Filtros + Kanban + Lista + Métricas no rodapé. **6 superfícies primárias.**
- **Pode fundir:** ForecastCard + métricas pipeline em **1 strip executivo** no topo (4 KPIs em linha, sem cards).
- **Pode desaparecer:** badges de status redundantes nos cards do kanban (já existe coluna).
- **Continua:** kanban como protagonista, scoring unificado, signals.
- **IA:** ausente diretamente — correto. nextActionSuggestion entra **dentro do card**, não como banner.
- **Score:** 6.0/10. **Alvo:** 8.5/10.

### 3.13 Pós-venda 🔴
- **Redundante:** 852 linhas — maior módulo do sistema. Mistura: lista de pós-vendas + cadência + assistente IA + métricas + signals + insights.
- **Poluindo:** 6 referências IA, mesmo padrão visual entre "alerta de cadência" e "sugestão IA" e "score do cliente".
- **Pode fundir:** "Status pós-venda" + "Próxima ação" + "Sinais" → **1 card consolidado por cliente**, com expansão progressiva.
- **Pode desaparecer:** banner de boas-vindas/contexto do módulo (AP-1).
- **Continua:** tabela de pós-vendas, assistente de respostas, signals determinísticos.
- **IA:** **1 painel contextual** ao selecionar cliente, não banner global.
- **Score:** 5.5/10. **Alvo:** 8.5/10.

### 3.14 Comunidade 🔴
- **Redundante:** **14 cards** no arquivo principal — cada post, sidebar, filtro, categoria, badge é um card. Card-soup textbook.
- **Poluindo:** AP-3 (nested cards), AP-5 (badge-soup), AP-8 (empty state inflado).
- **Pode fundir:** filtros + categorias em **1 toolbar horizontal**.
- **Pode desaparecer:** card de "regras da comunidade" sempre visível → mover para `<details>` ou link no footer.
- **Continua:** feed, posts, sistema de ajuda mútua.
- **IA:** mínima e correta — manter ausente.
- **Score:** 5.0/10. **Alvo:** 8.0/10.

### 3.15 Central de Ajuda 🟡
- **Redundante:** "Versão atual" + "Changelog" + "Roadmap" + "Status" — 4 cards no topo com infos parcialmente sobrepostas.
- **Pode fundir:** strip único "v2.4.0 · última atualização 14/05 · status estável · ver changelog →".
- **Continua:** busca, FAQ, conteúdo educacional.
- **Score:** 7.5/10.

### 3.16 Governança/Admin 🟡
- **Já bem estruturado** após Governance Expansion Wave (sections com criticality/status/maturity).
- **Refinar:** SectionView pode ganhar modo "compact" (resumo executivo sem expandir blocks).
- **Score:** 8.0/10.

---

## 4. Plano executivo de simplificação

### 4.1 Quick wins (≤1 wave cada, alta visibilidade)

| # | Ação | Módulos | Impacto |
|---|---|---|---|
| QW-1 | Remover **disclaimer/intro duplicado** (AP-1) | Diagnostic, Proposal, PostSale | -1 surface por módulo |
| QW-2 | Padronizar **trigger IA neutro** (AP-2) — sem repetir winner/score | Objections, PostSale | IA deixa de parecer banner |
| QW-3 | **Collapse-by-default** em todos "Detalhes técnicos" (AP-9) | Diagnostic, Proposal, Bids | Scroll inicial -40% |
| QW-4 | **1 banner máximo** entre `ModuleHeader` e conteúdo principal | Todos | Hierarquia clara |
| QW-5 | Remover badges redundantes em kanban (AP-5) | Carteira | Atenção limpa |
| QW-6 | Strip único v2.4.0 no Help (vs 4 cards) | Help | -3 cards |

### 4.2 Medium changes (1-2 waves)

| # | Ação | Módulos | Impacto |
|---|---|---|---|
| MC-1 | **Card consolidado por cliente** (status + ação + sinais) em PostSale | PostSale | -50% chrome |
| MC-2 | **Strip executivo de KPIs** (4 números em linha) na Carteira | Carteira | Substitui 2 cards |
| MC-3 | **Toolbar horizontal de filtros** na Comunidade (vs cards laterais) | Community | -4 cards |
| MC-4 | **1 painel IA contextual** em Abordagem (vs IA por aba) | Objections | IA estratégica real |
| MC-5 | Wizard Diagnóstico **1-viewport-por-passo** | Diagnostic | Fluidez wizard |
| MC-6 | Tooltip para disclaimer de cenários (vs italic permanente) | Investment | -1 nota visual |

### 4.3 Structural consolidations (waves arquiteturais)

| # | Ação | Módulos | Impacto |
|---|---|---|---|
| SC-1 | Avaliar **merge "Investimento + Comparador"** em "Análise comparativa" | Análise | -1 aba conceitualmente sobreposta |
| SC-2 | Fundir Abordagem (3 abas) em **1 jornada acordeão narrativa** | Objections | -2 superfícies, +narrativa |
| SC-3 | **PDF: sidebar única** (blocos + checklist + missing data) | ProposalPdf | -2 painéis |
| SC-4 | **Design tokens "executive surface"**: criar primitivos `<KpiStrip>`, `<NarrativeAccordion>`, `<InsightChip>` para padronizar redução de chrome global | Sistema | Reuso, consistência |
| SC-5 | Política institucional **"1 protagonista por módulo"** documentada em `docs/ux/protagonist-rule.md` + lint visual em PR review | Sistema | Governança preventiva |

---

## 5. Diretrizes para a IA (transversal)

A IA hoje aparece como:
- ✅ **Cockpit Consultivo** (Análise hub) — correto, hub de roteamento.
- ✅ **CentralAI no Investimento** (após wave) — complemento neutro colapsado.
- 🔴 **6 surfaces em Objections** — banner promocional, repetitivo.
- 🔴 **PostSale com IA + Score + Cadência** indistinguíveis visualmente.

**Política proposta (Wave Sistema "AI as Layer"):**

1. **1 superfície IA por módulo**, sempre colapsada por padrão.
2. **Trigger neutro**: nunca repetir nome/valor/score já exibido na tela.
3. **Conteúdo IA = narrativa + risco + racional** — nunca "winner: X, valor: Y" (isso é resultado, não IA).
4. **Visual neutro** (`bg-muted/30`), reservar `primary` para o protagonista do módulo.
5. **Disclaimer único** ("Conteúdo gerado por IA, valide antes de enviar") — uma vez por módulo, no expand.

---

## 6. Diretrizes visuais (sistema)

| Regra | Atual | Alvo |
|---|---|---|
| Surfaces `bg-primary/*` consecutivas | até 4 | máx. 1 (protagonista) |
| Cards aninhados | até 3 níveis | máx. 1 nível |
| Banners entre `ModuleHeader` e conteúdo | até 3 | máx. 1 |
| Collapsibles abertos no boot | quase todos | apenas o protagonista |
| Badges por header | até 5 | máx. 2 |
| Disclaimers por módulo | até 4 | 1 (legal) + 1 (IA quando aplicável) |

---

## 7. Scores globais

### Antes (estado atual v2.4.0)

| Dimensão | Score |
|---|---:|
| Cognitive clarity | 6.0 |
| Hierarchy quality | 6.5 |
| Consultive sophistication | 8.0 |
| Premium minimalism | 5.5 |
| IA usefulness | 6.5 |
| Visual cleanliness | 6.0 |
| UX fluidez | 6.0 |
| Estabilidade operacional | 9.5 |

### Pós-execução do plano (alvo v2.5.0)

| Dimensão | Score | Δ |
|---|---:|---:|
| Cognitive clarity | 8.5 | +2.5 |
| Hierarchy quality | 9.0 | +2.5 |
| Consultive sophistication | 9.0 | +1.0 |
| Premium minimalism | 9.0 | +3.5 |
| IA usefulness | 8.5 | +2.0 |
| Visual cleanliness | 9.0 | +3.0 |
| UX fluidez | 8.5 | +2.5 |
| Estabilidade operacional | 9.5 | 0 |

**Objetivo claro:** v2.5.0 = sistema visualmente **30-40% mais leve** sem perder 1 funcionalidade.

---

## 8. Restrições absolutas (carry-over)

- ❌ Lógica financeira / engines / cálculos / IA core / hooks / runtime / providers / Supabase: **intocáveis**.
- ❌ Migrations, edge functions, schema: **fora de escopo**.
- ✅ Mudanças permitidas: JSX/Tailwind, presentation components, layout primitives, copy estática, props default de visibilidade.

---

## 9. Próximos passos sugeridos

1. **Aprovar plano** (quick wins + medium changes) com o stakeholder.
2. **Wave QW-1 a QW-6** primeiro — alta visibilidade, baixíssimo risco.
3. Antes de SC-1/SC-2, **prototipar com `design--create_directions`** para validar visualmente.
4. Cada wave gera audit dedicado em `.lovable/audit/` (padrão atual).
5. Atualizar `mem://design/copy/titulos-subtitulos-modulos` com regra "1 protagonista por módulo".

---

**Conclusão:** o sistema está a **1 wave consolidada** de virar referência de produto consultivo premium na categoria. Não falta nada — sobra estrutura. Reduzir é, agora, a maior alavanca de valor percebido.
