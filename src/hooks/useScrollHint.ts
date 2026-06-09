import { useEffect, useRef } from 'react';

/**
 * Hook que adiciona a classe `is-scrolled` ao container e ao label de hint
 * quando o usuário rola horizontalmente — para suavizar o fade após a
 * primeira interação.
 *
 * Uso:
 *   const { containerRef, labelRef } = useScrollHint();
 *   <p ref={labelRef} className="scroll-hint-label">← arraste →</p>
 *   <div ref={containerRef} className="overflow-x-auto scroll-hint">...</div>
 */
export function useScrollHint<T extends HTMLElement = HTMLDivElement, L extends HTMLElement = HTMLParagraphElement>() {
  const containerRef = useRef<T | null>(null);
  const labelRef = useRef<L | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (el.scrollLeft > 8) {
        el.classList.add('is-scrolled');
        labelRef.current?.classList.add('is-scrolled');
        el.removeEventListener('scroll', onScroll);
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return { containerRef, labelRef };
}
