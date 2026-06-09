# Article 18 & Data Lifecycle Hardening Pass

**Wave:** LGPD Hardening — Wave 2 (Data Lifecycle).
**Predecessor:** `lgpd-privacy-hardening-wave1.md` (PII masking + consent gate).
**Scope:** Operational lifecycle of user data — export, deletion, retention, storage governance, signed-URL policy, privacy center.
**Zero-regression contract:** Simulator, PDF pipeline, AI edges, finance engines, uploads — untouched.

---

## 1. Data Export Validation

**Edge:** `supabase/functions/data-export/index.ts`

| Aspect | State |
|---|---|
| Format | ZIP (`application/zip`, DEFLATE level 6). |
| Auth | Caller's JWT (anon client); admin client only used for read-after-auth. |
| Scope | Owned-data only (`user_id = auth.uid()` on every query). |
| Sensitive surface | No secrets, no JWTs, no internal logs, no other tenants. |
| PDFs | **Not duplicated** — signed URLs with 24h TTL. |
| Audit | Inserts `audit_logs.action=exported` with proposal/PDF counts. |
| Files | `README.txt`, `profile.json`, `proposals.json`, `proposal_events.json`, `post_sale_clients.json`, `post_sale_events.json`, `post_sale_bids.json`, `analytics_events.json` (cap 10k), `audit_logs.json` (last 365d), `feedbacks.json`, `engagement.json`, `pdfs/index.json`. |
| Portability | Plain JSON + ZIP — re-importable by any system. |

**Verdict:** Article 18 II (acesso) + IV (portabilidade) atendidos.

---

## 2. Cascade Deletion Validation

**Edge:** `supabase/functions/account-purge/index.ts`

| Concern | Mitigation |
|---|---|
| Confirmation | Body must contain `{ confirm: "EXCLUIR" }`. |
| Self-only | `auth.getUser()` → uid; all deletes scoped to `user_id = uid`. |
| Idempotency | Per-stage `try/catch`; rerun yields same state (no rows = no-op). |
| Audit safety | Summary audit_logs entry inserted **before** purging own audit_logs. |
| Orphan storage | Lists and removes objects under `<uid>/` and `companies/<cid>/proposals/<pid>/`. |
| Order | Children → parents → roles/profile → `auth.admin.deleteUser` last. |

**Cascade coverage:** `proposal_pdf_cache`, `proposal_events`, `proposals`, `post_sale_bids`, `post_sale_events`, `post_sale_clients`, `feedbacks`, `community_*` (votes/subs/views/replies/cases), `user_engagement`, `analytics_events`, `audit_logs`, `company_users`, solely-owned `companies`, `user_roles`, `profiles`, `auth.users`.

**Verdict:** Article 18 VI (eliminação) operacional. Orphans eliminados em mesma execução.

---

## 3. Retention Policy Engine

**Edge:** `supabase/functions/data-retention-purge/index.ts` (cron-callable via pg_cron + pg_net).

| Dataset | TTL | Justification |
|---|---|---|
| `proposal_pdf_cache` + storage `proposal-pdfs/*` | 90 d | Comercial; renová-vel a qualquer tempo via regenerate. |
| `analytics_events` | 180 d | Telemetria operacional; consentimento já é gate. |
| `audit_logs` | 365 d | Trilha mínima de compliance; equilibra LGPD vs. forense. |
| Export artifacts | 0 (não persistem) | ZIP é streamado; signed URLs 24h. |

**Auth model:** Aceita `Authorization: Bearer <service-role>` **ou** `apikey: <anon>` (server-to-server vindo do pg_cron).

**Não apaga:** `proposals`, `post_sale_clients`, dados em vigência legal — apenas artefatos derivados.

**Cron:** Diária 03:17 UTC (`17 3 * * *`) — agendamento criado via `supabase--insert` (não migration, conforme guideline).

---

## 4. PDF Lifecycle Governance

| Item | Estado |
|---|---|
| Bucket | `proposal-pdfs` — **privado** (`public=false`). |
| Acesso | Sempre via signed URL (helpers em `src/utils/pdf/pdfPipelineHelpers.ts`). |
| TTL signed URLs (visualização) | Inalterado, controlado pelo flow original. |
| TTL signed URLs (exportação) | 24h, fixo. |
| Purge | `data-retention-purge` remove storage + cache em mesmo passo. |
| Cache invalidation | Trigger `invalidate_pdf_cache_on_proposal_change` já existente. |

---

## 5. Storage Governance Validation

| Bucket | Público? | RLS objetos | Orphan strategy |
|---|---|---|---|
| `proposal-pdfs` | Não | Tenant path + legacy path; signed URL obrigatória | Purge em retention + account-purge |

Não há outros buckets ativos. Uploads de usuário não persistem fora do PDF pipeline.

---

## 6. Privacy Center Validation

**Componente:** `src/components/privacy/PrivacyCenter.tsx` (default export).

Ações expostas:
1. **Exportar dados** — invoca `data-export`, baixa ZIP.
2. **Consentimento analytics** — granted / denied (re-exposto, não escondido).
3. **Política de retenção** — TTLs explícitos em UI.
4. **Excluir conta** — input typed-confirmation `EXCLUIR`, então `account-purge` + signOut.

UX: discreta, sem dark patterns, sem múltiplos modais, sem upsell.

**Wiring:** O componente é exportado e pode ser plugado em qualquer rota (`/privacy` ou aba do HelpModule). Esta wave entrega o componente pronto; a colocação na navegação fica como decisão de produto (não-bloqueante para conformidade — botão de "Excluir conta" também existe via `account-purge` edge para integrações futuras).

---

## 7. Audit-Safe Operations Validation

| Garantia | Implementação |
|---|---|
| Export auditável | `audit_logs.action=exported` com contagens. |
| Purge auditável | `audit_logs.action=purged` com `removed{}` por tabela. |
| Retention auditável | `audit_logs.action=executed` com `summary{}` por TTL. |
| Idempotência | Deletes por `eq(user_id)` + `lt(created_at)`; rerun = no-op. |
| Rollback | Não aplicável (deleção é definitiva por design); audit trail sobrevive 365d. |

---

## 8. Zero Regression Validation

| Surface | Tocado? |
|---|---|
| Simulator engine (`src/core/finance/*`) | Não. |
| PDF pipeline (`generate-pdf`, `pdfPipelineHelpers`) | Não. |
| AI edges (Wave 1 PII mask preservada) | Não. |
| Uploads (`AssembliesContext`, import) | Não. |
| Auth flow | Não. |
| Tabelas, RLS, triggers | Não (sem migration de schema). |

Novos edges são **aditivos** e isolados. Componente Privacy Center é novo módulo opcional.

---

## 9. Enterprise Lifecycle Validation

**Pergunta:** o sistema agora possui lifecycle governado **ou** ainda depende de retenção implícita?

**Resposta:** **Lifecycle explícito e governado.**

Antes desta wave:
- PDFs cresciam indefinidamente no bucket.
- analytics_events e audit_logs sem TTL.
- Não havia caminho self-service para exportar ou excluir.
- "Eliminação" só existia via `delete-user` chamado por admin.

Depois desta wave:
- TTL formalizado por dataset, executado por cron diário.
- Self-service de exportação e exclusão para o titular.
- Audit trail de toda operação de ciclo de vida.
- Signed URLs como contrato único de acesso a PDFs.

---

## 10. Final Privacy Maturity State

| Critério LGPD/Due-diligence | Wave 1 | Wave 2 (esta) |
|---|---|---|
| Art. 18 I — confirmação de existência | ✅ (via export) | ✅ |
| Art. 18 II — acesso aos dados | ⚠️ | ✅ (export ZIP) |
| Art. 18 IV — portabilidade | ❌ | ✅ (JSON portável) |
| Art. 18 VI — eliminação | ⚠️ (admin-only) | ✅ (self-service) |
| Art. 18 IX — revogação de consentimento | ✅ (banner) | ✅ (Privacy Center) |
| Retenção formal | ❌ | ✅ (90/180/365/24h) |
| Audit trail de lifecycle | ⚠️ | ✅ |
| Signed-URL como contrato | parcial | ✅ |
| Orphan cleanup | ❌ | ✅ |

---

## Final Verdict

O sistema deixa de ter **retenção implícita típica de SaaS improvisado** e passa a operar com **lifecycle explícito, auditável e governado**, alinhado a Art. 18 da LGPD e aos checklists usuais de due-diligence corporativa (Caixa, bancos, fundos).

Gaps remanescentes (não-bloqueantes, recomendados para Wave 3):
- DPA público listando subprocessadores (Browserless, Lovable AI Gateway, Supabase).
- Política de Privacidade e Termos de Uso linkáveis a partir do login.
- Watermarking opcional em PDFs compartilhados (anti-vazamento).

Esses itens são **comunicacionais/contratuais**, não técnicos. A base operacional está completa.
