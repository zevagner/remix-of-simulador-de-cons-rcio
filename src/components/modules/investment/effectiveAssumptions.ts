import { 
  DEFAULT_ADMIN_FEE, 
  DEFAULT_RESERVE_FUND, 
  DEFAULT_TERM_MONTHS, 
  DEFAULT_CDI_RATE 
} from '@/config/consortiumRates';

/**
 * Mapeia premissas do simulador principal para o contexto de cálculo da aba Cash.
 * Restaura a lógica necessária para o useCashComparison.ts não quebrar.
 */
export function getEffectiveAssumptions(
  assumptions: any,
  params: any,
  mode: string = 'cash'
): any {
  if (mode === 'cash') {
    return {
      cdiRate: params.cashCdiRate ?? DEFAULT_CDI_RATE,
      cdiPercent: params.cashInvestmentRate ?? 100,
      termMonths: params.cashTermMonths ?? DEFAULT_TERM_MONTHS,
      cash: {
        propertyValue: params.cashPropertyValue ?? 0,
        embeddedBidPercent: params.cashEmbeddedBidPercent ?? 0,
        freeBidPercent: params.cashFreeBidPercent ?? 0,
        adminFee: params.cashAdminFee ?? DEFAULT_ADMIN_FEE,
        reserveFund: params.cashReserveFund ?? DEFAULT_RESERVE_FUND,
        reinvestSurplus: params.reinvestSurplus ?? false,
      }
    };
  }

  // Fallback para outros modos se necessário no futuro
  return {
    cash: {
      propertyValue: 0,
      embeddedBidPercent: 0,
      freeBidPercent: 0,
      adminFee: DEFAULT_ADMIN_FEE,
      reserveFund: DEFAULT_RESERVE_FUND,
      reinvestSurplus: false,
    }
  };
}
