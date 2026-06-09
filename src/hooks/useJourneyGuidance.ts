import { useMemo } from 'react';
import { SimulationInput } from '@/types/consortium';

export interface JourneyStep {
  /** Target module to navigate to */
  targetModule: string;
  /** Short label for the CTA button */
  label: string;
  /** Contextual message explaining why */
  message: string;
  /** Icon key for rendering */
  icon: 'trending-up' | 'bar-chart' | 'settings' | 'message-square' | 'sparkles';
  /** Priority (lower = more important) */
  priority: number;
}

interface JourneyGuidanceInput {
  currentModule: string;
  creditValue: number;
  termMonths: number;
  hasSimulationResult: boolean;
  hasBidStudy: boolean;
  hasSelectedGroup: boolean;
  contemplated: boolean;
}

/**
 * Determines the best next step for the user based on their current context.
 * Returns at most 1 primary suggestion and 1 secondary suggestion.
 */
export function useJourneyGuidance(input: JourneyGuidanceInput): {
  primary: JourneyStep | null;
  secondary: JourneyStep | null;
} {
  return useMemo(() => {
    const { currentModule, creditValue, termMonths, hasSimulationResult, hasBidStudy, hasSelectedGroup, contemplated } = input;
    const hasValidSimulation = creditValue > 0 && termMonths > 0;

    const suggestions: JourneyStep[] = [];

    switch (currentModule) {
      case 'simulator': {
        if (hasSimulationResult) {
          suggestions.push({
            targetModule: 'investment',
            label: 'Ver como investimento',
            message: `Descubra o potencial de valorização desta carta de ${formatShortCurrency(creditValue)}`,
            icon: 'trending-up',
            priority: 1,
          });
          suggestions.push({
            targetModule: 'bids',
            label: 'Avaliar chance de contemplação',
            message: 'Veja o histórico de lances e suas chances reais de ser contemplado',
            icon: 'bar-chart',
            priority: 2,
          });
          if (contemplated) {
            suggestions.push({
              targetModule: 'comparator',
              label: 'Comparar com financiamento',
              message: 'Compare o consórcio com outras modalidades de crédito',
              icon: 'settings',
              priority: 3,
            });
          }
        }
        break;
      }

      case 'investment': {
        if (hasValidSimulation) {
          suggestions.push({
            targetModule: 'bids',
            label: 'Estudo de lances',
            message: 'Entenda quanto ofertar e suas chances de contemplação neste cenário',
            icon: 'bar-chart',
            priority: 1,
          });
          suggestions.push({
            targetModule: 'simulator',
            label: 'Ajustar simulação',
            message: 'Refine os parâmetros para otimizar o resultado',
            icon: 'settings',
            priority: 2,
          });
        } else {
          suggestions.push({
            targetModule: 'simulator',
            label: 'Começar simulação',
            message: 'Configure os parâmetros do consórcio para análise de investimento',
            icon: 'settings',
            priority: 1,
          });
        }
        break;
      }

      case 'bids': {
        if (hasSelectedGroup && hasBidStudy) {
          suggestions.push({
            targetModule: 'simulator',
            label: 'Simular com este lance',
            message: 'Teste a estratégia de lance diretamente na simulação e veja o impacto na parcela',
            icon: 'sparkles',
            priority: 1,
          });
        }
        if (!hasValidSimulation) {
          suggestions.push({
            targetModule: 'simulator',
            label: 'Testar variação do lance',
            message: 'Configure valor e prazo para simular diferentes cenários de lance',
            icon: 'settings',
            priority: 2,
          });
        }
        break;
      }

      case 'comparator': {
        suggestions.push({
          targetModule: 'simulator',
          label: 'Voltar ao simulador',
          message: 'Ajuste os parâmetros com base na comparação',
          icon: 'settings',
          priority: 1,
        });
        if (hasValidSimulation) {
          suggestions.push({
            targetModule: 'bids',
            label: 'Ver lances',
            message: 'Avalie as chances de contemplação',
            icon: 'bar-chart',
            priority: 2,
          });
        }
        break;
      }

      default:
        break;
    }

    suggestions.sort((a, b) => a.priority - b.priority);

    return {
      primary: suggestions[0] ?? null,
      secondary: suggestions[1] ?? null,
    };
  }, [input]);
}

function formatShortCurrency(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}mil`;
  return `R$ ${value.toFixed(0)}`;
}
