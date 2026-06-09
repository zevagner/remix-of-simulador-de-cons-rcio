import type { PostSaleClient } from '@/services/postSale';
import { STALE_CONTACT_DAYS, URGENT_CONTACT_DAYS } from './postSaleConstants';

export type RiskLevel = 'critical' | 'warning' | 'normal';

const daysSince = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
};

export interface ClientRisk {
  level: RiskLevel;
  label: string;
  reason: string;
}

/**
 * Classifica o cliente como Em risco / Atenção / Normal.
 * Regras determinísticas baseadas em status e tempo sem contato.
 */
export function getClientRisk(client: PostSaleClient): ClientRisk {
  if (client.status === 'inadimplente') {
    return { level: 'critical', label: 'Em risco', reason: 'Inadimplência ativa' };
  }

  const contactDays = daysSince(client.last_contact_date) ?? daysSince(client.created_at);

  if (client.status === 'ativo' && contactDays !== null && contactDays >= URGENT_CONTACT_DAYS) {
    return { level: 'critical', label: 'Em risco', reason: `${contactDays}d sem contato` };
  }
  if (client.status === 'ativo' && contactDays !== null && contactDays >= STALE_CONTACT_DAYS) {
    return { level: 'warning', label: 'Atenção', reason: `${contactDays}d sem contato` };
  }

  return { level: 'normal', label: 'Em dia', reason: 'Acompanhamento ativo' };
}

export const RISK_STYLES: Record<RiskLevel, { dot: string; chip: string; row: string }> = {
  critical: {
    dot: 'bg-destructive',
    chip: 'bg-destructive/15 text-destructive border-destructive/30',
    row: 'border-l-4 border-l-destructive',
  },
  warning: {
    dot: 'bg-amber-500',
    chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    row: 'border-l-4 border-l-amber-500',
  },
  normal: {
    dot: 'bg-success',
    chip: 'bg-success/15 text-success border-success/30',
    row: '',
  },
};
