import type { PostSaleEvent } from '@/services/postSale';

export interface NextActionPayload {
  kind: 'next_action';
  action: string;       // texto curto: "Ligar para confirmar interesse"
  due_date: string;     // ISO date (YYYY-MM-DD)
  done?: boolean;
}

export interface ReferralPayload {
  kind: 'referral';
  name: string;
  phone?: string | null;
  notes?: string | null;
}

/**
 * Extrai a próxima ação ATIVA do cliente a partir dos eventos `opportunity`.
 * Retorna o evento mais recente cujo metadata.kind === 'next_action' e !done.
 */
export function getActiveNextAction(events: PostSaleEvent[]): {
  event: PostSaleEvent;
  payload: NextActionPayload;
} | null {
  for (const e of events) {
    if (e.event_type !== 'opportunity') continue;
    const meta = e.metadata as Record<string, unknown> | null;
    if (!meta || meta.kind !== 'next_action') continue;
    if (meta.done === true) continue;
    return {
      event: e,
      payload: {
        kind: 'next_action',
        action: String(meta.action ?? ''),
        due_date: String(meta.due_date ?? e.event_date),
        done: false,
      },
    };
  }
  return null;
}

/** Retorna todas as indicações registradas (eventos opportunity com kind=referral). */
export function getReferrals(events: PostSaleEvent[]): Array<{ event: PostSaleEvent; payload: ReferralPayload }> {
  const list: Array<{ event: PostSaleEvent; payload: ReferralPayload }> = [];
  for (const e of events) {
    if (e.event_type !== 'opportunity') continue;
    const meta = e.metadata as Record<string, unknown> | null;
    if (!meta || meta.kind !== 'referral') continue;
    list.push({
      event: e,
      payload: {
        kind: 'referral',
        name: String(meta.name ?? ''),
        phone: (meta.phone as string) ?? null,
        notes: (meta.notes as string) ?? null,
      },
    });
  }
  return list;
}

/** Calcula urgência da próxima ação (atrasada / hoje / futura). */
export function getNextActionUrgency(dueDateIso: string): 'overdue' | 'today' | 'soon' | 'future' {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateIso); due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 3) return 'soon';
  return 'future';
}
