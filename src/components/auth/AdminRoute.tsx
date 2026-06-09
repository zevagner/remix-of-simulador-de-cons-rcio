import { type ReactNode, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { trackSecurityEvent } from '@/services/analyticsTracker';

const Loader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

/**
 * Guard de rota administrativa.
 * - loading        → Loader
 * - !user          → redirect /login
 * - user, !isAdmin → redirect /app + alerta de segurança
 * - admin          → renderiza children
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const firedRef = useRef(false);

  useEffect(() => {
    if (loading || !user || isAdmin) return;
    if (firedRef.current) return;
    firedRef.current = true;
    trackSecurityEvent(
      'unauthorized_admin_access',
      `Usuário ${user.email ?? user.userId} tentou acessar /admin sem privilégio`,
      { email: user.email, path: '/admin' },
    );
  }, [loading, user, isAdmin]);

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;

  return <>{children}</>;
}
