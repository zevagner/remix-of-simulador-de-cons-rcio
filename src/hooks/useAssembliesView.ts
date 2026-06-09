/**
 * useAssembliesView — leitura institucional canônica de assembleias.
 *
 * Substitui o legado `AssembliesContext`. Não mantém estado paralelo:
 *  - dados ⇒ `useAssemblies()` (TanStack Query, cache único institucional)
 *  - seleção (tipo + grupo) ⇒ `useSelectedGroup()` (fonte única)
 *
 * Apenas seletores puros derivados em `useMemo`. Sem transforms,
 * sem regrouping, sem cache local, sem side effects.
 *
 * Onda: Assemblies Legacy Context Removal Wave.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useAssemblies } from '@/hooks/useAssemblies';
import { useSelectedGroup } from '@/contexts/SelectedGroupContext';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import {
  getUniqueGroups,
  getUniqueMonths,
  hasUsefulBidData,
  parseAssemblyMonth,
} from '@/utils/assemblyData';
import { upsertAssemblies } from '@/services/assemblies';
import { initializeFromExcel } from '@/utils/excelLoader';
import { ASSEMBLIES_QUERY_KEY } from '@/hooks/useAssemblies';
import { logger } from '@/utils/logger';
import type { AssemblyRecord, ConsortiumType } from '@/types/consortium';

export interface AssembliesView {
  assemblies: AssemblyRecord[];
  isLoading: boolean;
  selectedTab: ConsortiumType;
  selectedGroupNumber: string;
  setSelectedTab: (v: ConsortiumType) => void;
  setSelectedGroupNumber: (v: string) => void;
  availableGroups: number[];
  latestValidRecord: AssemblyRecord | null;
  stats: { totalAssemblies: number; totalGroups: number; totalMonths: number; months: string[] };
}

export function useAssembliesView(): AssembliesView {
  const { assemblies, isLoading } = useAssemblies();
  const { selectedGroup, setSelectedType: setSelectedTab, setSelectedGroupNumber } = useSelectedGroup();
  const selectedTab = selectedGroup.type;
  const selectedGroupNumber = selectedGroup.groupNumber;

  const availableGroups = useMemo(
    () => getUniqueGroups(assemblies, selectedTab),
    [assemblies, selectedTab]
  );

  const latestValidRecord = useMemo<AssemblyRecord | null>(() => {
    if (!selectedGroupNumber) return null;
    const groupNum = parseInt(selectedGroupNumber, 10);
    const groupRecords = assemblies.filter(
      a => a.consortiumType === selectedTab && a.groupNumber === groupNum
    );
    const validByBid = groupRecords.filter(hasUsefulBidData);
    const recordsToUse = validByBid.length > 0 ? validByBid : groupRecords;
    if (recordsToUse.length === 0) return null;
    return recordsToUse.reduce((latest, current) =>
      parseAssemblyMonth(current.assemblyMonth).getTime() >
      parseAssemblyMonth(latest.assemblyMonth).getTime()
        ? current
        : latest
    );
  }, [assemblies, selectedTab, selectedGroupNumber]);

  const stats = useMemo(() => {
    const typeAssemblies = assemblies.filter(a => a.consortiumType === selectedTab);
    const groups = new Set(typeAssemblies.map(a => a.groupNumber));
    const months = getUniqueMonths(typeAssemblies);
    return {
      totalAssemblies: typeAssemblies.length,
      totalGroups: groups.size,
      totalMonths: months.length,
      months,
    };
  }, [assemblies, selectedTab]);

  return {
    assemblies,
    isLoading,
    selectedTab,
    selectedGroupNumber,
    setSelectedTab,
    setSelectedGroupNumber,
    availableGroups,
    latestValidRecord,
    stats,
  };
}

/**
 * Bootstrap legacy: auto-carrega Excel embutido se a base estiver esparsa,
 * e migra dados de localStorage de versões antigas. Side-effects isolados,
 * admin-gated. NÃO faz parte da leitura canônica.
 */
export function useAssembliesLegacyBootstrap(assemblies: AssemblyRecord[], isLoading: boolean) {
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const ranAutoLoad = useRef(false);
  const ranMigration = useRef(false);

  // Auto-load do Excel embutido — só admin escreve (RLS).
  useEffect(() => {
    if (ranAutoLoad.current || isLoading || !isAdmin || !user) return;
    const imob = getUniqueGroups(assemblies, 'imobiliario').length;
    const auto = getUniqueGroups(assemblies, 'auto').length;
    const pesados = getUniqueGroups(assemblies, 'pesados').length;
    if (imob >= 40 && auto >= 60 && pesados >= 15) {
      ranAutoLoad.current = true;
      return;
    }
    ranAutoLoad.current = true;
    (async () => {
      try {
        const result = await initializeFromExcel([]);
        if (result.stats.total > 0) {
          await upsertAssemblies(result.assemblies, user.userId);
          await queryClient.invalidateQueries({ queryKey: ASSEMBLIES_QUERY_KEY });
        }
      } catch (err) {
        logger.error('[assemblies] auto-bootstrap failed:', err);
      }
    })();
  }, [assemblies, isLoading, isAdmin, user, queryClient]);

  // Migração one-time de localStorage legado.
  useEffect(() => {
    if (ranMigration.current || isLoading || !user || assemblies.length > 0) return;
    ranMigration.current = true;
    try {
      const localData = window.localStorage.getItem('consortium-assemblies');
      if (!localData) return;
      const parsed = JSON.parse(localData) as AssemblyRecord[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      upsertAssemblies(parsed, user.userId)
        .then(() => {
          window.localStorage.removeItem('consortium-assemblies');
          queryClient.invalidateQueries({ queryKey: ASSEMBLIES_QUERY_KEY });
          logger.info('[assemblies] Migrated localStorage data to database');
        })
        .catch(err => logger.error('[assemblies] localStorage migration failed:', err));
    } catch {
      /* ignore */
    }
  }, [isLoading, user, assemblies.length, queryClient]);
}
