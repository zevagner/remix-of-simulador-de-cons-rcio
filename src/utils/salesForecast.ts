/**
 * Sales Forecast Engine
 *
 * Estima receita futura da carteira atribuindo probabilidade de fechamento
 * por estágio do funil e calculando valor esperado (credit_value × prob).
 *
 * Mapeamento de estágios pedidos → status reais do funil:
 *  - diagnóstico (10%) → prospeccao
 *  - simulação (20%) → aguardando_retorno
 *  - lance (35%) → em_avaliacao
 *  - proposta (60%) → proposta_ajustada
 *  - fechado (100%) → fechado (somado como receita realizada)
 *  - perdido (0%) → perdido (não entra no pipeline)
 *
 * Receita realizada (fechados no mês) entra como "já no caixa".
 * Pipeline = soma dos valores esperados dos status ativos.
 */
import type { ProposalRecord, ProposalStatus } from '@/services/proposals';

export const STAGE_PROBABILITY: Record<ProposalStatus, number> = {
  prospeccao: 0.10,
  aguardando_retorno: 0.20,
  em_avaliacao: 0.35,
  proposta_ajustada: 0.60,
  fechado: 1.0,
  perdido: 0,
};

export const STAGE_LABEL: Record<ProposalStatus, string> = {
  prospeccao: 'Diagnóstico',
  aguardando_retorno: 'Simulação',
  em_avaliacao: 'Lance / Avaliação',
  proposta_ajustada: 'Proposta',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

const ACTIVE_STATUSES: ProposalStatus[] = [
  'prospeccao',
  'aguardando_retorno',
  'em_avaliacao',
  'proposta_ajustada',
];

export interface ExpectedValueRow {
  proposal: ProposalRecord;
  probability: number;
  expectedValue: number;
}

export interface StageBreakdown {
  status: ProposalStatus;
  label: string;
  probability: number;
  count: number;
  totalCredit: number;
  expectedValue: number;
}

export interface SalesForecast {
  /** Soma dos valores esperados dos status ativos. */
  pipelineExpected: number;
  /** Receita já realizada no período (fechados). */
  closedRevenue: number;
  /** Receita projetada total = pipeline + fechados. */
  projectedTotal: number;
  /** Meta mensal configurada. */
  goal: number;
  /** Meta - projetado. Negativo = meta superada. */
  gap: number;
  /** % da meta atingida pela projeção total (0-1+). */
  goalProgress: number;
  /** Quebra por estágio. */
  byStage: StageBreakdown[];
  /** Linhas individuais (apenas ativos), ordenadas por valor esperado desc. */
  rows: ExpectedValueRow[];
  /** Top oportunidades a priorizar (maior expectedValue × proximidade do fechamento). */
  topOpportunities: ExpectedValueRow[];
}

/** Valor esperado de uma proposta isolada. */
export function computeExpectedValue(proposal: Pick<ProposalRecord, 'status' | 'credit_value'>): number {
  const prob = STAGE_PROBABILITY[proposal.status] ?? 0;
  const value = Number(proposal.credit_value) || 0;
  return value * prob;
}

/** Probabilidade do estágio. */
export function getStageProbability(status: ProposalStatus): number {
  return STAGE_PROBABILITY[status] ?? 0;
}

function startOfCurrentMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Computa forecast completo a partir das propostas. */
export function computeSalesForecast(
  proposals: ProposalRecord[],
  goal: number,
): SalesForecast {
  const monthStart = startOfCurrentMonth();

  // Receita realizada = fechados atualizados neste mês.
  const closedRevenue = proposals
    .filter((p) => p.status === 'fechado')
    .filter((p) => {
      const d = p.updated_at ? new Date(p.updated_at) : null;
      return d ? d >= monthStart : false;
    })
    .reduce((sum, p) => sum + (Number(p.credit_value) || 0), 0);

  // Pipeline = ativos.
  const activeProposals = proposals.filter((p) => ACTIVE_STATUSES.includes(p.status));

  const rows: ExpectedValueRow[] = activeProposals
    .map((p) => ({
      proposal: p,
      probability: STAGE_PROBABILITY[p.status],
      expectedValue: computeExpectedValue(p),
    }))
    .sort((a, b) => b.expectedValue - a.expectedValue);

  const pipelineExpected = rows.reduce((sum, r) => sum + r.expectedValue, 0);

  const byStage: StageBreakdown[] = (Object.keys(STAGE_PROBABILITY) as ProposalStatus[]).map((status) => {
    const items = proposals.filter((p) => p.status === status);
    const totalCredit = items.reduce((s, p) => s + (Number(p.credit_value) || 0), 0);
    return {
      status,
      label: STAGE_LABEL[status],
      probability: STAGE_PROBABILITY[status],
      count: items.length,
      totalCredit,
      expectedValue: totalCredit * STAGE_PROBABILITY[status],
    };
  });

  const projectedTotal = closedRevenue + pipelineExpected;
  const gap = goal - projectedTotal;
  const goalProgress = goal > 0 ? projectedTotal / goal : 0;

  // Top oportunidades: priorizar quem está mais próximo de fechar e tem maior valor esperado.
  // Ranking = expectedValue × bônus por estágio avançado.
  const stageBonus: Record<ProposalStatus, number> = {
    prospeccao: 1.0,
    aguardando_retorno: 1.1,
    em_avaliacao: 1.3,
    proposta_ajustada: 1.6,
    fechado: 0,
    perdido: 0,
  };
  const topOpportunities = [...rows]
    .sort((a, b) => b.expectedValue * stageBonus[b.proposal.status] - a.expectedValue * stageBonus[a.proposal.status])
    .slice(0, 5);

  return {
    pipelineExpected,
    closedRevenue,
    projectedTotal,
    goal,
    gap,
    goalProgress,
    byStage,
    rows,
    topOpportunities,
  };
}
