/**
 * Sistema de priorização automática de clientes Pós-venda.
 *
 * Calcula um score determinístico que orienta o gerente sobre quem deve
 * ser atendido primeiro. NÃO altera estrutura de dados nem lógica existente
 * (alertas/risco continuam como fontes de verdade); apenas combina sinais
 * já calculados em uma única dimensão de "urgência de ação".
 *
 * Pesos:
 *  • ação atrasada            → +3
 *  • cliente inadimplente     → +3
 *  • contemplado              → +2
 *  • sem contato recente      → +2
 *  • possui oportunidade      → +2  (referrals registradas / status quitado)
 */
import type { PostSaleClient, PostSaleEvent } from '@/services/postSale';
import { STALE_CONTACT_DAYS } from './postSaleConstants';
import { getNextActionUrgency } from './postSaleNextAction';

export type PriorityLevel = 'alta' | 'media' | 'baixa';

export interface PriorityScore {
  score: number;
  level: PriorityLevel;
  reasons: string[];
}

const daysSince = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
};

export function computeClientPriority(
  client: PostSaleClient,
  nextAction: PostSaleEvent | null,
): PriorityScore {
  let score = 0;
  const reasons: string[] = [];

  // Ação atrasada (+3)
  if (nextAction) {
    const meta = nextAction.metadata as Record<string, unknown> | null;
    const dueDate = String(meta?.due_date ?? nextAction.event_date);
    if (getNextActionUrgency(dueDate) === 'overdue') {
      score += 3;
      reasons.push('Ação atrasada');
    }
  }

  // Inadimplente (+3)
  if (client.status === 'inadimplente') {
    score += 3;
    reasons.push('Inadimplente');
  }

  // Contemplado (+2)
  if (client.status === 'contemplado') {
    score += 2;
    reasons.push('Contemplado');
  }

  // Sem contato recente (+2): só faz sentido para clientes ativos.
  const contactDays = daysSince(client.last_contact_date) ?? daysSince(client.created_at);
  if (
    client.status === 'ativo' &&
    contactDays !== null &&
    contactDays >= STALE_CONTACT_DAYS
  ) {
    score += 2;
    reasons.push(`${contactDays}d sem contato`);
  }

  // Oportunidade — quitado (pronto para nova venda) entra como sinal de oportunidade.
  if (client.status === 'quitado') {
    score += 2;
    reasons.push('Oportunidade de nova venda');
  }

  // Classificação em faixas. Ajustadas para destacar casos com 2+ sinais fortes.
  // Alta: 5+ (ex.: atrasada + sem contato, inadimplente + atrasada, etc.)
  // Média: 2–4 (um sinal forte ou combinação leve).
  // Baixa: 0–1.
  let level: PriorityLevel = 'baixa';
  if (score >= 5) level = 'alta';
  else if (score >= 2) level = 'media';

  return { score, level, reasons };
}

export const PRIORITY_BADGE: Record<PriorityLevel, { emoji: string; label: string; chip: string }> = {
  alta: {
    emoji: '🔴',
    label: 'Alta prioridade',
    chip: 'bg-destructive/15 text-destructive border-destructive/30',
  },
  media: {
    emoji: '🟡',
    label: 'Média',
    chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  baixa: {
    emoji: '🟢',
    label: 'Baixa',
    chip: 'bg-success/15 text-success border-success/30',
  },
};
