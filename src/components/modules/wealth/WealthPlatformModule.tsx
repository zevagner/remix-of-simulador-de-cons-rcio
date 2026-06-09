/**
 * WealthPlatformModule — Estratégias Patrimoniais
 *
 * Surface única: o módulo não renderiza uma camada superior de teses V2
 * separada da biblioteca. Todas as estratégias aparecem no mesmo sistema de
 * cards, em uma única sequência editorial dentro de StrategyLibrarySection.
 */
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { useTrackModuleAccess } from '@/hooks/useTrackModuleAccess';
import { StrategyLibrarySection } from './StrategyLibrarySection';
import { WealthOperationalBar } from './WealthOperationalBar';
import { WealthPdfSelectionBar } from './WealthPdfSelectionBar';
import { WealthAssumptionsProvider } from '@/contexts/WealthAssumptionsContext';
import { WealthPdfSelectionProvider } from '@/contexts/WealthPdfSelectionContext';

export function WealthPlatformModule() {
  useTrackModuleAccess('analysis-wealth');

  return (
    <WealthAssumptionsProvider>
     <WealthPdfSelectionProvider>
      <div className="space-y-10 md:space-y-14" data-wealth-platform="v1">
        <ModuleHeader
          moduleId="wealth"
          title="Estratégias Patrimoniais"
          subtitle="Mesa consultiva única — premissas vivas propagadas para todos os cards"
          forceShow
        />



        <WealthOperationalBar />

        <StrategyLibrarySection />
      </div>
      <WealthPdfSelectionBar />
     </WealthPdfSelectionProvider>
    </WealthAssumptionsProvider>
  );
}
