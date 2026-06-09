# Onda M3-E — Flip Controlado para Tenant-Scoped RLS

**Status:** ✅ Executada
**Tipo:** Backend RLS hardening + flag flip
**Reversibilidade:** Alta (rollback documentado abaixo)

---

## 1. Objetivo

Ativar oficialmente o isolamento por tenant nas tabelas operacionais, removendo as policies legacy puramente user-scoped e mantendo apenas as `tenant: ...` que exigem dupla validação (`auth.uid() = user_id AND (company_id IS NULL OR is_company_member(company_id))`).

**UX permanece idêntica.** Cada consultor continua vendo apenas os próprios registros.

---

## 2. Mudanças aplicadas

### 2.1 Policies legacy removidas (10 tabelas, 24 policies)

| Tabela                  | Policies dropadas                                          |
|-------------------------|------------------------------------------------------------|
| `proposals`             | view/insert/update/delete own (4)                          |
| `proposal_events`       | view own (1)                                               |
| `post_sale_clients`     | view/insert/update/delete own (4)                          |
| `post_sale_events`      | view/insert/update/delete own (4)                          |
| `post_sale_bids`        | view/insert/update/delete own (4)                          |
| `proposal_pdf_cache`    | view/insert/update/delete own (4)                          |
| `analytics_events`      | insert own events (1) — SELECT já era admin-only           |
| `audit_logs`            | insert/view own (2)                                        |
| `feedbacks`             | insert/view own (2) — mantém "notified" + leitura pública  |
| `user_engagement`       | view own (1) — mantém Service role manages para writes     |

### 2.2 Policies tenant-aware preservadas (já existentes desde M3-A)

Padrão canônico em todas as tabelas operacionais:
```sql
USING/WITH CHECK ((auth.uid() = user_id) AND ((company_id IS NULL) OR is_company_member(company_id)))
```

A cláusula `company_id IS NULL` garante compatibilidade com registros históricos que ainda não foram backfilled (defesa em profundidade — a M2 já fez backfill, mas se algum INSERT bypassar o trigger, a linha continua acessível ao próprio dono).

### 2.3 Frontend

`src/config/featureFlags.ts`:
```ts
export const MULTI_TENANT_RLS = true as const;
```

Nenhuma mudança em hooks, queries ou componentes. A infraestrutura `tenantKey()` da M3-D já estava tratando o frontend como tenant-aware.

---

## 3. Compatibilidade preservada

| Aspecto                  | Status                                                     |
|--------------------------|------------------------------------------------------------|
| Visão do consultor       | ✅ Idêntica (filtros por `auth.uid() = user_id` mantidos) |
| Admin global             | ✅ Policies `has_role(admin)` intactas                    |
| RPCs paginadas           | ✅ Já filtravam por `auth.uid()` + company_id opcional    |
| Triggers de auditoria    | ✅ Herdam company_id do parent (M3-B)                     |
| Storage PDFs antigos     | ✅ Policies legacy `{user_id}/...` mantidas (M3-F cleanup)|
| Storage PDFs novos       | ✅ Tenant policies `companies/{cid}/...` ativas           |
| Cache React Query        | ✅ tenantKey() (M3-D)                                     |
| Edge functions           | ✅ Usam service_role; não afetadas pelo flip              |
| Leitura pública feedbacks| ✅ Policy `Anyone can read public resolved feedback` mantida|

---

## 4. Riscos identificados e mitigação

| Risco                                                       | Mitigação                                                                 |
|-------------------------------------------------------------|---------------------------------------------------------------------------|
| Linha histórica com `company_id` errado fica invisível      | Cláusula `company_id IS NULL` permite acesso; M2 fez backfill completo   |
| INSERT futuro sem `company_id` setado                        | Trigger `set_company_id_from_profile` preenche; fallback ao próprio dono |
| Usuário sem membership em company_users                      | `handle_new_user` cria company + membership no signup (M1)                |
| Cache de browser stale após flip                             | M3-D já cuida do bust no logout; primeiro refresh resolve eventual stale |
| Edge functions usando anon key ao invés de service_role     | Auditadas: todas usam service_role para writes operacionais              |

---

## 5. Smoke Checklist

Executar no preview com usuário comum:

- [ ] Login → carteira mostra propostas próprias
- [ ] Criar nova proposta → aparece no Kanban
- [ ] Mover card entre colunas (status change) → trigger registra evento
- [ ] Editar proposta (notes/next action) → evento registrado
- [ ] Deletar proposta → some da lista
- [ ] Pós-venda: criar cliente, registrar lance, mudar status
- [ ] Gerar PDF novo → grava em `companies/{cid}/proposals/...`
- [ ] Reabrir proposta antiga com PDF legacy → cache encontra via fallback
- [ ] Analytics events sendo inseridos (verificar Network)
- [ ] Feedback: criar, marcar como notified
- [ ] Logout → cache `['t', ...]` limpo
- [ ] Refresh com sessão ativa → tudo ressincroniza
- [ ] Admin: dashboard global continua mostrando tudo

---

## 6. Rollback Plan

**Cenário:** detectado vazamento ou queries vazias inesperadas.

**Passo 1 — Frontend (segundos):**
```ts
// src/config/featureFlags.ts
export const MULTI_TENANT_RLS = false as const;
```

**Passo 2 — Backend (1 migration, ~30s):**
```sql
-- Recria todas as policies legacy (apenas user_id)
CREATE POLICY "Users can view own proposals" ON public.proposals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own proposals" ON public.proposals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own proposals" ON public.proposals
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own proposals" ON public.proposals
  FOR DELETE USING (auth.uid() = user_id);
-- ... (replicar para post_sale_*, proposal_pdf_cache, audit_logs, feedbacks,
--      analytics_events INSERT, user_engagement SELECT, proposal_events SELECT)
```

Como as policies tenant-aware permanecem (PERMISSIVE OR), o re-add das legacy restaura imediatamente o comportamento user-only sem dropar nada.

**Passo 3 — Cache (cliente):** refresh força (Ctrl+Shift+R) limpa qualquer cache stale.

---

## 7. Pontos preparados para M4

A M3-E deixa o sistema pronto para:
- **Visão manager+** (ampliar policy: `is_company_admin(company_id) OR auth.uid() = user_id`)
- **Switcher de tenant** (já existe `useCurrentCompany` + `currentCompanyId`)
- **Multi-membership** (`company_users` aceita N rows por user)
- **Delegação cross-user dentro do mesmo tenant** (basta remover `auth.uid() = user_id` das policies tenant-aware específicas)

---

## 8. Readiness Final SaaS

| Camada              | Estado                                          |
|---------------------|-------------------------------------------------|
| Foundation tenant   | ✅ M1                                           |
| Backfill operacional| ✅ M2                                           |
| RPCs tenant-aware   | ✅ M3-A                                         |
| Triggers herança    | ✅ M3-B                                         |
| Storage tenant-aware| ✅ M3-C (dual-read)                             |
| Frontend cache      | ✅ M3-D (tenantKey)                             |
| RLS flip            | ✅ **M3-E (esta onda)**                         |
| UX manager/switcher | ⏳ M4                                            |
| Storage cleanup     | ⏳ M3-F (drop legacy `{user_id}/...` policies)  |
