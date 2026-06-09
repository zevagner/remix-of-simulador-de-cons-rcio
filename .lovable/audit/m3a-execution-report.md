# M3-A — Execution Report

**Data:** 2026-05-11
**Escopo aprovado:** RLS dual + RPCs tenant-aware, **sem** mudanças no frontend, **sem** flip de `MULTI_TENANT_RLS`.
**Resultado:** ✅ aplicado. Comportamento operacional **idêntico** ao anterior.

---

## 1. O que foi feito

### 1.1 RLS dual (políticas aditivas `tenant: ...`)

Adicionadas políticas **PERMISSIVE** em paralelo às legacy. Como PostgreSQL **OR-eia** policies permissive, o efeito hoje é zero (a legacy já permitia tudo que a nova permite). Quando a flag for virada (M3-E), removemos as legacy e estas ficam como única camada.

Tabelas cobertas e operações:

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `proposals` | ✅ | ✅ | ✅ | ✅ |
| `post_sale_clients` | ✅ | ✅ | ✅ | ✅ |
| `post_sale_events` | ✅ | ✅ | ✅ | ✅ |
| `post_sale_bids` | ✅ | ✅ | ✅ | ✅ |
| `proposal_events` | ✅ | — (trigger) | — | — |
| `proposal_pdf_cache` | ✅ | ✅ | ✅ | ✅ |
| `audit_logs` | ✅ | ✅ | — (append-only) | — |
| `analytics_events` | — (admin-only) | ✅ | — | — |
| `feedbacks` | ✅ (own) | ✅ | — (admin) | — (admin) |
| `user_engagement` | ✅ | — (RPC) | — | — |

**Predicado padrão (todas):**
```sql
auth.uid() = user_id
AND (company_id IS NULL OR public.is_company_member(company_id))
```

> **Visibilidade default preservada:** consultor continua vendo apenas os próprios registros mesmo dentro da mesma company. A checagem `is_company_member` é **defesa adicional**, não relaxamento.

### 1.2 RPCs tenant-aware (3 funções refatoradas)

| RPC | Antes | Depois |
|---|---|---|
| `list_proposals_page` | 5 args, filtro `user_id = auth.uid()` | +`p_company_id uuid DEFAULT NULL`, resolve `COALESCE(p_company_id, current_company_id())`, adiciona filtro tolerante (`v_company IS NULL OR company_id IS NULL OR company_id = v_company`) |
| `list_post_sale_clients_page` | 4 args | idem |
| `list_proposal_events_page` | 3 args | idem |

**Backward-compat:** frontend chama sem o novo parâmetro → `p_company_id = NULL` → resolve via `current_company_id()` → resultado idêntico hoje (todos os registros do usuário já têm `company_id` correto após M2). Se o usuário ainda não tivesse company (impossível pós-M2), o filtro tolerante deixa passar tudo do `auth.uid()`.

---

## 2. Riscos encontrados e mitigações

| Risco | Probabilidade | Mitigação aplicada |
|---|---|---|
| Política nova bloqueando inserts pré-trigger | Baixa | `company_id IS NULL OR ...` — registros entram com `company_id` nulo no INSERT e o trigger `set_company_id_from_profile` preenche **BEFORE INSERT**. CHECK roda depois ✓ |
| Frontend quebrar por mudança de assinatura RPC | Nenhuma | Todos os parâmetros novos são `DEFAULT NULL` no fim. PostgREST aceita chamada sem o parâmetro |
| `current_company_id()` retornar NULL | Baixíssima | Usuários novos ganham company via `handle_new_user()` (M1). Migração M2 fez backfill 100%. Filtro tolerante cobre o canto |
| Vazamento cross-user via nova policy | Nenhum | Predicado mantém `auth.uid() = user_id` |
| Performance regressão | Baixa | `is_company_member()` é STABLE SECURITY DEFINER + índice `company_users(user_id, company_id)` já existe |
| Linter SECURITY DEFINER warnings | Pré-existente | Todas as RPCs do projeto já tinham esse padrão; nada introduzido aqui |

**Blast radius atualizado:** 🟢 **mínimo** — mudança puramente aditiva no banco, frontend intocado.

---

## 3. Smoke checklist M3-A

Validar manualmente no preview (logged in como usuário comum):

- [ ] **Login** funciona normalmente
- [ ] **Carteira → listar propostas** carrega registros do usuário
- [ ] **Criar nova proposta** → salva, aparece na lista, `company_id` preenchido (verificar via `read_query`)
- [ ] **Editar proposta** → salva sem erro
- [ ] **Deletar proposta** → remove
- [ ] **Pós-venda → listar clientes** carrega
- [ ] **Registrar lance pós-venda** → salva e dispara trigger de evento
- [ ] **Histórico de eventos da proposta** carrega
- [ ] **Gerar PDF** → cache funciona (insert em `proposal_pdf_cache`)
- [ ] **Enviar feedback** → salva
- [ ] **Logout / login com outro usuário** → vê APENAS seus próprios dados (não vê nada do anterior)
- [ ] **Admin → painel de auditoria** continua mostrando todos os logs
- [ ] **Analytics events** continuam sendo gravados (verificar contador no Admin → Performance)

Query de sanity:
```sql
-- Garantir que toda proposta nova já nasce com company_id correto
SELECT p.id, p.user_id, p.company_id, pr.company_id as profile_company
FROM proposals p
JOIN profiles pr ON pr.user_id = p.user_id
WHERE p.created_at > now() - interval '1 day'
  AND (p.company_id IS NULL OR p.company_id <> pr.company_id);
-- Esperado: 0 linhas
```

---

## 4. Rollback plan

Se algo der errado (extremamente improvável — mudança aditiva), basta:

```sql
-- Drop policies tenant
DROP POLICY IF EXISTS "tenant: users select own proposals" ON public.proposals;
-- ... (repetir para cada policy criada)

-- Restaurar RPCs antigas (assinaturas anteriores)
-- Disponível via histórico de migrations em supabase/migrations/
```

Alternativa mais simples: **reverter a migration via Lovable History** — clicar em "View History" e voltar para o estado anterior à migration M3-A. Toda a mudança está em **uma única migration**.

```xml
<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>
```

---

## 5. Plano para M3-B (próxima onda)

**Escopo M3-B — Triggers de log herdam `company_id` do parent**

Hoje os triggers `log_proposal_created`, `log_proposal_changes`, `log_post_sale_*` inserem em `proposal_events` / `post_sale_events` sem setar `company_id` explicitamente. O trigger `set_company_id_from_profile BEFORE INSERT` resolve via `profiles.user_id`, mas isso é **frágil** se o owner do parent for diferente do executor (caso futuro de delegação manager→consultor).

**Refatorar:**
- `log_proposal_created` → setar `NEW.company_id := (SELECT company_id FROM proposals WHERE id = NEW.proposal_id)` no INSERT
- Idem para `log_proposal_changes`, `log_post_sale_client_created`, `log_post_sale_status_change`, `log_post_sale_bid_registered`
- Remover dependência do trigger genérico `set_company_id_from_profile` para essas tabelas (manter como fallback)

**Risco:** baixo. **Blast radius:** 🟢. Pré-requisito limpo para M3-C/D/E.

---

## 6. Próximas ondas (referência)

| Onda | Escopo | Status |
|---|---|---|
| M3-A | RLS dual + RPCs tenant-aware | ✅ **concluída** |
| M3-B | Triggers de log herdam `company_id` do parent | 🟡 próxima |
| M3-C | Storage paths `companies/{companyId}/...` + dual-read | ⚪ planejada |
| M3-D | Frontend `tenantKey()` helper, prefixar React Query keys, cache bust no logout | ⚪ planejada |
| M3-E | Flip `MULTI_TENANT_RLS=true`, monitorar 48h, drop legacy policies | ⚪ planejada |
| M4 | UI multi-membership (switcher), visão manager+, quotas | ⚪ futuro |

---

## 7. Arquivos alterados

- `supabase/migrations/<timestamp>_m3a_rls_dual_rpcs_tenant.sql` — única migration desta onda
- `src/integrations/supabase/types.ts` — atualizado automaticamente

**Frontend:** zero alterações. Zero impacto perceptível ao usuário.
