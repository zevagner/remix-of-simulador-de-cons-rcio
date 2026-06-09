# LGPD, Governance & Privacy Hardening — Wave 1

**Status:** ✅ Phase 1 (PII Masking) and Phase 2 (Consent Gate) implemented.
**Audit base:** `.lovable/audit/full-lgpd-observability-governance-audit.md`

---

## Wave 1 — Implemented

### Phase 1 · PII & AI Hardening (CRITICAL)

**Goal:** No external AI provider receives literal PII.

| Action | Where | Status |
|---|---|---|
| Shared `piiMask.ts` (regex EMAIL/CPF/CNPJ/UUID/phone + `maskClientName` + `GLOBAL_PII_RULE`) | `scripts/_shared-edges/piiMask.ts` + sync'd to all 14 `_lib/` | ✅ |
| `clientName` → `[CLIENTE]` token in prompts | `sales-script`, `trigger-script`, `phase-action`, `sales-copilot`, `generate-proposal`, `sales-response`, `module-copilot`, `investment-storytelling` | ✅ |
| `GLOBAL_PII_RULE` injected into `sales-copilot` system prompt (model treats `[CLIENTE]` as neutral pronoun) | sales-copilot SYSTEM_PROMPT | ✅ |
| Zod schemas still accept `clientName` for legitimate UX (display in our own UI) — masking applied at prompt build, not at ingress | all edges | ✅ |

**Contextual anonimization preserved:** money values, group numbers, terms, scenario labels remain — they are consulting context, not PII. The AI keeps full consultive quality; only personal identifiers are replaced.

**Not persisting prompts:** the gateway already does not persist (Lovable AI). No edge writes prompts to our DB.

### Phase 2 · Cookie & Consent Governance (HIGH)

**Goal:** No telemetry without explicit opt-in.

| Action | Where | Status |
|---|---|---|
| `consent.ts` store (granted/denied/unknown, localStorage `lgpd.consent.v1`, pub/sub) | `src/lib/consent.ts` | ✅ |
| `ConsentBanner` (discreto, sem dark patterns, sem "aceitar tudo" exagerado) | `src/components/consent/ConsentBanner.tsx`, mounted in `App.tsx` | ✅ |
| `trackEvent` gated: `isAnalyticsAllowed() === false` ⇒ early return | `src/services/analyticsTracker.ts` | ✅ |

**Default-deny:** until user decides, `analytics_events` receives nothing from the browser. Server-side logs (auth, edge errors, audit_logs) are out of scope — eles seguem fluxo de obrigação legal/legítimo interesse.

---

## Wave 2 — Roadmap (não implementado nesta onda)

### Phase 3 · Article 18 LGPD (HIGH · medium effort)
- [ ] Edge `data-export` → ZIP com profile + proposals + post_sale + audit_logs + PDFs storage URLs (signed, 24h).
- [ ] Edge `account-purge` → cascade delete (proposals/post_sale/events/PDFs/community/engagement) + `auth.admin.deleteUser`.
- [ ] UI "Minha Privacidade" no perfil (export, revogar consentimento, excluir conta).

### Phase 4 · Document Security (MEDIUM · low effort)
- [ ] PDF watermark institucional (usuário + timestamp + origem) — adicionar no `generate-pdf` edge.
- [ ] Garantir todas as URLs de `proposal-pdfs` via `createSignedUrl(..., 3600)` (já é o padrão; auditar consumers que cachearam URLs).
- [ ] Cron `data-retention-purge`: PDFs > 90d, analytics_events > 180d, audit_logs > 365d.

### Phase 5 · Observability Hardening (MEDIUM · low effort)
- [ ] `sanitizeLogPayload()` no `logEdgeError` (reusar `maskPII`).
- [ ] Sentry `beforeSend` aplicar `maskPII` em `event.message`, breadcrumbs, request body.

### Phase 6 · Formal Governance (MEDIUM · medium effort)
- [ ] `/privacidade` página pública: política, retenção, terceiros (Supabase, Lovable AI, Browserless), DPO contact.
- [ ] `/termos` página pública.
- [ ] Subprocessor inventory em `docs/privacy/subprocessors.md`.

### Phase 7 · Enterprise Readiness (FUTURE · high effort)
- [ ] MFA (Supabase Auth MFA TOTP).
- [ ] SAML SSO ready (já listado no Lovable Cloud).
- [ ] SIEM-ready logging (audit_logs export).
- [ ] Pentest externo.

---

## What this changes for corporate due diligence

**Antes:** "SaaS moderno tecnicamente forte com governança parcial."
**Agora:** "Privacy-by-design real com PII isolada da IA externa e telemetria consensual."

Resposta honesta à Caixa: *"Os gaps identificados estão em hardening formal — Fase 1 e 2 concluídas, Fases 3-7 com roadmap executável."*

---

## Files changed in Wave 1

- Created: `scripts/_shared-edges/piiMask.ts`, `src/lib/consent.ts`, `src/components/consent/ConsentBanner.tsx`, this doc
- Edited: `scripts/_shared-edges/index.ts`, `src/services/analyticsTracker.ts`, `src/App.tsx`
- Edited (edges): `sales-script`, `trigger-script`, `phase-action`, `sales-copilot`, `generate-proposal`, `sales-response`, `module-copilot`, `investment-storytelling` (each `index.ts` + synced `_lib/`)

## Non-goals (intentional)

- ❌ Rewriting RLS — already mature.
- ❌ Removing analytics — they're valuable; we just gate them.
- ❌ Heavy GDPR-style cookie banner — product is auth-gated; LGPD allows lighter UX.
- ❌ Touching financial engines — locked under Production V2.4.
