/**
 * Types shared across the Investment module sub-components.
 * Legacy shim for compatibility during migration.
 */
export type TipoVendaCarta = 'cota-nao-contemplada' | 'carta-contemplada';

export interface Assumptions {
  propertyAppreciation: number;
  investmentReturn: number;
  rentalYield: number;
  analysisMonths: number;
  discountOnSale: number;
  agioOnSale: number;
  tipoVendaCarta: TipoVendaCarta;
  cdiPercent: number;
  cdiRate: number;
  contemplationMonthOverride: number;
  previdenciaTermMonths: number;
  previdenciaINPC: number;
  inpcAnnualPercent: number;
}

export const DEFAULT_ASSUMPTIONS: any = {};


export interface PathResult {
  totalPaid: number;
  finalResult: number;
  absoluteGain: number;
  percentGain: number;
  paidUntilContemplation?: number;
}

export interface PrevidenciaTurbinadaRow {
  month: number;
  creditLetterCorrected: number;
  monthlyPayment: number;
  accumulatedPaid: number;
}

export interface InvestmentCalculations {
  totalPaid: number;
  paidUntilContemplation: number;
  estimatedInstallment: number;
  adminFee: number;
  reserveFund: number;
  insurance: number;
  path1: PathResult;
  path2: PathResult & { paidUntilContemplation: number; tipoVenda: TipoVendaCarta; breakevenMonth: number | null };
  path3: PathResult & { monthlyRent: number; totalRentIncome: number };
  path4: PathResult & { grossResult: number; rendimento: number; irAliquota: number; irValue: number };
  path5: PathResult & { grossResult: number; rendimento: number; irAliquota: number; irValue: number };
  path6: PathResult & { finalCreditLetter: number; table: PrevidenciaTurbinadaRow[] };
}

export interface ScenarioResult {
  id: string;
  name: string;
  shortDesc: string;
  icon: any;
  totalPaid: number;
  finalResult: number;
  absoluteGain: number;
  percentGain: number;
  details: string;
  color: string;
  category: string;
  grossResult?: number;
  irAliquota?: number;
  irValue?: number;
}
