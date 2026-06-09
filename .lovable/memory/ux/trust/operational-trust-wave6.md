---
name: Operational Trust Wave 6
description: Camada calma de microconfirmações (trustFeedback) + Toaster institucional bottom-right cap=3 dur=3.2s; helpers notifySaved/notifyCopied/notifyError({retry})/withTrustFeedback (loader só >600ms); copyToClipboard agora retorna boolean
type: design
---
Onda 6 — Operational Trust & Confidence Polish:

- Toaster institucional em `src/components/ui/sonner.tsx`: position=bottom-right, duration=3200, visibleToasts=3, expand=false, gap=8 (não conflita com MobileStickyCTA).
- Camada `src/utils/trustFeedback.ts` (opt-in, sem refactor obrigatório):
  - `notifySaved(label?)` — 2.2s, id estável `saved:*` (dedup)
  - `notifyCopied(label?)` — 1.6s, id `copied:*`
  - `notifyError(msg, { retry })` — tom recuperável, action button inline "Tentar de novo", sem modal
  - `notifyProcessing(msg)` — loading explícito
  - `withTrustFeedback(promise, opts)` — só mostra loader se ação durar >600ms (delayMs configurável); resolve com mesmo id (atualiza in-place, não empilha)
- `src/utils/clipboard.ts` agora retorna `Promise<boolean>` + fallback robusto p/ ambientes corporativos sem Clipboard API. Backward compatible (callers existentes ignoram retorno).

Política: novos call-sites e refactors usam trustFeedback; legado segue funcional sob Toaster novo. Proibido modais/banners/overlays para confirmação. Mensagens de erro sempre tom recuperável + retry quando aplicável.

Auditoria: `.lovable/audit/ux-wave-6-operational-trust-confidence-polish.md`.
