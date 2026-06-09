# Super Auditoria de Consistência Sistêmica

> **Escopo:** Validação cross-módulo de coerência entre inteligências, scores, prioridades, copy, dados e fluxos. Foco em **drift silencioso**, não em bugs técnicos isolados.
> **Premissa:** o sistema cresceu por ondas (1→5). Cada onda agregou inteligência. Esta auditoria valida se as inteligências **convergem** ou apenas **convivem**.

---

## 1. Mapa Sistêmico — Inteligências Ativas

### 1.1 Engines de scoring/prioridade (encontrados)

| Engine / helper | Localização | Domínio | Produz |
|---|---|---|---|
| `proposalPriority.ts` → `scoreProposal` | `src/utils/` | Carteira (proposals) | `priority: alta\|media\|baixa`, `score 0–100` |
| `clientScoring.ts` → `scoreProposalUnified` / `scorePostSaleClient` | `src/utils/` | Carteira **+** Pós-venda | `score 0–100`, `temperature: quente\|morno\|frio`, `urgency: urgente\|atencao\|reativar` |
| `relationshipSignals.ts` → `getProposal/PostSaleRelationshipSignals` | `src/utils/` | Carteira + Pós-venda | chips qualitativos (`risco`, `oportunidade`) |
| `relationshipTimingSignals.ts` → `getProposal/PostSaleTimingSignal` | `src/utils/` | Carteira + Pós-venda | janelas temporais (graça, SLA, cooling) |
| `portfolioSignals.ts` → `compute(PostSale)PortfolioSignals` | `src/utils/` (Onda 5) | agregado de carteira | `cooling`, `concentration`, `strong_window`, `cadence_alert` |
| `salesForecast.ts` → `computeSalesForecast` / `getStageProbability` | `src/utils/` | Pipeline | valor esperado, gap vs meta |
| `opportunityAnalysis.ts` | `src/utils/` | Pós-venda / cockpit | janelas de oportunidade |
| `nextActionSuggestion.ts` | `src/utils/` | Carteira + Pós-venda | próximo passo determinístico |
| `decisionEngine.ts` | `src/utils/` | Cockpit/Análise | recomendação de fase/CTA |
| `useCopilotTriggers` / `useCopilotRecommendedStep` | `src/hooks/` | Cockpit | gatilhos visuais e CTA recomendado |
| `useJourneyGuidance` | `src/hooks/` | Top bar | banner de jornada |
| `useCentralAI` (`centralAI.ts`) | `src/services/` | IA fachada | roteador de intents IA |
| `useModuleCopilot` | `src/hooks/` | Cockpit | fetch de insights IA por módulo |
| `salesPitchGenerator.ts` | `src/utils/` | Abordagem/Proposta | argumentos AIDA/PAS |
| `objectionRecommender.ts` | `src/utils/` | Abordagem | objeções sugeridas |
| Edges: `sales-copilot`, `sales-script`, `phase-action`, `module-copilot`, `trigger-script`, `investment-storytelling`, `niche-storytelling`, `sales-response`, `bid-recommendation`, `generate-proposal` | `supabase/functions/` | IA por intent | textos consultivos |

> **Observação inicial:** existem **9 helpers determinísticos** + **10 edges IA** atuando sobre o **mesmo cliente**. Ondas 4 e 5 introduziram unificação parcial (`clientScoring`, `centralAI`), mas a **substituição não foi total** — engines antigas continuam vivas.

---

## 2. Auditoria de Duplicidade de Inteligência

### 2.1 Scoring de cliente — DUAS fontes coexistindo

**Conflito canônico:**

| Pergunta | Engine A | Engine B |
|---|---|---|
| Qual a prioridade desta proposta? | `proposalPriority.scoreProposal` (alta/media/baixa) | `clientScoring.scoreProposalUnified` (quente/morno/frio + urgente/atencao/reativar) |
| Onde é consumido? | `ProposalHistoryModule` (ordenação Carteira) | `ProposalCardContent`, `PortfolioInsightsBar`, Cockpit |
| Fórmula igual? | **Não.** `proposalPriority` usa idade da prop. + valor relativo. `clientScoring` usa cadência + status + ticket. |

**Drift real:** uma proposta pode aparecer **"alta prioridade"** na ordenação da Carteira e **"morno"** no card visual da mesma tela. Memória `[Pipeline Cadence Single Source]` (Onda 4) tentou unificar SLA, mas não unificou *score base*.

**Veredito:** **dois motores de prioridade competindo.** Fonte canônica não declarada.

### 2.2 Sinais de relacionamento — TRÊS camadas

`relationshipSignals` + `relationshipTimingSignals` + `portfolioSignals` produzem chips/badges sobre o **mesmo eixo conceitual** (saúde de relacionamento), mas:
- `relationshipSignals` → chip por cliente.
- `relationshipTimingSignals` → janela temporal por cliente.
- `portfolioSignals` → agregado da carteira.

Nenhum dos três importa o resultado do outro. Há **risco de mensagens contraditórias**: cliente marcado como `strong_window` no agregado pode não ter `oportunidade` no chip individual.

### 2.3 Recomendação de próximo passo — TRÊS fontes

| Fonte | Nível |
|---|---|
| `nextActionSuggestion.ts` (determinístico) | client-level |
| `useCopilotRecommendedStep` (Cockpit) | journey-level |
| Edge `phase-action` (IA) | tool-call por fase |

Não há ordem de precedência declarada. Cockpit pode mostrar CTA X, Carteira sugerir Y, Abordagem gerar Z para o mesmo cliente no mesmo momento.

### 2.4 IA — fachada parcialmente respeitada

Memória `[CentralAI Unified Facade]` define `centralAI.ts` como fachada única. Verificado: **9 dos 10 edges** ainda são chamados diretamente (sales-copilot, sales-script, phase-action, etc.). A fachada existe **conceitualmente**, mas os consumidores reais bypassam.

---

## 3. Auditoria de Prioridade — Drift Operacional

| Cenário | Cockpit | Carteira (ordenação) | Carteira (chip) | Pós-venda |
|---|---|---|---|---|
| Cliente sem contato há 8 dias, ticket alto | "Atenção" (copilot trigger) | `priority=alta` (proposalPriority) | `morno` (clientScoring) | n/a |
| Cliente contemplado recente | n/a | n/a | n/a | `quente` + `cooling` (conflito potencial) |
| Lead recém-criado <48h | "Janela de graça" | `priority=baixa` | `morno` | n/a |

**Diagnóstico:** a Onda 4 introduziu **graça 48h** apenas em `cadenceRules.ts`. `proposalPriority` desconhece a graça e pode marcar como **alta** um lead que o sistema considera **em janela de graça** em outras camadas.

**Severidade:** média-alta. Não quebra fluxo, mas mina credibilidade consultiva ("o sistema parece confuso sobre o que importa").

---

## 4. Auditoria de Scores e Heurísticas

| Score | Fórmula | Valor | Reuso? |
|---|---|---|---|
| `proposalPriority.score` | idade × valor relativo | 0–100 | Carteira ordenação |
| `clientScoring.score` | cadência + status + ticket | 0–100 | Carteira chips, Cockpit |
| `user_engagement.score` (DB) | atividade na plataforma | 0–∞ | Comunidade/admin |
| `salesForecast.expectedValue` | prob. por etapa × ticket | R$ | Pipeline |
| `bidAnalysis.recommended` | percentis históricos | % | Lances |
| `clientHealth` (implícito) | derivado de signals | qualitativo | Cards |

**Problema:** dois scores **0–100** com fórmulas diferentes para o **mesmo objeto** (proposta). Ambos chamados de "score" sem qualificador. Em logs/eventos analíticos isso é indistinguível.

**Quick win:** renomear `proposalPriority.score` → `priorityScore` e `clientScoring.score` → `engagementScore`. Documentar qual é canônico para qual decisão.

---

## 5. Auditoria de Nomenclatura

Inconsistências detectadas (busca por strings):

| Conceito | Termos em uso | Recomendado |
|---|---|---|
| Pessoa antes de fechar | "lead", "prospect", "prospecção", "cliente" | **cliente** (memória já estabelece) |
| Pessoa após fechar | "cliente", "cotista", "contemplado" | **cliente** + estado (`contemplado`/`em grupo`) |
| Documento comercial | "proposta", "simulação", "resumo", "operação" | **proposta** (memória onboarding) |
| Operador | "consultor", "gerente", "usuário" | **consultor** (frontstage), **usuário** (admin) |
| Etapa | "fase", "etapa", "status", "estágio", "coluna" | **etapa** (UX) / **status** (DB) |

**Status atual:** ~70% padronizado. Resíduos em PDFs antigos e em alguns prompts IA ("lead aquecido" aparece em 2 edges).

---

## 6. Auditoria de Copy e Tom

**Tons coexistentes detectados:**

1. **Consultivo neutro** (Onda 5, Cockpit, Carteira) — tom alvo.
2. **Marketing residual** (verbos como "transforme", "potencialize") — restos em prompts antigos.
3. **Institucional bancário** (Central de Ajuda alguns artigos) — neutralizado parcialmente na auditoria de compliance.
4. **Técnico de produto** (Governança/Admin) — apropriado, mas vaza para tooltips do app.

**Drift principal:** prompts IA não compartilham 100% dos `promptFragments` (`CONSULTATIVE_TONE`, `TRUST`, `OBJECTION`, `URGENCY`, `CSAA`). Apenas 6 dos 10 edges importam todos os fragments. **`investment-storytelling`, `niche-storytelling`, `bid-recommendation`, `sales-response`** importam parcial.

---

## 7. Auditoria de UX Sistêmica

**Padrões consistentes:** ModuleHeader, sidebar 6 passos, badge de status, semantic tokens.

**Inconsistências visuais:**
- Chips: `PortfolioInsightsBar` usa cor por categoria (cooling=azul, concentration=âmbar). `relationshipSignals` chip individual usa cor por severidade (risco=vermelho). **Mesmo cliente, dois esquemas cromáticos.**
- CTAs do Cockpit (`CopilotCard`) usam `variant="default"` enquanto `NextStepCTA` usa `variant="premium"`. Hierarquia visual ambígua.
- Densidade: cards de Carteira com 5 chips simultâneos em casos extremos (priority + temperature + timing + signal + portfolio). **Saturação cognitiva** — memória `[Portfolio Strategic Signals]` limita a 2 chips no insights bar mas não no card individual.

---

## 8. Auditoria de Fluxo Operacional

| Transição | Contexto preservado? | Problema |
|---|---|---|
| Carteira → Cockpit | ✅ via `ClientJourneyContext` | OK |
| Cockpit → Abordagem | ✅ | OK |
| Abordagem → Proposta | ⚠️ parcial | `salesScript` gerado não é persistido se usuário sair antes de salvar |
| Proposta → PDF | ✅ via `useProposalData` fachada | OK |
| Pós-venda → Operações Estruturadas | ❌ | nova proposta não herda histórico do cliente pós-venda; usuário recomeça do zero |
| Operações → Nova Proposta | ⚠️ | redilui dados do simulador mas perde contexto do cliente original |

**Maior gap:** **continuidade Pós-venda → nova proposta** quebra. O cliente é "novo" no Simulador mesmo já estando no banco como `post_sale_clients`.

---

## 9. Auditoria de Dados e Contexto

- **React Query keys:** `['proposals']`, `['post-sale-clients']`, `['admin-engagement']` invalidam independentemente. Quick win Onda 5 introduziu `invalidateQueries(['admin'])` no Admin, mas Carteira/Pós-venda não compartilham namespace de invalidação.
- **Períodos:** Admin usa "últimos 30 dias" (rolling). Analytics usa "mês corrente". Cockpit usa "últimos 7 dias". **Três janelas temporais simultâneas** sem rótulo explícito.
- **Filtros de tenant:** OK em DB (RLS) e fachadas. Drift potencial em cálculos client-side de `portfolioSignals` se usuário trocar de empresa sem refresh — não há `companyId` na queryKey de algumas hooks.

---

## 10. Helpers e Engines — Mapa de Convergência

```
DECISÃO                FONTE OFICIAL (proposta)        FONTE REDUNDANTE
────────────────────────────────────────────────────────────────────────
Prioridade ordenação   proposalPriority                clientScoring.urgency
Temperatura visual     clientScoring                   relationshipSignals
Próximo passo          nextActionSuggestion            useCopilotRecommendedStep, phase-action
Saúde de carteira      portfolioSignals                (—)
Forecast               salesForecast                   (—)
Pitch comercial        sales-copilot edge              salesPitchGenerator (local)
Objeções               sales-script edge               objectionRecommender (local)
IA roteamento          centralAI (deveria)             chamadas diretas a edges
```

**Convergência alvo:** colapsar para **1 score canônico por decisão**. Demais engines viram **inputs** ou **views**, não fontes.

---

## 11. Plano de Convergência (Onda 6 sugerida)

### Fase A — Quick wins (sem risco)
1. Renomear `proposalPriority.score` → `priorityScore`; `clientScoring.score` → `engagementScore`. Atualizar tipos.
2. Documentar matriz de fontes canônicas em `mem://arch/canonical-sources` e `governance/sections/architecture.ts`.
3. Padronizar import de `promptFragments` nos 4 edges restantes.
4. Limitar chips por card de cliente a **3** (top severity wins).
5. Adicionar `companyId` às queryKeys de `usePostSaleQueries` e `useProposalsQueries`.

### Fase B — Convergência de scoring (1 sprint)
6. `proposalPriority` passa a **derivar** de `clientScoring` (única fonte de score). Mantém nome para retrocompat.
7. `cadenceRules` (graça 48h, SLA por coluna) passa a ser **input** de `clientScoring`, não engine paralela.
8. `nextActionSuggestion` consome `clientScoring.urgency` como entrada — remove heurística duplicada de cadência.

### Fase C — Convergência IA (1 sprint)
9. `centralAI` vira **obrigatória**: lint rule proibindo `supabase.functions.invoke('sales-*' | 'phase-*' | 'module-copilot')` fora de `services/centralAI.ts`.
10. Edges compartilham `_shared/promptFragments.ts` e `_shared/payloadCanonical.ts` (já parcial).

### Fase D — Continuidade operacional
11. Pós-venda → Nova proposta: pré-popular Simulador com `client_name`, `consortium_type`, histórico do `post_sale_clients`.
12. Persistir `salesScript` gerado em `proposal_events` para retomada.

### Fase E — Visual
13. Esquema cromático único de chips: **severidade** (não categoria) — vermelho=urgente, âmbar=atenção, azul=neutro/oportunidade.
14. Hierarquia de CTA: 1 `premium` por tela, demais `default`/`outline`.

---

## 12. Auditoria Multi-tenant — Resumo

✅ RLS corretas (validadas em ondas anteriores).
✅ `current_company_ids()` consistente.
⚠️ **Cliente-side:** alguns hooks não escopam por `company_id` na queryKey → ao trocar tenant, dados antigos podem aparecer por <1s antes do refetch.
⚠️ **AI cache** (`aiResponseCache.ts`) não inclui `companyId` na chave → risco baixíssimo (chave inclui prompt+payload), mas teoricamente cross-tenant.

**Quick win:** prefixar todas as queryKeys e cacheKeys com `companyId`.

---

## 13. Before / After Conceitual

```
ANTES (hoje)
─────────────────────────────────────────────────────────
Cliente X
├── proposalPriority    → "alta"
├── clientScoring       → "morno"
├── relationshipSignals → "oportunidade"
├── portfolioSignals    → "strong_window"
├── copilotTrigger      → "atenção"
├── nextActionSuggestion→ "ligar amanhã"
└── phase-action edge   → "agendar reunião"
   3 cores, 5 chips, 2 CTAs, 4 sinais temporais.
   Usuário: "qual eu sigo?"

DEPOIS (Onda 6)
─────────────────────────────────────────────────────────
Cliente X
├── clientScoring (fonte única)
│   ├── score: 78
│   ├── temperature: morno
│   ├── urgency: atenção
│   └── window: forte (próx. 5 dias)
├── nextAction (derivado): "ligar nas próximas 48h"
├── chips visuais: máx. 3, esquema único de severidade
└── CTA único: "Iniciar abordagem" (premium)
   1 verdade. Múltiplas vistas coerentes.
```

---

## 14. Score Final de Coerência Sistêmica

| Dimensão | Antes | Alvo | Atual |
|---|---|---|---|
| Coerência de scoring | 5/10 | 9/10 | **6/10** |
| Coerência de prioridade | 5/10 | 9/10 | **6/10** |
| Coerência de copy/tom | 7/10 | 9/10 | **8/10** |
| Coerência visual (chips/CTAs) | 6/10 | 9/10 | **7/10** |
| Coerência de fluxo | 7/10 | 9/10 | **7/10** |
| Coerência de dados/cache | 7/10 | 9/10 | **8/10** |
| Coerência IA (fachada) | 5/10 | 9/10 | **6/10** |
| Multi-tenant | 9/10 | 10/10 | **9/10** |
| Governança | 8/10 | 9/10 | **9/10** |
| Nomenclatura | 7/10 | 10/10 | **7/10** |

### Score sistêmico global: **7.3 / 10**

> O sistema **já é coeso**, mas opera com **2–3 inteligências paralelas** sobre o mesmo objeto. A Onda 6 (convergência) deve elevar o score para **8.8–9.0** sem adicionar features — apenas **colapsando engines duplicadas em fontes canônicas**.

---

## 15. Riscos Restantes (pós Onda 6 sugerida)

- **Refator de scoring** pode quebrar ordenação histórica da Carteira → mitigar com snapshot de prioridade no `proposal_events`.
- **Lint rule de IA** exige rota de exceção para edges legítimos (admin, governance) → whitelist explícita.
- **Esquema cromático único** pode reduzir riqueza informacional → compensar com tooltips densos.

---

## 16. Conclusão

O sistema atravessou cinco ondas de evolução e atingiu **maturidade funcional**.
A próxima fronteira **não é mais funcionalidade** — é **convergência**.

> O sistema hoje é **um ecossistema de inteligências cooperando**.
> O alvo é **uma única inteligência se manifestando em múltiplas vistas**.

A diferença entre "plataforma SaaS premium" e "software cheio de recursos" mora exatamente nesta convergência.
