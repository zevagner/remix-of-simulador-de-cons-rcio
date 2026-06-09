/**
 * useProposalData — façade de LEITURA.
 *
 * Ponto único de entrada para todos os dados que alimentam a Proposta/PDF.
 * NÃO mantém estado próprio. NÃO recalcula. Apenas reexporta os contexts
 * já existentes em uma única chamada, de forma tipada.
 *
 * Regras de fonte única (não violar):
 *  - simulation        → SimulatorContext
 *  - diagnostic        → DiagnosticContext
 *  - journey           → ClientJourneyContext
 *  - investment        → InvestmentResultsContext
 *  - bidsStudy         → BidsStudyContext
 *  - selectedGroup     → SelectedGroupContext
 *  - activeStrategy    → ActiveStrategyContext (escolha consultiva ativa)
 *  - structuredOps     → StructuredOpsResultsContext (operação multi-cartas)
 */
import { useSimulatorContext } from '@/components/modules/simulator/SimulatorContext';
import { useDiagnosticContextSafe } from '@/components/modules/diagnostic/DiagnosticContext';
import { useClientJourneySafe } from '@/components/layout/ClientJourneyContext';
import { useInvestmentResults, type InvestmentResults } from '@/contexts/InvestmentResultsContext';
import { useBidsStudyResults, type BidsStudyResults } from '@/contexts/BidsStudyContext';
import { useSelectedGroupSafe, type SelectedGroup } from '@/contexts/SelectedGroupContext';
import { useActiveStrategySafe, type ActiveStrategy } from '@/contexts/ActiveStrategyContext';
import { useStructuredOpsResults, type StructuredOpsResults } from '@/contexts/StructuredOpsResultsContext';

export interface ProposalData {
  simulation: ReturnType<typeof useSimulatorContext>;
  diagnostic: ReturnType<typeof useDiagnosticContextSafe>;
  journey: ReturnType<typeof useClientJourneySafe>;
  investment: InvestmentResults | null;
  bidsStudy: BidsStudyResults | null;
  selectedGroup: SelectedGroup | null;
  activeStrategy: ActiveStrategy | null;
  structuredOps: StructuredOpsResults | null;
}

export function useProposalData(): ProposalData {
  const simulation = useSimulatorContext();
  const diagnostic = useDiagnosticContextSafe();
  const journey = useClientJourneySafe();
  const { results: investment } = useInvestmentResults();
  const { results: bidsStudy } = useBidsStudyResults();
  const selectedGroupCtx = useSelectedGroupSafe();
  const activeStrategyCtx = useActiveStrategySafe();
  const { results: structuredOps } = useStructuredOpsResults();

  return {
    simulation,
    diagnostic,
    journey,
    investment,
    bidsStudy,
    selectedGroup: selectedGroupCtx?.selectedGroup ?? null,
    activeStrategy: activeStrategyCtx?.activeStrategy ?? null,
    structuredOps,
  };
}
