import { supabase } from '@/integrations/supabase/client';
import { isAllowedEmail, DOMAIN_ERROR_SIGNUP } from '@/utils/emailValidation';
import { trackEventWithUser } from './analyticsTracker';
import { sanitizeInput } from '@/utils/sanitize';
import { logger } from '@/utils/logger';

export type UserRole = 'admin' | 'user';
const AUTH_DIAGNOSTIC_TIMEOUT_MS = 15000;

// ─── Utilities ───

function translateAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('signups not allowed') || lower.includes('signup is disabled'))
    return 'O cadastro está temporariamente indisponível. Tente novamente mais tarde.';
  if (lower.includes('rate limit') || lower.includes('too many requests'))
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (lower.includes('already registered') || lower.includes('already been registered'))
    return 'Este email já está cadastrado. Tente fazer login ou recuperar sua senha.';
  if (lower.includes('invalid email'))
    return 'Email inválido. Verifique e tente novamente.';
  if (lower.includes('password') && lower.includes('short'))
    return 'A senha deve ter no mínimo 6 caracteres.';
  // HIBP — Have I Been Pwned (Security Hardening Wave 1)
  if (lower.includes('pwned') || lower.includes('compromised') || lower.includes('breach') || (lower.includes('password') && lower.includes('weak')))
    return 'Esta senha já apareceu em vazamentos públicos de dados. Escolha uma senha diferente para proteger sua conta.';
  if (lower.includes('email not confirmed'))
    return 'Email não confirmado. Verifique sua caixa de entrada.';
  if (lower.includes('invalid login'))
    return 'Email ou senha inválidos.';
  if (lower.includes('user not found'))
    return 'Usuário não encontrado.';
  return msg;
}

function withDiagnosticTimeout<T>(
  label: string,
  operation: () => Promise<T>,
  timeoutMs = AUTH_DIAGNOSTIC_TIMEOUT_MS,
): Promise<T> {
  const startedAt = Date.now();
  const timerId = setTimeout(() => {
    logger.warn(`[auth] ${label} ainda pendente após ${timeoutMs}ms (diagnóstico)`);
  }, timeoutMs);

  return operation()
    .then((result) => {
      logger.log(`[auth] ${label} concluído em ${Date.now() - startedAt}ms`);
      return result;
    })
    .catch((error) => {
      logger.error(`[auth] ${label} falhou em ${Date.now() - startedAt}ms`, error);
      throw error;
    })
    .finally(() => clearTimeout(timerId));
}

async function runPostLoginChecks(userId: string): Promise<{ blocked: boolean; reason?: string }> {
  logger.log('[auth] Pós-login START', { userId });

  try {
    // Check if user has been manually blocked (approved set to false by admin)
    const { data: isApproved, error: rpcError } = await withDiagnosticTimeout(
      'rpc is_approved',
      async () => supabase.rpc('is_approved', { _user_id: userId }),
    );

    if (!rpcError && isApproved === false) {
      logger.warn('[auth] Usuário bloqueado pelo administrador. Realizando signOut.', { userId });
      await withDiagnosticTimeout('signOut usuário bloqueado', async () => supabase.auth.signOut(), 5000).catch((error) => {
        logger.error('[auth] Falha no signOut de usuário bloqueado', error);
      });
      return { blocked: true, reason: 'Seu acesso foi bloqueado pelo administrador.' };
    }

    trackEventWithUser(userId, 'session_login');
    return { blocked: false };
  } catch (error) {
    logger.error('[auth] Pós-login ERROR', error);
    return { blocked: false };
  } finally {
    logger.log('[auth] Pós-login DONE', { userId });
  }
}

// ─── Auth ───

export async function signUp(data: { nome: string; email: string; senha: string }) {
  const cleanEmail = sanitizeInput(data.email).toLowerCase();
  const cleanNome = sanitizeInput(data.nome);

  if (!isAllowedEmail(cleanEmail)) {
    return { success: false, error: DOMAIN_ERROR_SIGNUP };
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: data.senha,
    options: {
      data: { nome: cleanNome },
      emailRedirectTo: window.location.origin + '/login',
    },
  });

  if (error) {
    return { success: false, error: translateAuthError(error.message) };
  }

  if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
    return { success: false, error: 'Este email já está cadastrado. Tente fazer login ou recuperar sua senha.' };
  }

  if (authData.session) {
    await supabase.auth.signOut();
  }

  return { success: true, needsConfirmation: !authData.session };
}

export async function login(email: string, password: string) {
  logger.log('[auth] Iniciando login');

  const { data, error } = await withDiagnosticTimeout(
    'supabase.auth.signInWithPassword',
    async () => supabase.auth.signInWithPassword({ email, password }),
  );

  logger.log('[auth] Resposta do Supabase recebida', {
    hasUser: !!data?.user,
    hasSession: !!data?.session,
    hasError: !!error,
  });

  if (error) {
    logger.error('[auth] Login falhou', error);
    return { success: false, error: translateAuthError(error.message) };
  }

  if (data.user) {
    const postCheck = await runPostLoginChecks(data.user.id);
    if (postCheck.blocked) {
      return { success: false, error: postCheck.reason };
    }
  }

  logger.log('[auth] Login concluído');

  // Enforce single session for non-admin users.
  // Server-side: user_id é derivado do JWT autenticado (body é ignorado).
  // IMPORTANTE: usar fetch direto — supabase.functions.invoke() sobrescreve o
  // header Authorization com o token interno do SDK, que logo após
  // signInWithPassword ainda é null → 401 na edge + ruído no reporter global.
  const accessToken = data.session?.access_token;
  if (data.user && accessToken) {
    void fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enforce-single-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: '{}',
      },
    ).catch(err => {
      logger.warn('[auth] enforce-single-session ignorado', err);
    });
  }

  return { success: true };
}

export async function logout() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) trackEventWithUser(user.id, 'session_logout');
  // Security A2: limpa chaves de PII antes do signOut (defesa em profundidade).
  try {
    const { clearPiiStorageOnLogout } = await import('@/utils/storage/clearPiiOnLogout');
    clearPiiStorageOnLogout();
  } catch { /* never block logout */ }
  await supabase.auth.signOut();
}

export async function getCurrentUserRole(): Promise<UserRole> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'user';

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return (data?.role as UserRole) ?? 'user';
}
