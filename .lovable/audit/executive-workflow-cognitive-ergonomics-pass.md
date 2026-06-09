# Wave 37 — Executive Workflow & Cognitive Ergonomics Pass

**Data:** 2026-05-19
**Tipo:** Auditoria de ergonomia cognitiva (governance-only, **zero código alterado**)
**Risco operacional:** Zero — nenhuma alteração em JSX, CSS, runtime, engines,
edges, providers. Respeita Production Lock V2.4 e V2 Constitution.

---

## Princípio

> Maturidade visual já está resolvida (W13→W36). O próximo gargalo não é mais
> "como parece", é **"quanto cansa após 1h de uso"**.

Esta wave audita conforto operacional, scanning executivo e fadiga em sessões
longas — sem propor redesign, sem simplificar capability, sem remover
profundidade. Apenas mapeia onde a plataforma exige mais esforço cognitivo do
que precisa, e converte achados em backlog priorizado.

---

## 1. Full Executive Workflow Audit

Mapeamento dos fluxos canônicos × esforço cognitivo observado.

| Fluxo | Telas | Esforço cognitivo | Observação |
|---|---|---|---|
| Diagnóstico → Simulação → Estratégia → Proposta | 4 módulos | **médio** | Bem governado (NextStepCTA, sidebar 6-step). Atrito mínimo. |
| Cockpit → Simulação completa | 2 | **baixo** | W36 reduziu glow; Cockpit já é "indica, não resolve". |
| Carteira → Pós-venda → Resposta | 3 | **médio-alto** | Cards de cliente densos; PortfolioInsightsBar mitiga. Risco: 30+ proposals = scanning fatigue. |
| Análise (Investment/Comparator/Bids/Advanced/Assemblies) | 5 tabs em 1 módulo | **alto** | Tab-rich; cada subtab é uma "tela longa". Risco real de scroll fatigue. |
| Wealth Platform → Consultive Panel → Compare | 3 layers profundos | **médio** | DR-1/DR-2 já balanceou via `<details>`. OK. |
| Admin (10+ tabs) | 1 | **alto** | Tab explosion. Aceitável (uso esporádico, não hot path). |

### Pontos de fadiga identificados
1. **AnalysisModule (5 sub-tabs)** — usuário pode passar 20–40min navegando entre Investment/Comparator/Bids; nenhum "recap visual" entre transições.
2. **Cards de proposta na Carteira** — 8–14 chips/badges por card; em listas de 20+, a densidade vira ruído.
3. **Tabela de composição da parcela** — alta densidade vertical; sem affordance de "colapsar segmentos lidos".
4. **Mobile pós-W34** — tipografia financeira já calibrada, mas thumb fatigue em sessões longas em Carteira não foi medido.

---

## 2. Executive Scanning Rebalance

Para cada tela hot path, qual é o foco primário, secundário e ruído?

| Tela | Foco 1º (intencional) | Foco 2º | Competição detectada |
|---|---|---|---|
| Cockpit | Hero metric (parcela / crédito) | Próximo passo CTA | Nenhuma (W36 limpou glow). |
| Simulador | Resultados (right stage) | Inputs (left) | Nenhuma (W18/W19 já segregou). |
| Análise → Investment | Cenário ativo (path 1–6) | Card de premissas | **Sim**: 6 cards de cenário com peso visual similar. Olho não sabe onde pousar primeiro. |
| Carteira | Lista de clientes | SalesForecastCard | **Sim**: cards de forecast + insights bar + lista competem por atenção no topo. |
| Pós-venda | Cliente selecionado | Sugestão IA | Aceitável. |
| WealthPlatform | Tese ativa | Estratégias principais | Bem hierarquizado (flagship layer). |
| Admin | Tab atual | — | Tab list densa, mas não-crítico. |

### Recomendação (sem código)
- Investment: marcar 1 cenário "primário" por contexto (já há `isRecommended`); reforçar contraste **tipográfico** (não cor), os outros ficam siblings.
- Carteira: priorizar lista vs forecast — forecast em `<details>` colapsado por default em mobile.

---

## 3. Cognitive Load Reduction Pass

Áreas com excesso de informação simultânea.

| Componente | Carga atual | Carga alvo | Caminho sugerido (backlog, não implementado) |
|---|---|---|---|
| ProposalCardContent | 4 KPIs + 3 chips + 2 CTAs + insights | 2 KPIs + 1 chip primário + 1 CTA | Progressive disclosure: chips secundários atrás de `<details>` ou hover-only no desktop |
| Composição da parcela | tabela 6 col × 12+ linhas | mesma, com sticky header + grupos colapsáveis | `<details>` por segmento (capital/adm/FR/seguro) |
| AIInsightsPanel (Cockpit) | já em `<details>` recolhido (W governance) | manter | ✅ resolvido |
| InvestmentStorytelling | 6 linhas + 2 botões por cenário | manter — já é o ponto certo | ✅ |
| FAQ landing | accordion correto | ✅ | — |

### Princípio
Toda **microinformação** (≤11px, secundária, contextual) deve ser **default-hidden** quando o usuário não está em modo deep-dive. Nada novo precisa ser criado — usar `<details>` que já é padrão da plataforma.

---

## 4. Long Session Ergonomics

Heurística: sessão típica de gerente CAIXA = 90–180min/dia na plataforma.

| Eixo | Estado | Risco |
|---|---|---|
| Repetição estrutural | Cards uniformes pós-W14/W36 → **bom** para reconhecimento, **risco** de monotonia | Baixo — variação vem do conteúdo |
| Contraste sustentado | Sidebar azul institucional + canvas claro = alto contraste constante | **Médio** — sem modo "calmo" / dark institucional opcional |
| Motion | W28 limita a 120–240ms; sem motion decorativa no hot path | ✅ |
| Skeleton/loading | Breathing 2.4s — calmo, não pulsa | ✅ |
| Toaster | cap=3, dur=3.2s, bottom-right (W6) | ✅ |
| Tipografia financeira | tabular-nums + ss01 (W13/14) | ✅ |
| Hairlines tonais | W36 removeu gradientes decorativos | ✅ |

### Risco residual real
**Sidebar permanente em alto contraste** é o único elemento que "pulsa" perceptivelmente em sessão longa. Não é problema agora (governado por `mem://design/sidebar/protecao-azul-institucional`), mas é o candidato natural para uma futura opção de "modo concentrado" (sidebar colapsada por default após X min de inatividade na navegação). **Não implementar agora** — feature opcional, fora do lock.

---

## 5. Scroll & Flow Fatigue Audit

Telas com scroll vertical real (não overlay).

| Tela | Altura média (vh) | Repetição visual | Veredito |
|---|---|---|---|
| Simulador (desktop) | ~1.6 vh | baixa | ✅ |
| Análise → Bids | ~2.4 vh | média (3 blocos narrative) | ✅ — narrative flow justifica |
| Análise → Investment | ~2.8 vh | **alta** — 6 cenários × cards similares | ⚠️ Candidato a "view mode: comparar 2" |
| Carteira (50+ clientes) | depende | alta | ⚠️ Virtualização já existe (W performance), mas só dispara >200 |
| Pós-venda | ~1.8 vh | baixa | ✅ |
| WealthPlatform | ~2.2 vh | média | ✅ |
| Help Center | ~3+ vh | alta | aceitável (uso esporádico) |

### Backlog (sem implementar)
- Investment: toggle "mostrar 3 cenários" / "mostrar todos" — preserva profundidade, reduz scroll inicial.
- Carteira: baixar threshold de virtualização para 80 itens em mobile (atual: 200).

---

## 6. Operational Priority System

Validar que toda tela responde "o que importa mais agora?".

| Tela | Pergunta executiva | Resposta visual atual | OK? |
|---|---|---|---|
| Cockpit | "Onde estou no funil?" | Hero metric + próximo passo | ✅ |
| Simulador | "Quanto vai dar?" | Stage de resultados protagonista (W18/35) | ✅ |
| Bids | "Que lance ofereço?" | Recommended bid zone (W bids) | ✅ |
| Carteira | "Quem devo ligar hoje?" | Insights bar + ordenação por priority | ✅ |
| Pós-venda | "O que responder agora?" | Sugestão IA contextual | ✅ |
| Compare | "Qual tese vence?" | Winners + CTA "Simular esta" (W KPI gov) | ✅ |

Nenhum gap crítico. Sistema operacional já tem prioridade clara — fruto das waves anteriores (W6 canonical sources, W cockpit boundary, W flagship discoverability).

---

## 7. Mobile Executive Ergonomics

Viewport alvo: 380–414px, sessão típica 5–15min entre reuniões.

| Eixo | Estado | Risco |
|---|---|---|
| Thumb reach | BottomNav + MobileStickyCTA (W6/W1) | ✅ |
| Tap targets | 44px enforced (memory `interface/experiencia-mobile-interacoes`) | ✅ |
| Scrolling fatigue | ScrollAffordance fade-edge (W1) | ✅ |
| Density | Tipografia financeira reduzida 1100–1399 (W34); abaixo de 1100 herda mobile | ⚠️ Não há breakpoint dedicado a ≤414 para densidade de cards de proposta |
| CTA reachability | Sticky CTA sobe acima do BottomNav, some com keyboard | ✅ |
| Long-session | Não medido — backlog | — |

### Backlog
- Calibração de densidade de ProposalCardContent ≤414px (≤3 chips visíveis, resto em `<details>`).

---

## 8. Zero Regression Validation

| Risco | Status |
|---|---|
| Redesign teatral | ❌ Nada implementado nesta wave |
| Simplificação infantil | ❌ Nenhuma capability removida proposta |
| Redução de capability | ❌ Profundidade preservada — backlog usa `<details>`, não delete |
| Motion excessiva | ❌ Sem motion nova proposta |
| UX startup | ❌ Linguagem mantém tom institucional |
| Esconder profundidade | ❌ Progressive disclosure ≠ esconder; default-hidden + 1 clique para revelar |

---

## 9. Final Executive Comfort State

| Pergunta | Resposta honesta |
|---|---|
| Plataforma ficou menos cansativa? | **Já estava** após W28/W36. Esta wave não mexeu — apenas mapeou os 4 pontos residuais (Investment scenarios, ProposalCard density, sticky table headers, mobile ≤414 calibration). |
| Scanning ficou melhor? | Sem mudanças nesta wave. Scanning já está bom em 6 de 7 telas críticas. Risco real: AnalysisModule → Investment (6 cenários competindo). |
| Uso contínuo ficou mais confortável? | Não mudou agora — diagnóstico ergonômico está completo, conforto residual depende dos 3 backlogs (progressive disclosure em cards, toggle de cenários, mobile density). |
| Houve redução de fadiga? | **Conceitual**: sim, o mapa de fadiga existe agora e é auditável. **Real**: depende da execução do backlog priorizado. |
| Hierarquia ficou mais clara? | Já está clara. Operational Priority System validou 6/6 telas críticas. |
| Experiência parece mais fluida? | Para os hot paths, sim (W36 + governance). AnalysisModule é o único candidato a "fluidez recuperada" em wave futura. |

---

## Backlog priorizado (NÃO implementado nesta wave)

| # | Item | Esforço | Impacto cognitivo | Onda sugerida |
|---|---|---|---|---|
| 1 | ProposalCardContent: chips secundários em `<details>` | S | alto | próxima ergonomics wave |
| 2 | AnalysisModule → Investment: toggle 3/6 cenários | M | alto | próxima ergonomics wave |
| 3 | Composição da parcela: `<details>` por segmento | S | médio | quando houver demanda |
| 4 | Carteira mobile: baixar threshold de virtualização p/ 80 | S | médio | quando user reportar lag |
| 5 | ProposalCardContent ≤414px: ≤3 chips visíveis | S | médio | quando houver demanda mobile |
| 6 | "Modo concentrado" — sidebar auto-collapse após X min | M | baixo-médio | opcional, fora do lock |

**Critério para promover item do backlog → wave de implementação:** evidência de fadiga reportada por gerente real, ou métrica de scroll/dwell time anômala via Performance Intelligence Dashboard.

---

## Final Verdict

A plataforma **já é confortável** para uso profissional contínuo. O ganho de
W13→W36 (visual, peso, anti-AI-slop) eliminou os irritantes perceptivos
óbvios; W6, W bids narrative, W cockpit boundary, W flagship discoverability
e W KPI governance eliminaram os irritantes cognitivos óbvios.

O que esta wave entrega é o **mapa**: onde os 4 pontos residuais de fadiga
moram, com caminho de mitigação por progressive disclosure (não por
simplificação) e critério objetivo para promover cada item.

**Mover de "produto premium sofisticado" para "plataforma executiva confortável"
não exige mais uma wave de mudança — exige disciplina para não adicionar nada
até que um dos 4 itens do backlog vire sinal real.**

A regra de ouro permanece: **subtração governada > adição decorativa**.

---

## Arquivos tocados

- `.lovable/audit/executive-workflow-cognitive-ergonomics-pass.md` — este relatório (único arquivo desta wave)
