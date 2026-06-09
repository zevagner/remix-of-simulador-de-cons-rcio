/**
 * ════════════════════════════════════════════════════════════════════════════
 * WealthPdfSelectionContext — seleção multi-estratégia para PDF consolidado
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Estado local APENAS de seleção (IDs). Zero cálculo, zero persistência
 * (intencional — seleção é efêmera por sessão de mesa consultiva). Scoped
 * ao `WealthPlatformModule`, sem leakage para outros módulos.
 *
 * Geração de PDF ainda não habilitada — esta wave entrega apenas o
 * mecanismo de seleção (checkbox + barra flutuante).
 * ════════════════════════════════════════════════════════════════════════════
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface Ctx {
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
  count: number;
}

const WealthPdfSelectionCtx = createContext<Ctx | null>(null);

export function WealthPdfSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const clear = useCallback(() => setSelectedIds([]), []);

  const value = useMemo<Ctx>(
    () => ({
      selectedIds,
      isSelected: (id: string) => selectedIds.includes(id),
      toggle,
      clear,
      count: selectedIds.length,
    }),
    [selectedIds, toggle, clear],
  );

  return (
    <WealthPdfSelectionCtx.Provider value={value}>
      {children}
    </WealthPdfSelectionCtx.Provider>
  );
}

/** Safe — retorna null se fora do provider (cards podem ser renderizados em outros contextos). */
export function useWealthPdfSelectionSafe(): Ctx | null {
  return useContext(WealthPdfSelectionCtx);
}

export function useWealthPdfSelection(): Ctx {
  const ctx = useContext(WealthPdfSelectionCtx);
  if (!ctx) throw new Error('useWealthPdfSelection must be used within WealthPdfSelectionProvider');
  return ctx;
}
