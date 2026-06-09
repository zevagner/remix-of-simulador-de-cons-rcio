import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";
import { authenticateRequest, logAuth, trackAICallVerified } from "../_shared/auth.ts";
import { callAI, AIError } from "./_lib/aiCall.ts";
import { findForbiddenPromise, sanitizeText, SAFE_FALLBACK } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";

const FN = "strategy-storytelling";

// Ambiente — usado para decidir se expomos fallbackReason detalhado.
const IS_PROD = (Deno.env.get("DENO_ENV") ?? Deno.env.get("ENVIRONMENT") ?? "production")
  .toLowerCase() === "production";

// ═══════ SCHEMA (Round 3.A.2 — tese-agnóstico) ═══════
const ComputedFieldSchema = z.object({
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(80),
});

const NarrativeContextSchema = z.object({
  thesisFrame: z.string().min(10).max(600),
  vocabulary: z.object({
    allowed: z.array(z.string().max(60)).max(20).optional(),
    forbidden: z.array(z.string().max(60)).max(20).optional(),
  }).optional(),
  primaryRisk: z.string().min(10).max(600),
  nextStepHint: z.string().max(300).optional(),
  computedFields: z.array(ComputedFieldSchema).max(12),
});

const RequestSchema = z.object({
  strategyId: z.string().min(1).max(80),
  strategyTitle: z.string().min(1).max(120),
  thesisShort: z.string().min(1).max(280),
  narrativeContext: NarrativeContextSchema,
  clientContext: z.object({
    nome: z.string().min(2).max(60),
    objetivo: z.string().min(5).max(200),
    perfilRisco: z.enum(["conservador", "moderado", "arrojado"]),
  }),
});

type Payload = z.infer<typeof RequestSchema>;

function buildUserPrompt(req: Payload): string {
  const { strategyTitle, thesisShort, narrativeContext, clientContext } = req;
  const { thesisFrame, vocabulary, primaryRisk, nextStepHint, computedFields } = narrativeContext;

  const allowedTerms = vocabulary?.allowed?.length
    ? vocabulary.allowed.join(", ")
    : "(sem termos preferenciais especificados)";

  const forbiddenTerms = vocabulary?.forbidden?.length
    ? vocabulary.forbidden.join(", ")
    : "(sem termos proibidos específicos desta tese)";

  const fieldsBlock = computedFields.length
    ? computedFields.map((f) => `- ${f.label}: ${f.value}`).join("\n")
    : "(sem campos numéricos)";

  return `ESTRATÉGIA: ${strategyTitle}
TESE EM UMA LINHA: ${thesisShort}

FRAME DA TESE (eixo central da narrativa):
${thesisFrame}

VOCABULÁRIO PERMITIDO:
${allowedTerms}

VOCABULÁRIO PROIBIDO (específico desta tese):
${forbiddenTerms}

DADOS DA SIMULAÇÃO (use estes números, não invente):
${fieldsBlock}

RISCO PRINCIPAL A RECONHECER HONESTAMENTE:
${primaryRisk}

PRÓXIMO PASSO SUGERIDO:
${nextStepHint ?? "(sem sugestão específica)"}

CLIENTE:
- Nome: ${clientContext.nome}
- Objetivo: ${clientContext.objetivo}
- Perfil de risco: ${clientContext.perfilRisco}`;
}

const SYSTEM_PROMPT = `Você é um consultor CAIXA de consórcio. Sua tarefa é gerar uma narrativa consultiva e personalizada para um cliente específico, usando a tese estratégica e os dados de simulação fornecidos.

ESTRUTURA OBRIGATÓRIA (220 a 280 palavras, em 4 momentos contínuos):
1. Abertura: apresente o cliente e o objetivo dele em uma frase.
2. Mecânica: explique como a tese funciona usando os números reais da simulação fornecidos.
3. Risco honesto: reconheça o risco principal listado na tese.
4. Convite ao próximo passo: feche com a sugestão de próximo passo fornecida.

REGRAS DE TOM:
- Linguagem leiga, conversacional, próxima do cliente.
- Sem jargão financeiro técnico ou regulatório.
- Números sempre em algarismos (ex: "R$ 250 mil"), nunca por extenso.
- Mencione tributação de forma neutra ao final, apenas se a tese envolver ganho realizado.

VOCABULÁRIO:
- Use prioritariamente os termos do bloco "Vocabulário permitido" fornecido na entrada.
- Nunca use termos do bloco "Vocabulário proibido" fornecido na entrada — eles não fazem sentido na tese desta estratégia específica.

PROIBIDO (sempre, em qualquer tese):
- "garantia", "garantido", "garante", "garantimos"
- "certeza absoluta", "com certeza vai"
- "vai ser contemplado", "será contemplado em", "será contemplada"
- "promessa", "prometemos", "prometo"
- "sem risco", "retorno garantido"
- Jargão técnico: "ativo", "lastro", "alavanca", "valorização do lugar na fila"

Use APENAS os dados fornecidos. NÃO invente números, NÃO presuma informações não dadas, NÃO faça suposições sobre a tese que não estão explicitamente no frame fornecido.`;

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (!isOriginAllowed(cors)) return jsonResponse({ error: "Origem não permitida" }, 403, cors);

  // ═══════ AUTH OBRIGATÓRIA ═══════
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
      return jsonResponse(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        400,
        cors,
      );
    }

    const result = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(parsed.data) },
      ],
    });

    const text = sanitizeText(result.text);
    const matched = findForbiddenPromise(text);

    if (matched !== null) {
      logEdgeError(FN, new Error("safe_fallback_triggered"), {
        context: "strategy-storytelling",
        strategyId: parsed.data.strategyId,
        perfilRisco: parsed.data.clientContext.perfilRisco,
        matchedRegex: matched,
        textPreview: text.slice(0, 100) + (text.length > 100 ? "..." : ""),
      });
      const body: Record<string, unknown> = {
        storytelling: SAFE_FALLBACK,
        safeFallback: true,
      };
      body.fallbackReason = IS_PROD
        ? "validator_rejected"
        : `matched:"${matched}"`;
      return jsonResponse(body, 200, cors);
    }

    return jsonResponse({ storytelling: text, safeFallback: false }, 200, cors);
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
