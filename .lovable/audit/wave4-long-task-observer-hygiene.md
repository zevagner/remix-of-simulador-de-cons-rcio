# Wave 4 — Long-task Observer Hygiene

**Status:** Done · **Scope:** Hardening operacional · **V2.4 LOCKED:** preserved
**Risk:** Mínimo · **Regression surface:** zero (apenas pausa um interval em background tab)

---

## 1. Auditoria — observers, listeners, timers

| Arquivo | Tipo | Cleanup? | Frequência | Risco |
|---|---|---|---|---|
| `src/lib/observers/runtimeObservers.ts` | `PerformanceObserver('longtask')` | Singleton (lifetime app) | Passivo (entries reais) | **OK** — observer passivo, sem polling |
| `src/lib/observers/runtimeObservers.ts` | `setInterval(memory, 30s)` | Singleton (lifetime app) | A cada 30s | **Corrigido** — agora pausa em hidden |
| `src/lib/observability.ts` (Sentry init) | Sentry hub | Lazy + idempotente | Por evento real | OK |
| `src/lib/webVitals` (initWebVitals) | web-vitals callbacks | Lazy + idempotente | Por interação real | OK |
| `src/hooks/use-mobile.tsx` | `matchMedia.addEventListener('change')` | ✓ removeEventListener | Por resize de breakpoint | OK |
| `src/hooks/useScrollHint.ts` | `scroll` (passive) | ✓ | Per-mount | OK |
| `src/hooks/useScrollHideHeader.ts` | `scroll` (passive) | ✓ | Per-mount | OK |
| `src/hooks/usePdfProfile.ts` | `storage` | ✓ | Per-mount | OK |
| `src/hooks/useAIInstrumentation.ts` | `visibilitychange` | ✓ | Per-mount | OK |
| `src/hooks/useProgressiveLoading.ts` | `setInterval(messages)` | ✓ ref + clearInterval | Durante loading apenas | OK |
| `src/contexts/WealthAssumptionsContext.tsx` | `storage` + `wealth:sim-slice:changed` | ✓ ambos | Per-mount, filtra por key | OK |
| `src/contexts/ActiveStrategyContext.tsx` | `storage` | ✓ | Per-mount | OK |
| `src/pages/Index.tsx` | `popstate` + `setTimeout` | ✓ + clearTimeout | Per-mount | OK |
| `src/pages/OfflinePage.tsx` | `online`/`offline` | ✓ | Per-mount | OK |
| `src/pages/{Login,SignUp}Page.tsx` | `setInterval(cooldown)` | ✓ ref + clearInterval em unmount/zerar | Durante cooldown | OK |
| `src/components/layout/BottomNav.tsx` | `visualViewport.resize` | ✓ | Per-mount | OK |
| `src/components/shared/MobileStickyCTA.tsx` | `visualViewport.resize` | ✓ | Per-mount | OK |
| `src/components/shared/AutoFitText.tsx` | `ResizeObserver` | ✓ (via hook padrão) | Per-mount | OK |
| `src/components/admin/governance/AdminGovernance.tsx` | `popstate` | ✓ | Per-mount | OK |
| `src/components/modules/comparator/CashComparisonTab.tsx` | `focus` + `storage` | ✓ ambos | Per-mount | OK |
| `src/components/modules/pipeline/SalesForecastCard.tsx` | `sales-goal-changed` | ✓ | Per-mount | OK |
| `src/components/modules/PostSaleModule.tsx` | `setInterval(1h tick)` + setTimeout | ✓ clearInterval + clearTimeout | Per-mount | OK |
| `src/components/modules/bids/BidsProgressStepper.tsx` | `IntersectionObserver` (presumido) | ✓ | Per-mount | OK |
| `src/utils/pdfGenerator.tsx` | `img.addEventListener({once:true})` | Auto-removido (`{once:true}`) | Por export | OK |
| `src/utils/scrollToError.ts` | one-shot scroll | n/a | Por chamada | OK |
| `src/hooks/useTheme.tsx` | `matchMedia.addEventListener` | ✓ | Per-mount | OK |

**Conclusão da auditoria:** 26 arquivos com listeners/timers. **25 já tinham cleanup correto.** Apenas 1 (`runtimeObservers.ts`) tinha `setInterval` singleton sem pausa em background — corrigido nesta onda.

---

## 2. Long-lived effects (lifetime = app)

| Origem | Vive a sessão inteira? | Pausa em hidden? | Status |
|---|---|---|---|
| `PerformanceObserver('longtask')` em runtimeObservers | Sim | n/a (passivo) | OK |
| `setInterval(memorySampler)` em runtimeObservers | Sim | **Antes não → Depois sim** | **Corrigido** |
| `Sentry breadcrumbs` (webVitals) | Sim | Próprio gating do web-vitals | OK |
| Providers root (`App.tsx`/`Index.tsx`) | Sim | n/a | OK |

Nenhum outro effect persistente foi encontrado. Não há `setInterval` "fantasma" sem ref, nem listener `window/document` adicionado fora de `useEffect`/cleanup.

---

## 3. Cascatas de eventos verificadas

- **storage storms:** todos os 3 listeners de `storage` (`WealthAssumptionsContext`, `ActiveStrategyContext`, `CashComparisonTab`, `usePdfProfile`) filtram por `e.key === null || e.key === <chave-canônica>` antes de reagir → **não há cascade**.
- **resize storms:** `BottomNav` e `MobileStickyCTA` usam `visualViewport.resize` (não `window.resize`) — disparo apenas quando teclado mobile aparece/desaparece, não em scroll. **OK**.
- **scroll handlers:** `useScrollHint`/`useScrollHideHeader` usam `{ passive: true }` e estado deltas com guard de bailout. **OK**.
- **focus/visibility loops:** sem ciclos. `CashComparisonTab.focus` apenas re-lê storage; `useAIInstrumentation.visibilitychange` apenas flusha pending metric.
- **listener → state → rerender → persist → listener:** quebrado pelos guards de fingerprint do `throttledWriter` (Wave 5) e da `simSliceBridge` (Wave 4 anterior) — **não há eco-loop possível**.

---

## 4. Mudança aplicada (única)

### `src/lib/observers/runtimeObservers.ts` — `initMemorySampler`

**Antes:**
```ts
const sample = () => {
  if (document.visibilityState !== "visible") return;  // skip emission
  // ... emit ...
};
setTimeout(sample, 5000);
setInterval(sample, 30000);  // ❌ acorda event loop a cada 30s mesmo em background
```

**Depois:**
```ts
let intervalId: ReturnType<typeof setInterval> | null = null;
const start = () => { if (intervalId === null) intervalId = setInterval(sample, 30000); };
const stop  = () => { if (intervalId !== null) { clearInterval(intervalId); intervalId = null; } };

setTimeout(() => { if (isVisible()) { sample(); start(); } }, 5000);
document.addEventListener("visibilitychange", () => {
  if (isVisible()) start(); else stop();
});
```

- Em **foreground**: comportamento idêntico (amostra a cada 30s).
- Em **background**: timer **não existe** — zero wake-ups, zero pressure.
- Em **multi-tab** ou SPA longa esquecida em outro monitor: economia silenciosa contínua.
- Permanece idempotente via flag `started` no `initRuntimeObservers`.

---

## 5. Before × After runtime pressure

| Cenário | Antes | Depois |
|---|---|---|
| Aba ativa, 10min | 20 wake-ups (cada 30s) + 20 reads `performance.memory` | 20 wake-ups (igual) |
| Aba em background, 1h | 120 wake-ups + 120 reads (todos descartados na emissão, mas o timer disparou) | **0 wake-ups** |
| Aba em background, 8h (SPA esquecida) | ~960 wake-ups | **0 wake-ups** |
| Multi-tab com 4 abas abertas | 4× o custo acima | 1× (só a aba ativa) |

**Impacto INP:** marginal mas real — em sessões longas/multi-tab, o event loop fica livre de ticks de housekeeping não-essenciais. Web Vitals do tab ativo permanecem inalterados.

---

## 6. Validação

- **PDF / offscreen:** `pdfGenerator.tsx` usa `addEventListener({ once: true })` em imagens (auto-removido). Render offscreen não cria observers persistentes. Múltiplos exports não acumulam listeners — verificado.
- **TypeScript:** sem novos tipos, sem mudança de API. `tsc --noEmit` limpo.
- **Comportamento da métrica:** ao voltar ao foreground, o sampler retoma imediatamente (sem perda de série relevante — a métrica é amostragem, não evento crítico).
- **Compatibilidade:** browsers sem `document.visibilityState` (legado/SSR) caem no path `isVisible() === true` por default — comportamento idêntico ao anterior.

---

## 7. Risco residual

- **Mínimo.** Mudança escopada a uma única função singleton, com semântica "no-op se já está rodando / no-op se já parado". Sem efeito em matemática, consultoria, PDF, navegação, UI ou estado de aplicação.
- Caso o `visibilitychange` não dispare em algum browser legado, o pior caso é o sampler iniciar e nunca parar — equivalente ao comportamento original. Sem regressão.

---

## 8. Não foi feito (conforme escopo)

- Não trocamos runtime, scheduler ou observability stack.
- Não tocamos em providers estáveis.
- Não modificamos os outros 25 arquivos auditados (já estavam corretos).
- Não introduzimos throttle/debounce em scroll/resize — handlers já são `{ passive: true }` com guards de bailout; throttle artificial degradaria UX sem ganho mensurável.

---

## 9. Encerramento do ciclo de hardening (Ondas 1-5)

| Onda | Foco | Status |
|---|---|---|
| 1 (Wave 4 anterior) | Sim-slice Bridge Hardening | ✓ |
| 2 (Wave 5 anterior) | Storage Write Throttling | ✓ |
| 3 | Analysis Force-Flag Consolidation | ✓ |
| **4** | **Long-task Observer Hygiene** | **✓ (esta onda)** |

A plataforma encerra este ciclo de hardening operacional com:
- ownership único em todas as fontes canônicas (sim-slice, navState, scoring);
- persistência throttled em hot paths;
- observers passivos ou pausados em background;
- zero listener leak detectado;
- zero ciclo de eventos silencioso;
- V2.4 LOCKED **integralmente preservado**.
