/**
 * SelectedGroupContext — fonte ÚNICA da seleção (tipo + grupo) de consórcio
 * compartilhada entre os módulos Estudo de Lances e Assembléias.
 *
 * Regra do sistema (não violar):
 *   "Se dois módulos usam o mesmo dado, esse dado não pode ser local."
 *
 * Producers/consumers:
 *  - BidsContext  → consome via useSelectedGroup() (não mantém mais estado próprio).
 *  - AssembliesContext → idem.
 *  - useProposalData() (façade) → reexporta como `selectedGroup` para o PDF.
 *
 * Persistência: localStorage por usuário (chave única) — substitui as duas
 * persistências independentes que existiam antes em cada módulo.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ConsortiumType } from '@/types/consortium';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';

export interface SelectedGroup {
  type: ConsortiumType;
  groupNumber: string; // string vazia = nenhum grupo selecionado
}

interface SelectedGroupContextValue {
  selectedGroup: SelectedGroup;
  setSelectedType: (type: ConsortiumType) => void;
  setSelectedGroupNumber: (groupNumber: string) => void;
  setSelectedGroup: (group: Partial<SelectedGroup>) => void;
  resetSelectedGroup: () => void;
}

const DEFAULT_SELECTION: SelectedGroup = { type: 'imobiliario', groupNumber: '' };
const STORAGE_KEY_PREFIX = 'selected-group:';

function readPersisted(userId: string | null): SelectedGroup {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId ?? 'anon'}`);
    if (!raw) return DEFAULT_SELECTION;
    const parsed = JSON.parse(raw) as Partial<SelectedGroup>;
    return {
      type: parsed.type ?? DEFAULT_SELECTION.type,
      groupNumber: parsed.groupNumber ?? '',
    };
  } catch {
    return DEFAULT_SELECTION;
  }
}

function writePersisted(userId: string | null, value: SelectedGroup) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId ?? 'anon'}`, JSON.stringify(value));
  } catch {
    /* quota / privacy mode — silencioso */
  }
}

const SelectedGroupContext = createContext<SelectedGroupContextValue | null>(null);

export function SelectedGroupProvider({ children }: { children: React.ReactNode }) {
  const userId = useCurrentUserId();
  const initial = useRef(readPersisted(userId)).current;
  const [selectedGroup, setSelectedGroupState] = useState<SelectedGroup>(initial);

  // Persiste a cada mudança.
  useEffect(() => {
    writePersisted(userId, selectedGroup);
  }, [userId, selectedGroup]);

  const setSelectedType = useCallback((type: ConsortiumType) => {
    setSelectedGroupState(prev => {
      // Trocar de tipo invalida o grupo (grupo 123 imob ≠ grupo 123 auto).
      if (prev.type === type) return prev;
      return { type, groupNumber: '' };
    });
  }, []);

  const setSelectedGroupNumber = useCallback((groupNumber: string) => {
    setSelectedGroupState(prev => (prev.groupNumber === groupNumber ? prev : { ...prev, groupNumber }));
  }, []);

  const setSelectedGroup = useCallback((group: Partial<SelectedGroup>) => {
    setSelectedGroupState(prev => {
      const next: SelectedGroup = {
        type: group.type ?? prev.type,
        groupNumber: group.groupNumber ?? (group.type && group.type !== prev.type ? '' : prev.groupNumber),
      };
      if (next.type === prev.type && next.groupNumber === prev.groupNumber) return prev;
      return next;
    });
  }, []);

  const resetSelectedGroup = useCallback(() => {
    setSelectedGroupState(DEFAULT_SELECTION);
  }, []);

  const value = useMemo<SelectedGroupContextValue>(() => ({
    selectedGroup,
    setSelectedType,
    setSelectedGroupNumber,
    setSelectedGroup,
    resetSelectedGroup,
  }), [selectedGroup, setSelectedType, setSelectedGroupNumber, setSelectedGroup, resetSelectedGroup]);

  return <SelectedGroupContext.Provider value={value}>{children}</SelectedGroupContext.Provider>;
}

export function useSelectedGroup(): SelectedGroupContextValue {
  const ctx = useContext(SelectedGroupContext);
  if (!ctx) throw new Error('useSelectedGroup must be used within SelectedGroupProvider');
  return ctx;
}

/** Hook seguro para uso em componentes/hooks que podem rodar fora do provider. */
export function useSelectedGroupSafe(): SelectedGroupContextValue | null {
  return useContext(SelectedGroupContext);
}
