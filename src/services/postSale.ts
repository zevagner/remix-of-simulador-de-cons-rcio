/**
 * Pós-venda service — clientes ativos após o fechamento.
 * Tabelas dedicadas: post_sale_clients, post_sale_events, post_sale_bids.
 *
 * Otimização (Onda escala 10k): selects específicos + paginação + filtros server-side.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type PostSaleStatus = Database['public']['Enums']['post_sale_status'];
export type PostSalePriority = Database['public']['Enums']['post_sale_priority'];
export type PostSaleClient = Database['public']['Tables']['post_sale_clients']['Row'];
export type PostSaleEvent = Database['public']['Tables']['post_sale_events']['Row'];
export type PostSaleBid = Database['public']['Tables']['post_sale_bids']['Row'];

export type CreatePostSaleClientInput = Omit<
  Database['public']['Tables']['post_sale_clients']['Insert'],
  'id' | 'created_at' | 'updated_at'
>;

export type UpdatePostSaleClientInput = Partial<
  Omit<PostSaleClient, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export type CreatePostSaleEventInput = Omit<
  Database['public']['Tables']['post_sale_events']['Insert'],
  'id' | 'created_at'
>;

export type CreatePostSaleBidInput = Omit<
  Database['public']['Tables']['post_sale_bids']['Insert'],
  'id' | 'created_at'
>;

/** Limite de proteção: páginas máximas por listagem (proteção de escala). */
export const POST_SALE_PAGE_LIMIT = 500;
export const POST_SALE_EVENTS_LIMIT = 200;
export const POST_SALE_BIDS_LIMIT = 200;
export const POST_SALE_NEXT_ACTIONS_LIMIT = 200;

const CLIENT_LIST_COLS =
  'id,user_id,proposal_id,client_name,client_phone,consortium_type,credit_value,term_months,group_number,plan_modality,status,priority,group_entry_date,contemplation_date,last_contact_date,notes,created_at,updated_at';

const EVENT_COLS =
  'id,client_id,user_id,event_type,description,event_date,metadata,created_at';

const BID_COLS =
  'id,client_id,user_id,bid_date,bid_value,bid_percent,bid_type,was_winner,notes,created_at';

// ─── CLIENTS ───
/** Total real após o último listPostSaleClients() — para banner de aviso. */
let lastPostSaleTotal = 0;
export function getLastPostSaleTotal(): number {
  return lastPostSaleTotal;
}

/**
 * Lista clientes pós-venda usando a RPC paginada `list_post_sale_clients_page`
 * (hard cap server-side de 200). Mantém a assinatura legada para não quebrar
 * filtros/UI atuais — telas grandes podem migrar progressivamente para
 * `usePostSaleClientsPage` quando precisarem de paginação real.
 */
export async function listPostSaleClients(): Promise<PostSaleClient[]> {
  const { data, error } = await supabase.rpc('list_post_sale_clients_page', {
    p_search: null,
    p_status: null,
    p_limit: POST_SALE_PAGE_LIMIT,
    p_offset: 0,
  });
  if (error) throw error;
  const rows = (data ?? []) as Array<PostSaleClient & { total_count: number }>;
  lastPostSaleTotal = rows[0]?.total_count ?? rows.length;
  return rows.map(({ total_count, ...rest }) => rest as PostSaleClient);
}

export async function createPostSaleClient(input: CreatePostSaleClientInput): Promise<PostSaleClient> {
  const { data, error } = await supabase
    .from('post_sale_clients')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePostSaleClient(id: string, fields: UpdatePostSaleClientInput): Promise<PostSaleClient> {
  const { data, error } = await supabase
    .from('post_sale_clients')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePostSaleClient(id: string): Promise<void> {
  const { error } = await supabase
    .from('post_sale_clients')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/** Verifica se já existe um cliente pós-venda vinculado a uma proposta. */
export async function findPostSaleByProposal(proposalId: string): Promise<PostSaleClient | null> {
  const { data, error } = await supabase
    .from('post_sale_clients')
    .select(CLIENT_LIST_COLS)
    .eq('proposal_id', proposalId)
    .maybeSingle();
  if (error) throw error;
  return (data as PostSaleClient | null);
}

// ─── EVENTS ───
export async function listPostSaleEvents(clientId: string): Promise<PostSaleEvent[]> {
  const { data, error } = await supabase
    .from('post_sale_events')
    .select(EVENT_COLS)
    .eq('client_id', clientId)
    .order('event_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(0, POST_SALE_EVENTS_LIMIT - 1);
  if (error) throw error;
  return (data ?? []) as PostSaleEvent[];
}

export async function createPostSaleEvent(input: CreatePostSaleEventInput): Promise<PostSaleEvent> {
  const { data, error } = await supabase
    .from('post_sale_events')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Lista próximas ações ativas (event_type='opportunity', metadata.kind='next_action', !done).
 *
 * Otimização: filtros JSONB aplicados direto no banco (índice parcial
 * `idx_post_sale_events_next_action` cobre essa combinação).
 */
export async function listActiveNextActions(): Promise<PostSaleEvent[]> {
  const { data, error } = await supabase
    .from('post_sale_events')
    .select(EVENT_COLS)
    .eq('event_type', 'opportunity')
    .filter('metadata->>kind', 'eq', 'next_action')
    .not('metadata->>done', 'eq', 'true')
    .order('event_date', { ascending: true })
    .range(0, POST_SALE_NEXT_ACTIONS_LIMIT - 1);
  if (error) throw error;
  return (data ?? []) as PostSaleEvent[];
}

// ─── BIDS ───
export async function listPostSaleBids(clientId: string): Promise<PostSaleBid[]> {
  const { data, error } = await supabase
    .from('post_sale_bids')
    .select(BID_COLS)
    .eq('client_id', clientId)
    .order('bid_date', { ascending: false })
    .range(0, POST_SALE_BIDS_LIMIT - 1);
  if (error) throw error;
  return (data ?? []) as PostSaleBid[];
}

export async function createPostSaleBid(input: CreatePostSaleBidInput): Promise<PostSaleBid> {
  const { data, error } = await supabase
    .from('post_sale_bids')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}
