/**
 * useCommunityUpdates — fonte única de sinalização de novidades em casos
 * seguidos pelo usuário (RPC community_my_updates). Consumido por Sidebar e
 * BottomNav para badge numérico — não duplicar chamadas em outros lugares.
 *
 * Revalida a cada 60s; quando o usuário entra no módulo Comunidade, o caller
 * decide esconder o badge (não invalidamos aqui — a contagem real só zera
 * quando o usuário lê o caso e o backend atualiza last_seen_reply_count).
 */
import { useQuery } from '@tanstack/react-query';
import { listMyUpdates, type CommunityUpdate } from '@/services/community';
import { useAuth } from '@/hooks/useAuth';

const QUERY_KEY = ['community', 'my-updates'] as const;
const REFETCH_INTERVAL_MS = 60_000;

export function useCommunityUpdates() {
  const { user } = useAuth();
  const query = useQuery<CommunityUpdate[]>({
    queryKey: QUERY_KEY,
    queryFn: listMyUpdates,
    enabled: !!user,
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
  const items = query.data ?? [];
  return { items, count: items.length, isLoading: query.isLoading };
}
