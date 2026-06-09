import type { PostSaleStatus, PostSalePriority } from '@/services/postSale';

export const STATUS_LABELS: Record<PostSaleStatus, string> = {
  ativo: 'Ativo',
  contemplado: 'Contemplado',
  quitado: 'Quitado',
  inadimplente: 'Inadimplente',
};

export const STATUS_EMOJI: Record<PostSaleStatus, string> = {
  ativo: '🟢',
  contemplado: '🏆',
  quitado: '✅',
  inadimplente: '⚠️',
};

export const PRIORITY_LABELS: Record<PostSalePriority, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  created: 'Cadastro no pós-venda',
  group_entry: 'Entrada no grupo',
  contact: 'Contato realizado',
  bid_registered: 'Lance registrado',
  contemplation: 'Contemplação',
  status_change: 'Mudança de status',
  note: 'Observação',
  opportunity: 'Oportunidade',
};

export const EVENT_TYPE_EMOJI: Record<string, string> = {
  created: '✨',
  group_entry: '📥',
  contact: '📞',
  bid_registered: '💰',
  contemplation: '🏆',
  status_change: '🔄',
  note: '📝',
  opportunity: '🎯',
};

/** Limiar (em dias) para alertar "sem contato recente". */
export const STALE_CONTACT_DAYS = 30;
export const URGENT_CONTACT_DAYS = 60;

/** Janela (em dias) após contemplação em que o cliente é "quente para indicação/nova venda". */
export const POST_CONTEMPLATION_OPPORTUNITY_DAYS = 90;
