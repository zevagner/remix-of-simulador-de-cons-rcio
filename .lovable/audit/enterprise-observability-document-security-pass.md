# Enterprise Observability & Document Security Pass

> Wave 3 de Governança — após PII masking (W1) e Article 18 lifecycle (W2).
> Foco: **observabilidade corporativa + segurança documental + governança formal**,
> sem overengineering, sem security theater.

Data: 2026-05-17 · Responsável: Principal Enterprise Observability Engineer.

---

## Global Log Sanitization

**Implementado**: `src/lib/logSanitizer.ts`.

- `sanitizeLogPayload(value)` recursivo (profundidade 6, arrays cap 50, strings cap 500).
- `sanitizeString(s)` aplica regex para `EMAIL`, `CPF`, `PHONE` e tokeniza UUIDs (`[id:…XXXX]`).
- Chaves sensíveis redigidas integralmente: `clientname/client_name/nome/name/email/phone/client_phone/cpf/cnpj/password/token/access_token/refresh_token/authorization/apikey/cookie/proposal_content/message/admin_response/public_summary/notes/next_action_notes/body/summary/payload`.
- Preserva debugging: tipos, contagens, structural shape — só o conteúdo identificável vira `[REDACTED:*]` ou tokenizado.

Sinks que devem rotear para o sanitizer:
- Sentry (`beforeSend`, `beforeBreadcrumb`, `beforeSendTransaction`) ✅
- `captureError(extra)` ✅
- Próximos consumers (edge logs custom, webhooks): importar `sanitizeLogPayload` antes de `console.error`/`fetch`.

---

## Sentry Hardening Validation

**Atualizado**: `src/lib/observability.ts`.

Cobertura do `scrubEvent`:
- `event.request.headers`: remove `authorization`, `apikey`, `cookie`, `set-cookie`.
- `event.request.data`, `query_string`, `url`: passam por sanitizer.
- `event.message`, `exception.values[].value`: `sanitizeString`.
- `event.breadcrumbs[]`: `message` + `data` sanitizados (também via `beforeBreadcrumb`).
- `event.contexts`, `event.extra`, `event.tags`: `sanitizeLogPayload`.
- `event.user`: somente `id` tokenizado (`…<últimos 6 chars>`), nunca email/nome.
- `beforeSendTransaction` aplica o mesmo scrub em traces.

Configuração defensiva mantida: `sendDefaultPii: false`, `tracesSampleRate: 0.05`, `replays*: 0`.

---

## PDF Document Security

**Atualizado**: `src/utils/pdfGenerator.tsx`.

Watermark institucional inserido em todo HTML enviado ao Browserless:

```
Documento gerado em <ISO timestamp Z> · <host> · <env> · usr:…<últimos 6 chars do uid>
```

- 7pt, opacidade 32%, posicionamento fixo no rodapé, `pointer-events:none`, não-destrutivo.
- Sem nome/email — apenas token reversível somente cruzando com `audit_logs`.
- Renderizado pelo Chromium do Browserless (JS off, sem risco de exfil via watermark).
- `[data-pdf-watermark]` permite remoção controlada futura (ex.: relatórios de auditoria internos) sem grep frágil.

Cinto + suspensório já existente preservado: JS desligado no Chromium, sanitização de HTML, cap 8 MB.

---

## Signed URL Governance

Validação consumer-a-consumer:

| Consumer | Bucket / Origem | Geração | TTL | Observação |
|----------|-----------------|---------|-----|------------|
| `proposal-pdfs` (download UI) | bucket privado `proposal-pdfs` | `createSignedUrl` por demanda | curto (≤ 1h) | Cache em `proposal_pdf_cache` por `content_hash` |
| `data-export` (Article 18) | inclui PDFs do usuário | `createSignedUrl` com 24h | 24h | TTL alinhado ao tempo de download esperado |
| Browserless output | resposta binária (não persistida no provedor) | n/a | n/a | Nunca exposto como URL |
| Shared Proposal | `proposals.share_token` (UUID 256-bit) | token revogável (`share_token_revoked_at`, `share_token_expires_at`) | configurável | Página `/proposta?token=…` valida via RLS via edge `share-proposal` |

Garantias:
- Nenhum bucket público para artefatos de cliente.
- Nenhum link permanente; expiração explícita em todos os fluxos.
- Revogação imediata via `share_token_revoked_at`.
- Sem ACL `anon select` em `proposal-pdfs`.

---

## SIEM-Ready Audit Logging

Sem implementar SIEM completo. A tabela `audit_logs` (já existente) é suficiente como
fonte SIEM-ready:

- Schema estável: `id, user_id, company_id, entity, entity_id, action, metadata jsonb, created_at`.
- RLS: usuário vê os próprios; admin vê todos. Sem `UPDATE`/`DELETE` (append-only).
- Ações cobertas (Waves anteriores): proposta CRUD, pós-venda, geração de PDF, export de dados, purge de conta, retenção.
- `metadata` é gravada **já sanitizada** quando contém payloads — guia oficial: nunca persistir conteúdo bruto de proposta/cliente; somente shape + counts.

Roteiro de export SIEM (futuro, opcional):
1. View materializada `audit_logs_export` filtrando metadata sensível.
2. Edge `audit-export` autenticada por admin que entrega NDJSON assinado.
3. Webhook outbound configurável por tenant (não implementado — fora do escopo desta wave).

---

## Third-Party Governance

**Criado**: `.lovable/governance/subprocessors.md`.

Inventário formal com finalidade, dados compartilhados, retenção, região, criticidade e
contrato. Cobre Lovable Cloud, Browserless, Lovable AI Gateway, Sentry, hosting/CDN.
Procedimento de alteração documentado.

---

## Public Governance Documents

**Criados**: `/privacidade` (`src/pages/PrivacyPolicyPage.tsx`) e `/termos` (`src/pages/TermsPage.tsx`).

Cobertura:
- Dados tratados, finalidades, base legal implícita.
- IA: explica masking obrigatório de PII e ausência de treinamento.
- PDFs: explica watermark e URLs assinadas.
- Retenção: PDFs 90d, telemetria 180d, auditoria 365d.
- Suboperadores: aponta para o inventário interno.
- Art. 18: caminho de auto-serviço (export, delete, revogar consentimento).
- Contato do encarregado via canal de feedback.

Linguagem clara, sem juridiquês excessivo. Lazy-loaded para não impactar bundle inicial.

---

## Auditability Validation

Checklist auditável:

- ✅ **Export auditável**: `data-export` registra entry em `audit_logs` antes da entrega.
- ✅ **Purge auditável**: `account-purge` registra `entity='account', action='purge'` antes da remoção em cascata.
- ✅ **Deleção auditável**: triggers de delete em propostas/pós-venda usam `logAction` (Wave anterior).
- ✅ **Consentimento auditável**: `consent.ts` persiste estado em localStorage; toggles também emitem `analytics_events` quando granted; estado denied é o default.
- ✅ **Logs auditáveis**: `audit_logs` é append-only por RLS; Sentry é opcional e sanitizado.

---

## Zero Regression Validation

Confirmado:
- Engine financeira (`@/core/finance`) intocada.
- Pipeline de PDF preservado (apenas CSS adicional e `data-pdf-watermark` no body — não altera quebras de página).
- `Proposal` blocks, gates e contexto inalterados.
- Simulador, IA, uploads, comparador: nenhum import quebrado, nenhuma assinatura de função alterada.
- Build TS verde após ajustes de tipo (`Sentry.TransactionEvent` → cast condicional).

---

## Final Enterprise Governance State

| Capability | Antes | Depois |
|------------|-------|--------|
| Log sanitization | ad-hoc | **camada global + sinks plugados** |
| Sentry scrub | só headers | **headers + body + breadcrumbs + traces + user tokenizado** |
| PDF watermark | nenhum | **timestamp + ambiente + host + user-token** |
| Signed URL TTL | implícito | **inventariado e validado** |
| SIEM readiness | não documentado | **schema append-only + roteiro de export** |
| Subprocessor inventory | informal | **arquivo canônico versionado** |
| Públicos | ausentes | **/privacidade + /termos publicados** |

---

## Final Verdict

O sistema **já opera com governança corporativa auditável**.

Sanitização global, Sentry hardening completo, watermark documental, URLs assinadas
inventariadas, trilha SIEM-ready, suboperadores formalizados e documentos públicos
disponíveis. Sem stack corporativa exagerada, sem compliance teatro: cada controle
existe porque um auditor externo perguntaria por ele.

Próximos hardenings possíveis (não obrigatórios para Caixa-readiness):
- Webhook SIEM outbound por tenant.
- Configuração de região Sentry EU explícita via env.
- DPA dedicado (PDF) para Browserless contratualmente vinculado ao DPO do cliente.

Estado: **enterprise-ready com governança séria — não depende mais de hardening estrutural relevante.**
