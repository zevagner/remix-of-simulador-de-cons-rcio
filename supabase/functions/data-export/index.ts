/**
 * data-export — Article 18 (LGPD) portable user data export.
 *
 * Returns a structured ZIP with the user's owned data:
 *  - profile.json
 *  - proposals.json + post_sale.json + events
 *  - analytics_events.json (consent-derived, owned only)
 *  - audit_logs.json (owned, last 365d)
 *  - feedbacks.json
 *  - consent.json (placeholder; client-side, not server-side)
 *  - pdfs/<proposal_id>.url.txt with 24h signed URLs (NO file duplication)
 *  - README.txt with portability notice
 *
 * Never includes secrets, tokens, internal traces, or other tenants' data.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { getCorsHeaders, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";

const FN = "data-export";
// Onda 2 hardening: 24h → 1h. Janela suficiente para download imediato pelo
// titular logo após a exportação (LGPD Art. 18 — fluxo síncrono). Reexportar
// gera nova URL assinada sem custo operacional.
const SIGNED_TTL_SECONDS = 60 * 60; // 1h
const PDF_BUCKET = "proposal-pdfs";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (!isOriginAllowed(cors)) {
    return new Response(JSON.stringify({ error: "Origem não permitida" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Export LGPD — máx 5/hora/usuário (evita loop de download).
    if (!checkRateLimit(`data-export:${user.id}`, { windowMs: 3_600_000, max: 5 })) {
      return new Response(
        JSON.stringify({ error: "rate_limited", message: "Máximo 5 exportações por hora." }),
        { status: 429, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const uid = user.id;

    // Parallel fetch — owned data only
    const [
      profile, proposals, postSaleClients, postSaleEvents, postSaleBids,
      proposalEvents, analyticsEvents, auditLogs, feedbacks, pdfCache, engagement,
    ] = await Promise.all([
      admin.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
      admin.from("proposals").select("*").eq("user_id", uid),
      admin.from("post_sale_clients").select("*").eq("user_id", uid),
      admin.from("post_sale_events").select("*").eq("user_id", uid),
      admin.from("post_sale_bids").select("*").eq("user_id", uid),
      admin.from("proposal_events").select("*").eq("user_id", uid),
      admin.from("analytics_events").select("id,event_name,event_data,created_at").eq("user_id", uid).limit(10000),
      admin.from("audit_logs").select("*").eq("user_id", uid).gte("created_at", new Date(Date.now() - 365 * 86400_000).toISOString()),
      admin.from("feedbacks").select("*").eq("user_id", uid),
      admin.from("proposal_pdf_cache").select("proposal_id,storage_path,filename,generated_at").eq("user_id", uid),
      admin.from("user_engagement").select("*").eq("user_id", uid).maybeSingle(),
    ]);

    // Strip sensitive fields from profile (none currently, but defensive)
    const sanitizedProfile = profile.data ?? null;

    // PDF signed URLs (24h) — no file duplication into the ZIP
    const pdfLinks: Array<{ proposal_id: string; filename: string; signed_url: string | null; expires_in_seconds: number; generated_at: string }> = [];
    for (const row of pdfCache.data ?? []) {
      const { data: signed } = await admin.storage.from(PDF_BUCKET).createSignedUrl(row.storage_path, SIGNED_TTL_SECONDS);
      pdfLinks.push({
        proposal_id: row.proposal_id,
        filename: row.filename,
        signed_url: signed?.signedUrl ?? null,
        expires_in_seconds: SIGNED_TTL_SECONDS,
        generated_at: row.generated_at,
      });
    }

    const zip = new JSZip();
    const exportedAt = new Date().toISOString();

    zip.file("README.txt",
`Exportação de Dados Pessoais — LGPD Art. 18
Usuário: ${user.email ?? uid}
Gerado em: ${exportedAt}

Esta exportação contém apenas dados de sua titularidade.
PDFs são entregues via URL assinada com validade de 24h (sem duplicar arquivos).
Nenhum segredo, token, log interno ou dado de outros titulares está incluído.
`);

    zip.file("profile.json", JSON.stringify(sanitizedProfile, null, 2));
    zip.file("proposals.json", JSON.stringify(proposals.data ?? [], null, 2));
    zip.file("proposal_events.json", JSON.stringify(proposalEvents.data ?? [], null, 2));
    zip.file("post_sale_clients.json", JSON.stringify(postSaleClients.data ?? [], null, 2));
    zip.file("post_sale_events.json", JSON.stringify(postSaleEvents.data ?? [], null, 2));
    zip.file("post_sale_bids.json", JSON.stringify(postSaleBids.data ?? [], null, 2));
    zip.file("analytics_events.json", JSON.stringify(analyticsEvents.data ?? [], null, 2));
    zip.file("audit_logs.json", JSON.stringify(auditLogs.data ?? [], null, 2));
    zip.file("feedbacks.json", JSON.stringify(feedbacks.data ?? [], null, 2));
    zip.file("engagement.json", JSON.stringify(engagement.data ?? null, null, 2));
    zip.file("pdfs/index.json", JSON.stringify({ note: "Signed URLs valid for 24h. Re-export to refresh.", links: pdfLinks }, null, 2));

    const blob = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });

    // Audit trail
    await admin.from("audit_logs").insert({
      user_id: uid,
      entity: "data_export",
      entity_id: null,
      action: "exported",
      metadata: { proposals: (proposals.data ?? []).length, pdfs: pdfLinks.length, exported_at: exportedAt },
    });

    return new Response(blob, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="meus-dados-${uid.slice(0, 8)}-${exportedAt.slice(0, 10)}.zip"`,
        "Cache-Control": "no-store",
        "Pragma": "no-cache",
      },
    });
  } catch (err) {
    // Onda 2: nunca vazar error.message/stack para o cliente. Detalhe fica nos logs.
    console.error(`[${FN}] ERROR:`, err);
    return new Response(JSON.stringify({ error: "Falha ao processar exportação." }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store", "Pragma": "no-cache" },
    });
  }
});
