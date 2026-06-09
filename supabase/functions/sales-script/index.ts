import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";
import { authenticateRequest, logAuth, trackAICallVerified } from "../_shared/auth.ts";
import { callAI, AIError } from "./_lib/aiCall.ts";
import { GLOBAL_AI_RULES, isPromiseSafe, sanitizeText, SAFE_FALLBACK } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";
import { maskClientName, GLOBAL_PII_RULE } from "./_lib/piiMask.ts";

const FN = "sales-script";
const RATE_LIMIT_MAX = 12;


const RequestSchema = z.object({
  primaryDriver: z.enum(["economia", "seguranca", "rapidez", "liquidez", "status", "patrimonio"]),
  primaryDriverLabel: z.string().max(40),
  saleStage: z.enum(["primeiro_contato", "follow_up", "sumido", "fechamento"]),
  saleStageLabel: z.string().max(40),
  clientName: z.string().max(60).optional(),
  clientType: z.string().max(120).optional(),
  consortiumTypeLabel: z.string().max(40),
  creditValue: z.number().positive(),
  installment: z.number().nonnegative(),
  termMonths: z.number().int().positive().max(420),
  totalCost: z.number().nonnegative(),
  bidValue: z.number().nonnegative().default(0),
  bidPercent: z.number().min(0).max(100).default(0),
  contemplationMonth: z.number().int().nonnegative().max(420).optional(),
  estimatedFinancingTotal: z.number().nonnegative(),
  estimatedSavings: z.number(),
  estimatedRent60: z.number().nonnegative(),
});
type Payload = z.infer<typeof RequestSchema>;

function fmtBRL(n: number): string {
  return Math.max(0, Math.round(n)).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

const DRIVER_GUIDE: Record<string, string> = {
  economia:    "Ancore na economia real vs financiamento. Mostre o valor que ele DEIXA de pagar — não o que paga.",
  seguranca:   "Foque na previsibilidade: parcela fixa, sem juros surpresa, fim do aluguel jogado fora. Tom calmo.",
  rapidez:     "Mostre que dá para abreviar com lance. Use 'em vez de esperar X meses, ele pode contemplar antes'.",
  liquidez:    "Reforce que ele NÃO precisa imobilizar capital de uma vez. Parcela cabe sem mexer na reserva.",
  status:      "Conecte o consórcio ao salto de padrão (modelo melhor, bairro melhor). Sem ostentação.",
  patrimonio:  "Pense em 5-10 anos. Valor do crédito hoje vira ativo amanhã. Aluguel é despesa, parcela é construção.",
};

const STAGE_GUIDE: Record<string, string> = {
  primeiro_contato:
    "Primeiro contato: gere INTERESSE com 1 número que choque (economia ou aluguel jogado fora). Termine com convite para conversar, não para fechar.",
  follow_up:
    "Follow-up: retome o que foi falado. Adicione 1 informação NOVA (cenário, comparativo) que não estava na primeira conversa. Mantenha o calor sem pressionar.",
  sumido:
    "Cliente sumido: tom leve, sem cobrança. Reabra com curiosidade ('vi que o grupo X teve movimento...') ou com um número que mudou. Não comece com 'sumiu, hein?'.",
  fechamento:
    "Fechamento: assuma que ele já entendeu. Recap rápido (3 números), aponte o próximo passo CONCRETO (assinar, agendar, escolher data) e crie urgência LEGÍTIMA (próxima assembleia, vaga no grupo).",
};

function buildUserPrompt(d: Payload): string {
  const lines = [
    `Crie um argumento de WhatsApp para ${maskClientName(d.clientName) || "o cliente"} no estágio "${d.saleStageLabel}", explorando o driver dominante "${d.primaryDriverLabel}".`,
    "",
    "DRIVER DO CLIENTE (motor da persuasão):",
    DRIVER_GUIDE[d.primaryDriver],
    "",
    "ESTÁGIO DA VENDA (define o tom e o objetivo da mensagem):",
    STAGE_GUIDE[d.saleStage],
    "",
    "PERFIL:",
    d.clientType ? `- Tipo de cliente / objetivo: ${d.clientType}` : "- Tipo: não informado",
    "",
    "DADOS REAIS DA SIMULAÇÃO (use SEMPRE; nunca invente):",
    `- Tipo: ${d.consortiumTypeLabel}`,
    `- Crédito: ${fmtBRL(d.creditValue)}`,
    `- Parcela mensal: ${fmtBRL(d.installment)}`,
    `- Prazo: ${d.termMonths} meses`,
    `- Custo total no consórcio: ${fmtBRL(d.totalCost)}`,
    d.bidValue > 0
      ? `- Lance previsto: ${fmtBRL(d.bidValue)} (${d.bidPercent.toFixed(1).replace(".", ",")}%)`
      : "- Sem lance simulado",
    d.contemplationMonth ? `- Contemplação estimada: mês ${d.contemplationMonth}` : "",
    `- Custo equivalente em financiamento (PRICE 11% a.a.): ${fmtBRL(d.estimatedFinancingTotal)}`,
    `- Economia vs financiamento: ${fmtBRL(d.estimatedSavings)}`,
    `- Aluguel jogado fora em 5 anos (~0,5%/mês): ${fmtBRL(d.estimatedRent60)}`,
    "",
    "ESTRUTURA OBRIGATÓRIA (CSAA aplicada ao WhatsApp):",
    "1. CLASSIFIQUE a situação em 1 linha curta (uma pergunta retórica funciona bem).",
    "2. Traga CONTEXTO com 2-3 números reais do payload e/ou uma linha do tempo (hoje → daqui X meses).",
    "3. RECOMENDE a ação específica do estágio (ouvir, agendar, fechar, reativar).",
    "4. AJUSTE: termine com pergunta aberta ou próximo passo concreto.",
    "",
    "Máximo 6 linhas. Máximo 1 emoji leve.",
  ].filter(Boolean);
  return lines.join("\n");
}

const SYSTEM_PROMPT = `Você é um gerente de consórcio experiente, conversando no WhatsApp com um cliente real. Seu objetivo é construir argumentos curtos, naturais e contextuais — nunca scripts decorados.

TÉCNICAS QUE VOCÊ USA (escolha 1-2 por mensagem, não todas):
- Pergunta retórica que faz o cliente refletir.
- Linha do tempo curta (hoje → 3 meses → 5 anos) para tornar a decisão tangível.
- Emoção leve e respeitosa (sem drama, sem manipulação).
- Comparação com o que ele JÁ paga (aluguel, financiamento) para gerar contraste.

TOM (CRÍTICO):
- Linguagem natural, como uma pessoa fala. Frases curtas. Pode usar "olha", "pensa comigo", reticências.
- Personalize pelo perfil: investidor não fala como quem está saindo do aluguel.

${GLOBAL_AI_RULES}
- Linguagem simples, sem jargão técnico (sem "amortização", "TIR", "CET", "saldo devedor", "FC").
- Máximo 6 linhas, formato WhatsApp (texto corrido). No máximo 1 emoji.
- Sem títulos, sem listas, sem markdown, sem saudação genérica ("Olá!", "Tudo bem?").
- Encerre com pergunta aberta OU próximo passo concreto (depende do estágio).`;

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

  if (!checkRateLimit(`u:${userId}`, { max: RATE_LIMIT_MAX })) {
    return jsonResponse({ error: "Muitas requisições. Aguarde alguns segundos." }, 429, cors);
  }

  try {
    const raw = await req.json();
    const parsed = RequestSchema.safeParse(raw);
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

    return jsonResponse({ script: text }, 200, cors);
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

