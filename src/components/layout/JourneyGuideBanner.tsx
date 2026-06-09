import { useModuleNavigation } from './ModuleNavigationContext';
import { JourneyStep } from '@/hooks/useJourneyGuidance';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Settings2, MessageSquare, Sparkles, ArrowRight, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const ICON_MAP = {
  'trending-up': TrendingUp,
  'bar-chart': BarChart3,
  'settings': Settings2,
  'message-square': MessageSquare,
  'sparkles': Sparkles,
} as const;

const DISMISSED_KEY = 'journey-banner-dismissed';

function getDismissedSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persistDismissed(set: Set<string>) {
  try {
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
  } catch { /* noop */ }
}

interface JourneyGuideBannerProps {
  primary: JourneyStep | null;
  secondary?: JourneyStep | null;
}

export function JourneyGuideBanner({ primary, secondary }: JourneyGuideBannerProps) {
  const [dismissedSet, setDismissedSet] = useState<Set<string>>(getDismissedSet);
  const { navigateTo } = useModuleNavigation();

  // Sync on mount
  useEffect(() => {
    setDismissedSet(getDismissedSet());
  }, []);

  const dismiss = useCallback(() => {
    if (!primary) return;
    const key = `${primary.targetModule}`;
    setDismissedSet(prev => {
      const next = new Set(prev);
      next.add(key);
      persistDismissed(next);
      return next;
    });
  }, [primary]);

  if (!primary || dismissedSet.has(primary.targetModule)) return null;

  const PrimaryIcon = ICON_MAP[primary.icon];

  return (
    <div className="relative rounded-lg border border-primary/20 bg-primary/5 p-4 print-hide animate-fade-in">
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Fechar sugestão"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-10">
        <div className="rounded-full bg-primary/10 p-2 mt-0.5 flex-shrink-0">
          <PrimaryIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Próximo passo recomendado</p>
          <p className="text-xs text-muted-foreground mt-0.5">{primary.message}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              size="sm"
              variant="default"
              className="gap-1.5 h-9 min-h-[44px] text-xs"
              onClick={() => navigateTo(primary.targetModule)}
            >
              {primary.label}
              <ArrowRight className="h-3 w-3" />
            </Button>
            {secondary && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 h-9 min-h-[44px] text-xs text-muted-foreground"
                onClick={() => navigateTo(secondary.targetModule)}
              >
                {secondary.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
