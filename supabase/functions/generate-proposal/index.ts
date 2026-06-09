import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";
import { GLOBAL_AI_RULES, SAFE_FALLBACK, STRICT_NO_PROMISE_PROMPT } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";

const FN = "generate-proposal";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// ═══════ ZOD SCHEMA ═══════
const ProposalDataSchema = z.object({
  clientName: z.string().max(200).optional(),
  consortiumType: z.string().min(1).max(50),
  creditValue: z.number().positive().max(100_000_000),
  installment: z.number().nonnegative().max(10_000_000),
  termMonths: z.number().int().min(1).max(999),
  totalCost: z.number().nonnegative().max(1_000_000_000),
  bidPercent: z.number().min(0).max(100).optional(),
  bidType: z.string().max(50).optional(),
  scenarioProfile: z.string().max(50).optional(),
  financingInstallment: z.number().nonnegative().optional(),
  financingTotal: z.number().nonnegative().optional(),
  savings: z.number().optional(),
  savingsPercent: z.number().optional(),
  contemplated: z.boolean().optional(),
  contemplationMonth: z.preprocess((value) => {
    if (value === null || value === undefined || value === '' || value === 0) return undefined;
    return typeof value === 'string' ? Number(value) : value;
  }, z.number().int().min(1).max(999).optional()),
  reducedInstallment: z.boolean().optional(),
  reducedInstallmentMonths: z.number().int().min(1).max(999).optional(),
  reducedInstallmentValue: z.number().nonnegative().optional(),
  redilutedInstallmentValue: z.number().nonnegative().optional(),
  subObjetivo: z.string().max(100).optional(),
  usedCreditForAsset: z.boolean().optional(),
  creditUsageMonth: z.number().int().min(1).max(999).optional(),
});

const RequestSchema = z.object({
  proposalData: ProposalDataSchema,
});

// ═══════ SYSTEM PROMPT ═══════
const SYSTEM_PROMPT = `Você é consultor de consórcio CAIXA + copywriter de WhatsApp. Escreva uma proposta que faça o cliente responder.

ESTRUTURA (nesta ordem):
1. GANCHO (1 linha): pergunta/afirmação direta sobre conquistar o bem sem juros de banco.
2. COMPARAÇÃO (3-4 linhas): financiamento (Price 11% a.a., mesmo prazo/valor) vs consórcio, com números reais e diferença em R$.
3. PLANO: carta, parcela, prazo, custo total. Se contemplado, mencione mês e parcela reduzida.
4. POR QUE FUNCIONA (2-3 linhas): sem juros, poder de compra à vista, disciplina vira patrimônio.
5. CTA (1 linha): pergunta que cria movimento. Nunca "qualquer dúvida".

REGRAS: máx 300 palavras, tom humano e direto, WhatsApp com emojis discretos, sem "Olá/Tudo bem/Conforme conversamos", usar dados reais.

${GLOBAL_AI_RULES}

${STRICT_NO_PROMISE_PROMPT}
- Classifique cenário, dê contexto, recomende ação, indique próximo passo.`;

// ═══════ FIRE-AND-FORGET AI TRACKING ═══════
function trackAICall(userId: string) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    fetch(`${url}/rest/v1/analytics_events`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ user_id: userId, event_name: "ai_call", event_data: { module: "generate-proposal" } }),
    }).catch(() => {});
  } catch { /* never block */ }
}

serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  if (!isOriginAllowed(cors)) {
    return jsonResponse({ error: "Origem não permitida" }, 403, cors);
  }

  // ═══════ AUTENTICAÇÃO OBRIGATÓRIA ═══════
  // Valida JWT no Auth server (assinatura + expiração). Bloqueia
  // anônimos, JWT inválidos/expirados e chamadas diretas sem sessão.
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await supabaseUser.auth.getUser(token);
  if (userErr || !userData?.user) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = userData.user.id;

  // Auditoria mínima (sem prompt/payload/PII além do user_id autenticado).
  console.log(`[${FN}] auth_ok`, { userId, at: new Date().toISOString() });

  trackAICall(userId);

  // Rate-limit ancorado em userId verificado (sem fallback IP forjável)
  if (!checkRateLimit(`u:${userId}`, { max: 10 })) {
    return jsonResponse({ error: "Muitas requisições. Aguarde um momento antes de tentar novamente." }, 429, cors);
  }

  try {
    const rawBody = await req.json();
    const parsed = RequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return jsonResponse(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        400,
        cors,
      );
    }

    const { proposalData: d } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return jsonResponse({ error: "Chave de IA não configurada" }, 500, cors);
    }

    // Build context
    const lines: string[] = [];
    if (d.clientName) lines.push(`Nome do cliente: [CLIENTE] (token anonimizado — trate como pronome neutro)`);
    lines.push(`Tipo de consórcio: ${d.consortiumType}`);
    lines.push(`Valor da carta de crédito: R$ ${d.creditValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    lines.push(`Parcela estimada: R$ ${d.installment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    lines.push(`Prazo: ${d.termMonths} meses (${(d.termMonths / 12).toFixed(1)} anos)`);
    lines.push(`Custo total do consórcio: R$ ${d.totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);

    if (d.bidPercent && d.bidPercent > 0) {
      lines.push(`Lance sugerido: ${d.bidPercent.toFixed(1)}%`);
      if (d.bidType) lines.push(`Tipo de lance: ${d.bidType}`);
    }
    if (d.scenarioProfile) lines.push(`Perfil do cenário: ${d.scenarioProfile}`);
    if (d.financingInstallment) {
      lines.push(`\nCOMPARAÇÃO COM FINANCIAMENTO:`);
      lines.push(`Parcela financiamento: R$ ${d.financingInstallment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
      if (d.financingTotal) lines.push(`Custo total financiamento: R$ ${d.financingTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
      if (d.savings && d.savings > 0) {
        lines.push(`Economia estimada: R$ ${d.savings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${d.savingsPercent?.toFixed(1)}%)`);
      }
    }
    if (d.contemplated) {
      lines.push(`\nCONTEMPLAÇÃO: Simulação com contemplação no mês ${d.contemplationMonth}`);
    }
    if (d.reducedInstallment) {
      const hasPhases = !d.contemplated && d.reducedInstallmentValue != null && d.redilutedInstallmentValue != null && d.reducedInstallmentMonths;
      if (hasPhases) {
        const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        lines.push(`\nESTRATÉGIA DE PARCELA REDUZIDA (DUAS FASES — sem contemplação marcada):`);
        lines.push(`- Parcelas 1 a ${d.reducedInstallmentMonths}: ${fmt(d.reducedInstallmentValue!)}/mês (fase reduzida)`);
        lines.push(`- Parcelas ${d.reducedInstallmentMonths! + 1} a ${d.termMonths}: ${fmt(d.redilutedInstallmentValue!)}/mês (fase rediluída — déficit redistribuído)`);
        lines.push(`INSTRUÇÃO OBRIGATÓRIA: descreva EXPLICITAMENTE as duas fases na narrativa. NÃO trate como parcela única. Deixe claro que após a parcela ${d.reducedInstallmentMonths} o valor sobe para o valor rediluído — isso fecha a matemática com o custo total e evita a impressão de "dívida menor que a carta".`);
      } else {
        lines.push(`\nESTRATÉGIA DE PARCELA REDUZIDA: O cliente optou por parcelas menores no início do plano. A parcela informada acima já é o valor reduzido. Mencione essa vantagem na proposta: "Começamos com parcelas menores, facilitando a entrada, e depois ajustamos ao longo do plano."`);
      }
    }
    if (d.subObjetivo) {
      lines.push(`\nREFINAMENTO DO OBJETIVO: o cliente deseja ${d.subObjetivo}. Adapte o GANCHO e o "POR QUE FUNCIONA" para refletir esse contexto específico (ex.: reforma → mencionar obra/melhoria; aluguel → renda passiva; aposentadoria → tranquilidade futura; primeiro veículo → conquista; uso profissional → ferramenta de trabalho).`);
    }
    if (d.usedCreditForAsset) {
      const mes = d.creditUsageMonth ?? null;
      lines.push(`\nSEGURO PRESTAMISTA — UTILIZAÇÃO DA CARTA: o cliente utilizará a carta para aquisição de bem${mes ? ` no mês ${mes}` : ''}. O seguro Prestamista NÃO incide desde o início — passa a vigorar somente a partir desse mês. INSTRUÇÃO: mencione brevemente essa proteção complementar (1 linha) deixando claro que o seguro só começa quando o bem é adquirido. Não trate como custo do plano inteiro.`);
    }

    const userPrompt = `Com base nos dados abaixo, gere uma mensagem de WhatsApp apresentando a proposta ao cliente:\n\n${lines.join("\n")}`;

    // Streaming: chamada direta ao gateway (não usa callAI do _lib pois precisa retornar SSE bruto).
    // Resiliência: retry com backoff em 5xx + fallback de modelo (gpt-5.2 → gemini-2.5-flash).
    const callGateway = (model: string) => fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    const MODELS = ["openai/gpt-5.2", "google/gemini-2.5-flash"] as const;
    let response: Response | null = null;
    let lastStatus = 0;
    let lastBody = "";
    outer: for (const model of MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const r = await callGateway(model);
        if (r.ok) { response = r; break outer; }
        lastStatus = r.status;
        if (r.status === 429) return jsonResponse({ error: "Muitas requisições. Tente novamente em alguns segundos." }, 429, cors);
        if (r.status === 402) return jsonResponse({ error: "Créditos de IA esgotados." }, 402, cors);
        lastBody = await r.text().catch(() => "");
        // 5xx → retry; 4xx (não 429/402) → desiste deste modelo
        if (r.status < 500) break;
        if (attempt === 0) await new Promise((res) => setTimeout(res, 400));
      }
    }

    if (!response) {
      logEdgeError(FN, new Error(`AI gateway error ${lastStatus} após retries+fallback: ${lastBody.slice(0, 200)}`), { context: "ai_gateway", status: lastStatus });
      return jsonResponse({ error: SAFE_FALLBACK }, 503, cors);
    }


    return new Response(response.body, {
      headers: { ...cors, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    logEdgeError(FN, e, { context: "unhandled" });
    return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
  }
});
