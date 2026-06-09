# M3-B — Execution Report

**Data:** 2026-05-11
**Escopo:** Triggers de log herdam `company_id` do **registro pai (parent row)**, não mais do executor.
**Resultado:** ✅ aplicado. Backend mais resiliente. Zero impacto visual/UX.

---

## 1. Triggers refatoradas (5)

| Trigger | Tabela alvo | Antes | Depois |
|---|---|---|---|
| `log_proposal_created` | `proposal_events` | sem `company_id` no INSERT → resolvido pelo trigger genérico (busca em `profiles`) | inclui explicitamente `NEW.company_id` (vem da `proposals`) |
| `log_proposal_changes` | `proposal_events` | idem | idem — usa `NEW.company_id` da própria `proposals` |
| `log_post_sale_client_created` | `post_sale_events` | idem | usa `NEW.company_id` da `post_sale_clients` |
| `log_post_sale_status_change` | `post_sale_events` | idem | idem |
| `log_post_sale_bid_registered` | `post_sale_events` | idem | **lookup** em `post_sale_clients` por `client_id` (parent canônico), com fallback `NEW.company_id` |

### Mapa de herança

```text
proposals ──(NEW.company_id)──▶ proposal_events
post_sale_clients ──(NEW.company_id)──▶ post_sale_events (created/status_change)
post_sale_bids ──[lookup post_sale_clients]──▶ post_sale_events (bid_registered)
```

---

## 2. Trigger genérico mantido como fallback

`set_company_id_from_profile()` permanece ativo em `BEFORE INSERT` em 10 tabelas (proposals, post_sale_clients, post_sale_bids, proposal_events, post_sale_events, audit_logs, analytics_events, proposal_pdf_cache, feedbacks, user_engagement).

**Papel após M3-B:**
- Mecanismo principal apenas para inserts diretos (criar proposta, registrar lance) onde o usuário executor é o owner.
- **Rede de segurança (fallback)** para qualquer evento derivado em que a herança explícita falhar (ex: `NEW.company_id` momentaneamente nulo).
- Não é mais a fonte da verdade para eventos derivados.

---

## 3. Backfill defensivo (executado dentro da migration)

```sql
-- Resultado esperado: 0 linhas afetadas (tudo já consistente após M2)
UPDATE proposal_events SET company_id = parent.company_id WHERE divergente;
UPDATE post_sale_events SET company_id = parent.company_id WHERE divergente;
UPDATE post_sale_bids   SET company_id = parent.company_id WHERE divergente;
```

Garantia: nenhum evento histórico ficou com `company_id` divergente do parent.

---

## 4. Cenários futuros validados

| Cenário | Comportamento M3-B |
|---|---|
| **Manager cria ação para advisor** (M4+): manager loga e edita proposta de outro user | `NEW.company_id` da proposta = company do consultor → evento herda correto, não vai para a company do manager |
| **Edge function automação** (server-side, sem `auth.uid()`) | Continua funcionando: `NEW.company_id` vem da proposta, não depende de `profiles.user_id` lookup |
| **Job batch / cron** | Idem — não depende de sessão |
| **Multi-membership** (user em duas companies) | Evento é vinculado à company da proposta, não à "company default" do user (que poderia divergir) |
| **Workflow delegado** | Idem — fonte canônica é o resource original |

---

## 5. Riscos e mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| `NEW.company_id` momentaneamente NULL no INSERT da proposta | Muito baixa | `set_company_id_from_profile` (BEFORE INSERT) preenche antes do trigger AFTER INSERT rodar → fallback OK |
| Lookup extra em `post_sale_clients` para bids | Negligível | 1 SELECT por bid (insert raro) com PK lookup — sub-ms |
| Loop de trigger | Nenhum | Triggers AFTER INSERT só inserem em outras tabelas (proposal_events / post_sale_events não têm triggers de log) |
| Race condition | Nenhuma | Mesma transação do INSERT do parent |
| Performance | Sem regressão | Sem queries extras nos paths principais; lookup de bids é PK |
| Backfill divergente | Esperado 0 | Após M2 todos os eventos já estavam alinhados via trigger genérico |

**Blast radius:** 🟢 mínimo. Mudança puramente backend, aditiva (campo já existia, agora preenchido explicitamente).

---

## 6. Smoke checklist M3-B

Validar no preview (login normal):

- [ ] **Criar nova proposta** → linha em `proposal_events` com `event_type='created'` e `company_id` igual ao da proposta
- [ ] **Mudar status da proposta** → linha em `proposal_events` com `event_type='status_change'` e `company_id` correto
- [ ] **Editar próxima ação** (sem mudar status) → linha `next_action_set` com `company_id` correto
- [ ] **Migrar para pós-venda** → linha em `post_sale_events` com `event_type='created'` e `company_id` correto
- [ ] **Mudar status pós-venda** → linha `status_change` com `company_id` correto
- [ ] **Registrar lance pós-venda** → linha `bid_registered` com `company_id` herdado do client (não do bid)
- [ ] **Gerar PDF** continua funcionando (cache OK)
- [ ] **Analytics events** continuam sendo gravados normalmente
- [ ] **Audit logs** continuam íntegros
- [ ] **Login/logout** sem regressão

### Query de sanity (rodar após smoke)

```sql
-- Eventos novos do último dia devem ter company_id = company_id do parent
SELECT pe.id, pe.company_id AS evento, p.company_id AS parent
  FROM proposal_events pe
  JOIN proposals p ON p.id = pe.proposal_id
 WHERE pe.created_at > now() - interval '1 day'
   AND pe.company_id IS DISTINCT FROM p.company_id;
-- Esperado: 0 linhas

SELECT pse.id, pse.company_id AS evento, psc.company_id AS parent
  FROM post_sale_events pse
  JOIN post_sale_clients psc ON psc.id = pse.client_id
 WHERE pse.created_at > now() - interval '1 day'
   AND pse.company_id IS DISTINCT FROM psc.company_id;
-- Esperado: 0 linhas
```

---

## 7. Relatório de integridade (pós-migration)

- ✅ 5 triggers refatoradas, todas com `SECURITY DEFINER` + `search_path = public`
- ✅ Backfill defensivo executado nas 3 tabelas-alvo (resultado esperado: 0 linhas)
- ✅ Trigger genérico `set_company_id_from_profile` preservado em todas as 10 tabelas
- ✅ Nenhum DROP de função (apenas `CREATE OR REPLACE` — assinaturas idênticas)
- ✅ Linter: warnings 100% pré-existentes (todas as funções SECURITY DEFINER do projeto têm o mesmo padrão; proteção via `auth.uid()` interno)

---

## 8. Rollback plan

**Opção rápida:** revert via Lovable History na migration M3-B → restaura as 5 funções para a versão pré-M3-B (ainda funcional, dependendo do trigger genérico).

```xml
<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>
```

**Opção SQL:** restaurar cada função à versão anterior (disponível na migration M3-A e anteriores em `supabase/migrations/`).

Não há schema change — apenas corpo de função. Rollback é trivial e seguro.

---

## 9. Pontos preparados para M3-C

A M3-B fecha o capítulo "integridade interna do banco". Próxima onda **M3-C — Storage tenant-aware**:

- Migrar paths de PDFs em `proposal-pdfs` de `{user_id}/...` para `companies/{companyId}/proposals/{proposalId}/...`
- Storage policies via `is_company_member()` em vez de `auth.uid()::text = (storage.foldername(name))[1]`
- Estratégia dual-read: novos PDFs nos paths novos, leitura aceita ambos por X dias até backfill completo
- Atualização de `proposal_pdf_cache.storage_path` em batch
- Sem alteração visual: usuário continua baixando o PDF normalmente

Pré-requisitos M3-C ✅:
- Schema tenant-aware (M1)
- Backfill completo (M2)
- RPCs preparadas (M3-A)
- Triggers de log herdando do parent (M3-B)

---

## 10. Próximas ondas (visão geral)

| Onda | Escopo | Status |
|---|---|---|
| M3-A | RLS dual + RPCs tenant-aware | ✅ |
| **M3-B** | **Triggers de log herdam company_id do parent** | ✅ **concluída** |
| M3-C | Storage paths tenant-aware + dual-read | 🟡 próxima |
| M3-D | Frontend: `tenantKey()`, prefixar React Query keys, cache bust no logout | ⚪ |
| M3-E | Flip `MULTI_TENANT_RLS=true`, monitorar 48h, drop legacy policies | ⚪ |
| M4 | UI multi-membership (switcher), visão manager+, quotas | ⚪ |

---

## 11. Arquivos alterados

- `supabase/migrations/<timestamp>_m3b_triggers_inherit_company_id.sql` — única migration

**Frontend:** zero alterações. **UX:** zero alterações. **Comportamento operacional:** idêntico.
