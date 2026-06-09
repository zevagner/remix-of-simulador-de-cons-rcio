import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProposals, updateProposalStatus, updateProposalStatusWithAction,
  deleteProposal, updateProposal, saveProposal,
  type ProposalRecord, type ProposalStatus, type UpdateProposalFields, type InsertProposal,
  type ProposalsPageResult,
} from '@/services/proposals';
import { logger } from '@/utils/logger';
import { trackEvent } from '@/services/analyticsTracker';
import { toast } from 'sonner';
import { useClientJourneySafe } from '@/components/layout/ClientJourneyContext';
import { tenantKey, useCurrentCompanyId, type TenantId } from '@/utils/tenantKey';

/**
 * M3-D: query keys agora prefixadas por `['t', companyId, 'proposals', ...]`.
 * Mantém helper público `proposalsKeys` para consumers externos, exigindo cid.
 */
export const proposalsKeys = {
  scope: (cid: TenantId) => tenantKey(cid, 'proposals') as readonly unknown[],
  list: (cid: TenantId) => tenantKey(cid, 'proposals', 'list') as readonly unknown[],
};

const STALE_2_MIN = 2 * 60 * 1000;

function reportMutationError(operation: string, err: unknown, vars?: Record<string, unknown>) {
  const msg = err instanceof Error ? err.message : String(err);
  logger.error(`[proposals.${operation}] mutation falhou`, { msg, vars });
  trackEvent('proposal_mutation_failed', { operation, error: msg.slice(0, 200) });
}

type ProposalsCacheShape = ProposalRecord[] | ProposalsPageResult | undefined;
function patchProposalCaches(
  qc: ReturnType<typeof useQueryClient>,
  cid: TenantId,
  transform: (rows: ProposalRecord[]) => ProposalRecord[],
) {
  qc.setQueriesData<ProposalsCacheShape>({ queryKey: proposalsKeys.scope(cid) }, (data) => {
    if (!data) return data;
    if (Array.isArray(data)) return transform(data);
    if ('rows' in data && Array.isArray((data as ProposalsPageResult).rows)) {
      const next = transform((data as ProposalsPageResult).rows);
      return { ...(data as ProposalsPageResult), rows: next };
    }
    return data;
  });
}
function snapshotProposalCaches(qc: ReturnType<typeof useQueryClient>, cid: TenantId) {
  return qc.getQueriesData<ProposalsCacheShape>({ queryKey: proposalsKeys.scope(cid) });
}
function restoreProposalCaches(
  qc: ReturnType<typeof useQueryClient>,
  snap: ReturnType<typeof snapshotProposalCaches>,
) {
  for (const [key, data] of snap) qc.setQueryData(key, data);
}
function invalidateAllProposalCaches(qc: ReturnType<typeof useQueryClient>, cid: TenantId) {
  qc.invalidateQueries({ queryKey: proposalsKeys.scope(cid) });
}

/**
 * @deprecated Motor interno migrado para RPC `list_proposals_page`
 * (hard cap server-side 200). Para busca/paginação real, prefira
 * `useProposalsPage` em `@/hooks/usePaginatedQueries`.
 */
export function useProposals() {
  const cid = useCurrentCompanyId();
  return useQuery({
    queryKey: proposalsKeys.list(cid),
    queryFn: fetchProposals,
    staleTime: STALE_2_MIN,
    enabled: !!cid,
  });
}

export function useProposalsCache() {
  const qc = useQueryClient();
  const cid = useCurrentCompanyId();
  return {
    setProposals: (updater: (prev: ProposalRecord[]) => ProposalRecord[]) => {
      qc.setQueryData<ProposalRecord[]>(proposalsKeys.list(cid), (prev) => updater(prev ?? []));
    },
    invalidate: () => qc.invalidateQueries({ queryKey: proposalsKeys.list(cid) }),
  };
}

export function useUpdateProposalStatus() {
  const qc = useQueryClient();
  const cid = useCurrentCompanyId();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProposalStatus }) => {
      const ok = await updateProposalStatus(id, status);
      if (!ok) throw new Error('Falha ao atualizar status no banco');
      return { id, status };
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: proposalsKeys.scope(cid) });
      const previous = snapshotProposalCaches(qc, cid);
      patchProposalCaches(qc, cid, (rows) =>
        rows.map(p => p.id === id ? { ...p, status, updated_at: new Date().toISOString() } : p),
      );
      return { previous };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.previous) restoreProposalCaches(qc, ctx.previous);
      reportMutationError('updateStatus', err, vars as Record<string, unknown>);
      toast.error('Erro ao atualizar status. Estado revertido.');
    },
    onSettled: () => { invalidateAllProposalCaches(qc, cid); },
  });
}

export interface NextActionPayload {
  next_action_type: string | null;
  next_action_notes: string | null;
  next_contact_date: string | null;
}

export function useUpdateProposalStatusWithAction() {
  const qc = useQueryClient();
  const cid = useCurrentCompanyId();
  return useMutation({
    mutationFn: async ({ id, status, action }: { id: string; status: ProposalStatus; action: NextActionPayload }) => {
      const ok = await updateProposalStatusWithAction(id, status, action);
      if (!ok) throw new Error('Falha ao atualizar status + ação no banco');
      return { id, status, action };
    },
    onMutate: async ({ id, status, action }) => {
      await qc.cancelQueries({ queryKey: proposalsKeys.scope(cid) });
      const previous = snapshotProposalCaches(qc, cid);
      patchProposalCaches(qc, cid, (rows) =>
        rows.map(p => p.id === id ? {
          ...p, status, ...action, updated_at: new Date().toISOString(),
        } : p),
      );
      return { previous };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.previous) restoreProposalCaches(qc, ctx.previous);
      reportMutationError('updateStatusWithAction', err, vars as Record<string, unknown>);
      toast.error('Erro ao atualizar. Estado revertido.');
    },
    onSettled: () => { invalidateAllProposalCaches(qc, cid); },
  });
}

export function useDeleteProposal() {
  const qc = useQueryClient();
  const cid = useCurrentCompanyId();
  return useMutation({
    mutationFn: async (id: string) => {
      const ok = await deleteProposal(id);
      if (!ok) throw new Error('Falha ao deletar no banco');
      return id;
    },
    onSuccess: (id) => {
      patchProposalCaches(qc, cid, (rows) => rows.filter(p => p.id !== id));
    },
    onError: (err, vars) => {
      reportMutationError('delete', err, { id: vars });
      toast.error('Erro ao excluir. Tente novamente.');
    },
    onSettled: () => { invalidateAllProposalCaches(qc, cid); },
  });
}

export function useUpdateProposal() {
  const qc = useQueryClient();
  const cid = useCurrentCompanyId();
  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: UpdateProposalFields }) => {
      const ok = await updateProposal(id, fields);
      if (!ok) throw new Error('Falha ao atualizar campos no banco');
      return { id, fields };
    },
    onSuccess: ({ id, fields }) => {
      patchProposalCaches(qc, cid, (rows) =>
        rows.map(p => p.id === id ? { ...p, ...fields, updated_at: new Date().toISOString() } : p),
      );
    },
    onError: (err, vars) => {
      reportMutationError('update', err, vars as Record<string, unknown>);
      toast.error('Erro ao salvar alterações.');
    },
    onSettled: () => { invalidateAllProposalCaches(qc, cid); },
  });
}

export function useUpdateProposalNotes() {
  const qc = useQueryClient();
  const cid = useCurrentCompanyId();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { updateProposalNotes } = await import('@/services/proposals');
      const ok = await updateProposalNotes(id, notes);
      if (!ok) throw new Error('Falha ao salvar anotação');
      return { id, notes };
    },
    onSuccess: ({ id, notes }) => {
      patchProposalCaches(qc, cid, (rows) =>
        rows.map(p => p.id === id ? { ...p, notes, updated_at: new Date().toISOString() } : p),
      );
    },
    onError: (err, vars) => {
      reportMutationError('updateNotes', err, vars as Record<string, unknown>);
      toast.error('Erro ao salvar anotação.');
    },
    onSettled: () => { invalidateAllProposalCaches(qc, cid); },
  });
}

function friendlyProposalError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('PROSPECT_TRIGGER_REQUIRED')) {
    return 'Selecione o motivo do cliente (gatilho de prospecção) antes de salvar.';
  }
  if (raw.includes('NEXT_ACTION_REQUIRED')) {
    return 'Defina a próxima ação (ligar, WhatsApp, reunião…) antes de avançar a proposta.';
  }
  return 'Erro ao criar proposta.';
}

export function useCreateProposal() {
  const qc = useQueryClient();
  const cid = useCurrentCompanyId();
  const journey = useClientJourneySafe();
  return useMutation({
    mutationFn: async (data: InsertProposal) => {
      const record = await saveProposal(data);
      if (!record) throw new Error('Falha ao criar proposta');
      return record;
    },
    onSuccess: (record) => {
      patchProposalCaches(qc, cid, (rows) => [record, ...rows]);
      journey?.updateSlots({
        proposalStatus: {
          proposalId: record.id,
          status: 'gerada',
          at: new Date().toISOString(),
        },
      });
    },
    onError: (err) => {
      reportMutationError('create', err);
      toast.error(friendlyProposalError(err));
    },
    onSettled: () => { invalidateAllProposalCaches(qc, cid); },
  });
}
