/**
 * PortfolioInsightsBar — Onda 5 (silenciosa).
 * Faixa contextual leve no topo da Carteira / Pós-venda.
 * Renderiza no máximo 2 sinais. Sem hero, sem dashboard.
 */
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PortfolioSignal, PortfolioSignalTone } from '@/utils/portfolioSignals';
import { cn } from '@/lib/utils';

const TONE_CLASSES: Record<PortfolioSignalTone, string> = {
  info: 'bg-muted/40 text-muted-foreground border-border/60',
  warn: 'bg-warning/10 text-warning border-warning/30',
  positive: 'bg-primary/10 text-primary border-primary/30',
};

export interface PortfolioInsightsBarProps {
  signals: PortfolioSignal[];
  /** Máx. visível — default 2 (regra Onda 5). */
  max?: number;
  className?: string;
}

export function PortfolioInsightsBar({ signals, max = 2, className }: PortfolioInsightsBarProps) {
  const visible = signals.slice(0, max);
  if (visible.length === 0) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 px-1',
          className,
        )}
        aria-label="Visão estratégica da carteira"
      >
        {visible.map((s) => (
          <Tooltip key={s.kind}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                  'cursor-help transition-colors',
                  TONE_CLASSES[s.tone],
                )}
              >
                <span aria-hidden>{s.emoji}</span>
                <span>{s.label}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[260px] text-xs leading-relaxed">
              {s.hint}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
