import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';

type AutoFitTextProps = {
  children: ReactNode;
  className?: string;
  /** Minimum scale factor (0..1). Default 0.55. */
  minScale?: number;
  /** When true, uses block + transform-origin left so text aligns left. */
  alignLeft?: boolean;
};

/**
 * AutoFitText
 * -----------
 * Mede a largura real do conteúdo (scrollWidth) vs container (clientWidth)
 * e aplica `transform: scale(ratio)` para encolher SEM quebrar linha.
 * Mantém a tipografia base do CSS (clamp/cqw) — apenas adiciona uma camada
 * de "auto-fit" final quando o número ainda excede a largura disponível.
 *
 * Zero impacto quando o texto já cabe (scale = 1).
 */
export function AutoFitText({
  children,
  className,
  minScale = 0.45,
  alignLeft = true,
}: AutoFitTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Reseta para medir o tamanho natural sem influência do scale anterior.
        inner.style.transform = 'scale(1)';
        const available = container.clientWidth;
        const needed = inner.scrollWidth;
        if (available <= 0 || needed <= 0) return;
        // -2px de folga para evitar clipping por arredondamento de subpixel.
        const safe = Math.max(0, available - 2);
        const next = needed > safe ? Math.max(minScale, safe / needed) : 1;
        setScale(next);
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    ro.observe(inner);
    // Re-mede quando fontes terminam de carregar (produção carrega fontes
    // diferentes do preview e o scrollWidth muda após o swap).
    if (typeof document !== 'undefined' && (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready) {
      (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready.then(measure).catch(() => {});
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [children, minScale]);

  const innerStyle: CSSProperties = {
    display: 'inline-block',
    transform: `scale(${scale})`,
    transformOrigin: alignLeft ? 'left center' : 'center',
    whiteSpace: 'nowrap',
    willChange: scale === 1 ? undefined : 'transform',
  };

  return (
    <span
      ref={containerRef}
      className={className}
      style={{ display: 'block', width: '100%', overflow: 'hidden' }}
    >
      <span ref={innerRef} style={innerStyle}>
        {children}
      </span>
    </span>
  );
}
