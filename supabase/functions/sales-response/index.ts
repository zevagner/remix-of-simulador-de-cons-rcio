import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";
import { authenticateRequest, logAuth, trackAICallVerified } from "../_shared/auth.ts";
import { callAI, AIError } from "./_lib/aiCall.ts";
import { GLOBAL_AI_RULES, isPromiseSafe, SAFE_FALLBACK } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";
import { sanitizeUserField } from "../_shared/validators.ts";

const FN = "sales-response";


// ═══════ VALIDATION ═══════
const RequestSchema = z.object({
  clientResponse: z.string().min(1).max(2000),
  proposalContext: z.object({
    consortiumType: z.string().max(50).optional(),
    creditValue: z.number().nonnegative().optional(),
    installment: z.number().nonnegative().optional(),
    termMonths: z.number().int().min(1).max(999).optional(),
    totalCost: z.number().nonnegative().optional(),
    bidPercent: z.number().min(0).max(100).optional(),
    clientName: z.string().max(200).optional(),
    clientObjective: z.string().max(500).optional(),
  }).optional(),
});

const SYSTEM_PROMPT = `Você é um assistente de vendas consultivas especialista em consórcio CAIXA.

O consultor acabou de enviar uma proposta comercial para o cliente. O cliente respondeu e o consultor precisa da sua ajuda para continuar a conversa.

TAREFA:
1. Classifique a resposta do cliente em uma das categorias: "duvida", "objecao", "interesse", "indecisao"
2. Gere exatamente 3 sugestões de resposta

REGRAS PARA AS RESPOSTAS:
- Tom humano e consultivo — nunca robótico ou agressivo
- Frases curtas, parecer mensagem de WhatsApp
- Usar *negrito* para destaques (formato WhatsApp)
- Cada resposta deve ter abordagem diferente:
  1. Empática e acolhedora
  2. Baseada em dados/argumentos
  3. Direcionada ao próximo passo
- Máximo 4 linhas por resposta
- Sem pressão — conduzir naturalmente
- Se o cliente mostrou interesse: facilitar o próximo passo
- Se tem objeção: reconhecer, argumentar com dado, redirecionar
- Se está indeciso: acolher, dar espaço, manter porta aberta

${GLOBAL_AI_RULES}
- Toda sugestão deve classificar a situação, dar contexto curto, recomendar ação e propor próximo passo.

IMPORTANTE: Retorne APENAS o JSON solicitado via tool call, nada mais.`;

// ═══════ FIRE-AND-FORGET AI TRACKING ═══════
// trackAICall removido — usar trackAICallVerified do _shared/auth.ts

const TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_responses",
      description: "Classifica a resposta do cliente e gera sugestões de resposta para o consultor",
      parameters: {
        type: "object",
        properties: {
          classification: {
            type: "string",
            enum: ["duvida", "objecao", "interesse", "indecisao"],
          },
          classificationLabel: { type: "string" },
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                text: { type: "string" },
              },
              required: ["label", "text"],
              additionalProperties: false,
            },
            minItems: 3,
            maxItems: 3,
          },
        },
        required: ["classification", "classificationLabel", "suggestions"],
        additionalProperties: false,
      },
    },
  },
];

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
    return jsonResponse({ error: "Muitas requisições. Aguarde um momento." }, 429, cors);
  }

  try {
    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, 400, cors);
    }

    const { clientResponse: rawClientResponse, proposalContext } = parsed.data;
    // Security M1: sanitiza input livre antes de injetar no prompt do LLM.
    const clientResponse = sanitizeUserField(rawClientResponse);
    const safeClientObjective = proposalContext?.clientObjective
      ? sanitizeUserField(proposalContext.clientObjective, 500)
      : undefined;

    let contextInfo = "";
    if (proposalContext) {
      const parts: string[] = [];
      if (proposalContext.consortiumType) parts.push(`Tipo: ${proposalContext.consortiumType}`);
      if (proposalContext.creditValue) parts.push(`Carta: R$ ${proposalContext.creditValue.toLocaleString("pt-BR")}`);
      if (proposalContext.installment) parts.push(`Parcela: R$ ${proposalContext.installment.toLocaleString("pt-BR")}`);
      if (proposalContext.termMonths) parts.push(`Prazo: ${proposalContext.termMonths} meses`);
      if (proposalContext.totalCost) parts.push(`Custo total: R$ ${proposalContext.totalCost.toLocaleString("pt-BR")}`);
      if (proposalContext.bidPercent) parts.push(`Lance: ${proposalContext.bidPercent}%`);
      if (proposalContext.clientName) parts.push(`Nome do cliente: [CLIENTE] (token anonimizado — trate como pronome neutro)`);
      if (proposalContext.clientObjective) parts.push(`Objetivo do cliente: ${safeClientObjective}`);
      contextInfo = `\n\nDADOS DA PROPOSTA ENVIADA:\n${parts.join("\n")}`;
    }

    const result = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + contextInfo },
        { role: "user", content: `O cliente respondeu à proposta com: "${clientResponse}"\n\nClassifique a resposta e gere 3 sugestões de resposta para o consultor.` },
      ],
      tools: TOOLS,
      tool_choice: { type: "function", function: { name: "generate_responses" } },
    });

    if (!result.toolCall) {
      return jsonResponse({ error: "Resposta inválida da IA" }, 500, cors);
    }

    // Guardrail: substitui sugestões inválidas por fallback seguro, em vez de descartar todas.
    const data = result.toolCall.arguments as {
      suggestions?: Array<{ label: string; text: string }>;
      [k: string]: unknown;
    };
    const FALLBACK_TEXT = "Posso te explicar melhor esse ponto pelo WhatsApp? Em poucas linhas te passo o contexto e os próximos passos.";
    if (Array.isArray(data?.suggestions)) {
      let replaced = 0;
      data.suggestions = data.suggestions.map((s, i) => {
        if (!s?.text || !isPromiseSafe(s.text)) {
          replaced++;
          return { label: s?.label || `Sugestão ${i + 1}`, text: FALLBACK_TEXT };
        }
        return s;
      });
      if (replaced > 0) {
        logEdgeError(FN, new Error(`sugestões substituídas por fallback: ${replaced}`), { context: "guardrail_partial" });
      }
    }

    return jsonResponse({ success: true, data }, 200, cors);
  } catch (e) {
    if (e instanceof AIError) {
      const msg =
        e.code === "rate_limit" ? "Limite de requisições excedido." :
        e.code === "no_credits" ? "Créditos insuficientes." :
        "Erro ao consultar IA";
      return jsonResponse({ error: msg }, e.status >= 400 ? e.status : 500, cors);
    }
    logEdgeError(FN, e, { context: "unhandled" });
    return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
  }
});

