/**
 * Shared hook for assemblies data — backed by database with React Query caching.
 * Replaces all useLocalStorage('consortium-assemblies', []) usage.
 */
import { useQuery } from '@tanstack/react-query';
import { AssemblyRecord } from '@/types/consortium';
import { fetchAssemblies } from '@/services/assemblies';
import { normalizeAllAssemblies } from '@/utils/assemblyData';
import { useMemo } from 'react';

const ASSEMBLIES_QUERY_KEY = ['assemblies'] as const;

export function useAssemblies() {
  const query = useQuery<AssemblyRecord[]>({
    queryKey: ASSEMBLIES_QUERY_KEY,
    queryFn: fetchAssemblies,
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const assemblies = useMemo(
    () => normalizeAllAssemblies(query.data ?? []),
    [query.data]
  );

  return {
    assemblies,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export { ASSEMBLIES_QUERY_KEY };
