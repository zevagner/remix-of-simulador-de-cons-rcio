import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";
import { authenticateRequest, logAuth, trackAICallVerified } from "../_shared/auth.ts";
import { callAI, AIError } from "./_lib/aiCall.ts";
import { GLOBAL_AI_RULES, isPromiseSafe, sanitizeText, SAFE_FALLBACK } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";

const FN = "investment-storytelling";


// ═══════ SCHEMA ═══════
const RequestSchema = z.object({
  scenarioId: z.string().max(50),
  scenarioName: z.string().max(80),
  creditValue: z.number().positive(),
  installment: z.number().nonnegative(),
  termMonths: z.number().int().positive().max(420),
  contemplationMonth: z.number().int().nonnegative().max(420).optional(),
  bidPercent: z.number().min(0).max(100).optional(),
  totalPaid: z.number().nonnegative(),
  finalResult: z.number(),
  absoluteGain: z.number(),
  percentGain: z.number(),
  // Comparativo opcional com financiamento
  financingTotal: z.number().nonnegative().optional(),
  estimatedSavings: z.number().optional(),
  clientName: z.string().max(60).optional(),
  consortiumType: z.string().max(40).optional(),
});

type Payload = z.infer<typeof RequestSchema>;

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function buildUserPrompt(d: Payload): string {
  const lines: string[] = [];
  lines.push(`Crie um argumento de WhatsApp para o cliente${d.clientName ? ` [CLIENTE]` : ""} sobre o cenário "${d.scenarioName}". (Quando aparecer [CLIENTE], trate como pronome neutro — nunca reproduza o token literal.)`);
  lines.push("");
  lines.push("DADOS DA SIMULAÇÃO:");
  lines.push(`- Crédito: ${fmtBRL(d.creditValue)}`);
  lines.push(`- Parcela mensal: ${fmtBRL(d.installment)}`);
  lines.push(`- Prazo: ${d.termMonths} meses`);
  if (d.contemplationMonth) lines.push(`- Contemplação estimada: mês ${d.contemplationMonth}`);
  if (d.bidPercent !== undefined) lines.push(`- Lance previsto: ${d.bidPercent.toFixed(1).replace(".", ",")}%`);
  lines.push(`- Total investido pelo cliente: ${fmtBRL(d.totalPaid)}`);
  lines.push(`- Resultado final estimado: ${fmtBRL(d.finalResult)}`);
  lines.push(`- Ganho estimado: ${d.absoluteGain >= 0 ? "+" : ""}${fmtBRL(d.absoluteGain)} (${d.percentGain.toFixed(1)}%)`);
  if (d.financingTotal) lines.push(`- Custo equivalente em financiamento: ${fmtBRL(d.financingTotal)}`);
  if (d.estimatedSavings !== undefined) lines.push(`- Economia vs financiamento: ${fmtBRL(d.estimatedSavings)}`);
  if (d.consortiumType) lines.push(`- Tipo: ${d.consortiumType}`);
  lines.push("");
  lines.push("ESTRUTURA OBRIGATÓRIA (máx. 6 linhas, mensagem direta de WhatsApp, sem títulos, sem listas, sem emojis em excesso — no máx. 2):");
  lines.push("1. Comece com um contexto real e humano (1 linha).");
  if (d.financingTotal) lines.push("2. Compare brevemente com o financiamento usando os números do payload.");
  else lines.push("2. Mostre o diferencial dessa estratégia em poucas palavras.");
  lines.push("3. Explique o plano de forma simples (parcela, prazo, contemplação).");
  lines.push("4. Mostre o resultado em reais.");
  lines.push("5. Termine com um convite leve (ex: 'quer que eu detalhe?').");
  return lines.join("\n");
}

const SYSTEM_PROMPT = `Você é um especialista em consórcios e vendas consultivas. Seu papel é transformar uma simulação em uma mensagem clara e convincente de WhatsApp para o cliente.

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

