# Privacy-Safe Observability Activation Pass

> Wave: Observabilidade enxuta, LGPD-safe e acionável.
> Modo: **AUDITORIA + GOVERNANÇA**, sem novas instrumentações invasivas.
> Princípio de respeito ao Production Lock V2.4: medir o que já existe, consolidar fontes, eliminar ruído. Nenhum novo sink, nenhum novo SDK, nenhum hook de tracking criado nesta wave.

---

## Full Observability Surface Audit

Mapa real da superfície (varredura `rg` em `src/`):

| Camada | Arquivo canônico | Status | Observação |
|---|---|---|---|
| Crash / error reporting | `src/lib/observability.ts` | ✅ único | Sentry opt-in via `VITE_SENTRY_DSN`; no-op silencioso sem DSN. |
| PII scrubbing | `src/lib/logSanitizer.ts` | ✅ único | Regex E-mail/CPF/Telefone/UUID + denylist de chaves sensíveis. Reusado por Sentry, breadcrumbs, runtime metrics, edge logs. |
| Web Vitals | `src/lib/webVitals.ts` (`initWebVitals`) | ✅ único | FCP/LCP/CLS/INP/TTFB → `runtimeMetrics` + Sentry breadcrumbs. Disparado em `main.tsx`. |
| Render profiler | `src/lib/perfProfiler.tsx` | ✅ opt-in | `<PerfProfiler>` só ativa com `?perf=1`. Zero custo em produção. |
| Runtime pipeline | `src/lib/runtimeMetrics.ts` | ✅ único | Buffer in-memory 500, pub/sub, **sem polling, sem timers, sem persistência**. Listeners zero ⇒ overhead zero. |
| Runtime observers | `src/lib/observers/runtimeObservers.ts` | ✅ único | Long tasks + memory pressure; opt-in via dashboard. |
| Business analytics | `src/services/analyticsTracker.ts` | ✅ único | `trackEvent()` fire-and-forget para `analytics_events`; gated por `isAnalyticsAllowed()` (consent LGPD Fase 2). |
| Funnel analytics | `src/services/analyticsFunnel.ts` | ✅ único | Agregações para Admin; leitura-only. |
| AI instrumentation | `src/hooks/useAIInstrumentation.ts` | ✅ único | TTFT, total time, abandon, slow indicator. Sem prompts, sem responses. |
| Strategy V2 telemetry | `src/components/modules/strategy-v2/telemetry.ts` | ✅ único | Payload restrito a ids de blueprint e contadores (memória `mem://`). |
| Audit log de ações críticas | `src/services/auditLog.ts` | ✅ único | Server-side `audit_logs`; admin/proposals/PDF. |
| Navigation telemetry | `src/utils/navState.ts` | ✅ único | `navigation_changed` com `source` (sidebar/bottom-nav/cta). |
| Module access | `src/hooks/useTrackModuleAccess.ts` | ✅ único | Dedup in-memory via `Set` (memória DB I/O Onda 1). |
| Logger wrapper | `src/utils/logger.ts` | ✅ único | Wrapper de `console.*`; só ativo em DEV. **12 `console.*` diretos** remanescentes (toleráveis — UI/ResetButton/alert-dialog). |

### Sinais quantitativos

- **121 `trackEvent` calls** distribuídos em ~30 arquivos — escopo controlado, todos passam por `analyticsTracker` (sink único).
- **12 `console.*` calls diretos** (não-wrapper) — exclusivamente em UI/dev-tools; nenhum em hot path.
- **Sentry**: 1 ponto de init, 1 `captureError`, 1 `setUserContext`. Sem `Sentry.*` espalhado.
- **Sinks de telemetria**: 3 (analytics_events DB, Sentry, runtimeMetrics in-memory). **Zero sinks redundantes.**

### Findings

- ❌ Nenhuma duplicação real detectada.
- ❌ Nenhum sink shadow (vendor analytics, gtag, hotjar, mixpanel, etc.).
- ✅ Toda superfície converge em 3 fachadas (`trackEvent`, `captureError`, `emitMetric`).

---

## Privacy-Safe Telemetry Enforcement

### Garantias verificadas

| Vetor | Mitigação | Local |
|---|---|---|
| E-mail / CPF / Telefone em log | Regex global `sanitizeString` | `logSanitizer.ts:17-21` |
| UUID identificável | Tokenização `[id:…XXXX]` (4 chars) | `logSanitizer.ts:67` |
| Nomes de cliente / notas | Denylist `SENSITIVE_KEYS` → `[REDACTED:k]` | `logSanitizer.ts:23-51` |
| Headers `authorization` / `apikey` / `cookie` | Strip em `scrubEvent` Sentry | `observability.ts:22-25` |
| Prompts/respostas IA | **Não enviados** — `useAIInstrumentation` mede só TTFT/total/abandon | `useAIInstrumentation.ts` |
| Conteúdo de proposta / PDF | Denylist (`proposal_content`, `payload`, `body`, `summary`, `notes`) | `logSanitizer.ts:42-50` |
| User ID em Sentry | Tokenizado `…últimos 6 chars` | `observability.ts:138-140` |
| Body de request em breadcrumbs | `sanitizeLogPayload` recursivo | `observability.ts:54-58, 99-108` |
| String overflow (vaza por tamanho) | Truncamento 500 chars com tag `[truncated:N]` | `logSanitizer.ts:68-70` |
| Depth bomba | `MAX_DEPTH=6` → `[max-depth]` | `logSanitizer.ts:76` |
| Consent LGPD | `isAnalyticsAllowed()` gate antes de cada `trackEvent` | `analyticsTracker.ts:195` |
| sendDefaultPii | `false` no Sentry init | `observability.ts:87` |
| Session Replay | `replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 0` | `observability.ts:85-86` |

### Proibições — status

| Proibição | Status |
|---|---|
| ❌ Payloads ricos demais | **OK** — denylist + truncamento global. |
| ❌ Prompts completos | **OK** — só métricas de tempo. |
| ❌ PDFs em telemetry | **OK** — `proposal_content`/`body` redacted. |
| ❌ PII silenciosa | **OK** — 4 regex + denylist + scrub Sentry. |
| ❌ Session leakage | **OK** — Replay desligado, cookies stripped. |

### Recomendação de governança

Adicionar nova chave ao denylist sempre que surgir campo novo com texto livre do cliente. Manter `SENSITIVE_KEYS` como fonte única — **não criar sanitizers paralelos**.

---

## Signal-to-Noise Optimization

### Triagem de eventos `trackEvent` por valor de sinal

**Alto sinal (manter)**:
- `pdf_generated`, `proposal_generated`, `simulation_generated`, `share_link_clicked`, `proposal_pdf_sent`, `followup_response_received` → conversão real.
- `ai_ttft`, `ai_total_time`, `ai_abandon`, `ai_slow_indicator_shown` → SLOs de IA.
- `proposal_mutation_failed`, `proposal_invalid_status_detected`, `proposals_page_limit_reached`, `proposal_create_blocked_no_trigger` → integridade.
- `proposal_status_change`, `proposal_move_cancelled`, `proposal_next_action_skip` → fricção da cadência.
- `navigation_invalid_target` → bug de roteamento.

**Médio sinal (manter, baixa cardinalidade)**:
- `module_access`, `navigation_changed`, `simulator_save_as_proposal_click`, `simulator_nudge_*` → fluxo consultivo.
- `ai_cache_hit`, `investment_storytelling_cache_*`, `bid_recommendation_hybrid_local` → custo IA.
- `strategyv2_*` → preview validation (memória existente).

**Baixo sinal — candidatos a auditoria futura (não removidos nesta wave por estarem governados pelo Production Lock)**:
- `*_copied` / `*_whatsapp` (≈18 variantes). Sugestão: consolidar em 2 eventos genéricos `content_copied { kind }` e `content_shared_whatsapp { kind }` em wave futura, reduzindo cardinalidade ~85%.
- `argument_generated` vs `storytelling_generated` vs `investment_storytelling_generated` vs `niche_storytelling_generated` — sobreposição semântica.

**Conclusão**: ruído contido. Cardinalidade total = 70 eventos, mas todos com ownership claro e payload mínimo. Não há "event spam" — há **redundância semântica** para reduzir em wave futura.

---

## Performance Observability

| Sinal | Coleta | Sink | Acionabilidade |
|---|---|---|---|
| FCP / LCP / CLS / INP / TTFB | `web-vitals` lib | `runtimeMetrics` + Sentry breadcrumb | Dashboard "Performance Intel" + thresholds oficiais `web.dev/vitals`. |
| Long tasks (>50ms) | PerformanceObserver | `runtimeMetrics` (opt-in) | Render Hotspots no Admin. |
| Memory pressure | `performance.memory` | `runtimeMetrics` (opt-in) | Card Mobile/Citrix. |
| Render duration por componente | `<PerfProfiler>` (`?perf=1`) | `runtimeMetrics` | Render Hotspots. |
| Cold start | Web Vitals FCP/TTFB | `runtimeMetrics` | Auto via `initWebVitals()`. |
| Chunk load | Não instrumentado | — | **Gap conhecido** (vide §10). Vite divide chunks; falhas surgem como `ChunkLoadError` no Sentry. |

**Overhead**: `runtimeMetrics` tem `if (listeners.size === 0) return` antes do fanout. Em produção sem dashboard aberto, custo = 1 push em array circular de 500 + 1 check. Zero rerender, zero rede.

---

## Consultive Flow Intelligence

Cobertura por jornada:

| Jornada | Eventos | Detecta abandono? |
|---|---|---|
| Diagnóstico → Simulador | `diagnostic_used`, `simulation_generated`, `simulator_save_as_proposal_click`, `simulator_nudge_*` | ✅ Nudge dismissed + sem save. |
| Simulador → Proposta | `proposal_create_blocked_no_trigger`, `proposal_generated` | ✅ Bypass capturado. |
| Proposta → Compartilhamento | `share_link_generated`, `share_link_clicked`, `proposal_pdf_sent` | ✅ Gap entre generated/clicked = abandono. |
| Pós-venda → Follow-up | `followup_message_*`, `followup_response_received` | ✅ |
| Pipeline | `pipeline_lead_created`, `pipeline_lead_moved`, `proposal_move_cancelled`, `proposal_next_action_skip` | ✅ Fricção da cadência (Onda 5). |
| Comparator | `strategyv2_compare_*` | ✅ Recovered / remove indicam confusão. |
| Navigation dead-ends | `navigation_invalid_target` | ✅ |

**Sem espionagem**: nenhum `mousemove`, nenhum `keystroke logger`, nenhum heatmap, nenhum Session Replay.

---

## Error Governance Layer

| Aspecto | Estado |
|---|---|
| Sink único | ✅ `captureError()` em `observability.ts`. |
| Severity | ⚠️ Não padronizado — Sentry default level (`error`). **Recomendação futura**: tagar `severity` (`critical|degraded|warning`) por contexto via `Sentry.setTag` no callsite, sem novo SDK. |
| Classification | ✅ `ignoreErrors` filtra ruído conhecido (ResizeObserver, Non-Error promise). |
| Ownership | ⚠️ Implícito (módulo da stack). Recomendação: adicionar `tags.module` nas chamadas críticas (ex: `captureError(e, { tags: { module: 'pdf' } })`). Não obrigatório nesta wave. |
| Actionable traces | ✅ Stack values sanitizados sem perder linha/coluna. |
| Alert quality | ✅ Quota controlada por `tracesSampleRate: 0.05`. |
| Erro impossível de interpretar | Eliminado em hot path — `withTrustFeedback` + `notifyError({retry})` (memória `ux/trust/operational-trust-wave6`). |

---

## Observability DX Validation

- **Debugging clarity**: `logger.log('[analytics]', ...)` em DEV imprime evento + userId + payload. Em prod: silêncio.
- **Trace readability**: stacks Sentry preservadas, UUIDs tokenizados (`…ab12cd`) mantêm correlação cross-event sem expor PII.
- **Reproducibility**: `audit_logs` server-side dá replay determinístico de ações críticas (admin/proposals/PDF).
- **Painel único**: Admin → "Performance Intel" + "Auditoria" + "Performance IA" — 3 superfícies, ownership explícito.
- **CI gates**: `scripts/ci/anti-xss-gate.mjs` + ESLint `no-restricted-syntax` previnem regressão de scrub.

**Não vira ruído operacional**: zero alerts ativos, zero pager, zero webhook — observabilidade é **diagnóstica**, não reativa. Decisão alinhada ao porte atual.

---

## Mobile Runtime Observability

- Memory pressure card no dashboard cobre runtime spikes mobile.
- INP (Interaction to Next Paint) é o vital crítico mobile — coletado e classificado (`good ≤200ms`, `poor >500ms`).
- `<MobileStickyCTA>` e `scrollToFirstError()` (memória UX Wave 1) não emitem eventos próprios — overhead zero.
- Hydration failures: capturadas via Sentry global handler.
- Navigation degradation: `navigation_changed` com `source` permite diferenciar entrada mobile (bottom-nav) vs desktop (sidebar).

**Gap conhecido**: sem device class explícito no payload (`is_mobile`, `connection_type`). Aceito — `route` + INP já discriminam suficientemente para o porte atual.

---

## Zero Regression Validation

| Risco | Status |
|---|---|
| Tracking invasivo introduzido | ❌ Nenhum novo evento criado nesta wave. |
| Excesso de analytics | ❌ Nenhum hook novo. |
| PII leakage novo | ❌ Sanitizer intacto; nenhum bypass criado. |
| Telemetry theater | ❌ Sem dashboards vanity. |
| Performance degradation | ❌ Zero novo overhead (wave é auditoria). |
| Observability spam | ❌ Sem polling, sem timers, sem persistência local nova. |
| Edição de hot paths | ❌ Wave é doc-only. |
| Quebra de Production Lock V2.4 | ❌ Respeitado integralmente. |

---

## Final Observability State

| Pergunta | Resposta |
|---|---|
| A observabilidade ficou útil? | ✅ Sim — 3 sinks cobrem crashes (Sentry), conversão (analytics_events) e runtime (runtimeMetrics). |
| O ruído caiu? | ✅ Já estava baixo — 70 eventos com ownership, sem sinks shadow. Sugerida consolidação `*_copied`/`*_whatsapp` para wave futura (não nesta — Lock V2.4). |
| Existe segurança LGPD? | ✅ Sanitizer único, consent gate, Sentry sem PII, Replay desligado, tokenização de UUIDs/user_id. |
| Os sinais ficaram acionáveis? | ✅ Conversão, fricção, integridade e SLO de IA cobertos. |
| Engenharia ganhou visibilidade real? | ✅ Admin → Performance Intel + Auditoria + Performance IA. |
| A plataforma ficou mais governável? | ✅ Esta auditoria + memória `arch/ai/edges-map-vivo` + `governance/governance-expansion-wave` dão mapa vivo. |

### Métricas do estado atual

- **Sinks**: 3 (Sentry, analytics_events, runtimeMetrics in-memory).
- **Fachadas**: 3 (`captureError`, `trackEvent`, `emitMetric`).
- **PII regex**: 4 globais + denylist 28 chaves.
- **Overhead em prod sem dashboard**: ~0 (1 array push + 1 check por métrica emitida).
- **Sentry quota**: `tracesSampleRate: 0.05`, Replay = 0.
- **Eventos catalogados**: 70 (todos em `AnalyticsEventName` união discriminada).
- **Console.* fora do logger**: 12 (não-hot path).

---

## Final Verdict

**APROVADO — sem mudanças de código.**

A plataforma já operava com observabilidade **enxuta, segura e governável** antes desta wave; o que faltava era o **mapa formal** que esta auditoria produz. Não há débito crítico, não há vazamento de PII detectável, não há ruído estrutural.

**Movimento confirmado**:
> de _"logs e telemetry espalhados"_ (percepção)
> para _"3 fachadas, 3 sinks, 1 sanitizer, 1 consent gate, governança documentada"_ (realidade auditada).

**Backlog de wave futura (não obrigatório, fora do Production Lock V2.4)**:
1. Consolidar `*_copied`/`*_whatsapp` em 2 eventos genéricos com `kind`.
2. Padronizar `severity` em `captureError` via `Sentry.setTag` no callsite.
3. Instrumentar `ChunkLoadError` com auto-retry + métrica dedicada.
4. Avaliar `tags.module` opcional em `captureError` para ownership explícito.

Nenhum desses itens justifica edição agora. **Wave encerrada como governança pura.**
