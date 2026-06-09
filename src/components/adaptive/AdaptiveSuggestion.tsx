/**
 * AdaptiveSuggestion — banner consultivo discreto.
 *
 * UX:
 *  - 1 linha, dismiss persistido por sessão (sessionStorage).
 *  - Nunca abre modal. Nunca interrompe fluxo.
 *  - Aparece apenas quando há sinal real (perfil com confidence ≥ 0.35).
 *
 * Princípio: ajuda o consultor a calibrar a próxima ação, sem
 * substituir o raciocínio dele.
 */
import { useState, useEffect } from 'react';
import { Lightbulb, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdaptiveSuggestion as Suggestion } from '@/lib/adaptive/recommendations';

interface Props {
  suggestion: Suggestion | null;
  onAct?: (s: Suggestion) => void;
  className?: string;
}

const TONE: Record<NonNullable<Suggestion['tone']>, string> = {
  info: 'border-l-primary/60 bg-primary/5',
  success: 'border-l-success/60 bg-success/5',
  warning: 'border-l-warning/60 bg-warning/5',
};

const STORAGE_KEY = 'adaptive:dismissed';

function readDismissed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeDismissed(set: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* noop */
  }
}

export function AdaptiveSuggestion({ suggestion, onAct, className }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => readDismissed());

  useEffect(() => {
    setDismissed(readDismissed());
  }, [suggestion?.id]);

  if (!suggestion || dismissed.has(suggestion.id)) return null;

  const tone = TONE[suggestion.tone ?? 'info'];

  const dismiss = () => {
    const next = new Set(dismissed);
    next.add(suggestion.id);
    writeDismissed(next);
    setDismissed(next);
  };

  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2 rounded-md border-l-2 px-3 py-2 text-xs',
        tone,
        className
      )}
    >
      <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-foreground/70 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-foreground/85 leading-relaxed">{suggestion.message}</p>
        {suggestion.rationale && (
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/85">
            <span className="font-medium text-muted-foreground">Por quê? </span>
            {suggestion.rationale}
          </p>
        )}
      </div>
      {onAct && (suggestion.targetModule || suggestion.trailId) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => onAct(suggestion)}
        >
          Abrir <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      )}
      <button
        type="button"
        aria-label="Dispensar sugestão"
        onClick={dismiss}
        className="h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground/75 hover:text-foreground hover:bg-muted/40"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
