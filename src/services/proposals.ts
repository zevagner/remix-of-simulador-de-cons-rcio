/**
 * Proposals service — CRUD operations for the proposals table.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { logger } from '@/utils/logger';
import { logAction } from '@/services/auditLog';

export type ProposalRecord = Tables<'proposals'>;
export type ProposalStatus = ProposalRecord['status'];

export interface InsertProposal {
  client_name: string;
  credit_value: number;
  term_months: number;
  installment: number;
  total_cost: number;
  consortium_type: string;
  group_number?: number | null;
  bid_percent?: number | null;
  bid_zone?: string | null;
  proposal_content: string;
  proposal_format: string;
  status?: ProposalStatus;
  notes?: string | null;
  client_phone?: string | null;
  next_contact_date?: string | null;
  /**
   * Motivo de prospecção — OBRIGATÓRIO. O banco bloqueia qualquer
   * INSERT/UPDATE com 'nao_identificado' (validate_proposal_business_rules).
   * Os caminhos automáticos do simulador devem abrir o NewLeadModal em vez
   * de chamar saveProposal sem trigger.
   */
  prospect_trigger: string;
  next_action_type?: string | null;
  next_action_notes?: string | null;
  /** Modalidade do plano: 'tradicional' | 'agroflex' | 'empresarialflex' */
  plan_type?: string;
}

export interface UpdateProposalFields {
  client_name?: string;
  credit_value?: number;
  term_months?: number;
  installment?: number;
  total_cost?: number;
  bid_percent?: number | null;
  bid_zone?: string | null;
  notes?: string | null;
  status?: ProposalStatus;
  client_phone?: string | null;
  next_contact_date?: string | null;
  prospect_trigger?: string;
  next_action_type?: string | null;
  next_action_notes?: string | null;
  plan_type?: string;
}

export async function saveProposal(data: InsertProposal): Promise<ProposalRecord | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from('proposals')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    logger.error('Error saving proposal:', error);
    return null;
  }
  if (row) {
    logAction({
      action: 'create_proposal',
      entity: 'proposal',
      entity_id: row.id,
      metadata: {
        client_name: row.client_name,
        credit_value: row.credit_value,
        consortium_type: row.consortium_type,
        status: row.status,
      },
    });
  }
  return row;
}

/**
 * Limite máximo de propostas carregadas de uma vez (hard cap server-side = 200).
 * Migrado para usar a RPC paginada `list_proposals_page`. A assinatura do
 * hook legado `useProposals()` permanece idêntica para preservar Kanban/DnD.
 */
export const PROPOSALS_PAGE_LIMIT = 200;

/** Total real após o último fetch (para banner "muitos cards no Kanban"). */
let lastProposalsTotal = 0;
export function getLastProposalsTotal(): number {
  return lastProposalsTotal;
}

export async function fetchProposals(): Promise<ProposalRecord[]> {
  const page = await fetchProposalsPage({ limit: PROPOSALS_PAGE_LIMIT, offset: 0 });
  lastProposalsTotal = page.total;
  if (page.total > PROPOSALS_PAGE_LIMIT) {
    logger.warn(`fetchProposals: ${page.total} registros existem, exibindo os ${PROPOSALS_PAGE_LIMIT} mais recentes.`);
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      void supabase.from('analytics_events').insert({
        user_id: user.id,
        event_name: 'proposals_page_limit_reached',
        event_data: { limit: PROPOSALS_PAGE_LIMIT, total: page.total },
      });
    });
  }
  return page.rows;
}

export async function updateProposalStatus(id: string, status: ProposalStatus): Promise<boolean> {
  const { data, error } = await supabase
    .from('proposals')
    .update({ status })
    .eq('id', id)
    .select('id');

  if (error) {
    logger.error('Error updating proposal status:', error);
    return false;
  }
  if (!data || data.length === 0) {
    logger.error('updateProposalStatus: no rows affected', { id, status });
    return false;
  }
  if (status === 'fechado' || status === 'perdido') {
    logAction({
      action: status === 'fechado' ? 'close_proposal' : 'lose_proposal',
      entity: 'proposal',
      entity_id: id,
      metadata: { status },
    });
  }
  return true;
}

/** Move card + registra próxima ação numa única chamada (Onda 2). */
export async function updateProposalStatusWithAction(
  id: string,
  status: ProposalStatus,
  action: {
    next_action_type: string | null;
    next_action_notes: string | null;
    next_contact_date: string | null;
  },
): Promise<boolean> {
  const { data, error } = await supabase
    .from('proposals')
    .update({ status, ...action })
    .eq('id', id)
    .select('id');

  if (error) {
    logger.error('Error updating proposal status+action:', error);
    return false;
  }
  const ok = Boolean(data && data.length > 0);
  if (ok && (status === 'fechado' || status === 'perdido')) {
    logAction({
      action: status === 'fechado' ? 'close_proposal' : 'lose_proposal',
      entity: 'proposal',
      entity_id: id,
      metadata: { status, ...action },
    });
  }
  return ok;
}

export async function updateProposal(id: string, fields: UpdateProposalFields): Promise<boolean> {
  const { data, error } = await supabase
    .from('proposals')
    .update(fields)
    .eq('id', id)
    .select('id');

  if (error) {
    logger.error('Error updating proposal:', error);
    return false;
  }
  if (!data || data.length === 0) {
    logger.error('updateProposal: no rows affected', { id, fields });
    return false;
  }
  return true;
}

export async function updateProposalNotes(id: string, notes: string): Promise<boolean> {
  return updateProposal(id, { notes });
}

export async function deleteProposal(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('proposals')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    logger.error('Error deleting proposal:', error);
    return false;
  }
  if (!data || data.length === 0) {
    logger.error('deleteProposal: no rows affected', { id });
    return false;
  }
  logAction({ action: 'delete_proposal', entity: 'proposal', entity_id: id });
  return true;
}

export async function generateShareLink(proposalId: string): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-proposal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ proposalId }),
      }
    );

    if (!resp.ok) return null;
    const { shareToken } = await resp.json();
    return `${window.location.origin}/proposta?token=${shareToken}`;
  } catch (e) {
    logger.error('Error generating share link:', e);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════
// Paginação server-side (Onda escala). Usa RPC list_proposals_page com
// hard cap de 200/página no servidor.
// ════════════════════════════════════════════════════════════════════
export interface ProposalsPageParams {
  search?: string | null;
  status?: ProposalStatus | null;
  onlyActive?: boolean;
  limit?: number;
  offset?: number;
  /** M3-D: tenant explícito (RPC aceita p_company_id; null = fallback current_company_id()). */
  companyId?: string | null;
}

export interface ProposalsPageResult {
  rows: ProposalRecord[];
  total: number;
}

export async function fetchProposalsPage(params: ProposalsPageParams = {}): Promise<ProposalsPageResult> {
  const { search = null, status = null, onlyActive = false, limit = 50, offset = 0, companyId = null } = params;
  const { data, error } = await supabase.rpc('list_proposals_page', {
    p_search: search,
    p_status: status,
    p_only_active: onlyActive,
    p_limit: limit,
    p_offset: offset,
    p_company_id: companyId,
  });
  if (error) {
    logger.error('Error fetching proposals page:', error);
    return { rows: [], total: 0 };
  }
  const rows = (data ?? []) as Array<ProposalRecord & { total_count: number }>;
  const total = rows[0]?.total_count ?? 0;
  // Remove o total_count antes de devolver para tipagem ProposalRecord limpa.
  const cleaned = rows.map(({ total_count, ...rest }) => rest as ProposalRecord);
  return { rows: cleaned, total: Number(total) };
}
