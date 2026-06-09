/**
 * AppProviders — composição ÚNICA dos providers de sessão consultiva.
 *
 * Wave: Provider Consolidation & State Boundary Pass.
 *
 * Objetivo: substituir a "Provider Lasagna" (9 níveis aninhados em Index.tsx)
 * por um único wrapper com ownership documentado e ordem canônica.
 *
 * REGRAS (não violar):
 *  - NÃO recalcula nada. NÃO introduz engines novas.
 *  - NÃO altera contratos dos providers internos.
 *  - Mantém ordem topológica original (dependências entre contexts preservadas).
 *  - Apenas reduz superfície visual e centraliza a ownership mental.
 *
 * Ownership canônica (resumo — ver audit em
 *   .lovable/audit/provider-consolidation-state-boundary-pass.md):
 *
 *   ModuleNavigationProvider  → navegação entre módulos (efêmero, UI)
 *   DiagnosticProvider        → perfil/diagnóstico do cliente
 *   SimulatorProvider         → motor financeiro canônico (FONTE ÚNICA)
 *   ClientJourneyProvider     → jornada de venda (CRM/etapa)
 *   InvestmentResultsProvider → publicação read-only dos paths
 *   BidsStudyProvider         → publicação read-only do estudo de lances
 *   SelectedGroupProvider     → seleção (tipo + grupo) compartilhada Bids ↔ Assembléias
 *   ActiveStrategyProvider    → estratégia consultiva ativa (Wealth ↔ Proposta)
 *   StructuredOpsResultsProvider → operação multi-cartas (publicação)
 *
 * Consumidor read-only canônico: useProposalData() em src/contexts/proposal.
 */
import type { ReactNode } from 'react';
import { ModuleNavigationProvider } from '@/components/layout/ModuleNavigationContext';
import { SimulatorProvider } from '@/components/modules/simulator/SimulatorContext';
import { DiagnosticProvider } from '@/components/modules/diagnostic/DiagnosticContext';
import { ClientJourneyProvider } from '@/components/layout/ClientJourneyContext';
import { InvestmentResultsProvider } from '@/contexts/InvestmentResultsContext';
import { BidsStudyProvider } from '@/contexts/BidsStudyContext';
import { SelectedGroupProvider } from '@/contexts/SelectedGroupContext';
import { ActiveStrategyProvider } from '@/contexts/ActiveStrategyContext';
import { StructuredOpsResultsProvider } from '@/contexts/StructuredOpsResultsContext';

interface AppProvidersProps {
  children: ReactNode;
  /** Callback de navegação consumido pelo ModuleNavigationProvider (CTAs). */
  onModuleChange: (id: string) => void;
}

export function AppProviders({ children, onModuleChange }: AppProvidersProps) {
  return (
    <ModuleNavigationProvider onModuleChange={onModuleChange}>
      <DiagnosticProvider>
        <SimulatorProvider>
          <ClientJourneyProvider>
            <InvestmentResultsProvider>
              <BidsStudyProvider>
                <SelectedGroupProvider>
                  <ActiveStrategyProvider>
                    <StructuredOpsResultsProvider>
                      {children}
                    </StructuredOpsResultsProvider>
                  </ActiveStrategyProvider>
                </SelectedGroupProvider>
              </BidsStudyProvider>
            </InvestmentResultsProvider>
          </ClientJourneyProvider>
        </SimulatorProvider>
      </DiagnosticProvider>
    </ModuleNavigationProvider>
  );
}
