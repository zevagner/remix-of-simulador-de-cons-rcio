import { Tabs, TabsContent } from '@/components/ui/tabs';
import { PillToggle } from '@/components/ui/pill-toggle';
import { ConsortiumType, CONSORTIUM_TYPE_LABELS } from '@/types/consortium';
import { Building2, Car, Truck } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintableParams } from '@/components/print/PrintableParams';
import { CommercialInsights } from '@/components/modules/assemblies/CommercialInsights';
import { ModuleSkeleton } from '@/components/ui/ModuleSkeleton';
import { useState } from 'react';

import { AssembliesToolbar } from './assemblies/AssembliesToolbar';
import {
  AssembliesStatsCards,
  AssembliesGroupSelector,
  AssembliesGroupDetail,
  AssembliesEmptyStates,
} from './assemblies/AssembliesContent';
import { BestGroupsForBid } from './assemblies/BestGroupsForBid';
import { useTrackModuleAccess } from '@/hooks/useTrackModuleAccess';
import { useAssembliesView, useAssembliesLegacyBootstrap } from '@/hooks/useAssembliesView';
import { AdaptiveSuggestion } from '@/components/adaptive/AdaptiveSuggestion';
import { useAdaptiveProfile } from '@/lib/adaptive/useAdaptiveProfile';
import { suggestNextModule } from '@/lib/adaptive/recommendations';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';

export function AssembliesModule() {
  useTrackModuleAccess('assemblies');
  const view = useAssembliesView();
  useAssembliesLegacyBootstrap(view.assemblies, view.isLoading);
  const [showInsights, setShowInsights] = useState(false);
  const profile = useAdaptiveProfile();
  const adaptive = suggestNextModule('analysis', profile);
  const { navigateTo } = useModuleNavigation();


  if (view.isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <ModuleHeader title="Assembleias" subtitle="Identifique os melhores grupos por histórico" />
        <ModuleSkeleton />
      </div>
    );
  }

  const { assemblies, selectedTab, setSelectedTab, selectedGroupNumber, stats } = view;

  return (
    <div className="space-y-5 animate-fade-in">
      <ModuleHeader title="Assembleias" subtitle="Identifique os melhores grupos por histórico" />

      {adaptive && (
        <AdaptiveSuggestion
          suggestion={adaptive}
          onAct={(s) => s.targetModule && navigateTo(s.targetModule)}
        />
      )}

      <PrintHeader moduleName="Assembleias" consortiumType={CONSORTIUM_TYPE_LABELS[selectedTab]} />

      <PrintableParams
        title="Dados da Consulta"
        params={[
          { label: 'Tipo de Consórcio', value: CONSORTIUM_TYPE_LABELS[selectedTab] },
          { label: 'Grupo Selecionado', value: selectedGroupNumber ? `Grupo ${selectedGroupNumber}` : 'Nenhum' },
          { label: 'Total Assembleias', value: stats.totalAssemblies.toString() },
          { label: 'Grupos Cadastrados', value: stats.totalGroups.toString() },
        ]}
      />

      <div id="assemblies-toolbar">
        <AssembliesToolbar
          assemblies={assemblies}
          showInsights={showInsights}
          setShowInsights={setShowInsights}
        />
      </div>

      <CommercialInsights assemblies={assemblies} visible={showInsights} />

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as ConsortiumType)}>
        <div id="assemblies-tabs">
          <PillToggle<ConsortiumType>
            ariaLabel="Tipo de consórcio"
            value={selectedTab}
            onChange={(v) => setSelectedTab(v)}
            options={[
              { value: 'imobiliario', label: <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />Imobiliário</span> },
              { value: 'auto', label: <span className="inline-flex items-center gap-1.5"><Car className="h-3.5 w-3.5" />Veículos</span> },
              { value: 'pesados', label: <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" />Pesados</span> },
            ]}
          />
        </div>

        <TabsContent value={selectedTab} className="mt-4">
          <div id="assemblies-group-selector" className="mb-6">
            <AssembliesGroupSelector
              selectedTab={selectedTab}
              selectedGroupNumber={selectedGroupNumber}
              setSelectedGroupNumber={view.setSelectedGroupNumber}
              availableGroups={view.availableGroups}
            />
          </div>
          <AssembliesStatsCards stats={stats} selectedTab={selectedTab} />
          <div id="assemblies-best-groups">
            <BestGroupsForBid assemblies={assemblies} selectedTab={selectedTab} />
          </div>
          <AssembliesGroupDetail
            selectedTab={selectedTab}
            selectedGroupNumber={selectedGroupNumber}
            latestValidRecord={view.latestValidRecord}
          />
          <AssembliesEmptyStates
            selectedTab={selectedTab}
            selectedGroupNumber={selectedGroupNumber}
            latestValidRecord={view.latestValidRecord}
            availableGroups={view.availableGroups}
          />
        </TabsContent>
      </Tabs>

      <PrintFooter />
    </div>
  );
}
