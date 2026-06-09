# Performance Wave 3 — Real User Observability & Telemetry

**Princípio absoluto:** parar de otimizar às cegas. Medir antes de mexer.

## 1. Stack de observabilidade já presente (validado)

| Camada | Estado | Arquivo |
|---|---|---|
| Sentry init (DSN opt-in) | Ativo, sem PII, `tracesSampleRate=0.05`, `sendDefaultPii=false`, scrub de `authorization`/`apikey` | `src/lib/observability.ts` |
| Web Vitals (FCP/LCP/CLS/INP/TTFB) | Ativo, alimenta `runtimeMetrics` + breadcrumb Sentry; `captureMessage` quando `rating=poor` | `src/lib/webVitals.ts` |
| Pipeline central de métricas | Buffer circular 500, pub/sub rAF-debounced, zero overhead sem subscribers | `src/lib/runtimeMetrics.ts` |
| Render profiler opt-in (`?perf=1`) | Captura commits >16ms por componente | `src/lib/perfProfiler.tsx` |
| Painel executivo Admin | Cards Runtime/Mobile/Citrix/React + Web Vitals + Render Hotspots + feed | `src/components/admin/AdminPerformanceIntelligence.tsx` |

**Fundação:** sólida. Wave 3 não reescreve — adiciona as 4 camadas que faltavam.

## 2. Novos observers entregues (Wave 3)

Arquivo único: `src/lib/observers/runtimeObservers.ts`. Inicializado em `main.tsx` via `initRuntimeObservers()`.

### 2.1 Long Tasks (>50ms)
- `PerformanceObserver({ type: 'longtask', buffered: true })`
- Emite `type: 'long-task'`, classifica `good/needs-improvement/poor` em 50/100/200ms
- Detecta freezes, jank de scroll, handlers pesados, parsing de JSON gigante
- Safari: silenciosamente ignorado (API ausente)

### 2.2 Heap sampler (memória real)
- `performance.memory` (Chromium) a cada **30s**, primeira amostra após 5s
- **Pausa quando `document.visibilityState !== 'visible'`** → zero overhead com aba em background
- Reporta `usedMB`, `limitMB`, `pct`, `growthMB` (delta vs amostra anterior)
- Detecta leaks (growth contínuo positivo) e pressão de memória (pct > 60% / > 80%)

### 2.3 Device class
- Heurística institucional one-shot em idle: `low | mid | high`
  - `low`: `deviceMemory ≤ 2 GB` ou `cores ≤ 2` (notebooks corp/Citrix fracos)
  - `high`: `≥ 8 GB` e `≥ 8 cores`
- Captura `effectiveType`, `downlink`, `rtt`, `saveData`, `dpr`, viewport, mobile flag
- Permite segmentar todas as outras métricas por classe de hardware/rede

### 2.4 Login → App timings (real)
- `markLoginStart()` → no `setLoading(true)` do `LoginPage.handleSubmit`
- `markLoginSuccess()` → no `result.success` (auth handshake real)
- `markAppShellReady()` → primeiro `useEffect` do `Index.tsx` (shell montou)
- Gera 3 medidas via `performance.measure`:
  - `auth` (login:start → login:success) — handshake puro
  - `hydration` (login:success → app:shell-ready) — chunk + hidratação
  - `total` (login:start → app:shell-ready) — UX percebida ponta a ponta

## 3. Wiring

| Arquivo | Mudança |
|---|---|
| `src/lib/runtimeMetrics.ts` | `RuntimeMetricType` extendido com `long-task | memory | device | login-timing` |
| `src/lib/observers/runtimeObservers.ts` | **novo** — observers + login marks |
| `src/main.tsx` | `initRuntimeObservers()` chamado após `initWebVitals()` |
| `src/pages/LoginPage.tsx` | `markLoginStart()` no submit, `markLoginSuccess()` no sucesso |
| `src/pages/Index.tsx` | `markAppShellReady()` no mount |
| `src/components/admin/AdminPerformanceIntelligence.tsx` | Novo tab **Runtime real** com cards Long Tasks, Heap, Device class, Login → App |

## 4. Painel executivo — o que o admin vê agora

```
[ Runtime Health ] [ Mobile Health ] [ Citrix Ready ] [ React Stability ]

Tabs: Web Vitals | Runtime real | Render Hotspots | Eventos recentes

Runtime real:
  ┌── Long Tasks ──┐  ┌── Heap (JS) ──┐  ┌── Device class ──┐
  │ 12 tasks       │  │ 87 MB         │  │ mid              │
  │ pico 184ms     │  │ 21% / 410 MB  │  │ 8 cores · 8 GB   │
  │ média 78ms     │  │ growth +0.3MB │  │ 4g · desktop     │
  └────────────────┘  └───────────────┘  └──────────────────┘

  Login → App
  ┌── auth ──┐ ┌── hydration ──┐ ┌── total ──┐
  │ 612 ms   │ │ 384 ms        │ │ 1.40 s    │
  │ Excelente│ │ Excelente     │ │ Excelente │
  └──────────┘ └───────────────┘ └───────────┘
```

## 5. Gargalos REAIS que esta camada vai expor

- **Login lento:** se `auth > 1.5s` consistente → backend/RLS; se `hydration > 800ms` → chunk grande no `Index`
- **Jank de scroll:** long tasks com `startTime` perto de scroll handlers
- **Citrix/notebook corp:** `device-class=low` + INP/long tasks ruins → reduzir trabalho síncrono em hot paths
- **Memory leak:** `growthMB` positivo crescente entre amostras na mesma sessão
- **Refetch waterfall:** quando subscriber de query estiver plugado em `runtimeMetrics`, queries duplicadas aparecem por nome

## 6. Privacidade & overhead

| Garantia | Como |
|---|---|
| **Zero PII** | Apenas números, classes (`low/mid/high`), e nomes técnicos (`auth`, `hydration`, `LCP`). Sem email, sem userId, sem URL com query string. |
| **Zero overhead em background** | Heap sampler pausa quando aba não está visível. Long tasks observer só dispara em tarefas reais. |
| **Zero polling em hot path** | Memory: 30s. Long tasks: passive observer. Device: 1×. Login: 3 marks totais. |
| **Buffer circular** | `runtimeMetrics` cap 500 eventos in-memory. Sem persistência, sem rede própria. |
| **Sentry opcional** | Se `VITE_SENTRY_DSN` ausente, todo o pipeline funciona local-only (Admin dashboard) sem chamadas externas. |
| **Não derruba o app** | Todos os `try/catch` silenciam falhas de instrumentação. |

## 7. Validação

- [x] `initRuntimeObservers` é idempotente (`started` flag)
- [x] `markLoginStart`/`markLoginSuccess`/`markAppShellReady` toleram `performance.mark` indisponível
- [x] Heap sampler no-op em Safari/Firefox (sem `performance.memory`)
- [x] Long tasks no-op em Safari (sem `longtask` entry type)
- [x] Tab "Runtime real" renderiza estado vazio com mensagens claras
- [x] Login flow preservado: nenhuma mudança funcional, apenas marks
- [x] Sem novas dependências (`web-vitals` e `@sentry/react` já presentes)
- [x] Bundle: arquivo novo ~2 KB minified (no chunk principal, não inflar Index)

## 8. Próximos passos (data-driven, não mais "feeling")

1. **Coletar 1 semana** de métricas reais em produção
2. **Segmentar por device class:** se `low` tem INP > 500ms enquanto `high` está OK → otimizar para iGPU/Citrix especificamente
3. **Plugar React Query** em `emitMetric({ type: 'query', ... })` para detectar refetch waterfalls reais
4. **Login total > 2.5s** consistente → investigar chunk do `Index` (lazy split do `AnalysisModule`)
5. **Heap growth > 5MB/min** → suspeitar listeners órfãos em providers críticos
6. **Long tasks correlacionadas com scroll** → virtualizar listas específicas (não todas)

## 9. Arquivos tocados

- ✅ `src/lib/runtimeMetrics.ts` (extensão de tipos)
- ✅ `src/lib/observers/runtimeObservers.ts` (novo)
- ✅ `src/main.tsx` (init)
- ✅ `src/pages/LoginPage.tsx` (2 marks)
- ✅ `src/pages/Index.tsx` (1 mark)
- ✅ `src/components/admin/AdminPerformanceIntelligence.tsx` (tab Runtime real + cards)

## 10. Resultado

**Antes:** otimizações por feeling, sem evidência de que o usuário real estava sofrendo.
**Depois:** todo gargalo perceptivo (long task, heap, login lento, device fraco) aparece automaticamente no painel Admin, com classificação good/needs-improvement/poor, sem PII, sem overhead, sem dependências novas.

Wave 4 deve ser **data-driven**: abrir o painel após 1 semana e atacar os 3 piores hotspots reais.
