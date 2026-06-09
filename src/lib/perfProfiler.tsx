/**
 * <PerfProfiler> — wrapper opt-in em torno de React.Profiler.
 *
 * Ativa-se apenas quando `localStorage.setItem('perf:profile', '1')` ou
 * `?perf=1` na URL. Em produção sem flag: zero overhead (passthrough).
 *
 * Loga no console qualquer commit com `actualDuration > THRESHOLD_MS`
 * para o `id` informado. Não envia métricas — é ferramenta de
 * diagnóstico local/ondemand.
 *
 * Uso:
 *   <PerfProfiler id="Carteira">
 *     <CarteiraTab />
 *   </PerfProfiler>
 */
import { Profiler, type ProfilerOnRenderCallback, type ReactNode, useMemo } from "react";
import { emitMetric } from "./runtimeMetrics";

const THRESHOLD_MS = 16; // 1 frame @ 60 fps

function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.location.search.includes("perf=1")) return true;
    return window.localStorage.getItem("perf:profile") === "1";
  } catch {
    return false;
  }
}

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) => {
  if (actualDuration < THRESHOLD_MS) return;
  // eslint-disable-next-line no-console
  console.warn(
    `[perf] ${id} ${phase} ${actualDuration.toFixed(1)}ms (base ${baseDuration.toFixed(
      1,
    )}ms) @ ${commitTime.toFixed(0)}`,
    { startTime },
  );
  emitMetric({
    type: "render",
    name: id,
    value: actualDuration,
    rating: actualDuration > 50 ? "poor" : actualDuration > 32 ? "needs-improvement" : "good",
    module: id,
    meta: { phase, baseDuration: Math.round(baseDuration) },
  });
};

export function PerfProfiler({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const enabled = useMemo(isEnabled, []);
  if (!enabled) return <>{children}</>;
  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
