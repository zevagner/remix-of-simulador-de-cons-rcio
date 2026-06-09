/**
 * GlobalNextStepBar — barra global e discreta com o próximo passo recomendado.
 *
 * - Ler do ClientJourneyContext (não exige input).
 * - Fica oculta quando o fluxo terminou ou não há simulação utilizável ainda.
 * - Dispensável (botão X) por sessão para não poluir.
 */
import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClientJourneySafe } from '@/components/layout/ClientJourneyContext';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'global-next-step-dismissed-step';

export function GlobalNextStepBar({ className }: { className?: string }) {
  const journey = useClientJourneySafe();
  const { navigateTo } = useModuleNavigation();
  const [dismissedFor, setDismissedFor] = useState<string | null>(() => {
    try { return sessionStorage.getItem(DISMISS_KEY); } catch { return null; }
  });

  useEffect(() => {
    if (!dismissedFor) return;
    try { sessionStorage.setItem(DISMISS_KEY, dismissedFor); } catch { /* noop */ }
  }, [dismissedFor]);

  if (!journey) return null;
  const next = journey.nextStep;
  if (!next) return null;
  if (dismissedFor === next.id) return null;

  return (
    <div
      className={cn(
        'print-hide flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 text-xs cursor-pointer',
        'bg-primary/5 border-b border-primary/15 text-foreground hover:bg-primary/10 transition-colors',
        className,
      )}
      role="button"
      tabIndex={0}
      onClick={() => navigateTo(next.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateTo(next.id);
        }
      }}
    >
      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="text-muted-foreground shrink-0">Próximo passo:</span>
      {/* line-clamp-2 garante texto completo (sem cortar "Diag...") em até 2 linhas */}
      <span className="font-medium line-clamp-2 break-words min-w-0 flex-1">{next.label}</span>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 gap-1 px-2 text-xs text-primary hover:bg-primary/15 ml-auto shrink-0"
        onClick={(e) => { e.stopPropagation(); navigateTo(next.id); }}
      >
        Ir agora <ArrowRight className="h-3 w-3" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0"
        aria-label="Dispensar sugestão"
        onClick={(e) => { e.stopPropagation(); setDismissedFor(next.id); }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
