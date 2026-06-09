# Auditoria Multi-Tenant — Fase 1 (Onda M0)

**Status:** somente leitura — nenhuma migration/refactor aplicada nesta rodada.
**Decisões já tomadas:**
- Renomear `organizations` → `companies` + criar `company_users`.
- Backfill 1:1 (cada user atual vira owner de uma `company` própria).
- Entrega em ondas separadas (esta = Fase 1).

---

## 0. Estado atual em uma frase

O sistema é **single-user com shadow schema multi-tenant preparado**: existe `organizations` (vazia) e a coluna `organization_id uuid NULLABLE` em **8 tabelas** (proposals, post_sale_clients, post_sale_events, post_sale_bids, proposal_events, audit_logs, analytics_events, profiles), mas **nenhuma RLS policy hoje filtra por organization** — todo isolamento é via `auth.uid() = user_id`. Não há vazamento cross-tenant atual porque não existem tenants compartilhados; o risco aparece **no momento em que dois users forem postos na mesma company**.

---

## 1. Inventário de tabelas vs prontidão multi-tenant

| Tabela | Tem `organization_id`? | RLS hoje | Pronta p/ multi-tenant? | Crítico |
|---|---|---|---|---|
| `proposals` | ✅ nullable | `auth.uid()=user_id` | ❌ | 🔴 |
| `post_sale_clients` | ✅ nullable | `auth.uid()=user_id` | ❌ | 🔴 |
| `post_sale_events` | ✅ nullable | `auth.uid()=user_id` | ❌ | 🔴 |
| `post_sale_bids` | ✅ nullable | `auth.uid()=user_id` | ❌ | 🔴 |
| `proposal_events` | ✅ nullable | `auth.uid()=user_id` (+ admin SELECT) | ❌ | 🔴 |
| `audit_logs` | ✅ nullable | user_id + admin SELECT | ❌ | 🟠 |
| `analytics_events` | ✅ nullable | user_id + admin SELECT | ❌ | 🟠 |
| `profiles` | ✅ nullable | user_id + admin | ❌ | 🟠 |
| `proposal_pdf_cache` | ❌ | `auth.uid()=user_id` | ❌ | 🔴 |
| `feedbacks` | ❌ | user_id + admin | ❌ | 🟡 |
| `community_cases` | ❌ | autor + nível + admin | ⚠️ semi-global por design | 🟡 |
| `community_replies` | ❌ | autor + nível + admin | ⚠️ semi-global por design | 🟡 |
| `community_reply_votes` | ❌ | autor + visibilidade do case | ⚠️ | 🟡 |
| `user_engagement` | ❌ | self + admin | ❌ | 🟡 |
| `admin_logs` | ❌ | admin only | n/a (global por natureza) | ⚪ |
| `assemblies` / `assembly_results` / `groups` | ❌ | leitura por `is_approved`, escrita admin | n/a (catálogo global) | ⚪ |
| `user_roles` | ❌ | self SELECT + admin | n/a (papel global da plataforma) | ⚪ |
| `organizations` | — (é a tabela base) | owner only | precisa virar `companies` | 🔴 |

**Tabelas SEM `organization_id` que vão precisar receber `company_id` na Fase 3:**
`proposal_pdf_cache`, `feedbacks`, `user_engagement`. (Community e assemblies podem ficar de fora, ver §6.)

---

## 2. Hooks / services / RPCs com filtragem somente por `auth.uid()`

Todos os pontos abaixo **funcionam hoje** mas se tornam vetor de vazamento no momento em que duas pessoas dividirem company:

### 2.1 RPCs SECURITY DEFINER (críticas — são a fronteira de segurança real)

| RPC | Filtro atual | Falta |
|---|---|---|
| `list_proposals_page` | `WHERE p.user_id = auth.uid()` | precisa `OR is_company_member(p.company_id)` quando o role=member; owner/admin da company veem todos |
| `list_post_sale_clients_page` | `WHERE psc.user_id = auth.uid()` | idem |
| `list_proposal_events_page` | `WHERE pe.user_id = auth.uid()` | idem |
| `get_admin_users_page` | só admin global | precisa variante `list_company_members_page(company_id)` para owners |
| `get_users_with_email` | só admin global | idem |
| `community_recompute_engagement` | self + admin | ok (engagement é pessoal) |
| `is_approved` / `has_role` | helpers | ok, complementar com `is_company_member`, `is_company_admin`, `current_company_ids()` |

### 2.2 Hooks/services client-side que assumem usuário único

| Arquivo | Operação | Risco hoje | Risco multi-tenant |
|---|---|---|---|
| `src/services/proposals.ts` | 5 `from('proposals')` (CRUD direto) | nenhum | precisa `.eq('company_id', currentCompanyId)` ou confiar em RLS reescrita |
| `src/services/postSale.ts` | 4 `post_sale_clients` + 3 `post_sale_events` + 2 `post_sale_bids` | nenhum | idem — todos os INSERT precisam injetar `company_id` |
| `src/hooks/usePostSaleQueries.ts` / `usePaginatedQueries.ts` | leituras paginadas via RPC | nenhum | depende da reescrita das RPCs |
| `src/hooks/useProposalEvents.ts` / `useProposalsQueries.ts` | leituras | nenhum | idem |
| `src/services/pipelineMetrics.ts` | agregações em `proposals` + `proposal_events` | nenhum | precisa filtrar por company para métricas corretas |
| `src/services/auditLog.ts` | INSERT em `audit_logs` | nenhum | precisa injetar `company_id` |
| `src/services/analyticsTracker.ts` | INSERT em `analytics_events` | nenhum | precisa `company_id` (atual nullable é suficiente como migração suave) |
| `src/utils/pdfGenerator.tsx` | leitura/upsert em `proposal_pdf_cache` | nenhum | tabela ainda não tem `company_id` |
| `src/services/community.ts` | CRUD em `community_cases`/`community_replies` | nenhum | comunidade é cross-company por design (ver §6) |
| `src/services/users.ts` | admin global (RPC) | ok | precisa variante por company |
| `src/services/adminLogs.ts` | INSERT em `admin_logs` | ok | global por natureza |
| `src/utils/dev/mockSeed.ts` | seed proposals/post_sale_* | dev only | precisa setar `company_id` no seed |

### 2.3 SELECTs amplos

Não foram encontrados `select('*')` perigosos em tabelas multi-tenant — services usam colunas explícitas. **Bom sinal.**

### 2.4 Upserts perigosos

- `proposal_pdf_cache` faz upsert por `proposal_id` — quando virar multi-tenant, chave única tem que virar `(company_id, proposal_id)` (ou só `proposal_id` se proposal já é tenant-scoped).
- `community_reply_votes` tem `(reply_id, user_id) UNIQUE` — ok.

---

## 3. Edge functions — auditoria de isolamento

14 functions. **Nenhuma propaga `company_id` hoje** (não existe coluna preenchida ainda). Risco real está no padrão de autenticação:

| Edge | Tem `verify_jwt`/`getClaims`? | Usa SERVICE_ROLE | Faz query em tabela multi-tenant? | Risco multi-tenant |
|---|---|---|---|---|
| `create-user` | ✅ valida admin via user_roles | ✅ | profiles, admin_logs | 🟠 precisa virar admin **da company**, não global |
| `update-user-email` | ✅ admin | ✅ | — | 🟠 idem |
| `delete-user` | ✅ admin | ✅ | — | 🟠 idem |
| `share-proposal` | ✅ user JWT | ✅ | proposals (token público) | 🔴 precisa garantir que o token só serve à company dona da proposta |
| `generate-pdf` | ⚠️ depende de auth header | ✅ | proposal_pdf_cache | 🔴 cache key precisa incluir company_id |
| `generate-proposal` | ❌ sem getClaims | ✅ | — (chama AI) | 🟡 ok hoje, mas se logar precisa company |
| `bid-recommendation` | ❌ | ❌ | — | 🟡 |
| `module-copilot` / `sales-copilot` / `sales-script` / `sales-response` / `phase-action` / `niche-storytelling` / `investment-storytelling` / `trigger-script` | ❌ getClaims explícito | ✅ (insert analytics) | analytics_events | 🟡 rate-limit por user_id ok; analytics insere com user_id do JWT decodificado manualmente |

**Padrão atual nas edges de IA:** decodificam JWT manualmente (`atob(token.split('.')[1])`) só para pegar `sub` e gravar analytics. Não validam assinatura. Tecnicamente um token forjado entra — mas não acessa dados, só aciona o LLM. Em multi-tenant com cobrança por company isso vira problema (consumo cruzado de créditos). **Recomendação Onda M3+:** padronizar `getClaims()` em todas e propagar `company_id` derivado do membership ativo do user.

---

## 4. Foreign keys / integridade relacional

A inspeção mostra que **nenhuma tabela tem FK declarada** (`No foreign keys for the table X`) em todas as 20 tabelas listadas. Isso é grave **independente** de multi-tenant:

- `post_sale_clients.proposal_id` → `proposals.id` — sem FK, sem `ON DELETE`.
- `post_sale_events.client_id` → `post_sale_clients.id` — sem FK.
- `post_sale_bids.client_id` → `post_sale_clients.id` — sem FK.
- `proposal_events.proposal_id` → `proposals.id` — sem FK.
- `community_replies.case_id` → `community_cases.id` — sem FK.
- `community_reply_votes.reply_id` → `community_replies.id` — sem FK.
- `proposal_pdf_cache.proposal_id` → `proposals.id` — sem FK.
- `assembly_results.group_id` → `groups.id` — sem FK (mas RLS faz JOIN, então órfão é silenciosamente filtrado).
- `user_roles.user_id` / `profiles.user_id` → `auth.users.id` — sem FK (intencional pelas regras Lovable de não referenciar `auth.users`, ok).

**Risco:** órfãos hoje (deletar uma proposta deixa cache, eventos e post-sale órfãos). Em multi-tenant fica pior porque a deleção de uma `company` precisaria cascatear para 8+ tabelas.

**Plano para Fase 7:** adicionar FKs `ON DELETE CASCADE` nas relações pai/filho da própria company; FKs `ON DELETE SET NULL` para `proposal_id` em `post_sale_clients` (cliente persiste mesmo se proposta for apagada).

---

## 5. RLS — pontos de risco específicos

### 5.1 Policies que viram bugs em multi-tenant (precisam reescrita)

Toda policy `USING (auth.uid() = user_id)` em tabela operacional fica **incorreta** quando dois usuários da mesma company precisam ver a mesma proposta. Hoje funciona porque há um user por dado.

### 5.2 Policies já com atenção a admin

- `proposal_events`: admin SELECT global ✅
- `analytics_events`: admin SELECT global ✅
- `profiles`: admin pode tudo ✅, com trigger `prevent_profile_self_approval` ✅
- `user_roles`: políticas RESTRICTIVE para INSERT/UPDATE bloqueiam escalação ✅ (memory `Role Privilege Protection`)

### 5.3 Policies sensíveis a manter intactas

- `community_cases`/`community_replies` usam `community_user_level()` — esse modelo é **cross-company** por design (memory `Community Module Exposure`); confirmar com o usuário se mantém global ou vira por-company (ver §6).
- `feedbacks` tem leitura `anon,authenticated` para resolvidos públicos — esse é um caso legítimo de leitura sem tenant, manter.
- `assemblies`/`groups`/`assembly_results` — catálogo global compartilhado, **NÃO** levar `company_id` (memory `Operational Data Isolation`).

### 5.4 Risco que não é RLS mas parece

- `get_users_with_email()` lê `auth.users` direto e exige `has_role(admin)` — em multi-tenant precisa filtrar por membership da company do admin chamador, senão owner de company A vê emails da company B.
- `get_admin_users_page` mesma coisa.

---

## 6. Domínios que NÃO devem virar tenant-scoped

Importante separar para não over-engineerar:

| Domínio | Manter | Motivo |
|---|---|---|
| `assemblies`, `assembly_results`, `groups` | global, leitura por `is_approved` | catálogo de mercado (CAIXA), igual para todos |
| `community_*` | semi-global por nível | a memory `Community Module Exposure` define comunidade como rede de consultores entre companies — confirmar com o usuário antes de tenant-scopear |
| `user_roles` (admin/user da plataforma) | global | é o role de plataforma, não da company; o role dentro da company vai em `company_users.role` |
| `admin_logs` | global | logs de admin de plataforma |
| `feedbacks` | parcialmente global | público quando resolvido + público |

---

## 7. UI / Componentes que assumem usuário único

| Componente | Assumção | Quebra quando |
|---|---|---|
| `AuthProvider` (`useAuth.tsx`) | `user.role` é global (`admin`/`user`) | precisa expor `currentCompanyId`, `currentCompanyRole`, `companies[]`, `switchCompany()` |
| Sidebar / Header | nenhum company selector | usuário com 2+ companies não consegue trocar |
| `AdminPage` | admin = admin global da plataforma | owner de company precisa ter um "Admin da empresa" separado |
| `MockSeedFab` | seed atribui ao `user_id` atual | precisa atribuir à company atual |
| Onboarding (`auto-approval` por domínio CAIXA) | aprova user, não vincula a company | no fluxo SaaS precisa: signup → cria company own → role=owner |
| `salesGoal.ts` (localStorage por userId) | meta pessoal | em company B2B vira meta de company; ok manter pessoal por hora |

---

## 8. Riscos priorizados

### 🔴 CRÍTICO (bloqueiam multi-tenant real)
1. **RLS de todas as 8 tabelas operacionais** ainda é `auth.uid()=user_id` — vazamento intra-company no dia 1 de B2B.
2. **3 RPCs paginadas** (`list_proposals_page`, `list_post_sale_clients_page`, `list_proposal_events_page`) precisam virar tenant-aware.
3. **`proposal_pdf_cache` sem `company_id`** — cache compartilhado vaza PDF entre companies.
4. **`share-proposal` edge** — token público precisa carregar company_id; revogação tem que cascatear.
5. **Ausência total de FKs** — deleção de company não tem como cascatear seguro.
6. **Backfill 1:1** ainda não desenhado — sem ele a migração de RLS quebra todo dado existente.

### 🟠 ALTO
7. Edges admin (`create-user`/`update-user-email`/`delete-user`) precisam virar admin-da-company além de admin global.
8. `analytics_events` / `audit_logs` precisam de `company_id` preenchido para dashboards por tenant.
9. `get_users_with_email` e `get_admin_users_page` vazam emails entre companies.
10. AuthProvider sem conceito de company atual — UI inteira precisa do contexto.

### 🟡 MÉDIO
11. 14 edges de IA decodificam JWT manualmente em vez de `getClaims()` — risco baixo hoje, virar consumo cruzado em multi-tenant.
12. `feedbacks` / `user_engagement` — definir se são por company ou globais.
13. Comunidade (`community_*`) — confirmar escopo cross-company com o usuário.
14. `MockSeedFab` precisa company atual.

### ⚪ BAIXO
15. `salesGoal.ts` em localStorage — pessoal por enquanto.
16. Catálogos `assemblies`/`groups`/`assembly_results` — manter globais.

---

## 9. Plano de ondas sugerido (próximas entregas)

**Onda M1 (Fase 2 — Schema)** — *próxima rodada se aprovado*
- Renomear `organizations` → `companies` + adicionar campos (`slug`, `active`, `metadata`).
- Criar `company_users` (`company_id`, `user_id`, `role enum`, `active`).
- Criar enum `company_role` (`owner`, `admin`, `manager`, `advisor`, `viewer`).
- Criar helpers SECURITY DEFINER: `is_company_member(company_id)`, `is_company_admin(company_id)`, `current_company_ids()`, `current_company_id()` (retorna a company "default" do user).
- Trigger em `auth.users` (extend `handle_new_user`) para criar uma company own e inserir `company_users(role=owner)`.
- **Sem alterar nenhuma RLS existente.** App continua single-user; schema fica pronto.

**Onda M2 (Fase 3 — Backfill)**
- Rodar backfill: para cada user em `profiles` sem company, criar company `{user.nome}` e `company_users(role=owner)`.
- Preencher `organization_id` (já renomeada `company_id`) em todas as 8 tabelas existentes a partir do `user_id` → company own.
- Adicionar `company_id` em `proposal_pdf_cache`, `feedbacks`, `user_engagement` + backfill.
- Tornar `company_id` `NOT NULL` nas tabelas operacionais (proposals, post_sale_*, proposal_events).
- Adicionar índices `(company_id, updated_at desc)` etc.
- **RLS ainda inalterada** — mas dado já está consistente para a virada.

**Onda M3 (Fase 4 — RLS corporativa)**
- Reescrever policies de proposals/post_sale_*/proposal_events/proposal_pdf_cache para `is_company_member(company_id)`.
- Reescrever as 3 RPCs paginadas para filtrar por `company_id IN current_company_ids()`.
- Reescrever `auditLog`/`analyticsTracker` para injetar `company_id`.
- AuthProvider expõe `currentCompanyId`/`currentCompanyRole`.
- Reescrever `share-proposal` com binding de company.

**Onda M4 (Fase 6 — Edges)**
- `create-user`/`update-user-email`/`delete-user` viram operações de company (target precisa ser member da mesma).
- 10 edges de IA migram para `getClaims()` + propagação de `company_id`.

**Onda M5 (Fase 7+8 — FKs e índices)**
- FKs com cascade desenhado.
- Índices compostos (`company_id`, …).
- Unique compostos por company onde fizer sentido (ex.: `(company_id, slug)` em customizações futuras).

**Onda M6 (Fase 9 — UI)**
- Company selector na sidebar.
- Tela "Membros da empresa" para owner/admin.
- Convite por email.
- Separar AdminPage entre "Admin da plataforma" e "Admin da empresa".

**Onda M7 (Fase 9 — Pen test)**
- Bateria de testes cross-tenant: criar 2 companies, 2 users em cada, tentar acessar IDs alheios via REST direto.
- Validar que `share_token` não atravessa company.
- Validar que `proposal_pdf_cache` não retorna PDF de outra company.

---

## 10. Decisões pendentes que precisam confirmação antes da Onda M1

1. **Comunidade** continua cross-company (consultores conversam entre empresas) ou vira por-company?
2. **Domínio CAIXA**: hoje há auto-aprovação por `@caixa.gov.br`. No mundo SaaS isso vira "qualquer email CAIXA entra na company CAIXA automaticamente"? Ou cada user CAIXA cria sua própria company own?
3. **Admin global da plataforma** (`user_roles.role='admin'`) continua existindo paralelo ao `company_users.role`? (recomendado: sim, para suporte/manutenção)
4. **Quotas / limites por plano** entram nesta arquitetura agora ou ficam para depois? (recomendado: depois, mas reservar coluna `companies.plan` agora)
5. **Multi-company por usuário**: um user pode ser owner de A e advisor de B simultâneamente? (impacta UI do seletor)

---

## 11. Checklist final — esta entrega (Fase 1)

- [x] Inventário das 20 tabelas com status multi-tenant
- [x] Mapeamento de hooks/services/RPCs por tabela
- [x] Auditoria das 14 edges
- [x] Identificação de FKs ausentes
- [x] Risco priorizado em 4 níveis
- [x] Plano de ondas M1–M7
- [x] Decisões pendentes documentadas
- [x] **Zero alteração de schema, RLS, código ou UI nesta rodada**
