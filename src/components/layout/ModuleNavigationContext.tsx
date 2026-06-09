import { createContext, useContext, useCallback, useMemo, useState, type ReactNode } from 'react';

/**
 * Recomendação ativa propagada entre módulos.
 * - source: módulo de origem (rastreabilidade)
 * - recommendedScenarioId / scenarioName: vencedor do Investment (ex: 'quick-contemplation')
 */
export interface ModuleNavigationPayload {
  source?: 'investment';
  recommendedScenarioId?: string;
  scenarioName?: string;
}

interface ModuleNavigationContextType {
  navigateTo: (module: string, payload?: ModuleNavigationPayload) => void;
  /**
   * Abre explicitamente o Cockpit Consultivo (overview da Análise).
   * Use SOMENTE quando a intenção for realmente o overview — para subitens
   * (Wealth/Compare/etc.) use `navigateTo(<id-do-subitem>)`.
   */
  navigateToAnalysisOverview: () => void;
  /** Última recomendação propagada (consumida pelo módulo de destino, ex: Proposta) */
  recommendation: ModuleNavigationPayload | null;
  /** Limpa a recomendação (chamado pelo destino após consumir, opcional) */
  clearRecommendation: () => void;
}

const ModuleNavigationContext = createContext<ModuleNavigationContextType | null>(null);

export function useModuleNavigation() {
  const ctx = useContext(ModuleNavigationContext);
  if (!ctx) throw new Error('useModuleNavigation must be used within ModuleNavigationProvider');
  return ctx;
}

interface Props {
  onModuleChange: (module: string) => void;
  children: ReactNode;
}

export function ModuleNavigationProvider({ onModuleChange, children }: Props) {
  const [recommendation, setRecommendation] = useState<ModuleNavigationPayload | null>(null);

  const navigateTo = useCallback((module: string, payload?: ModuleNavigationPayload) => {
    if (payload) setRecommendation(payload);
    onModuleChange(module);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onModuleChange]);

  const navigateToAnalysisOverview = useCallback(() => {
    onModuleChange('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onModuleChange]);

  const clearRecommendation = useCallback(() => setRecommendation(null), []);

  const contextValue = useMemo(
    () => ({ navigateTo, navigateToAnalysisOverview, recommendation, clearRecommendation }),
    [navigateTo, navigateToAnalysisOverview, recommendation, clearRecommendation],
  );

  return (
    <ModuleNavigationContext.Provider value={contextValue}>
      {children}
    </ModuleNavigationContext.Provider>
  );
}
