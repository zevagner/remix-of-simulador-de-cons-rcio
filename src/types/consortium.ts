export type ConsortiumType = 'imobiliario' | 'auto' | 'pesados';

/** Tipo de contemplação derivado do estado da simulação */
export type ContemplationType = 'none' | 'sorteio' | 'lance';

/**
 * Opções pós-contemplação:
 * - 'keep-reduced-credit-adjusted': sorteio + parcela reduzida → mantém parcela reduzida, ajusta crédito
 * - 'restore-installment-keep-credit': sorteio + parcela reduzida → restaura parcela cheia, mantém crédito
 * - 'reduce-installment': lance → reduz parcela, mantém prazo
 * - 'reduce-term': lance → mantém parcela, reduz prazo
 */
export type PostContemplationChoice =
  | 'keep-reduced-credit-adjusted'
  | 'restore-installment-keep-credit'
  | 'reduce-installment'
  | 'reduce-term';

export interface SimulationInput {
  creditValue: number;
  termMonths: number;
  consortiumType: ConsortiumType;
  adminFeePercent: number;
  reserveFundPercent: number;
  /**
   * @deprecated (Onda 2 — Prestamista) — campo mantido por compatibilidade
   * com snapshots e formulários legados. O motor mensal ignora este percentual
   * e aplica o percentual oficial CAIXA via `calculatePrestamistaPremium`
   * (0,0680% cota antiga / 0,0765% cota nova) sobre o saldo devedor real.
   * Para desligar o seguro, use `personType='PJ'` ou zere `proponentAge`.
   */
  insurancePercent: number;
  /** Idade do proponente (18-80) — usada APENAS para elegibilidade prestamista (idade + prazo ≤ 80a). */
  proponentAge: number;
  reducedInstallment: boolean;
  freeBidValue: number;
  embeddedBidValue: number;
  /** PF (default) ou PJ — PJ não tem prestamista (Onda 2). */
  personType?: 'PF' | 'PJ';
  /** Coorte da cota — define percentual aplicável (default: cota nova ≥ 02/10/2023). */
  prestamistaCohort?: 'pre_2023_10_02' | 'post_2023_10_02';
}

export interface SimulationResult {
  installmentBeforeContemplation: number;
  installmentAfterContemplation: number;
  netCreditValue: number;
  /** Crédito ajustado (pode diferir de netCreditValue no cenário sorteio + parcela reduzida) */
  adjustedCreditValue: number;
  totalCost: number;
  adminFee: number;
  reserveFund: number;
  insuranceTotal: number;
  monthlyInsurance: number; // Seguro mensal fixo (modelo CAIXA)
  reducedInstallmentMonths: number;
  remainingTermAfterContemplation: number;
  debtAfterContemplation: number;
  /** Tipo de contemplação aplicado neste resultado */
  contemplationType: ContemplationType;
  /** Parcela cheia (base, sem redução) — fonte única de verdade para rediluição */
  fullInstallment: number;
  /** Parcela reduzida (70% da cheia) — 0 se não aplicável */
  reducedInstallmentValue: number;
  /** Parcela rediluída (após período reduzido) — 0 se não aplicável */
  redilutedInstallmentValue: number;
  /**
   * Carta de crédito contratada — sempre igual a `creditValue` da simulação,
   * independente de lance embutido. Campo aditivo (C2/A3 — Onda Audit
   * 2026-05-24) para consumers que precisam distinguir "carta contratada"
   * de `netCreditValue` (crédito líquido após lance embutido). NÃO substitui
   * `netCreditValue` em nenhum consumer existente.
   */
  contractedCredit: number;
  /**
   * Prêmio do PRIMEIRO mês com seguro ativo (modelo CAIXA operacional: prêmio
   * fixo mensal, não decrescente). Campo aditivo (C2 — Onda Audit 2026-05-24)
   * para consumers que precisam do prêmio mensal real em planos com carência
   * de seguro (`insuranceStartMonth > 1`), sem alterar `monthlyInsurance`
   * (média sobre o plano inteiro, consumida pelo card de Composição/PDF).
   * Quando seguro desabilitado, valor é 0.
   */
  firstInsurancePremium: number;
}


// Nova estrutura para assembleias
export interface AssemblyRecord {
  id: string;
  consortiumType: ConsortiumType;
  groupNumber: number;
  assemblyMonth: string; // formato "MMM-yy" ex: "Aug-24"
  assemblyDate: Date;
  
  // Lance embutido: 0 = não aceita. Limite por tipo: imobiliário 50%, auto/pesados 30%
  hasEmbeddedBid: boolean;
  embeddedBidMaxPercent: number; // 0 ou limite do tipo (ver EMBEDDED_BID_MAX_PERCENT)
  
  creditRange: string;
  participants: number;
  totalTerm: number;
  remainingTerm: number;
  
  // Datas da assembleia
  firstAssemblyDate?: string;
  nextAssemblyDate?: string;
  installmentDueDate?: string;
  
  // Lances (dados diretos do Excel)
  avgBid3Months: number; // Lance Média 3 Últimas Assembleias
  minBidLastAssembly: number; // Lance Mínimo Contemplado Última Assembleia
  maxBidLastAssembly: number; // Lance Máximo Contemplado Última Assembleia
  
  // Contemplações
  contemplationsBySorteio: number; // Qtde Cota Contemplada por Sorteio Ult.Assemb.
  contemplationsByLanceLivre: number; // Qtde Cota Contemplada por Lance Livre Ult.Assemb.
  contemplationsByLanceFixo: number; // Qtde Cota Contemplada por Lance Fixo Ult.Assemb.
  contemplationsLastAssembly: number; // Qtde Cota Contemplada Ult.Assemb.
  contemplationsCancelled: number; // Qtde Cota Contemplada Excluidas Ult.Assemb.
  totalContemplations: number; // Total de Contemplados
  
  // Outros dados
  sorteio: number;
  cancelled: number;
  lanceFixo: number;
  lanceLivre: number;
  
  // Campos legados (mantidos para compatibilidade)
  minBidPercentage: number;
  avgBidPercentage: number;
  maxBidPercentage: number;
  contemplationsByLance: number;
  
  createdAt: string;
}

// Análise com base nas últimas 6 assembleias
export interface BidStudyAnalysis {
  avgOfAvgBids: number; // média dos lances médios das últimas 6 assembleias
  minOfMinBids: number; // menor lance mínimo das últimas 6 assembleias
  maxOfMaxBids: number; // maior lance máximo das últimas 6 assembleias
  lastAssemblies: AssemblyRecord[]; // últimas 6 assembleias
  groupNumber: number;
  consortiumType: ConsortiumType;
  hasEmbeddedBid: boolean; // se o grupo aceita lance embutido
  embeddedBidMaxPercent: number; // percentual máximo (limite por tipo: imob 50%, auto/pesados 30%)
  creditRange: string; // faixa de crédito do grupo
}

// Tipo para lance sugerido do Estudo de Lances
export interface SuggestedBidFromStudy {
  bidPercent: number;
  zone: 'conservadora' | 'equilibrada' | 'agressiva';
  hasEmbeddedBid: boolean;
  embeddedBidMaxPercent: number;
  groupNumber: number;
  creditRange: string;
}

// Labels compartilhados para tipos de consórcio
export const CONSORTIUM_TYPE_LABELS: Record<ConsortiumType, string> = {
  imobiliario: 'Imobiliário',
  auto: 'Veículos',
  pesados: 'Pesados',
};
