# Tenant Blast Radius Report

> Data: 2026-05-11 · Pré Onda M1 · Complementa `multitenant-audit.md`
> Objetivo: mapear o raio de impacto REAL da migração single-tenant → multi-tenant ANTES de qualquer alteração de schema, RLS ou hook.
> Status: **análise pura — zero código alterado**.

---

## 1. Mapa textual do fluxo multi-tenant futuro

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. Auth (Supabase)                                              │
│    supabase.auth.getSession() → JWT com sub=user_id             │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Profile Resolution                                           │
│    profiles(user_id) → nome, approved                           │
│    user_roles(user_id) → role global ('admin' | 'user')         │
│    [hoje: para AQUI. Multi-tenant continua ↓]                   │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Company Resolution (NOVO)                                    │
│    company_users(user_id) → [company_id, role, active]          │
│    AuthProvider expõe: currentCompanyId, companies[],           │
│                        currentCompanyRole                       │
│    Persistência: localStorage('current_company_id') por user    │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Company Membership Guard                                     │
│    Helper SQL: is_company_member(company_id)                    │
│                is_company_admin(company_id)                     │
│                current_company_ids() → uuid[]                   │
│    Front: useCurrentCompany() (NOVO hook)                       │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Tenant-Scoped Queries                                        │
│    INSERT: { user_id: auth.uid(), company_id: currentCompanyId }│
│    SELECT: filtro implícito via RLS (is_company_member)         │
│    React Query keys: ['proposals', companyId, ...]              │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. RLS Enforcement (per-table)                                  │
│    USING  (is_company_member(company_id))                       │
│    WITH CHECK (is_company_member(company_id)                    │
│                AND user_id = auth.uid())                        │
│    Ações de admin de company: is_company_admin(company_id)      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Services / RPCs / Edge Functions                             │
│    RPCs: receber p_company_id ou inferir via current_company_id │
│    Edges: getClaims() → user_id → resolver company_id no server │
│    Audit/Analytics: gravar company_id automaticamente           │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. UI Layer                                                     │
│    Company Switcher (header)                                    │
│    Members management (per-company)                             │
│    Admin global (cross-company) vs Company Admin (in-tenant)    │
└─────────────────────────────────────────────────────────────────┘
```

**Invariante crítica**: nenhum SELECT/INSERT/UPDATE/DELETE em tabela operacional (proposals, post_sale_*, audit_logs, analytics_events, proposal_events, post_sale_bids, proposal_pdf_cache, feedbacks) pode existir sem `company_id` definido — nem mesmo durante o backfill.

---

## 2. Blast Radius por dimensão

### 2.1 Módulos (UI/feature) — risco de regressão

| Módulo | Risco | Por quê |
|---|---|---|
| **Carteira (Proposals)** | 🔴 Crítico | Lê/grava `proposals` + `proposal_events`. Kanban DnD, paginação RPC, mutations otimistas, cache React Query agressivo. Toda regra de cadência (`cadenceRules`) opera em cima do dataset; se vazar entre companies, telemetria/SLA quebra. |
| **Pós-venda** | 🔴 Crítico | 3 tabelas (`post_sale_clients`, `post_sale_events`, `post_sale_bids`) + RPC paginada. Cliente "órfão" pode aparecer cross-tenant. Triggers `log_post_sale_*` propagam `user_id` mas não `company_id`. |
| **PDF / Proposta Completa** | 🔴 Crítico | `proposal_pdf_cache` é compartilhado por hash de conteúdo — risco de servir PDF de outra company se o hash colidir. Edge `share-proposal` gera token público sem bind a company. Edge `generate-pdf` chama Browserless e grava em bucket `proposal-pdfs` com path por user_id. |
| **Admin Page** | 🟠 Alto | `get_admin_users_page` lista TODOS os profiles. Em multi-tenant, precisa virar "Global Admin (todas companies)" vs "Company Admin (membros da minha company)". Hoje é binário (`has_role admin` global). |
| **Comunidade** | 🟠 Alto | Decisão pendente: cross-company ou per-company? `community_user_level` usa `user_engagement` global. Se virar per-company, recomputo de score precisa considerar escopo. |
| **Pipeline / CRM** | 🟠 Alto | `pipelineMetrics`, `salesGoal`, `salesForecast` agregam sobre `proposals`. Métricas vazariam se RLS falhar. `salesGoal.ts` salva em `localStorage` por userId — precisa virar (userId, companyId). |
| **Investimentos / Comparador / Lances / Assembleias** | 🟡 Médio | Read-only sobre `groups`/`assemblies`/`assembly_results` que são **dados globais Caixa** (cross-company por design). Risco baixo de vazamento mas alto se alguém adicionar `company_id` por engano. |
| **Diagnostic / Simulador** | 🟡 Médio | Estado em memória + `useLocalStorage`. Persistência por `userId`; precisa namespacing por (userId, companyId) se um user tem 2+ companies. |
| **Análise (AnalysisModule)** | 🟡 Médio | Agregador visual de outros módulos; herda risco dos filhos. Bug recente de navegação (corrigido) mostra acoplamento alto. |
| **Feedbacks** | 🟡 Médio | Hoje globais (admin lê tudo). Pode permanecer global ou virar per-company — decisão pendente. |
| **Auditoria (audit_logs)** | 🟠 Alto | Admin lê tudo. Sem `company_id`, Company Admin não consegue auditar a própria company. Backfill obrigatório. |
| **Analytics dashboard** | 🟠 Alto | Mesma coisa: agregações por evento sem `company_id` impedem split por tenant. |
| **Comunidade — Ranking/Engagement** | 🟡 Médio | Score global hoje. Se community virar per-company, precisa recomputar isolado. |
| **Mock Seed (dev)** | ⚪ Baixo | Só dev/admin; precisa preencher `company_id` ao gerar. |

### 2.2 Hooks — quem quebra primeiro

| Hook | Risco | Motivo |
|---|---|---|
| `useProposalsQueries` | 🔴 | Query keys sem `companyId` → cache mantém dados da company anterior ao trocar. Mutations otimistas atualizam cache global. |
| `usePostSaleQueries` | 🔴 | Idem — paginated RPC + caches. |
| `useProposalEvents` | 🔴 | Lê eventos por `proposal_id`; se RLS rejeitar (proposta de outra company), UI fica em loading infinito sem error handling claro. |
| `useAdminQueries` | 🟠 | Assume admin global. Precisa decidir entre global vs company-scoped. |
| `useCommunity` | 🟠 | `community_user_level` chamada em RLS — depende da decisão community. |
| `useFeedbackNotifications` | 🟡 | Polling sobre `feedbacks`; se `feedbacks` virar per-company, query precisa filtro. |
| `usePostSaleActionCount` | 🟡 | Count agregado — vaza se RLS quebrar. |
| `useAssemblies` | ⚪ | Read-only sobre dados globais. |
| `useCurrentUserId` | 🟡 | Vai precisar irmão `useCurrentCompanyId`. Não quebra mas cria duplicação se ignorado. |
| `useAuth` | 🔴 | Precisa expor `currentCompanyId`, `companies[]`, `setCurrentCompany`. Mudança de contrato → tudo que consome `useAuth` é afetado. |
| `useTrackModuleAccess` | 🟡 | `analyticsTracker` precisa injetar `company_id`. |
| `useModuleCopilot` / `useCopilotRecommendedStep` / `useCopilotTriggers` | 🟡 | Chamam edges de IA — precisam passar `company_id`. |

### 2.3 Queries que dependem implicitamente de `auth.uid()`

Hoje **TODAS** as queries de tabelas operacionais dependem implicitamente de `auth.uid() = user_id` (na RLS). Lista das mais perigosas para migrar:

| Origem | Tabela | Tipo de dependência | Risco |
|---|---|---|---|
| `services/proposals.ts` (`getProposals`, `createProposal`, `updateProposal`, `deleteProposal`) | proposals | RLS USING auth.uid()=user_id | 🔴 |
| RPC `list_proposals_page` | proposals | `WHERE p.user_id = auth.uid()` HARDCODED no SQL | 🔴 |
| RPC `list_post_sale_clients_page` | post_sale_clients | idem | 🔴 |
| RPC `list_proposal_events_page` | proposal_events | idem | 🔴 |
| `services/postSale.ts` | post_sale_clients/events/bids | RLS user-scoped | 🔴 |
| `services/proposalEvents.ts` | proposal_events | RLS user-scoped | 🔴 |
| `services/auditLog.ts::fetchAuditLogs` | audit_logs | Admin-only RLS — sem filtro company | 🟠 |
| `services/analyticsTracker.ts` | analytics_events | Insert sem company_id | 🟠 |
| `services/pipelineMetrics.ts` | proposals (agregação) | Implicit user scope | 🟠 |
| `services/salesGoal.ts` | localStorage (`salesGoal:${userId}`) | Sem companyId | 🟡 |
| `services/community.ts` | community_cases/replies/votes | RLS por engagement | 🟡 |
| Trigger `log_proposal_*` / `log_post_sale_*` | proposal_events / post_sale_events | NEW.user_id propagado, mas sem company_id | 🔴 |
| Trigger `invalidate_pdf_cache_on_proposal_change` | proposal_pdf_cache | DELETE só por proposal_id (ok), mas cache pode vazar via hash | 🟠 |

### 2.4 Componentes que assumem single-user

| Componente | Risco | Suposição quebrada |
|---|---|---|
| `ProposalCard*`, `KanbanBoard`, `ProposalsTable` | 🔴 | Renderizam dataset filtrado por user; ao trocar company sem invalidar cache, mostram lista anterior. |
| `PostSaleDashboard`, `PostSaleClientCard` | 🔴 | Mesma classe de problema. |
| `SalesForecastCard`, `PipelineMetricsModal` | 🟠 | Agregações; resultados confundem usuário em troca de company. |
| `ProposalPdfModule` / `ProposalCompletePdf` | 🔴 | Lê `useProposalData()` (façade). Se proposta pertence a outra company e RLS deixa passar (race), PDF vaza. |
| `SharedProposalPage` (público) | 🔴 | Token público — precisa validar company no server e expirar tokens no rebind. |
| `AdminPage` | 🟠 | Lista users globais; precisa modo "company scope". |
| `FeedbackButton` / `Sino notificações` | 🟡 | Polling global. |
| `MockSeedFab` | ⚪ | Dev-only; só precisa setar company_id. |

### 2.5 Dashboards que podem vazar dados cross-tenant

🔴 **Pipeline Metrics Modal** — agrega `proposals` por status/etapa.
🔴 **Sales Forecast Card** — soma `expected_value` em todas propostas ativas.
🔴 **Admin → Performance IA** — agrega `analytics_events` (cache hit/miss). Sem company_id, comparações cruzam tenants.
🟠 **Admin → Auditoria** — tabela `audit_logs` sem company_id.
🟠 **Community Ranking** — `user_engagement.score` agregado global.
🟡 **Pós-venda overview counters** — `usePostSaleActionCount`.

### 2.6 RPCs mais perigosas

| RPC | Risco | Motivo |
|---|---|---|
| `list_proposals_page` | 🔴 | `WHERE p.user_id = auth.uid()` hardcoded; precisa virar `WHERE is_company_member(p.company_id) AND (p_company_id IS NULL OR p.company_id = p_company_id)`. |
| `list_post_sale_clients_page` | 🔴 | idem |
| `list_proposal_events_page` | 🔴 | idem |
| `get_admin_users_page` | 🟠 | Lista todos; precisa filtro por company OU dois modos. |
| `get_users_with_email` | 🟠 | Admin-only; precisa filtro por company. |
| `community_recompute_engagement` | 🟡 | Score global; depende de decisão community. |
| `community_user_level` | 🟡 | usado em RLS de community_cases — alteração tem efeito cascata. |
| `prevent_profile_self_approval` | ⚪ | Trigger; ok. |
| `validate_proposal_business_rules` | ⚪ | Validação de campo; ok. |
| `handle_new_user` | 🔴 | Hoje cria profile + role 'user'. **Precisa criar a own-company + membership**. Falha aqui = signup quebrado. |
| `is_approved` / `has_role` | ⚪ | Continuam globais. |

### 2.7 Edge functions — refactor obrigatório

| Edge | Refactor | Risco |
|---|---|---|
| `share-proposal` | OBRIGATÓRIO — token precisa carregar company_id e validar `is_company_member` no consumo | 🔴 |
| `generate-pdf` | Validar que proposal pertence à company do caller; bucket path por (company_id, proposal_id) | 🔴 |
| `create-user` | Decidir: cria user global e adiciona à company do caller? Cria user + nova company? | 🔴 |
| `update-user-email` | Restringir a company admins | 🟠 |
| `delete-user` | Idem; cuidado com cascade cross-company | 🟠 |
| `generate-proposal`, `sales-copilot`, `sales-response`, `sales-script`, `phase-action`, `trigger-script`, `module-copilot`, `bid-recommendation`, `investment-storytelling`, `niche-storytelling` | Decodificam JWT manualmente (`atob`) — migrar para `getClaims()` e injetar company_id em rate limit + cache key + analytics | 🟠 |

Todas as 14 edges hoje fazem `atob(jwt.split('.')[1])` para extrair `sub`. Em multi-tenant cada uma precisa:
1. `getClaims()` (validação de assinatura)
2. resolver `company_id` (do payload ou da membership ativa)
3. usar key de rate limit `${user_id}:${company_id}:${edge}` para isolar quotas por tenant
4. logar `company_id` em `analytics_events`

### 2.8 Caches React Query que contaminam tenants

🔴 **Todas** as query keys atuais ignoram `companyId`. Lista das mais perigosas:

```
['proposals', { search, status }]              → ['proposals', companyId, { search, status }]
['proposal', id]                                → ['proposal', companyId, id]
['post-sale-clients', filters]                 → ['post-sale-clients', companyId, filters]
['post-sale-events', clientId]                 → ['post-sale-events', companyId, clientId]
['proposal-events', proposalId]                → ['proposal-events', companyId, proposalId]
['admin-users', filters]                       → ['admin-users', { scope: 'global'|companyId }, filters]
['feedbacks-mine']                             → ['feedbacks-mine', companyId]
['pipeline-metrics']                           → ['pipeline-metrics', companyId]
['post-sale-action-count']                     → ['post-sale-action-count', companyId]
```

Estratégia: ao trocar company, executar `queryClient.removeQueries()` (não `invalidate`) para evitar flash de dados antigos.

### 2.9 PDFs / relatórios com queries inseguras

| Caminho | Risco |
|---|---|
| `proposal_pdf_cache` shared by `content_hash` sem company_id | 🔴 (colisão hash → vaza PDF) |
| `share-proposal` token público sem company bind | 🔴 |
| `generate-pdf` → bucket `proposal-pdfs/{user_id}/...` | 🟠 (path por user; precisa company_id no path) |
| `useProposalData()` façade — lê `simulation+diagnostic+journey+investment+bidsStudy` de contextos in-memory | 🟡 (não vaza por DB, mas precisa garantir que proposta carregada pertence à company) |

### 2.10 Joins que podem perder escopo tenant

| Join | Risco |
|---|---|
| `assembly_results JOIN groups` (RLS atual usa EXISTS sobre groups) | 🟡 — tabelas globais, ok |
| `community_replies JOIN community_cases` (RLS) | 🟡 — depende da decisão community |
| `community_reply_votes JOIN community_replies JOIN community_cases` | 🟡 — chain longa |
| `proposals → proposal_events` (1:N) | 🔴 — sem FK declarada; risco de orphans cross-tenant |
| `proposals → post_sale_clients` (proposal_id) | 🔴 — idem |
| `post_sale_clients → post_sale_events / post_sale_bids` | 🔴 — idem |

**Falta total de FKs** é multiplicador de risco em todos os joins.

### 2.11 Agregações / statistics perigosas

| Origem | Risco |
|---|---|
| `pipelineMetrics.ts` (conversão por etapa, ticket médio, tempo médio) | 🔴 |
| `salesForecast.ts` (probabilidade × valor) | 🔴 |
| `salesGoal.ts` (gap vs meta) | 🟠 (localStorage por user) |
| `Admin → Performance IA` (cache hit/miss agregado) | 🟠 |
| `community_recompute_engagement` (score) | 🟡 |
| `usePostSaleActionCount` | 🟡 |
| Heat map / funil em `analyticsFunnel.ts` | 🟠 |

### 2.12 Fluxos com maior impacto pós RLS company-scoped

1. 🔴 **Login pela primeira vez** — `handle_new_user` precisa criar own-company + membership atomicamente. Falha aqui = signup quebrado.
2. 🔴 **Listagem de propostas** — RPC paginada precisa receber/inferir company_id; cache React Query precisa rebind.
3. 🔴 **Geração de PDF / Share Link** — invariante de tenant binding no token.
4. 🔴 **Mutations em proposals/post_sale** — `WITH CHECK (is_company_member(company_id) AND user_id = auth.uid())` — esquecer `company_id` no INSERT = erro 42501.
5. 🟠 **Trocar de company no UI** — invalidar TUDO no cache; reset de drafts em localStorage.
6. 🟠 **Audit/Analytics** — todo `logAction` / `trackEvent` precisa injetar company_id sem fricção.
7. 🟠 **Edges de IA** — rate limit por (user, company); cache de IA por (company, payload-hash).

### 2.13 Tabelas mais críticas para backfill

Ordem de criticidade do backfill (1=mais crítica):

1. 🔴 `proposals` (núcleo do produto)
2. 🔴 `post_sale_clients` (depende de proposals)
3. 🔴 `post_sale_events`, `post_sale_bids` (dependem de clients)
4. 🔴 `proposal_events` (depende de proposals; populado via trigger)
5. 🔴 `proposal_pdf_cache` (precisa adicionar coluna `company_id`)
6. 🟠 `audit_logs`, `analytics_events` (já têm `organization_id` — renomear para `company_id` e backfill)
7. 🟠 `feedbacks`, `user_engagement` (precisam adicionar `company_id`)
8. 🟡 `community_*` (depende da decisão escopo)
9. ⚪ `assemblies`, `assembly_results`, `groups` (globais — NÃO recebem company_id)
10. ⚪ `user_roles` (continua global; admin de plataforma)

### 2.14 Constraints / FKs / locks na migration

| Risco | Detalhe |
|---|---|
| 🔴 | **Não há FKs hoje** — adicionar FKs com `ON DELETE CASCADE` em tabelas grandes (`analytics_events`, `audit_logs`) pode demorar minutos e adquirir `ACCESS EXCLUSIVE` lock. Mitigar: `ALTER TABLE ... ADD CONSTRAINT ... NOT VALID` + `VALIDATE CONSTRAINT` em janela separada. |
| 🔴 | `ALTER TABLE proposals ADD CONSTRAINT NOT NULL company_id` requer backfill 100% antes; falhar deixa app quebrado. Estratégia: 2 ondas — Onda M2 deixa nullable+default trigger; Onda M3 promove a NOT NULL. |
| 🟠 | Triggers `log_proposal_*` e `log_post_sale_*` são SECURITY DEFINER e usam `NEW.user_id`. Precisam aprender a copiar `NEW.company_id` — se esquecer, eventos novos nascem sem tenant. |
| 🟠 | `unique (proposal_id, content_hash)` em `proposal_pdf_cache` precisa virar `(company_id, proposal_id, content_hash)` para evitar colisão entre tenants. |
| 🟡 | Renomear `organizations` → `companies` precisa drop-and-recreate de policies que referenciam o nome (apenas 2 hoje — baixo risco). |
| 🟡 | Adicionar `company_id` a tabelas com índice grande pode requerer `CREATE INDEX CONCURRENTLY`. |

### 2.15 Índices a recriar/criar

Após adicionar `company_id`, criar (todos `CONCURRENTLY` em prod):

```sql
-- Hot paths de RLS:
CREATE INDEX CONCURRENTLY idx_proposals_company_user        ON proposals(company_id, user_id);
CREATE INDEX CONCURRENTLY idx_proposals_company_updated     ON proposals(company_id, updated_at DESC);
CREATE INDEX CONCURRENTLY idx_post_sale_clients_company     ON post_sale_clients(company_id, updated_at DESC);
CREATE INDEX CONCURRENTLY idx_post_sale_events_company      ON post_sale_events(company_id, client_id);
CREATE INDEX CONCURRENTLY idx_post_sale_bids_company        ON post_sale_bids(company_id, client_id);
CREATE INDEX CONCURRENTLY idx_proposal_events_company       ON proposal_events(company_id, proposal_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_audit_logs_company_created    ON audit_logs(company_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_analytics_events_company_name ON analytics_events(company_id, event_name, created_at DESC);
CREATE INDEX CONCURRENTLY idx_proposal_pdf_cache_company    ON proposal_pdf_cache(company_id, proposal_id);
CREATE INDEX CONCURRENTLY idx_company_users_user            ON company_users(user_id, active);
CREATE INDEX CONCURRENTLY idx_company_users_company         ON company_users(company_id, active);

-- Possivelmente DROPAR após validar (substituídos pelos compostos):
DROP INDEX CONCURRENTLY IF EXISTS idx_proposals_user_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_post_sale_clients_user_id;
```

### 2.16 Módulos com maior acoplamento estrutural

| Módulo | Acoplamento | Razão |
|---|---|---|
| AnalysisModule | 🔴 | Agrega 5 submódulos; bug recente expôs estado compartilhado. Trocar de company no meio quebra contextos `BidsStudy`, `InvestmentResults`, `SelectedGroup`. |
| Façade `useProposalData()` | 🔴 | Concentra simulation+diagnostic+journey+investment+bidsStudy. Se algum producer-context vazar dados de outra company, PDF inteiro vaza. |
| Sidebar + nav state | 🟡 | Persistência por user (`nav:lastModule`). Precisa namespace por (user, company). |
| `useAuth` | 🔴 | Tudo importa daqui; mudança de contrato é blast-radius máximo. |

### 2.17 Riscos de performance pós tenant isolation

| Risco | Mitigação |
|---|---|
| RLS adiciona predicate `is_company_member(company_id)` em **todo SELECT** | Manter helper SQL com `STABLE SECURITY DEFINER` + cachear `current_company_ids()` em GUC quando viável |
| Função `is_company_member` consultada N vezes por linha em joins | Marcar como `LEAKPROOF` se possível; benchmark com `EXPLAIN (ANALYZE, BUFFERS)` |
| Índices antigos por `user_id` viram subótimos vs `(company_id, user_id)` | Recriar conforme 2.15; medir antes de dropar |
| Agregações (pipeline metrics, forecast) ganham filtro extra | Index composto `(company_id, status, updated_at)` |
| Edge functions: cache de IA particionado por company → hit rate cai | Aceitar inicialmente; reavaliar após 30d métricas |
| `analytics_events` cresce por (user, company) — partição futura por mês | Não fazer agora; observar |

---

## 3. Ordem ideal de migração (waves)

### Onda M1 (Foundation) — risco ⚪/🟡
- Renomear `organizations` → `companies`
- Criar `company_users` + helpers (`is_company_member`, `is_company_admin`, `current_company_ids`, `current_company_id`)
- `handle_new_user` cria own-company + membership
- **Zero RLS alterada** · zero impacto em features existentes

### Onda M2 (Backfill) — risco 🟡
- 1:1 backfill: cada user vira owner de uma company
- Preencher `company_id` em proposals, post_sale_*, proposal_events, audit_logs, analytics_events
- Adicionar coluna `company_id` em `proposal_pdf_cache`, `feedbacks`, `user_engagement`
- Triggers passam a copiar `company_id` em logs
- **RLS ainda user-scoped** — feature flag `MULTI_TENANT_RLS=false`

### Onda M3 (RLS swap) — risco 🔴
- Reescrever RLS das 8 tabelas operacionais com `is_company_member(company_id)`
- Reescrever 3 RPCs paginadas
- React Query keys ganham `companyId`
- `useAuth` expõe `currentCompanyId` (ainda 1 company por user → no-op para usuários atuais)

### Onda M4 (Edges) — risco 🟠
- 14 edges migram para `getClaims()` + `company_id`
- Rate limit por (user, company)
- `share-proposal` token bind a company

### Onda M5 (FKs/Indexes/Constraints) — risco 🟠
- FKs `NOT VALID` + `VALIDATE`
- Promove `company_id` para `NOT NULL`
- Índices compostos via `CONCURRENTLY`
- Drop de índices antigos `user_id`-only

### Onda M6 (UI Multi-Company) — risco 🟡
- Company Switcher no header
- Tela "Membros da company"
- Convites por email
- Split AdminPage em "Global Admin" vs "Company Admin"

### Onda M7 (Pen test + monitoramento) — risco 🟢
- Bateria cross-tenant (login user A, query da company B)
- Dashboard de tenancy health (eventos sem company_id, queries lentas)

---

## 4. Módulos mais seguros para migrar primeiro

1. ⚪ `assemblies`, `assembly_results`, `groups` — globais, NÃO mudam
2. ⚪ `feedbacks` (se decidir manter global) — só adicionar coluna opcional
3. 🟡 `audit_logs`, `analytics_events` — já têm `organization_id` (vai virar `company_id`); insert simples
4. 🟡 `user_engagement` — write controlado (RPC `community_recompute_engagement`)
5. 🟡 `proposal_pdf_cache` — invalidação simples; bem isolado

## 5. Módulos que DEVEM ser migrados por último

1. 🔴 `proposals` (núcleo) — esperar até M3 com feature flag e rollback pronto
2. 🔴 `post_sale_clients` + filhos — depende de proposals
3. 🔴 `share-proposal` edge + token público — esperar bind de company estável (M4)
4. 🔴 `generate-pdf` + `proposal_pdf_cache` — última peça (riscos de vazamento de PDF)
5. 🔴 `handle_new_user` (signup) — última alteração; janela curta com smoke test imediato
6. 🟠 `AdminPage` — split global/company só faz sentido após RLS company-scoped estável

---

## 6. Decisões pendentes que travam Onda M1

(repetidas do `multitenant-audit.md` para conveniência — precisam resposta antes de M1)

1. **Comunidade**: cross-company (default) ou per-company?
2. **Domínio Caixa**: `@caixa.gov.br` auto-join na company do convidador, ou cada user cria a sua?
3. **Admin global** (`user_roles.role='admin'`) **paralelo** a `company_users.role`? (recomendação: sim)
4. **Quotas/planos** entram nesta arquitetura agora ou depois?
5. **Multi-company por user**: 1 user pode pertencer a N companies (recomendação: sim, com `current_company_id` ativo)?

Sem essas respostas, M1 ainda pode rodar (rename + helpers + handle_new_user), mas a forma do `company_users.role` (enum) e a unicidade `(user_id, company_id)` dependem da #5.

---

## 7. Resumo executivo do "raio da explosão"

| Eixo | Pior caso se M3 falhar |
|---|---|
| Vazamento de dados | 🔴 PDFs de cliente A servidos a usuário da company B (via cache_hash) |
| Quebra de feature | 🔴 Listagem de propostas vazia ou cruzada após troca de company |
| Quebra de signup | 🔴 `handle_new_user` falha → novos cadastros bloqueados |
| Performance | 🟠 Slowdown 2-5x em paginadas até índices novos entrarem em produção |
| Telemetria | 🟠 Métricas/funil ficam misturadas até `company_id` propagar 100% |
| Audit | 🟠 Company Admin não consegue auditar a própria company até backfill completo |

**Recomendação final**: rodar M1+M2 com **flag** `MULTI_TENANT_RLS=false` (RLS user-scoped intacta), validar que 100% das linhas operacionais têm `company_id`, depois flip para M3 fora de horário com rollback de policies pré-pronto.
