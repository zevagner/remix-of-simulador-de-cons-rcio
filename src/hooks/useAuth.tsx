import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { login as authLogin, type UserRole } from '@/services/auth';
import { trackEvent, setAnalyticsCachedUserId, trackSecurityEvent } from '@/services/analyticsTracker';
import { clearPiiStorageOnLogout } from '@/utils/storage/clearPiiOnLogout';
import { logger } from '@/utils/logger';

interface AuthUser {
  userId: string;
  email: string;
  nome: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  logModuleAccess: (module: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const USER_DATA_TIMEOUT_MS = 12000;

async function withTimeout<T>(label: string, operation: () => Promise<T>, timeoutMs = USER_DATA_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} excedeu ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([operation(), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  const initializedUserIdRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const forceSignOut = useCallback(async (reason: string) => {
    setUser(null);
    setLoading(false);
    initializedRef.current = false;
    initializedUserIdRef.current = null;
    clearPiiStorageOnLogout();
    await supabase.auth.signOut().catch(() => {});
    toast.error(reason);
    navigate('/login', { replace: true });
  }, [navigate]);

  const loadUserData = useCallback(async (authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }, source: string) => {
    if (loadingRef.current === authUser.id) return;
    loadingRef.current = authUser.id;

    try {
      const [profileSettled, roleSettled] = await Promise.allSettled([
        withTimeout('query profiles', async () => supabase.from('profiles').select('nome, approved').eq('user_id', authUser.id).maybeSingle()),
        withTimeout('query user_roles', async () => supabase.from('user_roles').select('role').eq('user_id', authUser.id).maybeSingle()),
      ]);

      const profileResult = profileSettled.status === 'fulfilled' ? profileSettled.value : null;
      const roleResult = roleSettled.status === 'fulfilled' ? roleSettled.value : null;

      // Check if user was manually blocked by admin
      const isApproved = profileResult?.data?.approved;
      if (isApproved === false) {
        loadingRef.current = null;
        await forceSignOut('Seu acesso foi bloqueado pelo administrador.');
        return;
      }

      setUser((prev) => ({
        userId: authUser.id,
        email: authUser.email ?? '',
        nome: profileResult?.data?.nome ?? (authUser.user_metadata?.nome as string) ?? authUser.email ?? '',
        role: (roleResult?.data?.role as UserRole) ?? prev?.role ?? 'user',
      }));

      // Alerta: usuário de domínio externo (@caixaconsorcio.com.br).
      // Disparo único por sessão via sessionStorage flag.
      const email = (authUser.email ?? '').toLowerCase();
      if (email.endsWith('@caixaconsorcio.com.br')) {
        try {
          const key = `sec:external-domain-fired:${authUser.id}`;
          if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            trackSecurityEvent(
              'external_domain_activity',
              `Acesso de domínio externo: ${email}`,
              { email, source },
            );
          }
        } catch {
          // ignora falhas de sessionStorage (modo privado, etc.)
        }
      }
    } catch {
      setUser((prev) => prev ?? {
        userId: authUser.id,
        email: authUser.email ?? '',
        nome: (authUser.user_metadata?.nome as string) ?? authUser.email ?? '',
        role: 'user',
      });
    } finally {
      loadingRef.current = null;
      setLoading(false);
    }
  }, [forceSignOut]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Keep analytics cache in sync (replaces the leaked module-scope listener)
      setAnalyticsCachedUserId(session?.user?.id ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        // M3-D cache bust: troca de usuário invalida cache tenant-aware anterior.
        // Mesmo usuário re-logando preserva cache (initializedUserIdRef bate).
        if (initializedUserIdRef.current && initializedUserIdRef.current !== session.user.id) {
          queryClient.removeQueries({ queryKey: ['t'] });
          queryClient.removeQueries({ queryKey: ['tenant'] });
        }
        if (initializedRef.current && initializedUserIdRef.current === session.user.id) {
          setLoading(false);
          return;
        }
        await loadUserData(session.user, 'onAuthStateChange');
      } else if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        setUser(null);
        setLoading(false);
        initializedRef.current = false;
        initializedUserIdRef.current = null;
        // M3-D: limpa todo o cache tenant-aware no logout para evitar
        // vazamento visual cross-tenant em login subsequente.
        queryClient.removeQueries({ queryKey: ['t'] });
        queryClient.removeQueries({ queryKey: ['tenant'] });
        // Security A2: limpa PII em localStorage (expirou sessão, troca de conta, etc.)
        clearPiiStorageOnLogout();
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Sync analytics cache on initial load
      setAnalyticsCachedUserId(session?.user?.id ?? null);

      if (session?.user) {
        initializedRef.current = true;
        initializedUserIdRef.current = session.user.id;
        // Capture returning users (session resumed without explicit login form).
        // Without this, session_login only fires for users typing email+password,
        // missing 90%+ of sessions and skewing all funnel analytics.
        trackEvent('session_login', { resumed: true });
        await loadUserData(session.user, 'getSession');
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      // Clean up analytics cache when AuthProvider unmounts
      setAnalyticsCachedUserId(null);
    };
  }, [loadUserData, queryClient]);

  // Periodic approval check during active session
  useEffect(() => {
    if (!user?.userId) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('approved')
          .eq('user_id', user.userId)
          .maybeSingle();

        if (error) {
          // Log but don't kick user on transient network error
          logger.warn('[useAuth] Erro ao verificar aprovação periódica', error);
          return;
        }

        if (data?.approved === false) {
          await forceSignOut('Seu acesso foi bloqueado pelo administrador.');
        }
      } catch (err) {
        logger.error('[useAuth] Falha crítica na verificação de aprovação', err);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user?.userId, forceSignOut]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      return await authLogin(email, password);
    } catch {
      return { success: false, error: 'Erro inesperado ao fazer login. Tente novamente.' };
    }
  }, []);

  const logout = useCallback(async () => {
    trackEvent('session_logout');
    setUser(null);
    clearPiiStorageOnLogout();
    await supabase.auth.signOut();
  }, []);

  const logModuleAccess = useCallback((module: string) => {
    trackEvent('module_access', { module });
  }, []);

  const isAdmin = user?.role === 'admin';

  const value = useMemo<AuthContextType>(() => ({
    user, loading, login, logout, isAdmin, logModuleAccess,
  }), [user, loading, login, logout, isAdmin, logModuleAccess]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
