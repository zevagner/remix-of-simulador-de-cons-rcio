/**
 * proposalEvents — leitura do histórico imutável de cada lead.
 * INSERTs são feitos via triggers de DB (SECURITY DEFINER); o cliente apenas lê.
 */
import { supabase } from '@/integrations/supabase/client';
import type { ProposalStatus } from '@/services/proposals';

import { logger } from '@/utils/logger';
export type ProposalEventType = 'created' | 'status_change' | 'next_action_set' | 'notes_updated';

export interface ProposalEvent {
  id: string;
  proposal_id: string;
  user_id: string;
  event_type: ProposalEventType;
  from_status: ProposalStatus | null;
  to_status: ProposalStatus | null;
  next_action_type: string | null;
  next_action_notes: string | null;
  next_contact_date: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const PROPOSAL_EVENTS_LIMIT = 200;

/**
 * Lê o histórico de eventos via RPC paginada `list_proposal_events_page`
 * (hard cap server-side de 200). Mantém assinatura legada — UIs continuam
 * recebendo `ProposalEvent[]`.
 */
export async function fetchProposalEvents(proposalId: string): Promise<ProposalEvent[]> {
  const { data, error } = await supabase.rpc('list_proposal_events_page', {
    p_proposal_id: proposalId,
    p_limit: PROPOSAL_EVENTS_LIMIT,
    p_offset: 0,
  });

  if (error) {
    logger.error('[proposalEvents] fetch error', error);
    return [];
  }
  const rows = (data ?? []) as Array<ProposalEvent & { total_count: number }>;
  return rows.map(({ total_count, ...rest }) => rest as ProposalEvent);
}
