import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit, getRateLimitKey } from "./_lib/rateLimit.ts";
import { logEdgeError } from "./_lib/logging.ts";

const FN = "create-user";

// ═══════ ZOD SCHEMA ═══════
const ALLOWED_DOMAINS = ["caixa.gov.br"];

const RequestSchema = z.object({
  email: z.string().email("E-mail inválido").max(255).transform((v) => v.trim().toLowerCase()),
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100).transform((v) => v.trim().replace(/[<>]/g, "")),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(128),
}).refine((data) => {
  const domain = data.email.split("@")[1];
  return domain && ALLOWED_DOMAINS.includes(domain);
}, { message: "Apenas e-mails @caixa.gov.br são permitidos", path: ["email"] });

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

    // 1. Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Não autorizado" }, 401, cors);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user: caller }, error: callerError } = await userClient.auth.getUser(token);
    if (callerError || !caller) {
      return jsonResponse({ error: "Não autorizado" }, 401, cors);
    }

    const { data: roleData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (roleData?.role !== "admin") {
      return jsonResponse({ error: "Apenas administradores podem criar usuários" }, 403, cors);
    }

    // 2. Validate input with Zod
    const rawBody = await req.json();
    const parsed = RequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      const errors = parsed.error.flatten();
      const firstError = Object.values(errors.fieldErrors).flat()[0] || errors.formErrors[0] || "Dados inválidos";
      return jsonResponse({ error: firstError }, 400, cors);
    }

    const { email, nome, password } = parsed.data;

    // 3. Create user with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (createError) {
      if (createError.message?.includes("already been registered") || createError.message?.includes("already exists")) {
        return jsonResponse({ error: "Este e-mail já está cadastrado no sistema" }, 409, cors);
      }
      return jsonResponse({ error: `Falha ao criar usuário: ${createError.message}` }, 500, cors);
    }

    // 4. Update profile
    if (newUser?.user) {
      await adminClient
        .from("profiles")
        .update({ nome, approved: true })
        .eq("user_id", newUser.user.id);
    }

    // 5. Log the action (minimizing PII)
    const emailDomain = email.split("@")[1];
    await adminClient.from("admin_logs").insert({
      admin_user_id: caller.id,
      action: "create_user",
      target_user_id: newUser?.user?.id ?? null,
      details: `Novo usuário criado com domínio @${emailDomain}`,
    });

    return jsonResponse({ success: true, message: "Usuário criado com sucesso" }, 200, cors);
  } catch (error) {
    logEdgeError(FN, error, { context: "unhandled" });
    return jsonResponse({ error: (error as Error).message ?? "Erro interno" }, 500, cors);
  }
});
