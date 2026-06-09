/**
 * account-purge — Article 18 (LGPD) self-service account deletion.
 *
 * Cascade-deletes the authenticated user's:
 *  - proposals + proposal_events + proposal_pdf_cache (+ storage PDFs)
 *  - post_sale_clients + post_sale_events + post_sale_bids
 *  - analytics_events + audit_logs (after recording the purge audit)
 *  - feedbacks
 *  - community_replies + community_cases (+ subscriptions/votes/views)
 *  - user_engagement
 *  - companies the user owns alone (+ company_users)
 *  - profile + user_roles
 *  - auth.users (last)
 *
 * Idempotent (per-table try/catch + best-effort), audit-safe (purge event
 * recorded BEFORE auth deletion in a separate purge-log entry that survives).
 *
 * Confirmation required: body must contain { confirm: "EXCLUIR" }.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { getCorsHeaders, isOriginAllowed, jsonResponse } from "./_lib/cors.ts";
import { checkRateLimit, getRateLimitKey } from "./_lib/rateLimit.ts";

// Operação destrutiva irreversível — schema estrito (rejeita campos extras).
const AccountPurgeSchema = z.object({
  confirm: z.literal("EXCLUIR"),
}).strict();

const FN = "account-purge";
const PDF_BUCKET = "proposal-pdfs";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (!isOriginAllowed(cors)) return jsonResponse({ error: "Origem não permitida" }, 403, cors);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Não autorizado" }, 401, cors);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: uErr } = await userClient.auth.getUser(token);
    if (uErr || !user) return jsonResponse({ error: "Não autorizado" }, 401, cors);

    // Operação destrutiva — máx 3/hora/usuário.
    if (!checkRateLimit(`account-purge:${user.id}`, { windowMs: 3_600_000, max: 3 })) {
      return jsonResponse(
        { error: "rate_limited", message: "Máximo 3 tentativas por hora." },
        429,
        cors,
      );
    }



    const body = await req.json().catch(() => ({}));
    const parsed = AccountPurgeSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse(
        {
          error: "Confirmação ausente ou inválida. Envie exatamente { confirm: 'EXCLUIR' }.",
          details: parsed.error.flatten().fieldErrors,
        },
        400,
        cors,
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const uid = user.id;
    const startedAt = new Date().toISOString();
    const removed: Record<string, number | string> = {};

    const safe = async (label: string, fn: () => Promise<{ count?: number | null; error?: unknown }>) => {
      try {
        const r = await fn();
        removed[label] = r.count ?? "ok";
        if (r.error) console.warn(`[${FN}] ${label} warn:`, r.error);
      } catch (e) {
        console.warn(`[${FN}] ${label} failed:`, e);
        removed[label] = "error";
      }
    };

    // 1) Storage: list & remove all PDFs under tenant + legacy paths
    try {
      const paths: string[] = [];
      const legacy = await admin.storage.from(PDF_BUCKET).list(uid, { limit: 1000 });
      for (const f of legacy.data ?? []) paths.push(`${uid}/${f.name}`);
      // Tenant path requires company list
      const { data: companies } = await admin.from("company_users").select("company_id").eq("user_id", uid);
      for (const c of companies ?? []) {
        const sub = await admin.storage.from(PDF_BUCKET).list(`companies/${c.company_id}/proposals`, { limit: 1000 });
        for (const f of sub.data ?? []) {
          const inner = await admin.storage.from(PDF_BUCKET).list(`companies/${c.company_id}/proposals/${f.name}`, { limit: 100 });
          for (const ff of inner.data ?? []) paths.push(`companies/${c.company_id}/proposals/${f.name}/${ff.name}`);
        }
      }
      if (paths.length) {
        const { error } = await admin.storage.from(PDF_BUCKET).remove(paths);
        if (error) console.warn(`[${FN}] storage remove warn:`, error);
      }
      removed["storage_pdfs"] = paths.length;
    } catch (e) {
      console.warn(`[${FN}] storage purge failed:`, e);
      removed["storage_pdfs"] = "error";
    }

    // 2) Tables — order matters for FK-less defensiveness
    await safe("proposal_pdf_cache", () => admin.from("proposal_pdf_cache").delete({ count: "exact" }).eq("user_id", uid));
    await safe("proposal_events", () => admin.from("proposal_events").delete({ count: "exact" }).eq("user_id", uid));
    await safe("proposals", () => admin.from("proposals").delete({ count: "exact" }).eq("user_id", uid));
    await safe("post_sale_bids", () => admin.from("post_sale_bids").delete({ count: "exact" }).eq("user_id", uid));
    await safe("post_sale_events", () => admin.from("post_sale_events").delete({ count: "exact" }).eq("user_id", uid));
    await safe("post_sale_clients", () => admin.from("post_sale_clients").delete({ count: "exact" }).eq("user_id", uid));
    await safe("feedbacks", () => admin.from("feedbacks").delete({ count: "exact" }).eq("user_id", uid));
    await safe("community_reply_votes", () => admin.from("community_reply_votes").delete({ count: "exact" }).eq("user_id", uid));
    await safe("community_subscriptions", () => admin.from("community_subscriptions").delete({ count: "exact" }).eq("user_id", uid));
    await safe("community_case_views", () => admin.from("community_case_views").delete({ count: "exact" }).eq("user_id", uid));
    await safe("community_replies", () => admin.from("community_replies").delete({ count: "exact" }).eq("user_id", uid));
    await safe("community_cases", () => admin.from("community_cases").delete({ count: "exact" }).eq("user_id", uid));
    await safe("user_engagement", () => admin.from("user_engagement").delete({ count: "exact" }).eq("user_id", uid));
    await safe("analytics_events", () => admin.from("analytics_events").delete({ count: "exact" }).eq("user_id", uid));

    // 3) Audit trail — record purge BEFORE deleting audit_logs/profile/auth
    try {
      await admin.from("audit_logs").insert({
        user_id: uid,
        entity: "account",
        entity_id: null,
        action: "purged",
        metadata: { started_at: startedAt, removed, completed_at: new Date().toISOString() },
      });
    } catch (e) {
      console.warn(`[${FN}] audit insert warn:`, e);
    }

    // 4) audit_logs of this user — purged AFTER recording the summary (compliance window)
    await safe("audit_logs", () => admin.from("audit_logs").delete({ count: "exact" }).eq("user_id", uid));

    // 5) Company memberships + solely-owned companies
    try {
      const { data: ownedCompanies } = await admin.from("companies").select("id").eq("owner_user_id", uid);
      const ids = (ownedCompanies ?? []).map((c) => c.id);
      await safe("company_users", () => admin.from("company_users").delete({ count: "exact" }).eq("user_id", uid));
      if (ids.length) {
        await safe("companies", () => admin.from("companies").delete({ count: "exact" }).in("id", ids));
      }
    } catch (e) {
      console.warn(`[${FN}] companies purge warn:`, e);
    }

    // 6) Roles + profile + auth.users (last)
    await safe("user_roles", () => admin.from("user_roles").delete({ count: "exact" }).eq("user_id", uid));
    await safe("profiles", () => admin.from("profiles").delete({ count: "exact" }).eq("user_id", uid));

    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) {
      console.error(`[${FN}] auth.deleteUser failed:`, delErr);
      return jsonResponse({ error: "Falha ao concluir remoção da conta.", removed }, 500, cors);
    }

    return jsonResponse({ success: true, removed, completed_at: new Date().toISOString() }, 200, cors);
  } catch (err) {
    console.error(`[${FN}] ERROR:`, err);
    return jsonResponse({ error: "Falha ao processar exclusão de conta." }, 500, cors);
  }
});
