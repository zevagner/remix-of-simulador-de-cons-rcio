// ════════════════════════════════════════════════════════════════════
// Authenticated AI Edge Standard — helper canônico
// Valida Authorization: Bearer <jwt> via supabase.auth.getUser()
// (assinatura + expiração + usuário existente no Auth server).
// NÃO usar atob() / parse local de JWT. NÃO confiar em payload do body.
// ════════════════════════════════════════════════════════════════════
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export type AuthResult =
  | { ok: true; userId: string; email: string | null; token: string }
  | { ok: false; status: 401; error: "Unauthorized" };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  const token = authHeader.slice(7).trim();
  if (!token) return { ok: false, status: 401, error: "Unauthorized" };

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Passa o token explicitamente — sem isso, supabase-js@2.39 + signing-keys
  // ocasionalmente ignora o header global e devolve user=null → 401 espúrio.
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  return { ok: true, userId: data.user.id, email: data.user.email ?? null, token };
}

// Variante admin: valida JWT via getUser() e confirma has_role('admin') via service role.
// Use em edges administrativas. Substitui o padrão atob() + has_role.
export type AdminAuthResult =
  | { ok: true; userId: string; email: string | null; token: string }
  | { ok: false; status: 401 | 403; error: "Unauthorized" | "Forbidden" };

export async function authenticateAdmin(req: Request): Promise<AdminAuthResult> {
  const base = await authenticateRequest(req);
  if (!base.ok) return base;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return { ok: false, status: 403, error: "Forbidden" };
  const admin = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.rpc("has_role", {
    _user_id: base.userId,
    _role: "admin",
  });
  if (error || !data) return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, userId: base.userId, email: base.email, token: base.token };
}

// Auditoria mínima padronizada: não loga prompt, resposta ou PII.
export function logAuth(fn: string, userId: string, extra?: Record<string, unknown>) {
  console.log(`[${fn}] auth_ok`, { userId, at: new Date().toISOString(), ...(extra ?? {}) });
}

// Tracking fire-and-forget de chamada de IA com userId já verificado.
export function trackAICallVerified(module: string, userId: string) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    fetch(`${url}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: userId,
        event_name: "ai_call",
        event_data: { module },
      }),
    }).catch(() => {});
  } catch { /* never block */ }
}
