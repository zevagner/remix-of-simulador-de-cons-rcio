import { useScrollHideHeader } from '@/hooks/useScrollHideHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useModuleShell } from '@/components/layout/ModuleShellContext';
import { JourneyProgressIndicator } from '@/components/layout/JourneyProgressIndicator';
import { SalesGuideTip } from '@/components/shared/SalesGuideTip';
import { getModuleTip } from '@/config/copy/moduleTips';

interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  /** Quando true, ignora o ModuleShellContext e sempre renderiza (usado pelo shell pai, ex: AnalysisModule). */
  forceShow?: boolean;
  /** ID do módulo atual — usado para o botão de guidance. */
  moduleId?: string;
  /** Oculta a faixa de orientação (próximo passo / progresso) abaixo do título. */
  hideGuidance?: boolean;
  /** Oculta apenas o SalesGuideTip contextual, preservando o JourneyProgressIndicator. */
  hideTip?: boolean;
}

export function ModuleHeader({ title, subtitle, forceShow = false, moduleId, hideGuidance = false, hideTip = false }: ModuleHeaderProps) {
  const isMobile = useIsMobile();
  const visible = useScrollHideHeader();
  const { suppressHeader } = useModuleShell();

  if (suppressHeader && !forceShow) return null;

  // Em mobile: agrupamos header + guidance em um único bloco animado para que
  // sumam/apareçam juntos no scroll, preservando a ordem (Header → Guidance → Conteúdo)
  // e evitando colisão entre o título reaparecendo e a faixa de orientação fixa.
  const collapsedOnMobile = isMobile && !visible;

  return (
    <div
      className={cn(
        'transition-transform duration-300 will-change-transform',
        // CLS fix: usar transform (compositor) ao invés de max-h (layout reflow).
        // Mantemos pointer-events-none + opacity para esconder visualmente sem
        // remover o slot do fluxo, evitando layout shift no scroll mobile.
        collapsedOnMobile && '-translate-y-full opacity-0 pointer-events-none',
        !collapsedOnMobile && 'translate-y-0 opacity-100',
      )}
    >
      <div data-shell-header="v2" className={cn('module-header tech-bg print-show', hideGuidance ? 'mb-4' : 'mb-3')}>
        <div className="module-header-content flex items-center">
          <div className="flex flex-col min-w-0 flex-1">
            {moduleId && (
              <span className="module-eyebrow hidden sm:inline-flex mb-1" aria-hidden="true">
                {moduleId}
              </span>
            )}
            <h1 className="module-header-title text-base sm:text-lg line-clamp-1 sm:line-clamp-2 break-words">{title}</h1>
            {subtitle && (
              <p className="module-header-subtitle hidden sm:block break-words line-clamp-2">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Faixa de orientação minimalista — apenas barra de progresso visual.
          Removidos: GlobalNextStepBar e badge "Copiloto sugere" (eram redundantes
          com dicas dentro dos módulos e geravam poluição visual no topo). */}
      {/* Faixa de orientação minimalista — barra de progresso visual + dica única
          contextual (uma por módulo, definida em config/copy/moduleTips). Removidos:
          GlobalNextStepBar e badge "Copiloto sugere" (eram redundantes). */}
      {!hideGuidance && (() => {
        const tip = getModuleTip(moduleId);
        return (
          <div className="print-hide mb-4 space-y-2">
            <JourneyProgressIndicator compact activeStepId={moduleId as never} />
            {tip && !hideTip && (
              <SalesGuideTip
                id={tip.id}
                message={tip.message}
                title={tip.title}
                variant={tip.variant}
              />
            )}
          </div>
        );
      })()}
    </div>
  );
}
