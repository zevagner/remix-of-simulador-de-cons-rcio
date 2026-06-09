---
name: Lifecycle Hardening Wave 2
description: LGPD Art. 18 lifecycle — data-export ZIP, account-purge cascade, retention cron (PDF 90d / analytics 180d / audit 365d), Privacy Center component; signed URLs 24h; storage purge incluído no account-purge e retention.
type: feature
---

## Regras

- **Export edge:** `data-export` retorna ZIP; PDFs NUNCA duplicados, sempre signed URL 24h; audit_logs registra `action=exported`.
- **Purge edge:** `account-purge` exige `{ confirm: "EXCLUIR" }`; cascade ordenada (children → parents → auth.users last); insere audit summary ANTES de apagar audit_logs do próprio user; remove objetos storage em `<uid>/*` e `companies/<cid>/proposals/<pid>/*`.
- **Retention engine:** `data-retention-purge` aceita service-role bearer OU anon apikey (cron); TTL: pdfs 90d, analytics_events 180d, audit_logs 365d. Cron diário 03:17 UTC via pg_cron+pg_net (criado por `supabase--insert`, não migration).
- **Signed URL TTL:** 24h para exportação. Visualização normal mantém contrato existente em `pdfPipelineHelpers`.
- **Privacy Center:** `src/components/privacy/PrivacyCenter.tsx` — export, consent toggle, retention summary, typed-confirm delete. Sem dark patterns.
- **Zero regression:** proibido tocar simulator/PDF pipeline/AI edges/uploads/auth/RLS nesta wave.
- **Audit doc:** `.lovable/audit/article18-data-lifecycle-hardening-pass.md`.
