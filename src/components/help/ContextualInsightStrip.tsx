/**
 * ContextualInsightStrip — Faixa inline com 1 insight consultivo do
 * surface, ideal para colocar logo abaixo de um resultado/decisão.
 *
 * Uso:
 *   <ContextualInsightStrip surfaceId="comparator.financing" />
 *
 * Diferente do HelpHint:
 *   - Sempre visível (não popover).
 *   - Mostra 1 insight curto + link "Aprofundar".
 *   - Ideal para "guided interpretation" pós-resultado.
 */
import { ArrowRight } from 'lucide-react';
import { getSurface, trackHelpInteraction } from '@/lib/contextualHelp/registry';
import { consultiveBlockMeta } from '@/data/helpContent.meta';
import { cn } from '@/lib/utils';

interface ContextualInsightStripProps {
  surfaceId: string;
  /** Índice do insight a renderizar (default 0). */
  insightIndex?: number;
  className?: string;
}

const TONE: Record<string, string> = {
  success: 'border-success/40 bg-success/5',
  danger: 'border-destructive/40 bg-destructive/5',
  info: 'border-primary/30 bg-primary/5',
  warning: 'border-warning/40 bg-warning/5',
  primary: 'border-primary/30 bg-primary/5',
  neutral: 'border-border bg-muted/30',
};

export function ContextualInsightStrip({
  surfaceId,
  insightIndex = 0,
  className,
}: ContextualInsightStripProps) {
  const surface = getSurface(surfaceId);
  if (!surface || !surface.insights || surface.insights.length === 0) return null;

  const insight = surface.insights[insightIndex];
  if (!insight) return null;

  const meta = consultiveBlockMeta[insight.kind];

  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2 flex items-start gap-2.5 text-xs',
        TONE[meta.tone],
        className
      )}
      onMouseEnter={() => trackHelpInteraction(surfaceId, 'insight-view')}
    >
      <span className="text-sm leading-none mt-0.5">{meta.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
            {meta.label}
          </span>
          <span className="text-caption text-muted-foreground/70 truncate">
            · {surface.title}
          </span>
        </div>
        <p className="text-foreground/85 leading-relaxed">{insight.body}</p>
      </div>
      <ArrowRight className="h-3 w-3 text-muted-foreground/70 mt-1 shrink-0" />
    </div>
  );
}
