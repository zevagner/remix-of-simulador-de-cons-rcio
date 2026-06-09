# Operational Stability & Failure Recovery Pass

**Data:** 2026-05-17
**Escopo:** comportamento da plataforma sob falha real (timeout, retry, indisponibilidade parcial, concorrência, cache).
**Regra de ouro:** zero regressão em simulador, engine financeira, Proposta, PDF, IA, UX comercial.

---

## 1. Browserless Failure Resilience

**Estado atual (verificado em `supabase/functions/generate-pdf/index.ts` + `src/utils/pdfGenerator.tsx` + `src/utils/pdf/pdfPipelineHelpers.ts`):**

| Vetor | Mitigação atual | Status |
|---|---|---|
| Timeout Browserless | `AbortController` 45s + `gotoOptions.timeout=25s` | ✅ |
| Retry exponencial | 2 tentativas por endpoint × 2 endpoints (SFO→LON) | ✅ |
| Fallback regional | `BROWSERLESS_ENDPOINTS = [sfo, lon]`, header `X-Pdf-Source` indica origem | ✅ |
| XSS server-side | `setJavaScriptEnabled: false` + `sanitizeHtml()` (script/on*/javascript:) | ✅ |
| Payload abusivo | `MAX_HTML_BYTES = 8MB` → 413 | ✅ |
| Rate limit | 30 PDFs/usuário/hora via `analytics_events`; falha-aberta se contador quebra (auditado e aceito) | ✅ |
| Geração duplicada | `withProposalMutex(proposalId)` em `pdfPipelineHelpers.ts` — concorrência intra-aba bloqueada | ✅ |
| Cache stale | Trigger `invalidate_pdf_cache_on_proposal_change` em `UPDATE proposals` (credit/term/installment/total/bid/content) | ✅ |
| Generation deadlock | Mutex limpa no `finally`; cliente tem timeout duro do fetch | ✅ |
| Dual-read pós-migração | `dualReadCandidates()`: registered → tenant → legacy | ✅ |

**Risco residual:**
- Mutex é **in-memory por aba** — duas abas ou dois dispositivos do mesmo usuário podem gerar concorrentemente. Mitigação suficiente: rate-limit hourly + cache idempotente por `proposal_id`. Não escalar para Redis (overengineering).
- Falha do contador de rate-limit é fail-open. Aceitável: é proteção de custo, não de segurança.

**Verdict:** ✅ resiliente.

---

## 2. Edge Function Failure Validation

**Auditado:** todas as 17 edges (generate-pdf, generate-proposal, sales-copilot, sales-response, sales-script, investment-storytelling, niche-storytelling, module-copilot, phase-action, trigger-script, bid-recommendation, share-proposal, data-export, account-purge, data-retention-purge, create/delete/update-user).

| Categoria | Padrão verificado |
|---|---|
| Timeout | edges IA usam `callAI` shared (timeout do gateway); generate-pdf usa AbortController 45s |
| Rate limit | `getRateLimitKey(req)` por user_id (fallback IP) em todas as edges IA |
| Idempotência | `account-purge` exige confirmação `"EXCLUIR"`; `data-export` é leitura; `data-retention-purge` usa TTL absoluto (re-run inofensivo) |
| Side-effects duplicados | `analytics_events` é append-only; `audit_logs` idem; PDFs idempotentes por `proposal_id` |
| Network instability | Streaming `sales-copilot` usa SSE pass-through (cliente reconecta) |
| Retry storms | Rate-limit per-user (10–20 req/min) + cliente sem loop infinito (toast + retry manual via `notifyError({retry})`) |
| CORS errors | retornados com `cors` headers — não travam o cliente |

**Risco residual:**
- `data-retention-purge` agendado por `pg_cron` — se falhar silenciosamente, retenção é violada. **Recomendação leve:** adicionar `audit_logs` entry de "retention-run-completed" diário e alerta se ausente >48h. Não bloqueante.

**Verdict:** ✅ resiliente; observabilidade do cron é o único gap operacional menor.

---

## 3. Supabase Resilience Validation

| Cenário | Comportamento |
|---|---|
| Transient 5xx | React Query (staleTime escalonado, retry default 3×) absorve |
| Degraded latency | Web Vitals + `PerfProfiler` capturam; sem timeout duro frontend (UX mostra skeleton) |
| Storage failure | `proposal-pdfs` privado; cliente recai em `dualReadCandidates` e, na ausência, regera |
| Signed URL expirada | TTL 24h em `data-export`; cliente sempre gera nova ao abrir, nunca persiste URL |
| Auth interrompida | `ErrorBoundary` + `useAuth` redireciona ao `/login`; 401 nas edges retorna mensagem clara |
| RLS edge cases | `has_role` / `is_company_member` / `current_company_id` — todas `STABLE SECURITY DEFINER` com `search_path` fixo |
| Query 1000-row limit | Documentado em memória; usamos `list_*_page` RPCs paginadas |

**Verdict:** ✅ previsível sob degradação.

---

## 4. AI Failure Handling

**Padrão único em todas as edges IA (`scripts/_shared-edges/aiCall.ts`):**

- `AIError` tipada com `code: rate_limit | no_credits | unknown`.
- Cliente mapeia para mensagens humanas (não vaza stack).
- `SAFE_FALLBACK` retornado em output vazio/malformado.
- `isPromiseSafe()` rejeita texto com promessa de garantia → fallback automático.
- `trustFeedback.notifyError({retry})` no client: toast recuperável, sem modal, sem spinner infinito.
- Streaming (sales-copilot) tem fallback graceful: se SSE quebra, usuário vê mensagem parcial + botão retry.

**Sem retry loops** — uma chamada falhou = um toast + decisão do usuário. Sem auto-retry agressivo (evita custo + storms).

**Verdict:** ✅ UX degradada elegante.

---

## 5. Cache Consistency Validation

| Cache | Invalidação | Status |
|---|---|---|
| `proposal_pdf_cache` (DB) | Trigger `invalidate_pdf_cache_on_proposal_change` em UPDATE de campos relevantes | ✅ |
| Storage `proposal-pdfs/*` | Sobrescrito por path determinístico; sem versionamento (idempotente) | ✅ |
| `aiResponseCache` | `cacheKey(scope, payload, tenantId)` com `companyId` → zero cross-tenant drift | ✅ |
| React Query | staleTime escalonado (curto p/ lista, longo p/ governance) | ✅ |
| LocalStorage simulador | Reset em mudança de tipo (SelectedGroupContext) | ✅ |

**Race conditions:** mutex client-side + idempotência server-side cobre o caso comum. Sem lock distribuído (não justificado pelo volume).

**Verdict:** ✅ consistente; zero corrupção silenciosa identificada.

---

## 6. Concurrency & Duplication Safety

| Operação | Defesa |
|---|---|
| Geração simultânea de PDF (mesma aba) | `withProposalMutex` |
| Geração simultânea (abas diferentes) | Cache idempotente por `proposal_id` + rate-limit 30/h |
| Double-click export | `withTrustFeedback` resolve com mesmo `toast id` (dedup visual) + edge idempotente |
| Multiple uploads (logo/xlsx) | `uploadGuard` valida magic bytes; upload é PUT (sobrescreve, não duplica) |
| Retry overlap IA | Rate-limit per-user impede storm; sem auto-retry no client |
| Duplicate Proposal | Insert protegido por `validate_proposal_business_rules` + UI bloqueia botão durante save |
| Duplicate PDF cache | `proposal_pdf_cache` PK = `proposal_id` (upsert) |

**Verdict:** ✅ safe.

---

## 7. Degraded-Mode UX Validation

- **ErrorBoundary global** (`src/components/ErrorBoundary.tsx`): captura crash, mostra "Tentar novamente" + "Recarregar", envia para Sentry sanitizado.
- **Toaster institucional** (`sonner` bottom-right, cap=3, 3.2s): mensagens calmas, sem alarmismo.
- **`notifyError({retry})`**: ação inline, sem modal.
- **Skeletons** em vez de spinners infinitos nas listagens paginadas.
- **OfflinePage** (`src/pages/OfflinePage.tsx`): PWA cobre cenário sem rede.
- **Sem alertas modais bloqueantes** em falhas operacionais.

**Verdict:** ✅ profissional, silencioso, resiliente.

---

## 8. Operational Telemetry Validation

| Sinal | Fonte | PII? |
|---|---|---|
| Web Vitals (FCP/LCP/CLS/INP/TTFB) | `initWebVitals()` → Sentry breadcrumbs | ❌ sanitizado |
| Render hotspots | `<PerfProfiler>` opt-in | ❌ |
| Edge errors | `logEdgeError(FN, e, ctx)` + `logSanitizer` no Sentry `beforeSend`/`beforeBreadcrumb` | ❌ |
| AI calls | `analytics_events { event_name:'ai_call', module }` | ❌ user_id apenas |
| PDF rate-limit hits | `pdf_generation_blocked` event | ❌ |
| Audit trail | `audit_logs` append-only (export/purge/retention) | ❌ payloads mascarados |
| Browserless source | header `X-Pdf-Source: primary|fallback` | ❌ |

**Verdict:** ✅ debug sem PII; auditabilidade preservada.

---

## 9. Zero Regression Validation

- ✅ Simulador (`src/core/finance/*`) — não tocado.
- ✅ Engine financeira (Price/SAC/CET/installments) — golden snapshot ativo.
- ✅ Proposta (PDF blocks + façade `useProposalData()`) — não tocado.
- ✅ IA — apenas leitura de comportamento, sem alteração de prompts/CSAA.
- ✅ UX comercial — sem mudanças de copy ou hierarquia.

Esta pass é **apenas auditoria**; nenhum arquivo de produto foi modificado.

---

## 10. Remaining Operational Risks

**Baixa prioridade (não bloqueantes):**

1. **Cron heartbeat:** `data-retention-purge` não tem monitor de execução. Risco: silent skip. Mitigação sugerida (não nesta pass): inserir `audit_logs { action:'retention_run' }` no fim de cada execução; dashboard admin alerta se gap >48h.
2. **Mutex multi-aba:** geração concorrente cross-tab cai no rate-limit (não corrompe, apenas custa 1 extra). Aceitável.
3. **Rate-limit count fail-open:** se `analytics_events` indisponível por minutos, contador zera. Aceitável (proteção de custo, não de segurança).
4. **Sem circuit-breaker formal** para Browserless: retry duro pode amplificar outage do upstream. Hoje contido por rate-limit + 2×2 tentativas. Circuit-breaker formal seria overengineering no volume atual.

Nenhum dos itens acima representa risco de **corrupção de dado, vazamento, ou trava operacional do usuário final**.

---

## 11. Final Operational Stability State

| Domínio | Maturidade |
|---|---|
| Browserless / PDF | 🟢 Maduro |
| Edge Functions | 🟢 Maduro |
| Supabase / RLS | 🟢 Maduro |
| IA failure handling | 🟢 Maduro |
| Cache consistency | 🟢 Maduro |
| Concurrency safety | 🟢 Maduro |
| Degraded-mode UX | 🟢 Maduro |
| Operational telemetry | 🟡 Maduro com gap menor (cron heartbeat) |

---

## Final Verdict

**O sistema HOJE possui resiliência operacional madura e comportamento previsível sob falha real** — timeout, retry, indisponibilidade parcial do Browserless ou IA, race conditions intra-aba, cache invalidation e degradação de latência são todos cobertos por mecanismos verificados em código.

Os pontos remanescentes (heartbeat do cron de retenção, circuit-breaker formal) são **otimizações operacionais futuras**, não fragilidades reais. Nenhuma corrupção silenciosa, deadlock ou tela quebrada foi identificada nos fluxos críticos (Proposta, PDF, IA, Simulador, Upload).

**Status:** ✅ **Operacionalmente resiliente. Pronto para operação contínua sob falha parcial.**
