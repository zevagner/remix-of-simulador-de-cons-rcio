# Pre-M3 Hardening & Readiness Audit

**Onda:** Pré-M3 (somente auditoria — zero alterações)
**Estado:** M1 + M2 concluídas. `MULTI_TENANT_RLS=false`. Sistema estruturalmente tenant-aware, ainda user-scoped em runtime.
**Objetivo:** Garantir que a M3 (swap real de RLS, RPCs, cache scope e tenant resolution) seja executada sem regressão e sem vazamento cross-tenant.

---

## 0. Sumário executivo

| Área | Readiness | Risco residual M3 | Ação obrigatória antes do swap |
|---|---|---|---|
| Schema & backfill (M1+M2) | 🟢 100% | ⚪ baixo | — |
| Triggers `set_company_id_from_profile` | 🟢 ativas | ⚪ baixo | — |
| RLS policies operacionais | 🟡 user-scoped intencional | 🟠 médio | Reescrever 4 grupos de policies |
| RPCs (`list_*_page`) | 🔴 `auth.uid()` hardcoded | 🔴 alto | Refactor obrigatório |
| React Query keys | 🔴 sem `companyId` | 🔴 alto | Prefixo `['t', companyId, ...]` |
| Edge functions (15) | 🟠 sem propagação `company_id` | 🟠 médio | Resolver tenant via JWT no servidor |
| Storage `proposal-pdfs` | 🟠 path por `user_id` | 🟠 médio | Migração de path tenant-aware |
| Dashboards admin | 🟢 globais por design | ⚪ baixo | Validar narrativa de produto |
| `proposal_pdf_cache` | 🟢 estrutura pronta | 🟡 médio | Tornar índice `(company_id, hash)` único |

**Readiness score global: 6.8 / 10.** Pronto para iniciar M3 em **sub-ondas controladas**, não em swap único.

---

## 1. React Query — inventário de query keys

Total: **13 query keys distintas** em hot path operacional + 6 em admin.

### 🔴 CRÍTICO — keys que precisam virar `['t', companyId, ...]`

| Key atual | Arquivo | Tabelas tocadas | Risco |
|---|---|---|---|
| `['proposals']` | `useProposalsQueries.ts` (5 ocorrências: setQueriesData, getQueriesData, invalidate, cancel×2) | `proposals` | Vazamento cross-tenant em troca de empresa: cache de empresa A vaza para B no mesmo browser |
| `['proposals', 'page', params]` | `usePaginatedQueries.ts:21` | `proposals` via RPC | idem |
| `['post_sale_clients', 'page', params]` | `usePaginatedQueries.ts:61` | `post_sale_clients` via RPC | idem |
| `['proposal_events', 'page', params]` | `usePaginatedQueries.ts:99` | `proposal_events` via RPC | idem |
| `['proposal-events', proposalId]` | `useProposalEvents.ts:10` | `proposal_events` | idem |

### 🟡 MÉDIO — admin (globais por design, manter assim)

| Key | Justificativa |
|---|---|
| `['audit-logs', ...]` | Admin global. **Não escopar.** |
| `['admin-ai-usage', ...]` | Admin global. **Não escopar.** |
| `['admin-ai-performance', ...]` | Admin global. |
| `['admin-ai-cache', ...]` | Admin global. |
| `['admin-profiles-for-ai']` | Admin global. |
| `[...adminKeys.all, 'users-page']` | Admin global. |

### Plano de refactor (M3-A)

1. Criar helper `tenantKey(companyId, ...rest)` em `src/lib/queryKeys.ts`.
2. Substituir as 5 keys 🔴 acima por `tenantKey(companyId, 'proposals', ...)`.
3. Adicionar `companyId` em **todas as `useQuery` deps** via `useCurrentCompany()`.
4. `invalidateQueries({ queryKey: ['t', companyId] })` no logout/troca de empresa.
5. **Cache busting global no swap inicial:** `qc.clear()` quando `MULTI_TENANT_RLS` virar `true` para evitar resíduo de keys antigas.

---

## 2. RPCs — auditoria

Total: **9 RPCs** chamadas pelo cliente.

### 🔴 RPCs com `auth.uid()` hardcoded — refactor obrigatório

| RPC | Linha do filtro | Refactor M3 |
|---|---|---|
| `list_proposals_page` | `WHERE p.user_id = auth.uid()` | `WHERE p.company_id = current_company_id()` (ou `IN (SELECT current_company_ids())`) |
| `list_post_sale_clients_page` | `WHERE psc.user_id = auth.uid()` | idem |
| `list_proposal_events_page` | `WHERE pe.user_id = auth.uid()` | idem |

**Estratégia:** adicionar parâmetro `p_company_id uuid DEFAULT NULL`. Se nulo, usar `current_company_id()`. Validar via `is_company_member(p_company_id)`. Manter compat: se feature flag desligada, comportar igual ao atual.

### 🟢 RPCs admin — manter como estão

- `get_admin_users_page` — global, gated por `has_role(admin)`.
- `get_users_with_email` — global, gated por `has_role(admin)`.

### 🟢 RPCs auxiliares — sem mudança

- `is_approved`, `community_set_vote`, `community_recompute_engagement` — escopo por user, sem dimensão tenant.

### Pendente complementar

- Criar RPC `set_current_company(_company_id uuid)` para o futuro company switcher (Onda M4).
- Endurecer `current_company_id()` para aceitar override por session var (`SET LOCAL app.current_company`) — preparação opcional.

---

## 3. RLS swap readiness

### Tabelas que mudam policy em M3

| Tabela | Policy atual | Policy M3 | Risco |
|---|---|---|---|
| `proposals` | `auth.uid()=user_id` | `is_company_member(company_id)` | 🟠 quebra se algum insert antigo não tiver `company_id` (já garantido pela trigger M2) |
| `proposal_events` | idem | idem | 🟢 trigger M2 cobre |
| `post_sale_clients` | idem | idem | 🟢 |
| `post_sale_events` | idem | idem | 🟢 |
| `post_sale_bids` | idem | idem | 🟢 |
| `proposal_pdf_cache` | idem | idem | 🟠 path do storage também muda — coordenar |
| `audit_logs` | user OR admin | manter user OR admin (escopar leitura tenant para non-admin) | 🟡 |
| `analytics_events` | INSERT auth.uid()=user_id, SELECT admin | mesma + tenant filter para futuras leituras tenant | 🟢 |
| `feedbacks` | user-scoped + admin | manter (feedback é canal direto para plataforma) | ⚪ |
| `user_engagement` | user OR admin | manter | ⚪ |

### Side-effects identificados

1. **`validate_proposal_business_rules`** continua disparando em UPDATEs. Backfills futuros precisam usar `session_replication_role=replica` (já adotado em M2).
2. **`log_proposal_*`/`log_post_sale_*`** inserem em tabelas que terão RLS company-scoped. Precisam herdar `company_id` da row pai. Hoje a trigger genérica `set_company_id_from_profile` cobre via `user_id`, mas o **modo correto pós-M3** é puxar do parent (`NEW.company_id := (SELECT company_id FROM proposals WHERE id = NEW.proposal_id)`). Ajustar em M3-B.
3. **Cross-table joins em RLS** (ex: `assembly_results → groups`) — `groups` é dado público de assembleia, não tenant. Manter como está.
4. **`proposal_pdf_cache` invalidation trigger** já existe e funciona por `proposal_id` — sem dependência de tenant.

### Policies a criar (M3-A)

```sql
-- Padrão para cada tabela operacional
CREATE POLICY "tenant_select" ON public.proposals FOR SELECT
  USING (is_company_member(company_id));
CREATE POLICY "tenant_insert" ON public.proposals FOR INSERT
  WITH CHECK (is_company_member(company_id) AND auth.uid() = user_id);
CREATE POLICY "tenant_update" ON public.proposals FOR UPDATE
  USING (is_company_member(company_id))
  WITH CHECK (is_company_member(company_id));
CREATE POLICY "tenant_delete" ON public.proposals FOR DELETE
  USING (is_company_admin(company_id) OR auth.uid() = user_id);
```

**Estratégia de swap segura:** policies novas convivem com antigas usando nomes distintos. Quando ambas estão ATIVAS, a permissão é a UNIÃO — então o app continua funcionando. Drop das antigas só após validação smoke.

---

## 4. Storage / PDF hardening

### Estado atual

- Bucket: `proposal-pdfs` (privado).
- Path atual no código: definido em `src/utils/pdfGenerator.tsx`. Por convenção implícita usa `<user_id>/<proposal_id>.pdf` (verificar antes do M3).
- `proposal_pdf_cache` agora tem `company_id` + índice `(company_id, content_hash)` (M2).
- Edge `generate-pdf` (Browserless) gera o blob; upload é client-side com `supabase.storage.from('proposal-pdfs').upload(path, blob)`.

### Riscos

| ID | Risco | Severidade |
|---|---|---|
| S1 | Path por `user_id` impede compartilhamento futuro entre membros da mesma company | 🟠 |
| S2 | `content_hash` dedup é global — possível "vazamento de existência" (não de conteúdo) entre tenants se 2 PDFs idênticos forem gerados | 🟡 |
| S3 | Signed URLs hoje vivem 1h e expõem `user_id` no path — não é vazamento de dado, mas é metadado | ⚪ |
| S4 | Bucket policies de Storage não foram auditadas neste relatório | 🟠 |

### Plano M3-C (Storage)

1. Novo path: `companies/{companyId}/proposals/{proposalId}/<hash>.pdf`.
2. Storage RLS: `bucket_id='proposal-pdfs' AND is_company_member((storage.foldername(name))[2]::uuid)`.
3. Migração lazy: novos PDFs já gravam no novo path; antigos continuam acessíveis via fallback até expirarem do cache.
4. Tornar `idx_pdf_cache_company_hash` UNIQUE para garantir dedup intra-tenant + permitir mesmo hash em tenants diferentes.

---

## 5. Edge functions — hardening

15 edges deployadas. Resumo:

### Padrão atual

- ✅ Todas têm CORS, Zod validation, rate limit (`_lib/rateLimit.ts`) por `user_id` (fallback IP).
- ✅ JWT validado via `getClaims()` (auditado: `module-copilot`, `sales-response`, `sales-copilot`, `investment-storytelling`, `share-proposal`, `generate-proposal`, `trigger-script`, `generate-pdf`, `sales-script`).
- ❌ **Nenhuma propaga `company_id`** no contexto de execução.
- ❌ Logging por `user_id`, sem `company_id` em `analytics_events.event_data`.

### Risco M3

| Edge | Vai quebrar em M3? | Razão | Ação |
|---|---|---|---|
| `generate-pdf` | 🟠 sim, parcial | Lê `proposals` via service_role — OK. Mas se passar a confiar em path tenant-aware, precisa receber `companyId`. | Adicionar `companyId` no payload + validar `is_company_member` |
| `share-proposal` | 🟠 sim | Cria token vinculado a proposta — precisa validar tenant do dono | Validar membership |
| `generate-proposal` | 🟢 não | IA pura, sem grava em `proposals` | — |
| `*-storytelling`, `*-copilot`, `*-script`, `bid-recommendation`, `phase-action`, `sales-response`, `module-copilot`, `niche-storytelling`, `trigger-script` | 🟢 não | IA stateless, leem contexto do payload | Apenas adicionar `companyId` ao log |
| `create-user`, `delete-user`, `update-user-email` | 🟡 admin-only | Admin global, não tenant | Validar que admin pode atuar fora da própria company |

### Padrão tenant-aware sugerido (helper compartilhado)

```ts
// scripts/_shared-edges/tenant.ts
export async function resolveTenant(supabase, claims) {
  const { data } = await supabase
    .from('company_users')
    .select('company_id, role')
    .eq('user_id', claims.sub)
    .eq('active', true);
  return { companyIds: data?.map(d => d.company_id) ?? [], primary: data?.[0]?.company_id };
}
```

E **rate limit** passa a ser `(companyId, userId)` em vez de só `userId`, para suportar quotas por plano (Onda M6).

---

## 6. Dashboard / analytics

### Inventário

- **AdminAuditLogs**, **AdminAIUsage**, **AdminAIPerformance** — agregam `analytics_events` e `audit_logs` global. **Mantidos globais.** ⚪
- **Pipeline metrics** (`pipelineMetrics.ts`) — agregam `proposals` do user logado. 🟠 Em M3 passam a agregar do tenant. **Validar narrativa:** o consultor enxerga a empresa inteira ou só dele? Default sugerido: **a si mesmo** (mantém UX user-scoped) com toggle "ver tudo da empresa" para `role >= manager`.
- **SalesForecastCard** — usa `localStorage` por `userId`. Sem mudança. ⚪
- **ClientScoring/Carteira** — lê `proposals` direto. RLS user-scoped hoje, vira tenant-scoped. **Mesma decisão acima.**

### Risco específico

- **Vazamento estatístico:** se um manager começar a ver dados agregados do tenant, é um produto novo, não um bug. Precisa ser decisão consciente em M3.
- **Cache compartilhado:** já coberto pela seção 1 (prefixo de tenant).

---

## 7. Hooks e services — críticos

| Arquivo | Dependência implícita | Status M3 |
|---|---|---|
| `useProposalsQueries` | `auth.uid()` via RLS, query key sem tenant | 🔴 refactor |
| `usePaginatedQueries` | RPCs hardcoded em `auth.uid()` | 🔴 refactor |
| `usePostSaleQueries` | (verificar) RLS + key sem tenant | 🔴 refactor |
| `useProposalEvents` | key `['proposal-events', proposalId]` — proposal já é unique key, mas falta tenant prefix para invalidação | 🟠 refactor leve |
| `useCurrentCompany` (M1) | já existe, retorna `currentCompanyId` | 🟢 base do M3 |
| `services/proposals.ts`, `postSale.ts`, `proposalEvents.ts` | chamam RPCs | 🔴 alinhar com novas assinaturas |
| `services/auditLog.ts`, `analyticsTracker.ts` | inserts em `audit_logs`/`analytics_events` — `company_id` cai pela trigger | 🟢 OK |
| `services/centralAI.ts`, `salesCopilot.ts`, etc. | chamam edges, não tocam DB direto | 🟢 OK (apenas adicionar `companyId` no payload de log) |

---

## 8. Smoke test plan — M3

### Pré-requisitos antes de cada smoke

- [ ] Snapshot do DB.
- [ ] Backup do `localStorage` do usuário de teste.
- [ ] Console limpo, network limpo.

### Cenário A — Usuário single-company (95% dos atuais)

1. Login → carrega `currentCompanyId` correto.
2. Carteira: lista propostas; conferir contagem == antes do M3.
3. Criar nova proposta: `company_id` populado; aparece na lista.
4. Mover proposta entre status: `proposal_events` registrado com `company_id`.
5. Migrar para pós-venda: `post_sale_clients.company_id` correto.
6. Registrar lance: `post_sale_bids.company_id` correto.
7. Gerar PDF: aparece com path novo, abre normalmente.
8. Compartilhar proposta: link público funciona; valida `company_id` da proposta.
9. Abrir IA (sales-copilot, storytelling, etc.): edges respondem; analytics gravado.
10. Logout → login: cache limpo, dados retornam idênticos.

### Cenário B — Usuário multi-company (futuro Onda M4)

11. Login com user que pertence a 2 companies.
12. Switcher troca `currentCompanyId`.
13. Carteira atualiza para a outra company sem reload.
14. Cache da company anterior não vaza (verificar React Query devtools).

### Cenário C — Admin global

15. Admin abre `/admin`: vê todos os users, todas as companies.
16. Audit logs e AI usage continuam globais.
17. Admin abre o app como user normal: vê **apenas a própria company**, não tudo.

### Cenário D — Regressão

18. Toggle `MULTI_TENANT_RLS=false` → sistema volta ao estado pré-M3 sem perda de dados.
19. Toggle `=true` novamente → mesma UX restaurada.

### Cenário E — Cross-tenant (segurança)

20. Forjar `company_id` em payload de edge: deve receber 403.
21. Forjar query React Query com outra `companyId` no prefixo: RLS deve barrar.
22. Tentar abrir PDF de outra company via URL direta: storage RLS deve barrar.

---

## 9. M3 execution strategy

### Sub-ondas

**M3-A — RLS dual + RPCs com fallback (1 migration)**
- Adiciona policies tenant-scoped novas (sem dropar antigas).
- RPCs ganham `p_company_id` opcional, default = `current_company_id()`.
- Feature flag continua `false`; RLS antiga vence por união permissiva.
- Risk: ⚪ baixo, totalmente reversível.

**M3-B — Triggers de propagação refinadas (1 migration)**
- `log_proposal_*` / `log_post_sale_*` puxam `company_id` da parent row em vez de `profiles`.
- Trigger genérica `set_company_id_from_profile` continua como safety net.
- Risk: ⚪ baixo.

**M3-C — Storage path tenant-aware (código + storage policy)**
- Novos uploads em `companies/{cid}/proposals/{pid}/...`.
- Storage policy nova permite acesso por membership.
- Antigos continuam funcionando.
- Risk: 🟡 médio. Smoke obrigatório de PDF.

**M3-D — React Query cache scope (frontend)**
- `tenantKey()` helper.
- Substitui as 5 keys 🔴.
- Adiciona `qc.clear()` no swap inicial e no logout.
- Risk: 🟠 médio. Risco real de cache contaminado se feito mal.

**M3-E — Flip da feature flag**
- `MULTI_TENANT_RLS=true` em ambiente de staging primeiro.
- Smoke test plan completo (cenários A–E).
- Drop das policies antigas só após 7 dias verdes.
- Risk: 🔴 alto se mal coordenado, ⚪ baixo se sub-ondas anteriores estiverem verdes.

### Rollback

- M3-A: drop policies novas, comportamento volta.
- M3-B: restaurar triggers anteriores (versão M2).
- M3-C: continuar lendo do path antigo (fallback já existe).
- M3-D: reverter `tenantKey()` para keys planas (1 commit).
- M3-E: `MULTI_TENANT_RLS=false` (1 toggle).

### Pontos de monitoramento

- `analytics_events` com `event_name='rls_denial'` (criar tracker no front).
- Edge function logs com `status_code in (401,403)` filtrados por `function_id`.
- Postgres logs filtrando `permission denied` na semana do swap.
- Latência das RPCs paginadas (índices novos da M2 devem segurar).

### Blast radius estimado

| Cenário | Usuários afetados | Tempo de detecção esperado |
|---|---|---|
| Erro em RLS (deny acidental) | 100% dos não-admin | < 5 min (UI vazia + logs) |
| Cache cross-tenant | usuários multi-company (hoje 0) | Apenas no Onda M4 |
| PDF path quebrado | quem gerar PDF naquela hora | < 15 min (suporte) |
| RPC quebrada | 100% (Carteira/Pós-venda) | < 2 min (página em branco) |

---

## 10. Tabelas críticas

| Prioridade | Tabela | Por quê |
|---|---|---|
| 🔴 1 | `proposals` | core do produto, hot path |
| 🔴 2 | `post_sale_clients` | core do produto, hot path |
| 🔴 3 | `proposal_pdf_cache` + bucket | path muda, signed URL muda |
| 🟠 4 | `proposal_events` | auditoria depende |
| 🟠 5 | `post_sale_events` / `post_sale_bids` | logs históricos |
| 🟡 6 | `audit_logs` / `analytics_events` | leitura admin global |
| ⚪ 7 | `feedbacks` / `user_engagement` | dimensão pessoal |

---

## 11. Decisões obrigatórias antes da M3-A

Estas decisões precisam ser respondidas pelo product owner antes de executar:

1. **Visibilidade default no tenant:** consultor vê **só os dele** (UX atual) ou **tudo da empresa**?  
   *Recomendação: só os dele, com toggle para `manager+`.*
2. **Multi-membership (Onda M4):** previsto, mas habilitamos a UI agora (switcher) ou só no M4?  
   *Recomendação: schema pronto, UI no M4.*
3. **Admin global vê dados operacionais de todas as companies?**  
   *Recomendação: NÃO. Continua o isolamento atual (memória `Operational Data Isolation`).*
4. **Quotas por tenant:** entram no M5 ou ficam para depois?  
   *Recomendação: depois do M3 estabilizado.*

---

## 12. Conclusão

- **Estrutura: pronta.** M1+M2 entregaram o esqueleto, dados e índices.
- **Runtime: ainda não.** RLS, RPCs e cache do React Query continuam user-scoped.
- **Risco real do M3:** está concentrado em 4 hot points — RPCs, RLS, query keys e storage path.
- **Mitigação:** sub-ondas M3-A → M3-E com policies em união permissiva, RPCs com fallback, cache busting controlado e flip por flag.
- **Readiness final:** **6.8/10** — apto a iniciar M3-A imediatamente, desde que as 4 decisões da seção 11 sejam confirmadas.
