import { type ReactNode } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useScrollHint } from '@/hooks/useScrollHint';
import { cn } from '@/lib/utils';

/**
 * Wrapper canônico para áreas com scroll horizontal.
 * Aplica:
 *   - fade edge animado (.scroll-hint) — pulsa 1ª vez, some após 1º scroll
 *   - label sutil "← arraste →" apenas mobile (.scroll-hint-label)
 *
 * Reduz fricção de "tabela cortada sem indicação" (auditoria UX Wave 1).
 *
 * Uso:
 *   <ScrollAffordance label="← arraste para ver mais →">
 *     <table>...</table>
 *   </ScrollAffordance>
 */
interface ScrollAffordanceProps {
  children: ReactNode;
  label?: string;
  className?: string;
  /** Para casos em que o container já tem borda/rounded próprios. */
  containerClassName?: string;
}

export function ScrollAffordance({
  children,
  label = 'arraste para ver mais',
  className,
  containerClassName,
}: ScrollAffordanceProps) {
  const { containerRef, labelRef } = useScrollHint<HTMLDivElement, HTMLParagraphElement>();

  return (
    <div className={className}>
      <p
        ref={labelRef}
        className="scroll-hint-label md:hidden text-caption text-muted-foreground mb-1.5 flex items-center justify-center gap-1.5"
      >
        <ArrowLeftRight className="h-3 w-3" aria-hidden />
        <span>{label}</span>
      </p>
      <div
        ref={containerRef}
        className={cn('overflow-x-auto print:overflow-visible scroll-hint', containerClassName)}
      >
        {children}
      </div>
    </div>
  );
}
