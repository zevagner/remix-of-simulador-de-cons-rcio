import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";
import { authenticateRequest, logAuth, trackAICallVerified } from "../_shared/auth.ts";
import { GLOBAL_AI_RULES, SAFE_FALLBACK, STRICT_NO_PROMISE_PROMPT } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";
import { GLOBAL_PII_RULE } from "./_lib/piiMask.ts";
import { sanitizeUserField } from "../_shared/validators.ts";

const FN = "sales-copilot";

const SimulationContextSchema = z.object({
  consortiumType: z.string().max(50).optional(),
  creditValue: z.number().nonnegative().optional(),
  installment: z.number().nonnegative().optional(),
  termMonths: z.number().int().min(1).max(999).optional(),
  totalCost: z.number().nonnegative().optional(),
  bidPercent: z.number().min(0).max(100).optional(),
  bidZone: z.string().max(50).optional(),
  groupNumber: z.number().int().positive().optional(),
  clientName: z.string().max(200).optional(),
  scenarioProfile: z.string().max(50).optional(),
  strategyLabel: z.string().max(200).optional(),
  savingsVsFinancing: z.number().optional(),
}).optional();

const RequestSchema = z.object({
  clientMessage: z.string().min(1).max(2000),
  simulationContext: SimulationContextSchema,
});

const SYSTEM_PROMPT = `Você é um copiloto de vendas especialista em consórcio CAIXA. Seu papel é ajudar o consultor a responder objeções e conduzir a negociação.

REGRAS:
- Respostas curtas e diretas (máximo 3 parágrafos)
- Tom consultivo e seguro, nunca agressivo
- Use os dados da simulação fornecidos no contexto
- Formate para WhatsApp: *negrito* para destaques, parágrafos curtos
- Foque em reduzir objeções e aumentar confiança

ESTRUTURA DA RESPOSTA:
1. Reconheça a preocupação do cliente
2. Apresente argumento com dados reais
3. Sugira próximo passo

${GLOBAL_AI_RULES}

${STRICT_NO_PROMISE_PROMPT}

${GLOBAL_PII_RULE}

CONTEXTO DO CONSULTOR:
Ele está em conversa ativa com um cliente e precisa de ajuda rápida para responder.`;

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

  if (!checkRateLimit(`u:${userId}`, { max: 10 })) {
    return jsonResponse({ error: "Muitas requisições. Aguarde um momento antes de tentar novamente." }, 429, cors);
  }

  try {
    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, 400, cors);
    }

    const { clientMessage: rawClientMessage, simulationContext } = parsed.data;
    // Security M1: sanitiza input livre antes de injetar no prompt do LLM.
    const clientMessage = sanitizeUserField(rawClientMessage);
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Chave de IA não configurada" }, 500, cors);

    // Contexto enxuto: só os campos essenciais para a resposta consultiva.
    let contextInfo = "";
    if (simulationContext) {
      const ctx = simulationContext;
      const parts: string[] = [];
      if (ctx.consortiumType) parts.push(`Tipo: ${ctx.consortiumType}`);
      if (ctx.creditValue) parts.push(`Carta: R$ ${ctx.creditValue.toLocaleString("pt-BR")}`);
      if (ctx.installment) parts.push(`Parcela: R$ ${ctx.installment.toLocaleString("pt-BR")}`);
      if (ctx.termMonths) parts.push(`Prazo: ${ctx.termMonths}m`);
      if (ctx.bidPercent) parts.push(`Lance: ${ctx.bidPercent}%`);
      if (ctx.savingsVsFinancing) parts.push(`Economia vs financ.: R$ ${ctx.savingsVsFinancing.toLocaleString("pt-BR")}`);
      if (parts.length) contextInfo = `\n\nSIMULAÇÃO: ${parts.join(" | ")}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5.2",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextInfo },
          { role: "user", content: `O cliente disse: "${clientMessage}"\n\nMe ajude a responder de forma consultiva e persuasiva.` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }, 429, cors);
      if (response.status === 402) return jsonResponse({ error: "Créditos insuficientes." }, 402, cors);
      logEdgeError(FN, new Error(`AI gateway ${response.status}`), { context: "ai_gateway", body: await response.text() });
      return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
    }

    return new Response(response.body, {
      headers: { ...cors, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    logEdgeError(FN, e, { context: "unhandled" });
    return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
  }
});
