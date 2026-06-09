/**
 * useAdaptiveProfile — leitura única do ConsultiveProfile derivado.
 *
 * Hook seguro para componentes fora dos providers (Diagnostic /
 * Simulator). Quando contexto está ausente, devolve perfil
 * `unknown` sem quebrar a árvore.
 *
 * NÃO produz efeitos colaterais. NÃO chama edges. NÃO persiste.
 */
import { useMemo } from 'react';
import { useDiagnosticContextSafe } from '@/components/modules/diagnostic/DiagnosticContext';
import { useSimulatorContextSafe } from '@/components/modules/simulator/SimulatorContext';
import { deriveConsultiveProfile, type ConsultiveProfile } from './profile';

export function useAdaptiveProfile(): ConsultiveProfile {
  const diag = useDiagnosticContextSafe();
  const sim = useSimulatorContextSafe?.();

  return useMemo(
    () =>
      deriveConsultiveProfile({
        diagnostic: diag?.data ?? null,
        consolidated: diag?.clientProfile ?? null,
        behavior: diag?.clientBehavior ?? null,
        creditValue: sim?.input?.creditValue ?? null,
        fullInstallment: sim?.result?.fullInstallment ?? null,
        monthlyCapacity:
          diag?.data?.capacidadeMensal ?? diag?.data?.monthlyCapacity ?? null,
      }),
    [diag, sim]
  );
}
