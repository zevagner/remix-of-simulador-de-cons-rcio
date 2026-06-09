import type { ConsortiumType } from '@/types/consortium';
import type { ProposalBlockDef } from '@/utils/proposalPdf/sections';
import type { DecisionOutput } from '@/utils/decisionEngine';

// ════════ TYPES ════════
export interface PdfPropostaCompletaData {
  clientName: string;
  managerName?: string;
  managerRole?: string;
  agencyName?: string;
  managerPhone?: string;
  managerWhatsapp?: string;
  managerEmail?: string;
  logoDataUrl?: string;

  diagnostic: {
    objetivo?: string;
    subObjetivo?: string;
    capacidadeMensal: number;
    temCapital: boolean;
    capitalDisponivel: number;
    urgencia?: string;
    situacao?: string;
    /** Prioridade declarada (menor_parcela, menor_custo, rapidez, manter_liquidez) */
    prioridade?: string;
  };

  simulation: {
    consortiumType: ConsortiumType;
    creditValue: number;
    termMonths: number;
    installment: number;
    effectiveClientCost: number;
    totalCost: number;
    freeBidValue?: number;
    embeddedBidValue?: number;
    fullInstallment?: number;
    installmentBeforeContemplation?: number;
    reducedInstallmentValue?: number;
    reducedInstallmentMonths?: number;
    /** Reajuste INPC anual aplicado (% a.a.). 0 = sem reajuste (padrão CAIXA). */
    annualAdjustmentPercent?: number;
  };

  recommendation: DecisionOutput | null;

  comparisons?: {
    financingTotal?: number;
    financingMonthly?: number;
    financingRate?: number;
    cashImpact?: string;
  };

  strategy?: {
    bidPercent?: number;
    bidValue?: number;
    contemplationMonth?: number;
    incomeMonthly?: number;
    saleProfit?: number;
  };

  /**
   * Espelho estruturado de `strategy` no formato esperado pelos consumidores
   * de "Investimento" (páginas e gates). Mantido em paralelo a `strategy` para
   * não quebrar consumidores existentes — fonte de verdade continua sendo `strategy`.
   * Campos podem vir `null` (não computados na sessão) — consumidores devem tratar.
   */
  investment?: {
    incomeMonthly: number | null;
    saleProfit: number | null;
    contemplationMonth: number | null;
    /**
     * Cenários completos do módulo Investimento (Path 1-6).
     * Cada cenário traz totalPaid, finalResult, absoluteGain, percentGain.
     * Se ausente → página de Investimento usa apenas summary (incomeMonthly/saleProfit).
     */
    scenarios?: Array<{
      id: string;
      name: string;
      shortDesc?: string;
      category?: string;
      totalPaid: number;
      finalResult: number;
      absoluteGain: number;
      percentGain: number;
    }> | null;
    bestStrategyId?: string | null;
    /** Premissas usadas (para a página de Premissas). */
    assumptions?: {
      propertyAppreciation?: number;
      investmentReturn?: number;
      rentalYield?: number;
      cdiPercent?: number;
      analysisMonths?: number;
    } | null;
  };

  bidsStudy?: {
    groupNumber?: string | null;
    avgBid?: number | null;
    minBid?: number | null;
    maxBid?: number | null;
    recommendedBid?: number | null;
    monthsAnalyzed?: number | null;
  };

  /**
   * Tese patrimonial consultiva (bloco `wealth-thesis`).
   * Reflete a estratégia ATIVA escolhida pelo gerente na Wealth Library /
   * Compare V2 (fonte: ActiveStrategyContext + STRATEGY_LIBRARY). Não há
   * catálogo no PDF — apenas a escolha consultiva personalizada do caso.
   */
  wealth?: {
    strategyId: string;
    title: string;
    chapter?: string;
    tagline?: string;
    source: 'wealth-library' | 'compare-winner' | 'manual';
    howItWorks?: string;
    patrimonialLogic?: string;
    advantages?: string[];
    risks?: string[];
    /** KPIs textuais já formatados pelo módulo Wealth. */
    kpis?: Array<{ label: string; value: string }>;
  } | null;

  /**
   * Operação estruturada multi-cartas (bloco `structured-ops`).
   * Reflete EXATAMENTE o consolidado exibido no StructuredOperationsModule.
   * Sem recálculo; sem heurística. Se o usuário nunca abriu o módulo,
   * este campo vem ausente e o bloco é descartado pelo gate.
   */
  structuredOps?: {
    cardsCount: number;
    totalQuantity: number;
    totalCreditValue: number;
    totalInitialInstallment: number;
    totalInstallmentAfterContemplation: number;
    totalPaid: number;
    totalBid: number;
    effectiveRatePercent: number;
    cards: Array<{
      consortiumType: string;
      quantity: number;
      creditValue: number;
      totalCreditValue: number;
      installmentAfterContemplation: number;
    }>;
  } | null;

  /**
   * Schedule mensal SLIM da simulação (subset de MonthlyRow), usado para
   * tabelas e gráficos de evolução no PDF. Vem do SimulatorContext —
   * NUNCA recalculado aqui. Pode ser undefined se a sessão não computou.
   */
  monthlyScheduleSlim?: Array<{
    month: number;
    payment: number;
    insurance: number;
    balanceEnd: number;
    regime: 'reduced' | 'full' | 'rediluted' | 'post-bid';
  }> | null;

  storytellingText?: string;
  argumentsList?: string[];
  /** Lista de objeções respondidas (bloco "objections"). Renderizado apenas se bloco selecionado. */
  objectionsList?: Array<{ q: string; a: string }>;

  /** Mensagem pessoal do gerente exibida logo após a capa. Máx 300 chars, sem HTML. */
  customOpening?: string;
  /** Mensagem pessoal do gerente exibida antes da escala 0–10. Máx 300 chars, sem HTML. */
  customClosing?: string;

  blocks: ProposalBlockDef[];
}
