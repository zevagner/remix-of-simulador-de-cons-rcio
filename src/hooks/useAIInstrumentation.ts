import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/services/analyticsTracker";

/**
 * Instrumentação padronizada para chamadas de IA (Edge Functions).
 *
 * Métricas registradas (analytics_events):
 *   - ai_ttft               → tempo até o primeiro token / resposta
 *   - ai_total_time         → tempo total da chamada
 *   - ai_abandon            → usuário cancelou / saiu antes da resposta
 *   - ai_slow_indicator_shown → TTFT > 2s (UX: aviso "pode levar alguns segundos…")
 *
 * Uso:
 *   const ai = useAIInstrumentation("phase-action");
 *   ai.start();
 *   try {
 *     const r = await callEdge();
 *     ai.markFirstToken();   // p/ não-stream: chame imediatamente após receber data
 *     ai.markComplete();
 *   } catch (e) { ai.markError(); }
 *
 *   // streaming:
 *   ai.start();
 *   for await (const chunk of stream) {
 *     if (firstChunk) ai.markFirstToken();
 *   }
 *   ai.markComplete();
 */
export function useAIInstrumentation(edge: string) {
  const startRef = useRef<number | null>(null);
  const ttftRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const slowTimerRef = useRef<number | null>(null);
  const [isSlow, setIsSlow] = useState(false);

  const cleanup = useCallback(() => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    cleanup();
    startRef.current = performance.now();
    ttftRef.current = null;
    completedRef.current = false;
    setIsSlow(false);
    // Indicador de lentidão se TTFT > 2s
    slowTimerRef.current = window.setTimeout(() => {
      if (ttftRef.current === null) {
        setIsSlow(true);
        trackEvent("ai_slow_indicator_shown", { edge });
      }
    }, 2000);
  }, [edge, cleanup]);

  const markFirstToken = useCallback(() => {
    if (startRef.current === null || ttftRef.current !== null) return;
    const ttft = performance.now() - startRef.current;
    ttftRef.current = ttft;
    cleanup();
    trackEvent("ai_ttft", { edge, ttft: Math.round(ttft) });
  }, [edge, cleanup]);

  const markComplete = useCallback(() => {
    if (startRef.current === null || completedRef.current) return;
    completedRef.current = true;
    const total = performance.now() - startRef.current;
    cleanup();
    trackEvent("ai_total_time", { edge, total: Math.round(total) });
  }, [edge, cleanup]);

  const markAbandon = useCallback(
    (reason: "cancel" | "navigate" | "tab_hidden" = "cancel") => {
      if (startRef.current === null || completedRef.current) return;
      completedRef.current = true;
      cleanup();
      trackEvent("ai_abandon", { edge, reason });
    },
    [edge, cleanup],
  );

  const markError = useCallback(() => {
    cleanup();
    completedRef.current = true;
  }, [cleanup]);

  // Cleanup on unmount → conta como abandono se ainda em andamento
  useEffect(() => {
    return () => {
      if (startRef.current !== null && !completedRef.current) {
        trackEvent("ai_abandon", { edge, reason: "navigate" });
      }
      cleanup();
    };
  }, [edge, cleanup]);

  // Tab hidden = abandono leve (mas não bloqueia complete posterior)
  useEffect(() => {
    const onVis = () => {
      if (
        document.hidden &&
        startRef.current !== null &&
        !completedRef.current
      ) {
        trackEvent("ai_abandon", { edge, reason: "tab_hidden" });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [edge]);

  return {
    start,
    markFirstToken,
    markComplete,
    markAbandon,
    markError,
    isSlow,
  };
}
