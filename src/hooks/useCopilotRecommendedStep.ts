/**
 * useCopilotRecommendedStep — mapeia gatilhos do copiloto para o passo de jornada
 * que o usuário deveria revisitar. Não bloqueia nada — apenas sinaliza.
 *
 * Mapeamento:
 *  - custo_alto         → 'analysis'  (revisar cenário / comparativo)
 *  - lance_embutido     → 'analysis'  (estudo de lances)
 *  - cliente_parado     → 'proposals' (carteira / follow-up)
 *  - risco_alto_pos_venda → 'post-sale'
 */
import { useMemo } from 'react';
import { useCopilotTriggers, type CopilotTriggerInput } from '@/hooks/useCopilotTriggers';
import type { JourneyStepId } from '@/components/layout/ClientJourneyContext';

export interface CopilotRecommendedStep {
  stepId: JourneyStepId | null;
  reason: string | null;
}

const PRIORITY: Array<{ key: string; stepId: JourneyStepId; label: string }> = [
  { key: 'risco_alto_pos_venda', stepId: 'post-sale', label: 'Cliente com alto risco de desistência' },
  { key: 'cliente_parado',       stepId: 'proposals', label: 'Cliente sem contato — risco de perda' },
  { key: 'custo_alto',           stepId: 'analysis',  label: 'Custo bem acima do crédito — revisar cenário' },
  { key: 'lance_embutido',       stepId: 'analysis',  label: 'Parte do crédito não será recebida pelo cliente' },
];

export function useCopilotRecommendedStep(input: CopilotTriggerInput = {}): CopilotRecommendedStep {
  const triggers = useCopilotTriggers(input);
  return useMemo(() => {
    if (!triggers.fired) return { stepId: null, reason: null };
    for (const p of PRIORITY) {
      if (triggers.reasons.some(r => r.startsWith(p.key))) {
        return { stepId: p.stepId, reason: p.label };
      }
    }
    return { stepId: null, reason: null };
  }, [triggers]);
}
