import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit, getRateLimitKey } from "./_lib/rateLimit.ts";
import { logEdgeError } from "./_lib/logging.ts";

const FN = "delete-user";

// ═══════ ZOD SCHEMA ═══════
const RequestSchema = z.object({
  userIdToDelete: z.string().uuid("ID do usuário inválido"),
});

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
      return jsonResponse({ error: "Apenas administradores podem excluir usuários" }, 403, cors);
    }

    // 2. Validate input
    const rawBody = await req.json();
    const parsed = RequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return jsonResponse(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        400,
        cors,
      );
    }

    const { userIdToDelete } = parsed.data;

    // 3. Prevent self-deletion
    if (userIdToDelete === caller.id) {
      return jsonResponse({ error: "Não é possível excluir a si mesmo" }, 400, cors);
    }

    // 4. Prevent deleting last admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: adminRoles } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const isTargetAdmin = (adminRoles ?? []).some((r) => r.user_id === userIdToDelete);
    if (isTargetAdmin && (adminRoles ?? []).length <= 1) {
      return jsonResponse({ error: "Não é possível excluir o último administrador" }, 400, cors);
    }

    // 5. Delete related data (cascade: groups → assembly_results automatic)
    await adminClient.from("feedbacks").delete().eq("user_id", userIdToDelete);
    await adminClient.from("analytics_events").delete().eq("user_id", userIdToDelete);
    await adminClient.from("groups").delete().eq("user_id", userIdToDelete);
    // Legacy `assemblies` table is frozen (canonical = groups + assembly_results). No writes.
    await adminClient.from("admin_logs").delete().eq("admin_user_id", userIdToDelete);
    await adminClient.from("user_roles").delete().eq("user_id", userIdToDelete);
    await adminClient.from("profiles").delete().eq("user_id", userIdToDelete);

    // 6. Delete from auth.users
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userIdToDelete);

    if (deleteError) {
      return jsonResponse({ error: `Falha ao excluir usuário: ${deleteError.message}` }, 500, cors);
    }

    // 7. Log the action
    await adminClient.from("admin_logs").insert({
      admin_user_id: caller.id,
      action: "delete_user_complete",
      target_user_id: userIdToDelete,
      details: "Usuário removido completamente (auth + dados)",
    });

    return jsonResponse({ success: true, message: "Usuário excluído completamente" }, 200, cors);
  } catch (error) {
    logEdgeError(FN, error, { context: "unhandled" });
    return jsonResponse({ error: (error as Error).message ?? "Erro interno" }, 500, cors);
  }
});
