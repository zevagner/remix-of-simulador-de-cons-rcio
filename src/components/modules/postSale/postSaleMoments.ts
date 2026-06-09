/**
 * postSaleMoments — agrupa clientes do Pós-venda por "momento de relacionamento".
 *
 * Reaproveita sinais já calculados (risk, score unificado, status, datas) e
 * NÃO depende de novas tabelas / motores. Mantém o módulo como uma lista leve
 * com sections colapsáveis — sem virar Kanban.
 *
 * Ordem de prioridade de classificação (cada cliente cai em UM momento):
 *   1. at_risk              — inadimplente ou risco crítico
 *   2. pre_assembly         — ativo + próxima assembleia ≤ 7 dias
 *   3. recently_contemplated— contemplado nos últimos 90 dias
 *   4. eligible_paid        — quitado (janela de reentrada/indicação)
 *   5. dormant              — frio + sem contato há ≥ STALE_CONTACT_DAYS
 *   6. others               — demais (acompanhamento normal)
 */
import type { PostSaleClient } from '@/services/postSale';
import type { ClientScore } from '@/utils/clientScoring';
import type { RiskLevel } from './postSaleRisk';
import { POST_CONTEMPLATION_OPPORTUNITY_DAYS, STALE_CONTACT_DAYS } from './postSaleConstants';

export type Moment =
  | 'at_risk'
  | 'pre_assembly'
  | 'recently_contemplated'
  | 'eligible_paid'
  | 'dormant'
  | 'others';

export interface MomentMeta {
  label: string;
  emoji: string;
  description: string;
  /** Section default-open quando há itens. */
  defaultOpen: boolean;
  /** Ordem visual da section na tela. */
  order: number;
}

// Onda Pós-venda — ordem por urgência (audit): Em risco → Pré-assembleia →
// Dormentes → Recém contemplados → Acompanhamento → Quitados elegíveis.
// Dormentes sobem porque exigem reativação ativa antes de virarem perdas.
export const MOMENT_META: Record<Moment, MomentMeta> = {
  at_risk: {
    label: 'Em risco',
    emoji: '🚨',
    description: 'Inadimplência ou alerta crítico — atender hoje.',
    defaultOpen: true,
    order: 1,
  },
  pre_assembly: {
    label: 'Pré-assembleia',
    emoji: '⏰',
    description: 'Assembleia em até 7 dias — reativar antes do evento.',
    defaultOpen: true,
    order: 2,
  },
  recently_contemplated: {
    label: 'Recém contemplados',
    emoji: '🏆',
    description: 'Contemplação recente — janela de indicação e nova venda.',
    defaultOpen: true,
    order: 3,
  },
  dormant: {
    label: 'Dormentes',
    emoji: '❄️',
    description: 'Ativos sem contato e relacionamento esfriando — reativar.',
    defaultOpen: true,
    order: 4,
  },
  others: {
    label: 'Acompanhamento',
    emoji: '📋',
    description: 'Demais clientes em dia.',
    defaultOpen: false,
    order: 5,
  },
  eligible_paid: {
    label: 'Quitados elegíveis',
    emoji: '✅',
    description: 'Clientes quitados — reentrada e indicações de família.',
    defaultOpen: false,
    order: 6,
  },
};

const daysBetween = (iso: string | null | undefined, refMs = Date.now()): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((refMs - t) / 86_400_000);
};

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / 86_400_000);
}

export function getClientMoment(args: {
  client: PostSaleClient;
  risk: { level: RiskLevel };
  unified: ClientScore;
  nextAssemblyDate: string | null | undefined;
}): Moment {
  const { client, risk, unified, nextAssemblyDate } = args;

  if (client.status === 'inadimplente' || risk.level === 'critical') return 'at_risk';

  const dToAssembly = daysUntil(nextAssemblyDate);
  if (
    client.status === 'ativo' &&
    dToAssembly !== null &&
    dToAssembly >= 0 &&
    dToAssembly <= 7
  ) {
    return 'pre_assembly';
  }

  if (client.status === 'contemplado') {
    const since = daysBetween(client.contemplation_date) ?? Number.POSITIVE_INFINITY;
    if (since <= POST_CONTEMPLATION_OPPORTUNITY_DAYS) return 'recently_contemplated';
  }

  if (client.status === 'quitado') return 'eligible_paid';

  // Dormente: apenas para clientes ATIVOS (sem contato + frio).
  // Contemplados e quitados nunca devem cair aqui — recém-contemplado e dormente
  // são mutuamente exclusivos. Contemplados fora da janela de 90d caem em "others".
  const lastContact = daysBetween(client.last_contact_date) ?? daysBetween(client.created_at);
  if (
    client.status === 'ativo' &&
    unified.temperature === 'frio' &&
    lastContact !== null &&
    lastContact >= STALE_CONTACT_DAYS
  ) {
    return 'dormant';
  }

  return 'others';
}

// ─── Chips de oportunidade patrimonial ───
// Discretos, contextuais, derivados de dados existentes. Sem IA.
export interface OpportunityChip {
  emoji: string;
  label: string;
  /** Tooltip curto explicando o sinal. */
  hint: string;
}

const HIGH_CREDIT_THRESHOLD = 300_000;

export function getOpportunityChips(
  client: PostSaleClient,
  unified: ClientScore,
  nextActionPresent: boolean,
): OpportunityChip[] {
  const chips: OpportunityChip[] = [];

  if (client.status === 'contemplado' || client.status === 'quitado') {
    chips.push({
      emoji: '💡',
      label: 'Potencial nova operação',
      hint: 'Cliente em janela de oportunidade — momento ideal para próxima venda.',
    });
  }

  if (client.status === 'quitado') {
    chips.push({
      emoji: '🔁',
      label: 'Possível reentrada',
      hint: 'Quitou recentemente — convidar para nova cota ou indicação de família.',
    });
  }

  if (unified.temperature === 'quente' && !nextActionPresent && client.status === 'ativo') {
    chips.push({
      emoji: '🔥',
      label: 'Quente parado',
      hint: 'Cliente quente sem próxima ação agendada — agendar contato.',
    });
  }

  if (client.credit_value >= HIGH_CREDIT_THRESHOLD) {
    chips.push({
      emoji: '⭐',
      label: 'Crédito alto',
      hint: 'Ticket relevante na carteira — priorizar relacionamento.',
    });
  }

  return chips;
}
