/**
 * useCentralAI — hook que injeta automaticamente o ClientJourneyContext
 * em todas as chamadas, garantindo coerência sistêmica.
 *
 * Uso:
 *   const { generateInsight, streamInsight, ready } = useCentralAI();
 *   const result = await generateInsight('summary');
 *   if (!result.ok) toast.error(result.message);
 */
import { useCallback } from 'react';
import { useClientJourney } from '@/components/layout/ClientJourneyContext';
import {
  generateInsight as rawGenerateInsight,
  streamInsight as rawStreamInsight,
  type CentralAIIntent,
  type CentralAIResult,
  type StreamInsightInput,
} from '@/services/centralAI';

export interface UseCentralAIOptions {
  /** Mensagem do cliente (necessária apenas para `objection_handling`). */
  clientMessage?: string;
}

export function useCentralAI() {
  const journey = useClientJourney();

  const generateInsight = useCallback(
    (intent: CentralAIIntent, opts?: UseCentralAIOptions): Promise<CentralAIResult> => {
      return rawGenerateInsight({
        context: journey,
        intent,
        clientMessage: opts?.clientMessage,
      });
    },
    [journey],
  );

  const streamInsight = useCallback(
    (
      intent: CentralAIIntent,
      handlers: Pick<StreamInsightInput, 'onDelta' | 'onDone' | 'onError' | 'signal'>,
      opts?: UseCentralAIOptions,
    ) => {
      return rawStreamInsight({
        context: journey,
        intent,
        clientMessage: opts?.clientMessage,
        ...handlers,
      });
    },
    [journey],
  );

  return {
    /** Pronto para gerar insights que dependem da simulação. */
    ready: journey.simulation.isValid,
    /** Recomendação determinística atual (do decisionEngine). */
    recommendation: journey.recommendation,
    /** Próximo passo sugerido (mesma lógica do indicador visual). */
    nextStep: journey.nextStep,
    generateInsight,
    streamInsight,
  };
}
