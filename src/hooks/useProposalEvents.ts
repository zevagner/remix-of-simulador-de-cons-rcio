import { useQuery } from '@tanstack/react-query';
import { fetchProposalEvents } from '@/services/proposalEvents';
import { tenantKey, useCurrentCompanyId } from '@/utils/tenantKey';

/**
 * @deprecated Motor migrado para RPC `list_proposal_events_page` (hard cap 200).
 * Para paginação real, use `useProposalEventsPage` em `@/hooks/usePaginatedQueries`.
 */
export function useProposalEvents(proposalId: string | null, enabled = true) {
  const cid = useCurrentCompanyId();
  return useQuery({
    queryKey: tenantKey(cid, 'proposal-events', proposalId),
    queryFn: () => (proposalId ? fetchProposalEvents(proposalId) : Promise.resolve([])),
    enabled: enabled && !!proposalId && !!cid,
    staleTime: 30 * 1000,
  });
}
