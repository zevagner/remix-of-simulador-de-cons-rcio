import { CheckCircle2, Circle, Sparkles, Dot } from 'lucide-react';
import { useClientJourney, type JourneyStepId } from '@/components/layout/ClientJourneyContext';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import { useCopilotRecommendedStep } from '@/hooks/useCopilotRecommendedStep';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Indicador de progresso (mapa de etapas) — NÃO impõe fluxo.
 *
 * - Mostra estado de cada passo (concluído / atual / pendente).
 * - Permite navegação livre clicando em qualquer passo.
 * - Destaca o passo *recomendado pelo copiloto* quando há gatilho ativo
 *   (custo alto, lance embutido, cliente parado, risco pós-venda).
 * - Não exibe CTA do tipo "próximo passo obrigatório" — quem orienta
 *   ações é o CopilotCard. Aqui é apenas mapa + indicação visual.
 */
export function JourneyProgressIndicator({
  compact = false,
  activeStepId,
}: {
  compact?: boolean;
  /** Passo atualmente em foco (módulo ativo). Se omitido, derivamos do primeiro pendente. */
  activeStepId?: JourneyStepId;
}) {
  const { steps, totalSteps } = useClientJourney();
  const { navigateTo } = useModuleNavigation();
  const recommended = useCopilotRecommendedStep();

  const completed = steps.filter(s => s.done).length;
  const percent = Math.round((completed / totalSteps) * 100);

  const currentId: JourneyStepId | undefined =
    activeStepId ?? (steps.find(s => !s.done)?.id as JourneyStepId | undefined);

  if (compact) {
    // Topo: apenas a barra visual de progresso. Sem texto redundante e sem
    // badge de "Copiloto sugere" (já há GlobalNextStepBar como orientação única).
    return (
      <div
        className="h-1 w-full rounded-full bg-muted overflow-hidden print-hide"
        title={`${completed} de ${totalSteps} etapas concluídas`}
        aria-label={`Progresso da jornada: ${completed} de ${totalSteps}`}
      >
        <div className="h-full bg-primary transition-[colors,box-shadow,transform]" style={{ width: `${percent}%` }} />
      </div>
    );
  }

  return (
    <div className="print-hide rounded-lg border border-border bg-card/50 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-semibold text-foreground">
          Progresso da jornada — {completed} de {totalSteps}
        </span>
        <span className="text-xs text-muted-foreground">{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-[colors,box-shadow,transform]" style={{ width: `${percent}%` }} />
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {steps.map(step => {
          const isCurrent = step.id === currentId;
          const isRecommended = step.id === recommended.stepId;
          return (
            <button
              key={step.id}
              onClick={() => navigateTo(step.id)}
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-caption transition-colors border',
                step.done
                  ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                  : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/70',
                isCurrent && 'ring-1 ring-primary/40',
                isRecommended && 'border-primary/60 bg-primary/15 text-primary',
              )}
              title={
                isRecommended
                  ? `Recomendado pelo copiloto — ${recommended.reason}`
                  : step.done ? 'Concluído' : 'Pendente'
              }
            >
              {step.done
                ? <CheckCircle2 className="h-3 w-3" />
                : isCurrent ? <Dot className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              {step.label}
              {isRecommended && (
                <Sparkles className="h-3 w-3 text-primary" />
              )}
            </button>
          );
        })}
      </div>
      {recommended.stepId && (
        <p className="text-caption text-muted-foreground pt-0.5">
          <span className="font-medium text-primary">Copiloto:</span>{' '}
          revisar <span className="font-medium">{labelOf(steps, recommended.stepId)}</span> — {recommended.reason}
        </p>
      )}
    </div>
  );
}

function labelOf(steps: ReturnType<typeof useClientJourney>['steps'], id: JourneyStepId): string {
  return steps.find(s => s.id === id)?.label ?? id;
}
