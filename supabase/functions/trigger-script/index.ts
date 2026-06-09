import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";
import { authenticateRequest, logAuth, trackAICallVerified } from "../_shared/auth.ts";
import { AIError } from "./_lib/aiCall.ts";
import { GLOBAL_AI_RULES, SAFE_FALLBACK } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";
import { maskClientName, GLOBAL_PII_RULE } from "./_lib/piiMask.ts";

const FN = "trigger-script";

const RequestSchema = z.object({
  triggerId: z.enum(["antecipacao", "desapego", "autoridade", "prova_social"]),
  triggerName: z.string().max(40),
  consortiumTypeLabel: z.string().max(40),
  creditValue: z.number().positive(),
  installment: z.number().nonnegative(),
  termMonths: z.number().int().positive().max(420),
  bidValue: z.number().nonnegative().default(0),
  bidPercent: z.number().min(0).max(100).default(0),
  contemplationMonth: z.number().int().nonnegative().max(420).optional(),
  financingTotal: z.number().nonnegative(),
  estimatedSavings: z.number(),
  totalCost: z.number().nonnegative(),
  estimatedRent: z.number().nonnegative(),
  clientName: z.string().max(60).optional(),
  /** Tipo/perfil do cliente (ex: "comprar imóvel", "trocar de carro", "investidor"). */
  clientType: z.string().max(80).optional(),
  /** Cenário/estratégia escolhida no Estudo de Lances ou Investimento. */
  selectedStrategy: z.string().max(120).optional(),
});

type Payload = z.infer<typeof RequestSchema>;

function fmtBRL(n: number): string {
  return Math.max(0, Math.round(n)).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

const TRIGGER_GUIDE: Record<string, string> = {
  antecipacao: "Projete dois futuros (com vs sem consórcio). Use aluguel 5 anos vs construção de patrimônio.",
  desapego: "Sem urgência forçada. Tom calmo, posição de guardião de oportunidade. NÃO depende da venda.",
  autoridade: "Cite dados específicos (custo total, parcela, comparativo financiamento). Conhecimento = credibilidade.",
  prova_social: "Cite perfis SEMELHANTES ao cliente (mesma faixa, mesmo tipo). Evite depoimentos genéricos.",
};

function buildUserPrompt(d: Payload): string {
  const aluguel60 = d.estimatedRent * 60;
  const lines = [
    `Crie script WhatsApp aplicando "${d.triggerName}"${d.clientName ? ` para ${maskClientName(d.clientName)}` : ""}.`,
    `DIRETRIZ: ${TRIGGER_GUIDE[d.triggerId]}`,
    d.clientType ? `Perfil: ${d.clientType}` : "",
    d.selectedStrategy ? `Estratégia escolhida: ${d.selectedStrategy} (ancore o argumento nela)` : "",
    "",
    "DADOS REAIS (use SEMPRE, nunca invente):",
    `${d.consortiumTypeLabel} | Crédito ${fmtBRL(d.creditValue)} | Parcela ${fmtBRL(d.installment)}/${d.termMonths}m`,
    d.bidValue > 0 ? `Lance ${fmtBRL(d.bidValue)} (${d.bidPercent.toFixed(1).replace(".", ",")}%)` : "Sem lance",
    d.contemplationMonth ? `Contemplação estimada: mês ${d.contemplationMonth}` : "",
    `Custo consórcio ${fmtBRL(d.totalCost)} vs financiamento ${fmtBRL(d.financingTotal)} → economia ${fmtBRL(d.estimatedSavings)}`,
    `Aluguel 5 anos: ${fmtBRL(aluguel60)}`,
    "",
    "ENTREGA: máx 5 linhas WhatsApp. 2-3 números reais. Termina com pergunta aberta.",
  ].filter(Boolean);
  return lines.join("\n");
}

const SYSTEM_PROMPT = `Você é um gerente de consórcio falando com cliente real no WhatsApp. Aplica gatilhos com naturalidade, sem soar manipulador.

REGRAS:
- Linguagem real, conversacional. Frases curtas. Sem jargão técnico (sem CET/TIR/amortização).
- Máx 5 linhas, texto corrido. Máx 1 emoji. Sem títulos/listas/markdown.
- Sem saudação genérica ("Olá", "Tudo bem"). Encerre sempre com pergunta aberta.
- Personalize pelo perfil (clientType) quando informado.

${GLOBAL_AI_RULES}`;

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
    const raw = await req.json();
    const parsed = RequestSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, 400, cors);
    }


    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Chave de IA não configurada" }, 500, cors);

    // Streaming SSE — TTFT muito menor; guardrail (isPromiseSafe) é re-validado no client
    // sobre o texto final concatenado e mantido aqui como camada server-side em caso de retorno não-stream.
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(parsed.data) },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Muitas requisições. Tente novamente em alguns segundos." }, 429, cors);
      if (response.status === 402) return jsonResponse({ error: "Créditos de IA esgotados." }, 402, cors);
      const txt = await response.text().catch(() => "");
      logEdgeError(FN, new Error(`AI gateway ${response.status}: ${txt.slice(0, 200)}`), { context: "ai_gateway" });
      return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
    }

    return new Response(response.body, {
      headers: { ...cors, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    if (e instanceof AIError) {
      const msg =
        e.code === "rate_limit" ? "Muitas requisições. Tente novamente em alguns segundos." :
        e.code === "no_credits" ? "Créditos de IA esgotados." :
        e.code === "config" ? "Chave de IA não configurada" :
        "Erro ao consultar IA";
      return jsonResponse({ error: msg }, e.status >= 400 ? e.status : 500, cors);
    }
    logEdgeError(FN, e, { context: "unhandled" });
    return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
  }
});
