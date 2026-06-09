---
name: LGPD Hardening Wave 1
description: PII masking em AI edges (sales-script/trigger-script/phase-action/sales-copilot/generate-proposal/sales-response/module-copilot/investment-storytelling) via maskClientName + consent gate em analyticsTracker via lib/consent
type: feature
---
# LGPD Hardening — Wave 1 (PII + Consent)

## Fonte canônica
- `scripts/_shared-edges/piiMask.ts` — `maskPII`, `maskClientName`, `GLOBAL_PII_RULE`. Sincronizada via `scripts/sync-shared-edges.sh` para todos `supabase/functions/*/_lib/`.
- `src/lib/consent.ts` — store de consentimento (`granted|denied|unknown`, localStorage `lgpd.consent.v1`, pub/sub).
- `src/components/consent/ConsentBanner.tsx` — banner discreto, mostra apenas quando `unknown`, montado em `App.tsx`.

## Regras
- **Proibido** interpolar `clientName`/`email`/`cpf`/`telefone` LITERAL em prompts de IA. Use `maskClientName()` ou token `[CLIENTE]`.
- **Proibido** chamar `trackEvent` sem checar `isAnalyticsAllowed()` — o gate já está no próprio `trackEvent`; novos call sites herdam.
- Novas edges que enviarem texto livre ao gateway DEVEM importar de `./_lib/piiMask.ts` e mascarar antes de injetar no prompt.
- Schemas zod continuam aceitando `clientName` (UX legítima do produto); masking acontece no `buildUserPrompt`.

## Ainda não implementado (Wave 2+)
Phase 3 (export/purge LGPD art.18), Phase 4 (PDF watermark + retention cron), Phase 5 (sanitize logs + Sentry beforeSend com maskPII), Phase 6 (políticas públicas + subprocessor inventory), Phase 7 (MFA/SSO/SIEM/pentest). Roadmap em `.lovable/audit/lgpd-privacy-hardening-wave1.md`.

## Não fazer
- Não reintroduzir nome literal em prompts (mesmo "primeiro nome").
- Não bypassar o consent gate adicionando inserts diretos em `analytics_events` no client.
- Não criar banner pesado estilo GDPR cookie wall — produto é auth-gated.
