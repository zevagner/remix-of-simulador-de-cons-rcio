import { useEffect, useState, type ReactNode } from 'react';

interface DelayedFallbackProps {
  /** Skeleton/spinner to render once the delay elapses. */
  children: ReactNode;
  /**
   * Delay in ms before showing the fallback. Cached chunks resolve under this
   * threshold, so the user sees no flash of skeleton at all — perceptive
   * continuity. Default 140ms (≈ 1 frame above human flicker threshold).
   */
  delay?: number;
  /** Optional reserved min-height to prevent layout shift while invisible. */
  minHeight?: string | number;
}

/**
 * UX Wave 5 — Perceived Performance.
 *
 * Suspense fallback wrapper that withholds the skeleton for a short window.
 * If the lazy chunk resolves within `delay`, no loading UI ever paints —
 * eliminating the most common source of "flash → content" jumps when
 * navigating between already-cached modules.
 *
 * When the fallback does render, it fades in via the existing
 * `animate-fade-in` utility so the transition stays soft.
 */
export function DelayedFallback({ children, delay = 140, minHeight }: DelayedFallbackProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);

  if (!visible) {
    // Reserve space silently to prevent CLS during the grace window.
    return <div aria-hidden style={minHeight ? { minHeight } : undefined} />;
  }

  return (
    <div className="animate-fade-in motion-reduce:animate-none" style={minHeight ? { minHeight } : undefined}>
      {children}
    </div>
  );
}
