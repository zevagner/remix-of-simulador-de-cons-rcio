/**
 * Tipos públicos da Engine de Financiamento (Onda B2).
 *
 * Toda parcela / saldo / amortização do app DEVE consumir estes shapes.
 * Componentes UI são puros consumers — não recompõem nem derivam matemática.
 */

export interface FinancingInstallment {
  month: number;
  amortization: number;
  interest: number;
  mip: number;
  dfi: number;
  adminFee: number;
  /** Parcela total = amortização + juros + MIP + DFI + adm. */
  payment: number;
  /** Saldo devedor após o mês (já corrigido por TR, se aplicável). */
  balance: number;
}

/**
 * Insumos canônicos do financiamento. Mesmo objeto alimenta Price e SAC,
 * garantindo paridade de hipóteses entre os dois sistemas.
 */
export interface FinancingScheduleInput {
  /** Valor financiado (propertyValue − entrada). */
  creditValue: number;
  /** Prazo em meses. */
  termMonths: number;
  /** Taxa de juros nominal anual (% a.a., ex.: 11.5). */
  annualInterestRate: number;
  /** Taxa MIP mensal (% a.m., ex.: 0.02 = 0,02%/mês). */
  mipMonthlyRate?: number;
  /** Taxa DFI mensal (% a.m.). */
  dfiMonthlyRate?: number;
  /** Tarifa administrativa mensal em R$. */
  adminFeeMonthly?: number;
  /** Valor do bem (default: creditValue). DFI incide sobre este valor. */
  propertyValue?: number;
  /** Correção monetária mensal da TR (% a.m.). 0 = nominal puro. */
  trMonthlyRate?: number;
}

export interface FinancingScheduleResult {
  /** Parcela "limpa" (juros + amortização) do 1º mês — referência de UI. */
  monthlyPaymentReference: number;
  /** Soma juros + amortização ao longo do prazo (sem seguros/adm). */
  totalCost: number;
  totalMIP: number;
  totalDFI: number;
  totalAdminFee: number;
  /** totalCost + MIP + DFI + adm. */
  totalWithInsurance: number;
  table: FinancingInstallment[];
}

/**
 * Resultado consolidado Price + SAC. Espelha a interface histórica
 * (`calculateFinancingCost`) para preservar consumers existentes.
 */
export interface FinancingResult {
  // Price
  priceMonthlyPayment: number;
  priceTotalCost: number;
  priceTotalMIP: number;
  priceTotalDFI: number;
  priceTotalAdminFee: number;
  priceTotalWithInsurance: number;
  priceTable: FinancingInstallment[];
  // SAC
  sacFirstPayment: number;
  sacLastPayment: number;
  sacTotalCost: number;
  sacTotalMIP: number;
  sacTotalDFI: number;
  sacTotalAdminFee: number;
  sacTotalWithInsurance: number;
  sacTable: FinancingInstallment[];
}
