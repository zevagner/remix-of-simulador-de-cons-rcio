import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'tip' | 'warning';

interface SalesGuideTipProps {
  /** Identificador único — usado para persistir o "fechar" por usuário/sessão. */
  id: string;
  /** Texto curto comercial. */
  message: string;
  /** Título opcional (usar para variant="warning"). */
  title?: string;
  /** Visual: dica padrão ou alerta crítico (ex: lance embutido). */
  variant?: Variant;
  className?: string;
}

const STORAGE_KEY = 'sales-guide-tip-dismissed';

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persist(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch { /* noop */ }
}

/**
 * Dica comercial contextual, não intrusiva e fechável.
 * Persiste o dismiss por id em localStorage para não reaparecer.
 *
 * Uso:
 *   <SalesGuideTip id="diagnostic-intro" message="..." />
 *   <SalesGuideTip id="comparator-embutido" variant="warning" title="Importante" message="..." />
 */
export function SalesGuideTip({ id, message, title, variant = 'tip', className }: SalesGuideTipProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissed);

  useEffect(() => { setDismissed(getDismissed()); }, []);

  const onClose = useCallback(() => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      persist(next);
      return next;
    });
  }, [id]);

  if (dismissed.has(id)) return null;

  const isWarning = variant === 'warning';
  const Icon = isWarning ? AlertTriangle : Lightbulb;

  return (
    <div
      role="note"
      className={cn(
        'relative rounded-md border px-3 py-2 pr-10 text-xs sm:text-sm flex items-start gap-2 print-hide animate-fade-in',
        isWarning
          ? 'border-secondary/40 bg-secondary/10 text-foreground'
          : 'border-primary/20 bg-primary/5 text-foreground',
        className,
      )}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', isWarning ? 'text-secondary' : 'text-primary')} />
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && (
          <p className={cn('font-semibold mb-0.5', isWarning ? 'text-secondary' : 'text-primary')}>{title}</p>
        )}
        <p className="text-muted-foreground">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar dica"
        className="absolute top-1 right-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1.5 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
