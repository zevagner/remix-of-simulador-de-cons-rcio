/**
 * module-copilot — Copiloto de Vendas (camada de orquestração).
 *
 * Recebe um snapshot do estado do app + módulo atual e devolve um JSON
 * estruturado (tool calling) para o front renderizar:
 *   { estrategia, argumentoPrincipal, alerta, proximaAcao, fraseSugerida }
 *
 * REGRAS:
 *  - IA APENAS para linguagem (interpretação + redação).
 *  - NUNCA recalcula nada — usa os números já calculados pelo front.
 *  - Cláusulas globais "nunca prometer garantia" reaproveitadas.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { sanitizeUserField as sanitizeFreeText } from "../_shared/validators.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";
import { authenticateRequest, logAuth, trackAICallVerified } from "../_shared/auth.ts";
import { GLOBAL_AI_RULES, SAFE_FALLBACK, STRICT_NO_PROMISE_PROMPT } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";

const FN = "module-copilot";

const ModuleSchema = z.enum([
  "analysis",
  "approach",
  "proposal",
  "proposal-pdf",
  "wallet",
  "post-sale",
]);

const SnapshotSchema = z.object({
  // Simulação (sempre valores prontos — não recalcular)
  consortiumType: z.string().max(50).optional(),
  creditValue: z.number().nonnegative().optional(),
  installment: z.number().nonnegative().optional(),
  termMonths: z.number().int().min(1).max(999).optional(),
  totalCost: z.number().nonnegative().optional(),
  effectiveClientCost: z.number().nonnegative().optional(),
  bidPercent: z.number().min(0).max(100).optional(),
  bidZone: z.string().max(50).optional(),
  contemplationMonth: z.number().int().min(0).max(999).optional(),
  // Diagnóstico
  clientName: z.string().max(200).optional(),
  clientObjective: z.string().max(200).optional(),
  scenarioProfile: z.enum(["conservador", "equilibrado", "agressivo"]).optional(),
  urgency: z.string().max(50).optional(),
  priority: z.string().max(50).optional(),
  clientBehavior: z.string().max(50).optional(),
  clientProfileLabel: z.string().max(200).optional(),
  consortiumConfidence: z.string().max(80).optional(),
  subObjetivo: z.string().max(200).optional(),
  capacidadeMensal: z.number().nonnegative().optional(),
  // Recomendação determinística (path do decisionEngine)
  recommendedPath: z.string().max(80).optional(),
  // Pipeline / Pós-venda
  saleStage: z.string().max(80).optional(),
  daysSinceLastContact: z.number().int().min(0).optional(),
  riskLevel: z.string().max(20).optional(),
  // Investment / Bids resumidos
  incomeMonthly: z.number().optional(),
  saleProfit: z.number().optional(),
  // Texto livre opcional (ex: última mensagem do cliente)
  freeText: z.string().max(2000).optional(),
});

const RequestSchema = z.object({
  module: ModuleSchema,
  snapshot: SnapshotSchema,
});

const SYSTEM_PROMPT = `Você é o Copiloto de Vendas de uma plataforma de consórcio.
Sua função é INTERPRETAR o estado atual do consultor e devolver orientação prática.

REGRAS DURAS:
- NÃO calcule nada. Use somente os números recebidos no snapshot.
- NÃO invente dados ausentes — se faltar, generalize ou diga "informação não disponível".
- Linguagem brasileira, consultiva, direta. Sem jargão.
- Frases curtas (máx 25 palavras). Tom de mentor, não de vendedor agressivo.
- A "fraseSugerida" deve ser pronta para enviar ao cliente (WhatsApp). Use 1ª pessoa.
- O "alerta" é opcional — só preencha se houver risco real (ex: cliente parado, lance fora da zona, sem ação prevista).
- Adapte estratégia ao módulo: análise=visão consultiva, abordagem=script de conversa, proposta=fechamento, carteira=follow-up, pos-venda=relacionamento.
- Adapte o vocabulário ao tipo do bem:
  * Veículo: fale em FIPE, seguro, valor de revenda, CDC, troca, entrada.
  * Imóvel: fale em financiamento bancário, ITBI, escritura, valorização, aluguel evitado.
  * Veículos pesados: fale em frota, depreciação, custo operacional, CNPJ.
  * Serviços: fale em reforma, viagem, educação, prazo flexível.
- Use o Sub-objetivo para personalizar ainda mais (ex: "primeiro imóvel", "upgrade de veículo").
- Use a Parcela confortável declarada como referência de acessibilidade — nunca sugira ação que exija valor acima disso.
- Use o Comportamento e a Confiança no consórcio para calibrar o tom: confiante = avance direto; neutro = reforce diferenciais; resistente = use comparativos antes de propor.

${GLOBAL_AI_RULES}

${STRICT_NO_PROMISE_PROMPT}`;

const TOOL = {
  type: "function" as const,
  function: {
    name: "module_copilot_response",
    description: "Devolve orientação estruturada para o consultor.",
    parameters: {
      type: "object",
      properties: {
        estrategia: { type: "string", description: "1-2 frases: leitura do cenário e o que priorizar agora." },
        argumentoPrincipal: { type: "string", description: "O argumento mais forte para esse cenário, em 1 frase." },
        alerta: { type: "string", description: "Risco/atenção (vazio se não houver)." },
        proximaAcao: { type: "string", description: "Ação concreta próxima (verbo no imperativo, 1 frase)." },
        fraseSugerida: { type: "string", description: "Frase pronta para enviar ao cliente (1-3 linhas)." },
      },
      required: ["estrategia", "argumentoPrincipal", "proximaAcao", "fraseSugerida"],
      additionalProperties: false,
    },
  },
};

// trackAICall removido — usar trackAICallVerified do _shared/auth.ts

function buildUserPrompt(module: string, snap: z.infer<typeof SnapshotSchema>): string {
  const fmt = (n?: number) => (typeof n === "number" ? `R$ ${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` : "—");
  const parts: string[] = [];
  parts.push(`MÓDULO ATUAL: ${module}`);
  if (snap.clientName) parts.push(`Cliente: [CLIENTE] (token anonimizado — trate como pronome neutro)`);
  if (snap.clientObjective) parts.push(`Objetivo: ${snap.clientObjective}`);
  if (snap.scenarioProfile) parts.push(`Perfil: ${snap.scenarioProfile}`);
  if (snap.priority) parts.push(`Prioridade do cliente: ${snap.priority}`);
  if (snap.consortiumConfidence) parts.push(`Confiança no consórcio: ${snap.consortiumConfidence}`);
  if (snap.clientBehavior) parts.push(`Comportamento: ${snap.clientBehavior}`);
  if (snap.clientProfileLabel) parts.push(`Perfil consolidado: ${snap.clientProfileLabel}`);
  if (snap.subObjetivo) parts.push(`Sub-objetivo: ${snap.subObjetivo}`);
  if (typeof snap.capacidadeMensal === "number") parts.push(`Parcela confortável declarada: ${fmt(snap.capacidadeMensal)}`);
  if (snap.urgency) parts.push(`Urgência: ${snap.urgency}`);
  if (snap.consortiumType) parts.push(`Tipo: ${snap.consortiumType}`);
  if (snap.creditValue) parts.push(`Crédito: ${fmt(snap.creditValue)}`);
  if (snap.installment) parts.push(`Parcela: ${fmt(snap.installment)}`);
  if (snap.termMonths) parts.push(`Prazo: ${snap.termMonths} meses`);
  if (snap.effectiveClientCost ?? snap.totalCost) parts.push(`Custo real: ${fmt(snap.effectiveClientCost ?? snap.totalCost)}`);
  if (snap.bidPercent) parts.push(`Lance: ${snap.bidPercent}% (${snap.bidZone ?? "n/d"})`);
  if (snap.contemplationMonth) parts.push(`Contemplação prevista: mês ${snap.contemplationMonth}`);
  if (snap.recommendedPath) parts.push(`Caminho recomendado: ${snap.recommendedPath}`);
  if (snap.incomeMonthly) parts.push(`Renda projetada: ${fmt(snap.incomeMonthly)}/mês`);
  if (snap.saleProfit) parts.push(`Lucro venda cota: ${fmt(snap.saleProfit)}`);
  if (snap.saleStage) parts.push(`Estágio CRM: ${snap.saleStage}`);
  if (typeof snap.daysSinceLastContact === "number") parts.push(`Sem contato há: ${snap.daysSinceLastContact}d`);
  if (snap.riskLevel) parts.push(`Risco: ${snap.riskLevel}`);
  if (snap.freeText) {
    // Security M1: sanitiza observação livre antes de injetar no prompt.
    // Import síncrono via top-level não funciona aqui (função pura) — usa replace inline equivalente.
    const safe = sanitizeFreeText(snap.freeText);
    parts.push(`\nObservação livre: ${safe}`);
  }
  parts.push(`\nDevolva o JSON via a função module_copilot_response.`);
  return parts.join("\n");
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

  try {
    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, 400, cors);
    }
    const { module, snapshot } = parsed.data;

    if (!checkRateLimit(`u:${userId}`, { max: 20, windowMs: 60_000 })) {
      return jsonResponse({ error: "Muitas requisições. Aguarde antes de tentar de novo." }, 429, cors);
    }


    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Chave de IA não configurada" }, 500, cors);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(module, snapshot) },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "module_copilot_response" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Limite de requisições excedido. Tente em alguns segundos." }, 429, cors);
      if (response.status === 402) return jsonResponse({ error: "Créditos de IA esgotados." }, 402, cors);
      const txt = await response.text();
      logEdgeError(FN, new Error(`AI gateway ${response.status}`), { context: "ai_gateway", body: txt });
      return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      return jsonResponse({ error: "Resposta inválida da IA." }, 502, cors);
    }
    let result: Record<string, unknown>;
    try { result = JSON.parse(argsStr); } catch {
      return jsonResponse({ error: "JSON inválido da IA." }, 502, cors);
    }

    return jsonResponse(result, 200, cors);
  } catch (e) {
    logEdgeError(FN, e, { context: "unhandled" });
    return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
  }
});
