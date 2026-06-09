/**
 * Hooks de paginação server-side (Onda escala).
 *
 * Use estes hooks em telas que podem crescer (Carteira, Histórico, Pós-venda).
 * Hard cap de 200 registros por página é aplicado pelo servidor (RPC).
 *
 * Os hooks legados (`useProposals`, `usePostSaleClients`) continuam funcionando
 * para telas pequenas / dashboards agregados.
 *
 * M3-D: query keys agora prefixadas por `['t', companyId, ...]` e companyId
 * é propagado explicitamente para as RPCs (`p_company_id`).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchProposalsPage, type ProposalsPageParams, type ProposalsPageResult } from '@/services/proposals';
import { logger } from '@/utils/logger';
import type { Tables } from '@/integrations/supabase/types';
import { tenantKey, useCurrentCompanyId } from '@/utils/tenantKey';

const STALE_1_MIN = 60_000;

// ─── Propostas paginadas ──────────────────────────────────────────
export function useProposalsPage(params: ProposalsPageParams) {
  const cid = useCurrentCompanyId();
  return useQuery<ProposalsPageResult>({
    queryKey: tenantKey(cid, 'proposals', 'page', params),
    queryFn: () => fetchProposalsPage({ ...params, companyId: cid ?? undefined }),
    staleTime: STALE_1_MIN,
    enabled: !!cid,
    placeholderData: (prev) => prev,
  });
}

// ─── Clientes pós-venda paginados ─────────────────────────────────
export interface PostSalePageParams {
  search?: string | null;
  status?: string | null;
  limit?: number;
  offset?: number;
}

export interface PostSalePageResult {
  rows: Array<Tables<'post_sale_clients'>>;
  total: number;
}

async function fetchPostSaleClientsPage(
  params: PostSalePageParams,
  companyId: string | null,
): Promise<PostSalePageResult> {
  const { search = null, status = null, limit = 50, offset = 0 } = params;
  const { data, error } = await supabase.rpc('list_post_sale_clients_page', {
    p_search: search,
    p_status: status,
    p_limit: limit,
    p_offset: offset,
    p_company_id: companyId,
  });
  if (error) {
    logger.error('Error fetching post-sale page:', error);
    return { rows: [], total: 0 };
  }
  const rows = (data ?? []) as Array<Tables<'post_sale_clients'> & { total_count: number }>;
  const total = rows[0]?.total_count ?? 0;
  const cleaned = rows.map(({ total_count, ...rest }) => rest as Tables<'post_sale_clients'>);
  return { rows: cleaned, total: Number(total) };
}

export function usePostSaleClientsPage(params: PostSalePageParams) {
  const cid = useCurrentCompanyId();
  return useQuery<PostSalePageResult>({
    queryKey: tenantKey(cid, 'post-sale', 'clients', 'page', params),
    queryFn: () => fetchPostSaleClientsPage(params, cid),
    staleTime: STALE_1_MIN,
    enabled: !!cid,
    placeholderData: (prev) => prev,
  });
}

// ─── Eventos da proposta paginados (histórico) ────────────────────
export interface ProposalEventsPageParams {
  proposalId?: string | null;
  limit?: number;
  offset?: number;
}

export interface ProposalEventsPageResult {
  rows: Array<Tables<'proposal_events'>>;
  total: number;
}

async function fetchProposalEventsPage(
  params: ProposalEventsPageParams,
  companyId: string | null,
): Promise<ProposalEventsPageResult> {
  const { proposalId = null, limit = 50, offset = 0 } = params;
  const { data, error } = await supabase.rpc('list_proposal_events_page', {
    p_proposal_id: proposalId,
    p_limit: limit,
    p_offset: offset,
    p_company_id: companyId,
  });
  if (error) {
    logger.error('Error fetching proposal events page:', error);
    return { rows: [], total: 0 };
  }
  const rows = (data ?? []) as Array<Tables<'proposal_events'> & { total_count: number }>;
  const total = rows[0]?.total_count ?? 0;
  const cleaned = rows.map(({ total_count, ...rest }) => rest as Tables<'proposal_events'>);
  return { rows: cleaned, total: Number(total) };
}

export function useProposalEventsPage(params: ProposalEventsPageParams) {
  const cid = useCurrentCompanyId();
  return useQuery<ProposalEventsPageResult>({
    queryKey: tenantKey(cid, 'proposal-events', 'page', params),
    queryFn: () => fetchProposalEventsPage(params, cid),
    staleTime: STALE_1_MIN,
    enabled: !!cid && params.proposalId !== undefined,
    placeholderData: (prev) => prev,
  });
}
