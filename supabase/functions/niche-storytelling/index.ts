import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";
import { authenticateRequest, logAuth, trackAICallVerified } from "../_shared/auth.ts";
import { callAI, AIError } from "./_lib/aiCall.ts";
import { GLOBAL_AI_RULES, isPromiseSafe, sanitizeText, SAFE_FALLBACK } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";

const FN = "niche-storytelling";


// ═══════ SCHEMA ═══════
const RequestSchema = z.object({
  nicheId: z.string().max(50),
  nicheTitle: z.string().max(80),
  audience: z.string().max(200),
  whatYouDo: z.string().max(400),
  whenItFits: z.string().max(400),
  mainArgument: z.string().max(800),
  consortiumType: z.string().max(40),
  suggestedCredit: z.number().positive().optional(),
});

type Payload = z.infer<typeof RequestSchema>;

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function buildUserPrompt(d: Payload): string {
  const lines: string[] = [];
  lines.push(`Crie uma mensagem de WhatsApp para o cliente sobre a estratégia "${d.nicheTitle}".`);
  lines.push("");
  lines.push("CONTEXTO DA ESTRATÉGIA:");
  lines.push(`- Indicado para: ${d.audience}`);
  lines.push(`- O que o cliente faz: ${d.whatYouDo}`);
  lines.push(`- Quando faz sentido: ${d.whenItFits}`);
  lines.push(`- Tipo de consórcio: ${d.consortiumType}`);
  if (d.suggestedCredit) lines.push(`- Crédito típico: ${fmtBRL(d.suggestedCredit)}`);
  lines.push(`- Argumento base do consultor: "${d.mainArgument}"`);
  lines.push("");
  lines.push("ESTRUTURA OBRIGATÓRIA (máx. 6 linhas, mensagem direta de WhatsApp, sem títulos, sem listas, no máx. 2 emojis):");
  lines.push("1. Comece com um contexto real e humano que conecte ao perfil do cliente (1 linha).");
  lines.push("2. Mostre a dor ou oportunidade prática (1-2 linhas).");
  lines.push("3. Apresente a estratégia em linguagem simples, sem jargão.");
  lines.push("4. Termine com um convite leve à conversa (ex: 'quer que eu detalhe?').");
  return lines.join("\n");
}

const SYSTEM_PROMPT = `Você é um especialista em consórcios e vendas consultivas. Seu papel é transformar uma estratégia consultiva em uma mensagem clara e convincente de WhatsApp para o cliente.

${GLOBAL_AI_RULES}
- Linguagem simples, natural, sem termos técnicos (sem "amortização", "saldo devedor", "TIR", "CET").
- Máximo 6 linhas, formato WhatsApp (texto corrido, quebras de linha curtas).
- No máximo 2 emojis. Sem títulos, sem listas numeradas, sem markdown.
- Sempre encerre com um convite leve à conversa.`;

// trackAICall removido — usar trackAICallVerified do _shared/auth.ts

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

  if (!checkRateLimit(`u:${userId}`, { max: 15 })) {
    return jsonResponse({ error: "Muitas requisições. Aguarde alguns segundos." }, 429, cors);
  }


  try {
    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, 400, cors);
    }

    const result = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(parsed.data) },
      ],
    });

    let text = sanitizeText(result.text);
    if (!isPromiseSafe(text)) {
      logEdgeError(FN, new Error("output rejeitado: promessa proibida"), { text });
      text = SAFE_FALLBACK;
    }

    return jsonResponse({ storytelling: text }, 200, cors);
  } catch (e) {
    if (e instanceof AIError) {
      const msg =
        e.code === "rate_limit" ? "Muitas requisições. Tente em alguns segundos." :
        e.code === "no_credits" ? "Créditos de IA esgotados." :
        "Erro ao consultar IA";
      return jsonResponse({ error: msg }, e.status >= 400 ? e.status : 500, cors);
    }
    logEdgeError(FN, e, { context: "unhandled" });
    return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
  }
});

