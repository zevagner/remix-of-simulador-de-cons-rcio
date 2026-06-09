/**
 * Proposal priority scoring — pure functions.
 * Uses existing proposal data to calculate priority without any DB changes.
 */
import type { ProposalRecord, ProposalStatus } from '@/services/proposals';
import { classifyProposalStatus } from './proposalStatusNormalize';

export type PriorityLevel = 'alta' | 'media' | 'baixa';

export interface ProposalWithPriority extends ProposalRecord {
  priority: PriorityLevel;
  priorityScore: number;
  priorityReason: string;
  /** True quando o status no DB era um valor desconhecido (não-enum, não-legado). */
  hasInvalidStatus: boolean;
  /** Valor original do DB, preservado para diagnóstico. */
  rawStatus: string;
}

const STATUS_WEIGHT: Record<ProposalStatus, number> = {
  prospeccao: 15,
  aguardando_retorno: 25,
  em_avaliacao: 40,
  proposta_ajustada: 45,
  fechado: 0,
  perdido: 0,
};

function daysSince(dateStr: string): number {
  return Math.max(0, (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function scoreProposal(proposal: ProposalRecord, maxCreditValue: number): ProposalWithPriority {
  // Classificação explícita: preserva flag de inválido para a UI exibir.
  const classified = classifyProposalStatus(proposal.status as string);
  const status = classified.status;
  const p = { ...proposal, status };

  if (p.status === 'fechado' || p.status === 'perdido') {
    return {
      ...p,
      priority: 'baixa',
      priorityScore: 0,
      priorityReason: p.status === 'fechado' ? 'Negócio fechado' : 'Proposta perdida',
      hasInvalidStatus: classified.unknown,
      rawStatus: classified.raw,
    };
  }

  const days = daysSince(p.created_at);
  const updatedDays = daysSince(p.updated_at);

  const statusScore = STATUS_WEIGHT[p.status] ?? 10;
  const recencyScore = Math.max(0, 30 * (1 - days / 30));
  const valueScore = maxCreditValue > 0 ? 20 * (p.credit_value / maxCreditValue) : 10;

  let stalenessBoost = 0;
  let stalenessReason = '';
  if (updatedDays >= 7) {
    stalenessBoost = 10;
    stalenessReason = `Parada há ${Math.floor(updatedDays)} dias`;
  } else if (updatedDays >= 3) {
    stalenessBoost = 5;
    stalenessReason = `Sem atualização há ${Math.floor(updatedDays)} dias`;
  }

  const totalScore = Math.min(100, statusScore + recencyScore + valueScore + stalenessBoost);

  let priority: PriorityLevel;
  let reason: string;

  if (totalScore >= 60) {
    priority = 'alta';
    reason = p.status === 'em_avaliacao' || p.status === 'proposta_ajustada'
      ? 'Em avaliação ativa'
      : stalenessReason || 'Proposta recente com alto valor';
  } else if (totalScore >= 35) {
    priority = 'media';
    reason = stalenessReason || 'Aguardando retorno do cliente';
  } else {
    priority = 'baixa';
    reason = p.status === 'prospeccao'
      ? 'Em prospecção'
      : days > 14 ? `Enviada há ${Math.floor(days)} dias` : 'Prioridade normal';
  }

  return {
    ...p,
    priority,
    priorityScore: Math.round(totalScore),
    priorityReason: reason,
    hasInvalidStatus: classified.unknown,
    rawStatus: classified.raw,
  };
}

export function scoreAndSortProposals(proposals: ProposalRecord[]): ProposalWithPriority[] {
  const activeProposals = proposals.filter(p => p.status !== 'fechado' && p.status !== 'perdido');
  const maxCredit = activeProposals.length > 0
    ? Math.max(...activeProposals.map(p => p.credit_value))
    : 1;

  return proposals
    .map(p => scoreProposal(p, maxCredit))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; emoji: string; className: string }> = {
  alta: { label: 'Alta', emoji: '🔥', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  media: { label: 'Média', emoji: '⚠️', className: 'bg-warning/10 text-warning border-warning/30' },
  baixa: { label: 'Baixa', emoji: '💤', className: 'bg-muted text-muted-foreground border-border' },
};
