/**
 * data-retention-purge — Retention Policy Engine (LGPD lifecycle).
 *
 * TTL contract (frozen by audit Wave 2):
 *  - proposal_pdf_cache + storage objects in proposal-pdfs ........ 90 days
 *  - analytics_events ............................................. 180 days
 *  - audit_logs ................................................... 365 days
 *  - (data-export artifacts are NEVER persisted server-side; 24h signed URLs)
 *
 * Safe-by-default:
 *  - Idempotent: rerunning yields the same end state.
 *  - Per-stage try/catch; one failure does not abort siblings.
 *  - Storage purge follows DB purge so orphan PDFs are cleaned in same run.
 *  - Designed to be called by pg_cron with SERVICE_ROLE bearer (via Vault).
 *
 * Authorization model (hardened — anon key REJECTED):
 *  - REQUIRES `Authorization: Bearer <SERVICE_ROLE_KEY>`.
 *  - Anon key, user JWT (common or admin) and missing token are ALL rejected (401).
 *  - Rationale: anon key is public (shipped to browser); accepting it allowed
 *    anonymous execution of a destructive job. Service role is server-only.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, jsonResponse } from "./_lib/cors.ts";
import { checkRateLimit, getRateLimitKey } from "./_lib/rateLimit.ts";

const FN = "data-retention-purge";
const PDF_BUCKET = "proposal-pdfs";

const TTL = {
  pdfs_days: 90,
  analytics_days: 180,
  audit_days: 365,
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // SERVICE_ROLE ONLY. Anon key, user JWT (common/admin) and missing token are rejected.
  // Audit-log every attempt (success/fail) without exposing internals to the client.
  const auth = req.headers.get("authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const tokenOk = auth === `Bearer ${serviceKey}`;
  if (!tokenOk) {
    console.warn(`[${FN}] unauthorized attempt`, {
      at: new Date().toISOString(),
      hasAuth: Boolean(req.headers.get("authorization")),
      hasApikey: Boolean(req.headers.get("apikey")),
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
    });
    return jsonResponse({ error: "Não autorizado" }, 401, cors);
  }

  // Job administrativo pesado — máx 2/hora.
  if (!checkRateLimit(`retention-purge:${getRateLimitKey(req)}`, { windowMs: 3_600_000, max: 2 })) {
    return jsonResponse({ error: "rate_limited", message: "Máximo 2 execuções por hora." }, 429, cors);
  }

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
    const now = Date.now();
    const cutoffPdf = new Date(now - TTL.pdfs_days * 86400_000).toISOString();
    const cutoffAnalytics = new Date(now - TTL.analytics_days * 86400_000).toISOString();
    const cutoffAudit = new Date(now - TTL.audit_days * 86400_000).toISOString();

    const summary: Record<string, unknown> = { ttl: TTL, started_at: new Date(now).toISOString() };

    // 1) Identify expired PDFs (cache row + storage path), then delete both.
    try {
      const { data: expiredPdfs, error } = await admin
        .from("proposal_pdf_cache")
        .select("proposal_id,user_id,storage_path,generated_at")
        .lt("generated_at", cutoffPdf)
        .limit(2000);
      if (error) throw error;

      const paths = (expiredPdfs ?? []).map((r) => r.storage_path).filter(Boolean);
      if (paths.length) {
        const { error: rmErr } = await admin.storage.from(PDF_BUCKET).remove(paths);
        if (rmErr) console.warn(`[${FN}] storage remove warn:`, rmErr);
      }
      const ids = (expiredPdfs ?? []).map((r) => r.proposal_id);
      if (ids.length) {
        await admin.from("proposal_pdf_cache").delete().in("proposal_id", ids);
      }
      summary["pdfs_removed"] = paths.length;
    } catch (e) {
      console.warn(`[${FN}] pdfs stage failed:`, e);
      summary["pdfs_removed"] = "error";
    }

    // 2) analytics_events older than TTL.
    try {
      const { count } = await admin
        .from("analytics_events")
        .delete({ count: "exact" })
        .lt("created_at", cutoffAnalytics);
      summary["analytics_removed"] = count ?? 0;
    } catch (e) {
      console.warn(`[${FN}] analytics stage failed:`, e);
      summary["analytics_removed"] = "error";
    }

    // 3) audit_logs older than TTL (keep last 365d minimum trail).
    try {
      const { count } = await admin
        .from("audit_logs")
        .delete({ count: "exact" })
        .lt("created_at", cutoffAudit);
      summary["audit_removed"] = count ?? 0;
    } catch (e) {
      console.warn(`[${FN}] audit stage failed:`, e);
      summary["audit_removed"] = "error";
    }

    summary["completed_at"] = new Date().toISOString();
    console.log(`[${FN}] retention pass`, summary);

    // Record a single summary entry (does not bypass its own TTL — that's intentional).
    try {
      await admin.from("audit_logs").insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        entity: "retention_job",
        action: "executed",
        metadata: summary,
      });
    } catch (e) {
      console.warn(`[${FN}] summary insert warn:`, e);
    }

    return jsonResponse({ success: true, summary }, 200, cors);
  } catch (err) {
    console.error(`[${FN}] ERROR:`, err);
    return jsonResponse({ error: "Erro interno" }, 500, cors);
  }
});
