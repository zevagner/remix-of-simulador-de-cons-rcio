/**
 * HelpHint — Ajuda contextual discreta.
 *
 * Padrão visual institucional: ícone (i) circular, click abre Popover
 * com resumo + insights consultivos curtos + link para artigos.
 *
 * Uso:
 *   <HelpHint surfaceId="simulator.installment-composition" />
 *
 * Princípios:
 *   - Discrição: ícone 14px, cor muted-foreground.
 *   - Disclosure progressivo: resumo curto → insights → "ver mais".
 *   - Zero poluição: NÃO usa em todo input. Só em pontos de decisão.
 *   - Telemetria opt-in via trackHelpInteraction.
 */
import { useEffect, useState } from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  getSurface,
  getSurfaceArticles,
  trackHelpInteraction,
  type ContextualInsight,
} from '@/lib/contextualHelp/registry';
import { consultiveBlockMeta } from '@/data/helpContent.meta';
import { cn } from '@/lib/utils';

interface HelpHintProps {
  surfaceId: string;
  /** Tamanho do ícone gatilho. Default 14px. */
  size?: 'sm' | 'md';
  /** Classe adicional no botão gatilho. */
  className?: string;
  /** Label sr-only customizado. */
  ariaLabel?: string;
}

const TONE_BORDER: Record<string, string> = {
  success: 'border-l-success/60',
  danger: 'border-l-destructive/60',
  info: 'border-l-primary/60',
  warning: 'border-l-warning/60',
  primary: 'border-l-primary/60',
  neutral: 'border-l-muted-foreground/40',
};

function InsightLine({ insight }: { insight: ContextualInsight }) {
  const meta = consultiveBlockMeta[insight.kind];
  return (
    <div className={cn('rounded-md bg-muted/40 border-l-2 px-2.5 py-2', TONE_BORDER[meta.tone])}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-xs leading-none">{meta.emoji}</span>
        <span className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
          {meta.label}
        </span>
      </div>
      <p className="text-xs text-foreground/85 leading-relaxed">{insight.body}</p>
    </div>
  );
}

export function HelpHint({ surfaceId, size = 'sm', className, ariaLabel }: HelpHintProps) {
  const [open, setOpen] = useState(false);
  const surface = getSurface(surfaceId);
  // Lazy: o catálogo institucional (~117 KB) só é carregado quando o
  // usuário abre o popover — não no mount do ícone.
  const [articles, setArticles] = useState<
    Array<{ article: { id: string; title: string }; categoryTitle: string }>
  >([]);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getSurfaceArticles(surfaceId).then((list) => {
      if (!cancelled) setArticles(list);
    });
    return () => { cancelled = true; };
  }, [open, surfaceId]);

  if (!surface) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[HelpHint] surfaceId desconhecido: ${surfaceId}`);
    }
    return null;
  }

  const iconSize = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) trackHelpInteraction(surfaceId, 'open');
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel ?? `Ajuda: ${surface.title}`}
          className={cn(
            'inline-flex items-center justify-center rounded-full text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors',
            size === 'md' ? 'h-6 w-6' : 'h-5 w-5',
            className
          )}
        >
          <HelpCircle className={iconSize} />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-80 p-0">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">{surface.title}</span>
            <Badge variant="secondary" className="text-micro uppercase tracking-wide ml-auto">
              Ajuda contextual
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{surface.summary}</p>
        </div>

        {surface.insights && surface.insights.length > 0 && (
          <div className="p-3 space-y-2 border-b">
            {surface.insights.map((ins, i) => (
              <InsightLine key={i} insight={ins} />
            ))}
          </div>
        )}

        {surface.riskNote && (
          <div className="p-3 border-b">
            <div className="rounded-md border-l-2 border-l-warning/60 bg-warning/5 px-2.5 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs">⚠️</span>
                <span className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                  Atenção
                </span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">{surface.riskNote}</p>
            </div>
          </div>
        )}

        {articles.length > 0 && (
          <div className="p-3">
            <div className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              Aprofundar na Central de Ajuda
            </div>
            <div className="space-y-1">
              {articles.map(({ article, categoryTitle }) => (
                <div
                  key={article.id}
                  className="flex items-start gap-1.5 text-xs text-foreground/80"
                  onClick={() => trackHelpInteraction(surfaceId, 'article-click')}
                >
                  <ArrowRight className="h-3 w-3 mt-0.5 text-muted-foreground/75 shrink-0" />
                  <span>
                    <span className="font-medium">{article.title}</span>
                    <span className="text-muted-foreground"> · {categoryTitle}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
