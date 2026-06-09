import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listPostSaleClients, createPostSaleClient, updatePostSaleClient, deletePostSaleClient,
  listPostSaleEvents, createPostSaleEvent, listActiveNextActions,
  listPostSaleBids, createPostSaleBid,
  type CreatePostSaleClientInput, type UpdatePostSaleClientInput,
  type CreatePostSaleEventInput, type CreatePostSaleBidInput,
} from '@/services/postSale';
import { logAction, type AuditAction } from '@/services/auditLog';
import { tenantKey, useCurrentCompanyId, type TenantId } from '@/utils/tenantKey';

const POST_SALE_EVENT_AUDIT_MAP: Record<string, AuditAction> = {
  contact: 'contact_post_sale_client',
  opportunity: 'schedule_post_sale_action',
  note: 'register_post_sale_referral',
};

// M3-D: factories tenant-aware. Todas as keys ficam sob `['t', cid, 'post-sale', ...]`.
const KEYS = {
  scope: (cid: TenantId) => tenantKey(cid, 'post-sale') as readonly unknown[],
  clients: (cid: TenantId) => tenantKey(cid, 'post-sale', 'clients') as readonly unknown[],
  events: (cid: TenantId, clientId: string) =>
    tenantKey(cid, 'post-sale', 'events', clientId) as readonly unknown[],
  bids: (cid: TenantId, clientId: string) =>
    tenantKey(cid, 'post-sale', 'bids', clientId) as readonly unknown[],
  nextActions: (cid: TenantId) =>
    tenantKey(cid, 'post-sale', 'next-actions') as readonly unknown[],
};

const STALE_30S = 30 * 1000;
const STALE_60S = 60 * 1000;

export function useActiveNextActions() {
  const cid = useCurrentCompanyId();
  return useQuery({
    queryKey: KEYS.nextActions(cid),
    queryFn: listActiveNextActions,
    staleTime: STALE_60S,
    enabled: !!cid,
  });
}

/**
 * @deprecated Motor migrado para RPC `list_post_sale_clients_page`
 * (hard cap server-side 200). Para busca/paginação real, use
 * `usePostSaleClientsPage` em `@/hooks/usePaginatedQueries`.
 */
export function usePostSaleClients() {
  const cid = useCurrentCompanyId();
  return useQuery({
    queryKey: KEYS.clients(cid),
    queryFn: listPostSaleClients,
    staleTime: STALE_30S,
    enabled: !!cid,
  });
}

export function useCreatePostSaleClient() {
  const qc = useQueryClient();
  const cid = useCurrentCompanyId();
  return useMutation({
    mutationFn: (input: CreatePostSaleClientInput) => createPostSaleClient(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.clients(cid) }),
  });
}

export function useUpdatePostSaleClient() {
  const qc = useQueryClient();
  const cid = useCurrentCompanyId();
  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: UpdatePostSaleClientInput }) =>
      updatePostSaleClient(id, fields),
    onSuccess: (_d, { id, fields }) => {
      qc.invalidateQueries({ queryKey: KEYS.clients(cid) });
      qc.invalidateQueries({ queryKey: KEYS.events(cid, id) });
      if (fields.status) {
        logAction({
          action: 'change_post_sale_status',
          entity: 'post_sale_client',
          entity_id: id,
          metadata: { status: fields.status },
        });
      }
    },
  });
}

export function useDeletePostSaleClient() {
  const qc = useQueryClient();
  const cid = useCurrentCompanyId();
  return useMutation({
    mutationFn: (id: string) => deletePostSaleClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.clients(cid) }),
  });
}

export function usePostSaleEvents(clientId: string | null) {
  const cid = useCurrentCompanyId();
  return useQuery({
    queryKey: KEYS.events(cid, clientId ?? ''),
    queryFn: () => listPostSaleEvents(clientId!),
    enabled: !!cid && !!clientId,
    staleTime: STALE_30S,
  });
}

export function useCreatePostSaleEvent() {
  const qc = useQueryClient();
  const cid = useCurrentCompanyId();
  return useMutation({
    mutationFn: (input: CreatePostSaleEventInput) => createPostSaleEvent(input),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.events(cid, vars.client_id) });
      qc.invalidateQueries({ queryKey: KEYS.clients(cid) });
      qc.invalidateQueries({ queryKey: KEYS.nextActions(cid) });
      const auditAction = POST_SALE_EVENT_AUDIT_MAP[vars.event_type];
      if (auditAction) {
        logAction({
          action: auditAction,
          entity: 'post_sale_event',
          entity_id: vars.client_id,
          metadata: { event_type: vars.event_type, description: vars.description },
        });
      }
    },
  });
}

export function usePostSaleBids(clientId: string | null) {
  const cid = useCurrentCompanyId();
  return useQuery({
    queryKey: KEYS.bids(cid, clientId ?? ''),
    queryFn: () => listPostSaleBids(clientId!),
    enabled: !!cid && !!clientId,
    staleTime: STALE_30S,
  });
}


export function useCreatePostSaleBid() {
  const qc = useQueryClient();
  const cid = useCurrentCompanyId();
  return useMutation({
    mutationFn: (input: CreatePostSaleBidInput) => createPostSaleBid(input),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.bids(cid, vars.client_id) });
      qc.invalidateQueries({ queryKey: KEYS.events(cid, vars.client_id) });
      logAction({
        action: 'register_post_sale_bid',
        entity: 'post_sale_bid',
        entity_id: vars.client_id,
        metadata: {
          bid_value: vars.bid_value,
          bid_percent: vars.bid_percent,
          bid_type: vars.bid_type,
          was_winner: vars.was_winner,
        },
      });
    },
  });
}
