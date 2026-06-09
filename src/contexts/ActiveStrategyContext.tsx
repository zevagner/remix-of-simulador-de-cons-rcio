/**
 * ════════════════════════════════════════════════════════════════════════════
 * ActiveStrategyContext — Tese ativa do cliente (contexto global leve)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * PROBLEMA RESOLVIDO
 *   A auditoria sistêmica apontou que estratégias escolhidas em Wealth Library
 *   ou Compare não viram estado rastreável — usuário fechava o painel e a
 *   escolha se perdia. Sem isso, nenhuma continuidade consultivo→operacional
 *   é possível.
 *
 * PRINCÍPIO
 *   • Contexto MÍNIMO: apenas {id, source, selectedAt}. Sem cópia de dados,
 *     sem snapshot de KPIs, sem cache pesado.
 *   • Persistido em localStorage (não é DB, não é CRM, não é "IA").
 *   • Leitor opcional — módulos consomem quando faz sentido sugerir continuidade.
 *   • Set silencioso — gravar não dispara navegação, apenas grava.
 *
 * NÃO É
 *   • Não é "estratégia obrigatória" — usuário pode trocar a qualquer momento.
 *   • Não é tracking — não envia telemetria.
 *   • Não é onboarding nem wizard.
 * ════════════════════════════════════════════════════════════════════════════
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ActiveStrategySource =
  | 'wealth-library'   // selecionada no card da biblioteca
  | 'compare-winner'   // vencedora apurada no Compare
  | 'manual';          // outra origem (deep-link, restauração)

export interface ActiveStrategy {
  /** ID canônico da estratégia (Library: strategyLibraryData.id · Compare: blueprint.id). */
  id: string;
  /** Origem da escolha — usado em "Continuidade consultiva". */
  source: ActiveStrategySource;
  /** Timestamp (epoch ms) da última seleção. */
  selectedAt: number;
}

interface ActiveStrategyContextValue {
  activeStrategy: ActiveStrategy | null;
  setActiveStrategy: (id: string, source: ActiveStrategySource) => void;
  clearActiveStrategy: () => void;
}

const STORAGE_KEY = 'active-strategy:v1';

const Ctx = createContext<ActiveStrategyContextValue | null>(null);

function load(): ActiveStrategy | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed && typeof parsed === 'object'
      && typeof parsed.id === 'string'
      && typeof parsed.source === 'string'
      && typeof parsed.selectedAt === 'number'
    ) {
      return parsed as ActiveStrategy;
    }
    return null;
  } catch {
    return null;
  }
}

function save(value: ActiveStrategy | null) {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage cheio / privado — ignorar silenciosamente */
  }
}

export function ActiveStrategyProvider({ children }: { children: ReactNode }) {
  const [activeStrategy, setState] = useState<ActiveStrategy | null>(() => load());

  // Re-sync entre abas (storage event)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setState(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setActiveStrategy = useCallback((id: string, source: ActiveStrategySource) => {
    const next: ActiveStrategy = { id, source, selectedAt: Date.now() };
    setState(next);
    save(next);
  }, []);

  const clearActiveStrategy = useCallback(() => {
    setState(null);
    save(null);
  }, []);

  const value = useMemo<ActiveStrategyContextValue>(
    () => ({ activeStrategy, setActiveStrategy, clearActiveStrategy }),
    [activeStrategy, setActiveStrategy, clearActiveStrategy],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActiveStrategy(): ActiveStrategyContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useActiveStrategy must be used within ActiveStrategyProvider');
  return ctx;
}

/** Leitor opcional — não lança quando o provider não está montado (útil em testes). */
export function useActiveStrategySafe(): ActiveStrategyContextValue | null {
  return useContext(Ctx);
}
