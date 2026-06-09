import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit, getRateLimitKey } from "./_lib/rateLimit.ts";
import { logEdgeError } from "./_lib/logging.ts";

const FN = "update-user-email";

// ═══════ ZOD SCHEMA ═══════
const RequestSchema = z.object({
  new_email: z.string().email("E-mail inválido").max(255).transform((v) => v.trim().toLowerCase()),
  target_user_id: z.string().uuid("ID do usuário inválido").optional(),
}).refine((data) => {
  const domain = data.new_email.split("@")[1];
  return domain === "caixa.gov.br";
}, { message: "Novo e-mail deve ser @caixa.gov.br", path: ["new_email"] });

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  if (!isOriginAllowed(cors)) {
    return jsonResponse({ error: "Origem não permitida" }, 403, cors);
  }

  if (!checkRateLimit(getRateLimitKey(req), { max: 15 })) {
    return jsonResponse({ error: "Muitas requisições. Aguarde um momento." }, 429, cors);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1. Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Não autorizado" }, 401, cors);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user: caller } } = await userClient.auth.getUser(token);
    if (!caller) {
      return jsonResponse({ error: "Não autorizado" }, 401, cors);
    }

    // 2. Validate input
    const rawBody = await req.json();
    const parsed = RequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      const errors = parsed.error.flatten();
      const firstError = Object.values(errors.fieldErrors).flat()[0] || errors.formErrors[0] || "Dados inválidos";
      return jsonResponse({ error: firstError }, 400, cors);
    }

    const { new_email, target_user_id } = parsed.data;

    // 3. Authorization check
    const userId = target_user_id || caller.id;
    if (target_user_id && target_user_id !== caller.id) {
      const { data: roleData } = await userClient.from("user_roles").select("role").eq("user_id", caller.id).single();
      if (roleData?.role !== "admin") {
        return jsonResponse({ error: "Apenas administradores podem alterar e-mail de outros usuários" }, 403, cors);
      }
    }

    // 4. Check if email already exists
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    let page = 1;
    const perPage = 50;
    let existingUser = null;
    let hasMore = true;
    while (hasMore && !existingUser) {
      const { data: { users } } = await adminClient.auth.admin.listUsers({ page, perPage });
      existingUser = users?.find((u) => u.email === new_email && u.id !== userId) ?? null;
      hasMore = (users?.length ?? 0) === perPage;
      page++;
    }
    if (existingUser) {
      return jsonResponse({ error: "Já existe um usuário com este e-mail" }, 409, cors);
    }

    // 5. Update email
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      email: new_email,
      email_confirm: true,
    });

    if (updateError) throw updateError;

    // 6. Audit trail (Onda 2 — sem PII além do próprio e-mail já consentido)
    try {
      await adminClient.from("audit_logs").insert({
        user_id: caller.id,
        entity: "user_account",
        entity_id: userId,
        action: "update_email",
        metadata: {
          target_user_id: userId,
          self: userId === caller.id,
          new_email_domain: new_email.split("@")[1],
          at: new Date().toISOString(),
          success: true,
        },
      });
    } catch (e) {
      console.warn(`[${FN}] audit insert warn:`, e);
    }

    return jsonResponse({ success: true, message: `E-mail atualizado para ${new_email}` }, 200, cors);
  } catch (error) {
    logEdgeError(FN, error, { context: "unhandled" });
    return jsonResponse({ error: "Falha ao atualizar e-mail." }, 500, cors);
  }
});
