import type { PostSaleClient } from '@/services/postSale';
import { STALE_CONTACT_DAYS, URGENT_CONTACT_DAYS, POST_CONTEMPLATION_OPPORTUNITY_DAYS } from './postSaleConstants';

export type AlertLevel = 'critical' | 'warning' | 'info';

export interface PostSaleAlert {
  level: AlertLevel;
  label: string;
  reason: string;
}

const daysSince = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Computa alertas para um cliente pós-venda.
 * Lógica determinística baseada em datas (sem IA).
 */
export function computeClientAlerts(client: PostSaleClient): PostSaleAlert[] {
  const alerts: PostSaleAlert[] = [];

  if (client.status === 'inadimplente') {
    alerts.push({
      level: 'critical',
      label: 'Inadimplente',
      reason: 'Risco de exclusão do grupo — contato urgente.',
    });
  }

  // Sem contato recente
  const contactDays = daysSince(client.last_contact_date) ?? daysSince(client.created_at);
  if (contactDays !== null && contactDays >= URGENT_CONTACT_DAYS && client.status === 'ativo') {
    alerts.push({
      level: 'critical',
      label: `${contactDays}d sem contato`,
      reason: 'Risco de abandono — retomar relacionamento.',
    });
  } else if (contactDays !== null && contactDays >= STALE_CONTACT_DAYS && client.status === 'ativo') {
    alerts.push({
      level: 'warning',
      label: `${contactDays}d sem contato`,
      reason: 'Programe um contato esta semana.',
    });
  }

  // Oportunidade pós-contemplação
  const contempDays = daysSince(client.contemplation_date);
  if (
    client.status === 'contemplado' &&
    contempDays !== null &&
    contempDays <= POST_CONTEMPLATION_OPPORTUNITY_DAYS
  ) {
    alerts.push({
      level: 'info',
      label: 'Oportunidade quente',
      reason: 'Cliente recém-contemplado — momento ideal para indicação ou nova venda.',
    });
  }

  // Quitado: reativação
  if (client.status === 'quitado') {
    alerts.push({
      level: 'info',
      label: 'Pronto para nova venda',
      reason: 'Cliente quitado — abordar para próximo bem ou indicação.',
    });
  }

  return alerts;
}

export const alertLevelOrder: Record<AlertLevel, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function getHighestAlertLevel(alerts: PostSaleAlert[]): AlertLevel | null {
  if (alerts.length === 0) return null;
  return alerts.reduce<AlertLevel>(
    (acc, a) => (alertLevelOrder[a.level] < alertLevelOrder[acc] ? a.level : acc),
    alerts[0].level,
  );
}
