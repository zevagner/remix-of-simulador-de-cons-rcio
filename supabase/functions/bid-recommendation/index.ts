import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";
import { authenticateRequest, logAuth, trackAICallVerified } from "../_shared/auth.ts";
import { callAI, AIError } from "./_lib/aiCall.ts";
import { GLOBAL_AI_RULES, isPromiseSafe, sanitizeText, SAFE_FALLBACK } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";

const FN = "bid-recommendation";

const RequestSchema = z.object({
  clientBid: z.number().min(0).max(100),
  avgBid: z.number().min(0).max(100),
  minBid: z.number().min(0).max(100),
  maxBid: z.number().min(0).max(100),
  faixaIdealMin: z.number().min(0).max(100),
  faixaIdealMax: z.number().min(0).max(100),
  suggestedBid: z.number().min(0).max(100),
  diffFromAvg: z.number(),
  probabilityLevel: z.enum(["baixa", "média", "media", "alta"]),
  groupName: z.string().max(50).optional(),
  groupType: z.string().max(50).optional(),
  creditRange: z.string().max(50).optional(),
});

// ═══════ LÓGICA DETERMINÍSTICA (executada no edge, fora da IA) ═══════
type DeterministicSummary = {
  position: "abaixo da média" | "na média" | "acima da média";
  inIdealRange: boolean;
  action: "manter" | "aumentar" | "reduzir";
  targetBid: number | null;
  diffPp: number;
};

function computeDeterministic(d: z.infer<typeof RequestSchema>): DeterministicSummary {
  const diffPp = Number((d.clientBid - d.avgBid).toFixed(1));
  const position: DeterministicSummary["position"] =
    diffPp <= -1 ? "abaixo da média" : diffPp >= 1 ? "acima da média" : "na média";
  const inIdealRange = d.clientBid >= d.faixaIdealMin && d.clientBid <= d.faixaIdealMax;

  let action: DeterministicSummary["action"] = "manter";
  let targetBid: number | null = null;

  if (d.clientBid < d.faixaIdealMin) {
    action = "aumentar";
    targetBid = Number(d.faixaIdealMin.toFixed(1));
  } else if (d.clientBid > d.faixaIdealMax + 5) {
    // só sugere reduzir se estiver muito acima da faixa ideal (>5pp)
    action = "reduzir";
    targetBid = Number(d.faixaIdealMax.toFixed(1));
  }

  return { position, inIdealRange, action, targetBid, diffPp };
}

function buildUserPrompt(d: z.infer<typeof RequestSchema>, det: DeterministicSummary): string {
  const fmt = (n: number) => n.toFixed(1).replace(".", ",");
  const ctxLine = d.groupName
    ? `Grupo ${d.groupName}${d.groupType ? ` (${d.groupType})` : ""}${d.creditRange ? `, crédito ${d.creditRange}` : ""}.`
    : "";

  // ── Resumo determinístico já pronto: a IA só precisa transformar em fala consultiva ──
  const resumo = [
    `Posição: ${det.position}.`,
    `Faixa ideal do grupo: ${fmt(d.faixaIdealMin)}% a ${fmt(d.faixaIdealMax)}% (cliente está com ${fmt(d.clientBid)}%, ${det.inIdealRange ? "dentro" : "fora"} da faixa).`,
    `Probabilidade histórica: ${d.probabilityLevel}.`,
    `Ação recomendada: ${det.action}${det.targetBid !== null ? ` para ${fmt(det.targetBid)}%` : ""}.`,
  ].join(" ");

  return `${ctxLine}
RESUMO DETERMINÍSTICO (não recalcule, apenas explique de forma consultiva):
${resumo}

Escreva uma recomendação consultiva em 3 a 4 linhas (texto corrido, sem títulos, sem listas, sem repetir números cruamente). Confirme a posição do cliente, conecte com o histórico do grupo e diga objetivamente o que fazer${det.targetBid !== null ? ` (incluindo o número ${fmt(det.targetBid)}% como meta)` : ""}.`;
}

const SYSTEM_PROMPT = `Você é um consultor de consórcios. Recebe um RESUMO DETERMINÍSTICO já calculado e o transforma em uma fala curta, natural e acionável (3-4 linhas, texto corrido, sem títulos nem listas). Não recalcule probabilidades nem invente números.

${GLOBAL_AI_RULES}`;

// ═══════ CACHE EM MEMÓRIA (TTL 24h) ═══════
type CacheEntry = { text: string; expiresAt: number };
const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;

async function hashKey(d: z.infer<typeof RequestSchema>): Promise<string> {
  const norm = {
    cb: Math.round(d.clientBid * 10) / 10,
    av: Math.round(d.avgBid * 10) / 10,
    mn: Math.round(d.minBid * 10) / 10,
    mx: Math.round(d.maxBid * 10) / 10,
    fmin: Math.round(d.faixaIdealMin * 10) / 10,
    fmax: Math.round(d.faixaIdealMax * 10) / 10,
    sg: Math.round(d.suggestedBid * 10) / 10,
    pl: d.probabilityLevel,
    gn: d.groupName ?? "",
    gt: d.groupType ?? "",
    cr: d.creditRange ?? "",
  };
  const buf = new TextEncoder().encode(JSON.stringify(norm));
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function cacheGet(key: string): string | null {
  const e = CACHE.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { CACHE.delete(key); return null; }
  return e.text;
}
function cacheSet(key: string, text: string) {
  if (CACHE.size >= CACHE_MAX) {
    const firstKey = CACHE.keys().next().value;
    if (firstKey) CACHE.delete(firstKey);
  }
  CACHE.set(key, { text, expiresAt: Date.now() + CACHE_TTL_MS });
}

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (!isOriginAllowed(cors)) return jsonResponse({ error: "Origem não permitida" }, 403, cors);

  // ═══════ AUTH OBRIGATÓRIA (Authenticated AI Edge Standard) ═══════
  const auth = await authenticateRequest(req);
  if (!auth.ok) return jsonResponse({ error: "Unauthorized" }, 401, cors);
  const userId = auth.userId;
  logAuth(FN, userId);
  trackAICallVerified(FN, userId);

  if (!checkRateLimit(`u:${userId}`)) {
    return jsonResponse({ error: "Muitas requisições. Aguarde alguns segundos." }, 429, cors);
  }

  try {
    const raw = await req.json();
    const parsed = RequestSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        400,
        cors,
      );
    }

    // Cache lookup
    const key = await hashKey(parsed.data);
    const cached = cacheGet(key);
    if (cached) {
      return jsonResponse({ recommendation: cached, cached: true }, 200, cors);
    }

    // Híbrido: cálculos feitos no edge, IA apenas explica.
    const det = computeDeterministic(parsed.data);

    const result = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(parsed.data, det) },
      ],
    });

    // Guardrail: rejeita silenciosamente promessas (substitui por aviso).
    let text = sanitizeText(result.text);
    if (!isPromiseSafe(text)) {
      logEdgeError(FN, new Error("output rejeitado: promessa proibida"), {
        userId,
        context: "guardrail_promise",
        text,
      });
      text = SAFE_FALLBACK;
    } else {
      cacheSet(key, text);
    }

    return jsonResponse({ recommendation: text }, 200, cors);
  } catch (e) {
    if (e instanceof AIError) {
      const msg =
        e.code === "rate_limit"
          ? "Muitas requisições. Tente em alguns segundos."
          : e.code === "no_credits"
          ? "Créditos de IA esgotados."
          : "Erro ao consultar IA";
      return jsonResponse({ error: msg }, e.status === 200 ? 500 : e.status, cors);
    }
    logEdgeError(FN, e, { context: "unhandled" });
    return jsonResponse(
      { error: SAFE_FALLBACK },
      500,
      cors,
    );
  }
});
