import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit, getRateLimitKey } from "./_lib/rateLimit.ts";
import { logEdgeError } from "./_lib/logging.ts";
import { authenticateRequest } from "../_shared/auth.ts";

const FN = "share-proposal";

// ═══════ ZOD SCHEMAS ═══════
const PostBodySchema = z.object({
  proposalId: z.string().uuid("ID da proposta inválido"),
});

const TokenQuerySchema = z.string().min(1).max(128);

serve(async (req) => {
  // share-proposal precisa de GET, POST e OPTIONS — sobrescreve métodos do CORS
  const cors = { ...getCorsHeaders(req), "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  // GET é público (link compartilhável) — não bloquear por origem.
  if (req.method !== "GET" && !isOriginAllowed(cors)) {
    return jsonResponse({ error: "Origem não permitida" }, 403, cors);
  }

  // Rate limit (mais permissivo no GET pois é público)
  if (!checkRateLimit(getRateLimitKey(req), { max: req.method === "GET" ? 60 : 15 })) {
    return jsonResponse({ error: "Muitas requisições. Aguarde um momento." }, 429, cors);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const url = new URL(req.url);

    // GET: Fetch proposal by share token (public)
    if (req.method === "GET") {
      const token = url.searchParams.get("token");
      const tokenParsed = TokenQuerySchema.safeParse(token);
      if (!tokenParsed.success) {
        return jsonResponse({ error: "Token obrigatório" }, 400, cors);
      }

      const { data, error } = await supabase
        .from("proposals")
        .select("client_name, credit_value, term_months, installment, total_cost, consortium_type, group_number, bid_percent, bid_zone, proposal_content, proposal_format, prospect_trigger, created_at, share_token_expires_at, share_token_revoked_at")
        .eq("share_token", tokenParsed.data)
        .single();

      if (error || !data) {
        return jsonResponse({ error: "Proposta não encontrada" }, 404, cors);
      }

      // Validações de validade do link
      const row = data as Record<string, unknown>;
      if (row.share_token_revoked_at) {
        return jsonResponse({ error: "Link revogado pelo consultor" }, 410, cors);
      }
      if (row.share_token_expires_at && new Date(row.share_token_expires_at as string) < new Date()) {
        return jsonResponse({ error: "Link expirado. Solicite um novo ao consultor." }, 410, cors);
      }

      // Não devolve campos internos ao público
      delete row.share_token_expires_at;
      delete row.share_token_revoked_at;
      return jsonResponse(row, 200, cors);
    }

    // POST: Generate share token (authenticated)
    if (req.method === "POST") {
      // AuthN via helper canônico (valida assinatura + expiração via auth.getUser())
      const auth = await authenticateRequest(req);
      if (!auth.ok) {
        return jsonResponse({ error: "Não autorizado" }, 401, cors);
      }
      const userId = auth.userId;

      const rawBody = await req.json();
      const parsed = PostBodySchema.safeParse(rawBody);
      if (!parsed.success) {
        return jsonResponse(
          { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
          400,
          cors,
        );
      }

      const { proposalId } = parsed.data;

      // Check ownership
      const { data: proposal } = await supabase
        .from("proposals")
        .select("id, share_token, share_token_expires_at, share_token_revoked_at, user_id")
        .eq("id", proposalId)
        .single();

      if (!proposal || proposal.user_id !== userId) {
        return jsonResponse({ error: "Proposta não encontrada" }, 404, cors);
      }

      const now = new Date();
      const stillValid =
        proposal.share_token &&
        !proposal.share_token_revoked_at &&
        proposal.share_token_expires_at &&
        new Date(proposal.share_token_expires_at) > now;

      if (stillValid) {
        return jsonResponse({
          shareToken: proposal.share_token,
          expiresAt: proposal.share_token_expires_at,
        }, 200, cors);
      }

      // Generate 256-bit token + expira em 30 dias
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const shareToken = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error: updateError } = await supabase
        .from("proposals")
        .update({
          share_token: shareToken,
          share_token_expires_at: expiresAt,
          share_token_revoked_at: null,
        })
        .eq("id", proposalId);

      if (updateError) {
        logEdgeError(FN, updateError, { proposalId });
        return jsonResponse({ error: "Erro ao gerar link" }, 500, cors);
      }

      return jsonResponse({ shareToken, expiresAt }, 200, cors);
    }

    return jsonResponse({ error: "Método não suportado" }, 405, cors);
  } catch (e) {
    logEdgeError(FN, e, { context: "unhandled" });
    return jsonResponse({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500, cors);
  }
});
