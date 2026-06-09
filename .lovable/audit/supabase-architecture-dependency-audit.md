# Supabase Architecture Dependency Audit

**Data:** 2026-05-11
**Escopo:** Avaliar profundidade real da dependência do Supabase no produto, identificando acoplamentos saudáveis, perigosos e oportunidades de abstração antes da Onda M2 (backfill multi-tenant).
**Status:** Auditoria — **nenhuma alteração de código, schema, RLS ou edges nesta etapa.**

---

## 0. Sumário executivo

| Dimensão | Score (0-10) | Observação |
|---|---|---|
| Auth (uso correto do Supabase Auth) | **9** | Implementação enxuta, JWT padrão, sem anti-patterns |
| RLS / Policies | **7** | Cobertura ampla, mas 100% baseada em `auth.uid()=user_id` (não tenant-aware) |
| Triggers / DB Functions | **6** | Lógica crítica vive no banco — produtiva mas pouco rastreável |
| Edge Functions | **6** | Bem padronizadas (CORS/rate-limit/Zod) mas decodificam JWT manualmente (`atob`) |
| Frontend (acoplamento) | **8** | 99% das queries passam pela camada `src/services/*` — saudável |
| React Query (cache) | **5** | Query keys **sem `companyId`** — risco real ao introduzir multi-company |
| Storage / PDF | **5** | `proposal_pdf_cache` indexado por `content_hash` global → risco cross-tenant |
| Schema / Modelagem | **6** | Sem FKs declaradas; `company_id` adicionado mas ainda nullable |
| **SaaS Readiness Geral** | **6.0** | Fundação multi-tenant feita (M1), mas execução (RLS+cache+PDF) ainda single-tenant |

**Conclusão estratégica:** o sistema está **profundamente** acoplado ao Supabase, mas em sua maioria de forma **saudável e produtiva**. Os pontos perigosos são localizados (3 áreas) e devem ser tratados nas Ondas M2/M3 sem necessidade de "desacoplar do Supabase".

> **Recomendação direta:** **NÃO** investir em camada de abstração genérica (repository/adapter agnóstico de banco). O custo arquitetural seria alto e o ganho baixo — Supabase é vantagem competitiva aqui, não risco.

---

## 1. AUTH — análise

### Componentes reais
- `src/hooks/useAuth.tsx` — `AuthProvider`, single source of truth da sessão
- `src/services/auth.ts` — `login`, `signUp`, `runPostLoginChecks`, `getCurrentUserRole`
- `src/components/auth/ProtectedRoute.tsx` — guard de rota
- `src/hooks/useCurrentUserId.ts` — hook reativo para `auth.uid()`
- `src/hooks/useCurrentCompany.tsx` — **(Onda M1)** resolução de `currentCompanyId`

### Acoplamentos saudáveis ✅
- **Uso direto do `supabase.auth`** — não há wrapper artificial; é a API correta para o Supabase JS SDK.
- `onAuthStateChange` usado **uma única vez** no `AuthProvider` (sem listeners vazados).
- `runPostLoginChecks` chama RPC `is_approved` — server-side, não confia no cliente.
- Timeout defensivo (`withTimeout` 12s) evita travas de UI quando `profiles`/`user_roles` demoram.

### Acoplamentos perigosos 🔴
- **Edge functions decodificam JWT com `atob(token.split('.')[1])`** — exemplos: `niche-storytelling/index.ts` (`trackAICall`), `update-user-email/index.ts`, e ~12 outras edges.
  - Risco: assinatura **não verificada**. Qualquer JWT bem-formado é aceito para "tracking" → contaminação de `analytics_events.user_id`.
  - Solução prevista (M4): trocar por `supabase.auth.getUser(token)` ou `getClaims()` com JWKS já configurado (secret `SUPABASE_JWKS` existe).
- **`AuthUser` não carrega `currentCompanyId`** — `useAuth()` e `useCurrentCompany()` são **dois contextos paralelos**. Componentes que precisam de "user + tenant" terão que sincronizar manualmente. Isso vai duplicar bugs sutis na M3.

### Acoplamentos difíceis de migrar
- Nenhum. Sair do Supabase Auth seria caro, mas não está na pauta — e seria erro estratégico.

### Veredito Auth
> **Mantenha 100% como está.** Único trabalho real: padronizar JWT validation nas edges (já planejado em M4) e fundir `useAuth` + `useCurrentCompany` num único contexto na M6.

---

## 2. RLS E POLICIES — análise

### Mapeamento (20 tabelas)

| Categoria | Tabelas | Padrão de policy |
|---|---|---|
| **Operacionais por usuário** | `proposals`, `post_sale_clients`, `post_sale_events`, `post_sale_bids`, `proposal_events`, `proposal_pdf_cache`, `audit_logs` | `auth.uid() = user_id` |
| **Operacionais via JOIN** | `analytics_events` | `auth.uid() = user_id` + admin override |
| **Conteúdo público admin** | `groups`, `assemblies`, `assembly_results` | `is_approved(auth.uid())` leitura, `has_role(admin)` escrita |
| **Comunidade** | `community_cases`, `community_replies`, `community_reply_votes` | Híbrido com `community_user_level()` (gating por engajamento) |
| **Identidade** | `profiles`, `user_roles` | Self + admin; `user_roles` com RESTRICTIVE policy contra escalation |
| **Multi-tenant (M1)** | `companies`, `company_users` | `is_company_admin/member` + admin global |
| **Misc** | `feedbacks`, `user_engagement`, `admin_logs` | Self + admin |

### Helpers SQL (saudáveis ✅)
- `has_role(_user_id, _role)` — `STABLE SECURITY DEFINER`, anti-recursão correta
- `is_approved(_user_id)` — idem
- `is_company_member(_company_id)`, `is_company_admin(_company_id)`, `current_company_id()`, `current_company_ids()` — **(M1)** prontos para uso, **ainda não usados em policy alguma**

### Pontos perigosos 🔴
1. **Policies `auth.uid() = user_id` em 8 tabelas operacionais que JÁ TÊM `company_id`.**
   - Hoje: usuário A nunca vê dados de B → seguro single-tenant.
   - Amanhã (M3): usuário A entra como `advisor` na company de B → **não consegue ver os dados de B**, pois a policy não considera `is_company_member(company_id)`.
   - Esta é a mudança central da M3 e está corretamente planejada no `multitenant-audit.md`.
2. **`proposal_pdf_cache` sem `company_id`** — RLS por `user_id`, mas o conteúdo do PDF pertence ao crédito/cliente, não ao consultor. Se um membro de empresa gera PDF de um cliente da empresa, outro membro não reusa o cache → desperdício + leak potencial via `content_hash`.
3. **`assembly_results` policy faz JOIN com `groups`** — `(EXISTS SELECT 1 FROM groups g WHERE g.id=assembly_results.group_id AND has_role(...))`. Em escala (10M idx_scans já observados em `groups_pkey` per memory `infra/db/otimizacao-io-onda1`), isso continuará pesado. Não é bloqueador, mas precisa monitorar.
4. **Comunidade gating por `community_user_level()`** — função `STABLE SECURITY DEFINER` faz lookup em `user_engagement`. Em alta concorrência (assembleia ao vivo) pode virar gargalo. Aceitável hoje.

### Acoplamentos saudáveis ✅
- Uso disciplinado de `SECURITY DEFINER` apenas em funções idempotentes.
- `user_roles` tem policy RESTRICTIVE contra privilege escalation (memory: `security/database/privilege-escalation-protection`).
- Trigger `prevent_profile_self_approval` impede usuário marcar `approved=true` em si mesmo.

### Veredito RLS
> Estrutura sólida. **Não tente desacoplar RLS** — é o motor de segurança. Apenas **migrar policies de `user_id` para `is_company_member(company_id)`** na M3, conforme já planejado.

---

## 3. TRIGGERS E DB FUNCTIONS — análise

### Mapeamento (lógica crítica no banco)

| Trigger / Function | Tabela | Tipo | Risco |
|---|---|---|---|
| `handle_new_user` | `auth.users` | AFTER INSERT | 🟢 Crítico mas correto — cria profile + role + company + company_users em transação |
| `log_proposal_created` / `log_proposal_changes` | `proposals` | AFTER INS/UPD | 🟡 Lógica de auditoria opaca para o frontend |
| `log_post_sale_*` (3 triggers) | `post_sale_*` | AFTER | 🟡 Idem |
| `validate_proposal_business_rules` | `proposals` | BEFORE | 🔴 Regra de negócio (`PROSPECT_TRIGGER_REQUIRED`, `NEXT_ACTION_REQUIRED`) escondida no banco |
| `clear_next_action_on_terminal` | `proposals` | BEFORE UPD | 🟡 Side effect implícito |
| `validate_next_action_type` / `validate_proposal_event_type` / `validate_post_sale_event_type` | várias | BEFORE | 🟡 Validação de enum em texto — deveria ser ENUM DDL |
| `invalidate_pdf_cache_on_proposal_change` | `proposals` | AFTER UPD | 🟢 Correto |
| `community_sync_*` (3 triggers) | community | AFTER | 🟡 Contadores denormalizados — risco de dessincronia |
| `community_recompute_engagement` | RPC | — | 🟢 Idempotente, com checagem de permissão |
| `set_feedback_resolved_at` / `reset_feedback_user_notified` | `feedbacks` | BEFORE UPD | 🟢 Pequenos, óbvios |

### Pontos perigosos 🔴
- **`validate_proposal_business_rules` lança erros com codes (`PROSPECT_TRIGGER_REQUIRED`, `NEXT_ACTION_REQUIRED`) que o frontend precisa traduzir.** Acoplamento implícito banco↔UI. Se alguém mexer no trigger, UI quebra silenciosamente.
- **Validação de enum em texto** (3 triggers) — mais frágil que `CREATE TYPE ... AS ENUM`. Já existe `proposal_status` como enum; estender o padrão para `event_type`s.
- **Contadores denormalizados** (`reply_count`, `helpful_count`, `not_helpful_count`) dependem de triggers. Se trigger falhar (ou for desabilitado em migration), valor diverge do real. Sem job de reconciliação.

### Pontos saudáveis ✅
- **`handle_new_user` em transação única** — garante invariante "usuário sempre tem company".
- Todos os triggers usam `SECURITY DEFINER` + `SET search_path = public` (anti SQL injection via search_path).
- Lógica de eventos (`proposal_events`, `post_sale_events`) no banco evita race conditions cliente.

### Veredito Triggers
> Vale manter. **Documentar** as regras escondidas (especialmente `validate_proposal_business_rules`) num único arquivo `.lovable/audit/db-business-rules.md` para evitar que sumam do radar.

---

## 4. EDGE FUNCTIONS — análise

### Mapeamento (16 edges)

| Categoria | Edges |
|---|---|
| **AI / IA** (12) | `niche-storytelling`, `investment-storytelling`, `bid-recommendation`, `sales-copilot`, `sales-script`, `sales-response`, `module-copilot`, `phase-action`, `trigger-script`, `generate-proposal`, `share-proposal`, sales-related |
| **Admin** (3) | `create-user`, `update-user-email`, `delete-user` |
| **Infra** (1) | `generate-pdf` (Browserless) |

### Padrão arquitetural ✅
- `_lib/` espelhado de `scripts/_shared-edges/` via `sync-shared-edges.sh` — **excelente** prática.
- Camadas: `cors.ts`, `rateLimit.ts`, `aiCall.ts`, `validators.ts`, `logging.ts`, `promptFragments.ts`.
- Zod em todas as edges para input.
- `getCorsHeaders` + `isOriginAllowed` consistente.
- Rate limit por user_id com fallback IP (memory: `arch/ai/padronizacao-global-ias`).

### Pontos perigosos 🔴
1. **Decodificação manual de JWT (`atob`)** em ~12 edges (ver seção 1). Resolver em M4.
2. **`SUPABASE_SERVICE_ROLE_KEY`** disponível em **todas** as edges, mesmo as que só precisam ler com JWT do usuário. Princípio do menor privilégio violado. Em multi-tenant, uma edge AI usando service_role acidentalmente em `from('proposals')` **bypassaria toda a RLS de tenant**.
3. **`update-user-email`** lista users com `adminClient.auth.admin.listUsers({page, perPage:50})` em loop até achar — em escala (10k+ users) é O(n) e pode dar timeout.
4. **`share-proposal`** gera token público sem `company_id` no payload — token vazado de uma company poderia (depois de M3) ser invalidamente usado se a checagem só olhar `proposal.user_id`.

### Veredito Edges
> Boa estrutura. **Não criar mais abstração** — só padronizar JWT validation e auditar quais edges realmente precisam de service_role.

---

## 5. FRONTEND — análise de acoplamento

### Distribuição real de uso (`supabase.*`)

```
src/services/         → 9 arquivos com supabase.* (CORRETO)
src/hooks/            → 6 arquivos (4 são auth/orchestration, OK)
src/components/       → 3 arquivos (RUÍDO — devem mover p/ services)
src/pages/            → 4 arquivos (todas auth pages — OK)
src/utils/            → 2 arquivos (pdfGenerator, mockSeed — OK)
```

### Componentes que ainda fazem `supabase.from()` direto 🔴
- `src/components/feedback/FeedbackModal.tsx`
- `src/components/admin/AdminAIUsage.tsx`
- `src/components/admin/AdminDashboard.tsx`

> 3 violações pontuais; baixo custo refatorar para `services/feedbacks.ts` e expandir `services/adminLogs.ts`.

### Pontos saudáveis ✅
- **~95% das queries passam por `src/services/*`** — camada de service real e funcional. Não precisa de "repository pattern" formal por cima.
- `useCurrentUserId` isolado e reativo.
- `usePaginatedQueries`, `useProposalsQueries`, `usePostSaleQueries` — encapsulam React Query + service.
- `useAdminQueries` para painel admin.
- Tipos vêm de `src/integrations/supabase/types.ts` (gerado) — single source of truth.

### Veredito Frontend
> **Camada de service já existe e funciona.** Só normalizar os 3 componentes infratores e a arquitetura está madura. **Não criar repositório agnóstico.**

---

## 6. REACT QUERY — análise

### Pontos perigosos 🔴 (este é o **risco #1** para M3)

- **Query keys sem `companyId`:** chaves como `['proposals', filters]`, `['post-sale-clients', filters]`, `['proposal-events', proposalId]` em `usePaginatedQueries`, `useProposalsQueries`, `usePostSaleQueries`.
  - Cenário M3+: usuário troca de company no `useCurrentCompany`. Query key idêntica → **React Query devolve dados cacheados da company anterior** até stale time expirar. **Vazamento visual de dados cross-tenant.**
  - Solução obrigatória M3: prefixar todas as keys com `currentCompanyId` (ex: `['t', companyId, 'proposals', filters]`).
- **Sem invalidação coordenada ao trocar de tenant.** Não há `queryClient.clear()` no callback de troca de company (porque essa troca ainda não existe na UI).

### Pontos saudáveis ✅
- React Query usado consistentemente — sem `useEffect + fetch` espalhado.
- Invalidação correta em mutations (`invalidateQueries(['proposals'])`).
- `staleTime` razoável.

### Veredito React Query
> **Maior risco oculto da plataforma.** Custo de correção: 1 dia (introduzir helper `tenantKey(['proposals', ...])`). **Fazer junto com M3.**

---

## 7. STORAGE / PDF — análise

### Mapeamento
- Bucket único: `proposal-pdfs` (privado).
- `src/utils/pdfGenerator.tsx` — upload e download via `supabase.storage`.
- `proposal_pdf_cache` — tabela de hash + path.
- Edge `generate-pdf` — usa Browserless.

### Pontos perigosos 🔴
1. **`content_hash` global** — duas companies com mesma proposta (mesmo cliente, mesmo crédito → improvável mas possível) compartilhariam hash. Cache hit cross-tenant.
2. **Naming dos arquivos** — checar se inclui `user_id` ou `proposal_id` no path. Se for só `<hash>.pdf`, colisão real possível.
3. **RLS de storage não auditada aqui** (precisa olhar policies do bucket no painel Storage).

### Pontos saudáveis ✅
- Bucket privado.
- Trigger `invalidate_pdf_cache_on_proposal_change` garante consistência ao editar proposta.
- Uso do Browserless para fidelidade visual (memory: `infra/pdf/geracao-via-browserless`).

### Veredito Storage
> **Adicionar `company_id` em `proposal_pdf_cache`** + reescrever path como `companies/<company_id>/proposals/<proposal_id>/<hash>.pdf` na M3. Ajuste pequeno, ganho enorme.

---

## 8. SCHEMA E MODELAGEM — análise

### Pontos perigosos 🔴
- **Zero foreign keys declaradas** no schema (todas as tabelas listadas como "No foreign keys"). Cascades de deleção não existem; consistência relacional depende exclusivamente do código.
- **`company_id` ainda nullable** em 8 tabelas operacionais (esperado em M1 — será `NOT NULL` em M2).
- **`prospect_trigger` como `text`** com validação em trigger — deveria ser ENUM.
- **`event_type` em vários *_events** como `text` validado por trigger — idem.

### Pontos saudáveis ✅
- ENUMs corretos: `proposal_status`, `post_sale_status`, `post_sale_priority`, `app_role`, `company_role`, `community_*`.
- `gen_random_uuid()` consistente.
- Timestamps `created_at`/`updated_at` padronizados.
- Trigger `update_updated_at_column` reutilizado.

### Veredito Schema
> Boa modelagem na **forma**, fraca em **garantias declarativas**. Adicionar FKs com `ON DELETE CASCADE/RESTRICT` na **Onda M5** é alto-impacto baixo-custo.

---

## 9. O QUE ESTÁ BEM IMPLEMENTADO

1. **Auth** (`useAuth` + `services/auth`) — referência arquitetural.
2. **Camada `src/services/*`** — abstração real, não fake.
3. **Padronização de edges via `_lib/`** — ouro raro.
4. **Helpers SQL `SECURITY DEFINER`** corretos e anti-recursão.
5. **RLS coverage 100%** das tabelas (nenhuma tabela sem policy).
6. **Tipos gerados** + tipos de domínio em `src/types/` separados.
7. **Pagination via RPC** (`list_*_page`) com hard cap 200 — anti-DoS implícito.
8. **Audit logs + analytics_events** — observabilidade real.
9. **PDF via Browserless** — desacoplado da renderização do cliente.
10. **Memory rules** (`mem://`) — governança de decisões arquiteturais.

---

## 10. O QUE DEVERIA SER ABSTRAÍDO (lista mínima)

| Abstração | Onde | Prioridade | Justificativa |
|---|---|---|---|
| `tenantKey(keys: unknown[])` helper | `src/lib/queryKeys.ts` | 🔴 Alta (M3) | Resolve risco #1 de cache cross-tenant |
| `useTenantContext()` (fusão `useAuth` + `useCurrentCompany`) | `src/hooks/` | 🟡 Média (M6) | Reduz duplicação |
| `getEdgeUserClaims(req)` | `supabase/functions/_shared/auth.ts` | 🔴 Alta (M4) | Substitui `atob` manual em 12 edges |
| `pdfPath({companyId, proposalId, hash})` | `src/utils/pdfPaths.ts` | 🟡 Média (M3) | Garante isolamento físico |
| `services/feedbacks.ts` + remover `from()` de 3 components | — | 🟢 Baixa | Limpeza |

**Note:** todas as abstrações acima são **dentro do paradigma Supabase** — nenhuma propõe trocar de provider.

---

## 11. O QUE NÃO VALE A PENA MUDAR (honestidade arquitetural)

- ❌ **Não** criar repository pattern por cima de `supabase.from()`. Custo alto, ganho zero.
- ❌ **Não** abstrair `supabase.auth` atrás de wrapper genérico.
- ❌ **Não** mover regras de `validate_proposal_business_rules` para o cliente — elas estão certas no banco (último checkpoint de integridade).
- ❌ **Não** trocar React Query por SWR/Relay/etc. — funciona perfeitamente.
- ❌ **Não** introduzir GraphQL/PostgREST custom — overhead sem benefício.
- ❌ **Não** desnormalizar `companies/company_users` em `profiles` — modelo atual é correto.
- ❌ **Não** criar "domain layer" formal (DDD) — projeto não tem complexidade que justifique.

---

## 12. CUSTO FUTURO (continuando no Supabase)

### O que escala bem
- Auth (até centenas de milhares de usuários sem ajuste).
- RLS com `SECURITY DEFINER` helpers (muito eficiente).
- Edge functions (auto-scale Deno).
- Storage privado.

### Riscos / limites
| Risco | Quando vira problema | Mitigação |
|---|---|---|
| `assembly_results` JOIN com `groups` em RLS | 1M+ assembly_results | Materialized view ou denormalizar `has_admin_role` em assembly_results (improvável) |
| `proposal_pdf_cache` sem TTL | 100k+ PDFs | Job de cleanup mensal |
| `analytics_events` sem partição | 50M+ rows | Particionar por mês |
| `list_proposals_page` ILIKE sem trigram index | 100k+ proposals | `pg_trgm` + GIN index |
| Service role key em todas as edges | Sempre | Auditar e remover onde não necessário |
| 16 edge functions cold start | Picos de tráfego | Warm-up via cron ou pré-aquecimento |

### Dívida técnica acumulável
- Ausência de FKs vai cobrar caro no primeiro `DELETE FROM companies` que não cascateie.
- Validação de `event_type` em trigger vai cobrar caro quando alguém adicionar enum no código sem alinhar trigger.

---

## 13. SAAS READINESS

| Critério | Status |
|---|---|
| Tenant isolation (lógico) | 🟡 Estrutura criada (M1), execução pendente (M3) |
| Tenant isolation (físico — storage/cache) | 🔴 PDF cache compartilhado |
| Multi-membership por usuário | 🟢 `company_users` suporta |
| Quotas/billing | 🔴 Não existe |
| Onboarding multi-tenant | 🟡 Trigger cria company, mas sem fluxo de invite |
| Admin global vs tenant admin | 🟢 Separação clara (`app_role` vs `company_role`) |
| Observabilidade por tenant | 🔴 `audit_logs` tem `company_id` mas analytics dashboards filtram por `user_id` |
| Soft delete / GDPR | 🔴 Sem padrão |
| Rate limit por tenant | 🟡 Por user_id, não por company |

**Score SaaS Readiness: 6.0 / 10** — Fundação correta, execução incompleta. Esperado neste estágio.

---

## 14. PRIORIDADES ANTES DA M2

Em ordem de impacto/risco:

1. **🔴 Backfill defensivo (M2):** validar que **todos** os rows operacionais ganham `company_id` correto via `profiles.company_id`. Adicionar constraint `NOT NULL` só após validação 100%.
2. **🔴 Inventário de queries por React Query key:** listar todas as keys que precisarão de prefixo `companyId`. Não fazer ainda — só listar.
3. **🟡 Documentar regras escondidas em triggers** (`validate_proposal_business_rules` etc.) num único arquivo.
4. **🟡 Decidir 5 perguntas pendentes** do `multitenant-audit.md` (community escopo, CAIXA domain, global admin, quotas, multi-membership).
5. **🟢 Limpar `from()` direto em 3 components** (FeedbackModal, AdminAIUsage, AdminDashboard).

---

## 15. RECOMENDAÇÕES FINAIS

### Conservar com força
- Stack Supabase ponta-a-ponta (Auth + Postgres + RLS + Edges + Storage).
- Camada `src/services/*` como única superfície de acesso ao banco no frontend.
- Padrão `_lib/` nas edges.
- Helpers SQL `SECURITY DEFINER`.

### Corrigir nas próximas ondas
- M2: backfill + `NOT NULL` em `company_id`.
- M3: RLS tenant-aware + `tenantKey()` em React Query + path tenant-aware no Storage/PDF.
- M4: `getClaims()` nas edges + auditoria de service_role.
- M5: FKs declaradas + ENUMs nos `event_type`s.
- M6: fusão `useAuth`+`useCurrentCompany`, UI de troca de company, invite por email.

### Não tocar
- Auth flow.
- Estrutura de policies (apenas migrar predicado).
- Triggers de auditoria.
- Estrutura de tipos gerados.

---

## 16. Score final de maturidade arquitetural

```
Auth ............... ████████░░ 9/10
Services ........... ████████░░ 8/10
RLS ................ ███████░░░ 7/10
Edges .............. ██████░░░░ 6/10
Triggers/DB ........ ██████░░░░ 6/10
Schema ............. ██████░░░░ 6/10
React Query ........ █████░░░░░ 5/10  ← maior risco oculto
Storage/PDF ........ █████░░░░░ 5/10
SaaS Readiness ..... ██████░░░░ 6/10
─────────────────────────────────
GERAL .............. ██████▓░░░ 6.4/10
```

**Veredito final:** o sistema **é Supabase-native por escolha estratégica correta**. Os acoplamentos são majoritariamente saudáveis. Os 3 riscos reais (RLS não tenant-aware, React Query keys sem company, PDF cache compartilhado) são todos endereçáveis dentro das próximas 2-3 ondas, sem refatoração estrutural. **Avançar para M2.**

---

*Auditoria conduzida sem alteração de código, schema, RLS ou edges, conforme solicitado.*
