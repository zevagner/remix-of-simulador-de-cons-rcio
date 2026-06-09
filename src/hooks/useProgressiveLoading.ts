import { useEffect, useRef, useState } from "react";

/**
 * Mensagens progressivas para edges síncronas.
 * Reduz percepção de travamento exibindo feedback evolutivo:
 * "Analisando..." → "Gerando resposta..." → "Quase pronto..."
 */
export const DEFAULT_PROGRESSIVE_MESSAGES = [
  "Analisando seu cenário…",
  "Consultando dados reais…",
  "Montando a melhor resposta…",
  "Quase pronto…",
];

/** Mensagens curtas pra botões. */
export const BUTTON_PROGRESSIVE_MESSAGES = [
  "Analisando…",
  "Gerando…",
  "Quase pronto…",
];

interface Options {
  messages?: string[];
  /** ms entre mudanças. default 1500ms */
  intervalMs?: number;
}

export function useProgressiveLoading(active: boolean, opts: Options = {}) {
  const messages = opts.messages ?? DEFAULT_PROGRESSIVE_MESSAGES;
  const intervalMs = opts.intervalMs ?? 1500;
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    setIndex(0);
    timerRef.current = window.setInterval(() => {
      setIndex((i) => Math.min(i + 1, messages.length - 1));
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [active, intervalMs, messages.length]);

  return {
    message: messages[index],
    index,
  };
}
