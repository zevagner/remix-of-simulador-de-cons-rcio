import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

/**
 * Onda M1 — Foundation Layer tenant-aware.
 *
 * Este contexto carrega a(s) company(s) do usuário autenticado e expõe
 * o "currentCompanyId" para consumo futuro (M2/M3). Não altera nenhuma
 * UX nem dispara nenhum filtro tenant-aware ainda — apenas prepara o
 * terreno. Enquanto MULTI_TENANT_RLS=false, todas as queries continuam
 * filtrando por auth.uid().
 *
 * Modelo atual: 1 usuário → 1 company própria.
 * O hook já é resiliente a múltiplas companies para suportar M5+.
 */

export type CompanyRole = 'owner' | 'admin' | 'manager' | 'advisor' | 'viewer';

export interface CompanyMembership {
  companyId: string;
  role: CompanyRole;
  active: boolean;
}

interface CurrentCompanyContextValue {
  currentCompanyId: string | null;
  companies: CompanyMembership[];
  loading: boolean;
  setCurrentCompany: (companyId: string) => void;
  refresh: () => Promise<void>;
}

const CurrentCompanyContext = createContext<CurrentCompanyContextValue | null>(null);

const STORAGE_KEY = 'tenant:currentCompanyId';

export function CurrentCompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyMembership[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      // company_users foi criada na migration M1; usamos cast porque types.ts
      // pode não estar regenerado ainda na primeira renderização do build.
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => {
          select: (s: string) => {
            eq: (col: string, val: string) => {
              eq: (col: string, val: boolean) => Promise<{ data: Array<{ company_id: string; role: CompanyRole; active: boolean }> | null; error: unknown }>;
            };
          };
        };
      })
        .from('company_users')
        .select('company_id, role, active')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) {
        logger.warn('[useCurrentCompany] erro ao carregar memberships', error);
        setCompanies([]);
        setCurrentCompanyId(null);
        return;
      }

      const list: CompanyMembership[] = (data ?? []).map((r) => ({
        companyId: r.company_id,
        role: r.role,
        active: r.active,
      }));

      setCompanies(list);

      // Resolução de current: localStorage → owner → primeira → null
      const stored = localStorage.getItem(STORAGE_KEY);
      const resolved =
        list.find((m) => m.companyId === stored)?.companyId ??
        list.find((m) => m.role === 'owner')?.companyId ??
        list[0]?.companyId ??
        null;

      setCurrentCompanyId(resolved);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.userId) {
      setCompanies([]);
      setCurrentCompanyId(null);
      return;
    }
    void load(user.userId);
  }, [user?.userId, load]);

  const setCurrentCompany = useCallback((companyId: string) => {
    setCurrentCompanyId(companyId);
    localStorage.setItem(STORAGE_KEY, companyId);
  }, []);

  const refresh = useCallback(async () => {
    if (user?.userId) await load(user.userId);
  }, [user?.userId, load]);

  const value = useMemo<CurrentCompanyContextValue>(
    () => ({ currentCompanyId, companies, loading, setCurrentCompany, refresh }),
    [currentCompanyId, companies, loading, setCurrentCompany, refresh],
  );

  return (
    <CurrentCompanyContext.Provider value={value}>
      {children}
    </CurrentCompanyContext.Provider>
  );
}

export function useCurrentCompany(): CurrentCompanyContextValue {
  const ctx = useContext(CurrentCompanyContext);
  if (!ctx) {
    // Fallback seguro: hook pode ser chamado antes do provider estar montado
    // (ex.: testes isolados). Não lançar erro para não regredir UX.
    return {
      currentCompanyId: null,
      companies: [],
      loading: false,
      setCurrentCompany: () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}
