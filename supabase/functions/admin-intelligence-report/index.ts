/**
 * admin-intelligence-report
 * ─────────────────────────
 * Gera relatório executivo em markdown a partir do snapshot operacional da
 * plataforma. Admin-only — valida JWT + has_role('admin') antes de chamar IA.
 *
 * Não persiste o relatório; cliente armazena em localStorage.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";
import { SAFE_FALLBACK } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";
import { authenticateAdmin, logAuth } from "../_shared/auth.ts";

const FN = "admin-intelligence-report";

// Snapshot é opaco para a edge (só repassa para a IA), mas validamos shape mínimo.
const SnapshotSchema = z.object({
  periodo: z.string().max(10),
}).passthrough();

const RequestSchema = z.object({
  snapshot: SnapshotSchema,
});

const SYSTEM_PROMPT = `Você é um analista de produto sênior especializado em plataformas SaaS B2B para consultores de consórcio CAIXA.
Sua função é analisar dados operacionais e gerar relatórios executivos claros, diretos e acionáveis.

REGRAS:
- Sempre identifique: o que está funcionando bem, o que precisa de atenção, e 3 recomendações priorizadas.
- Use linguagem profissional mas acessível.
- Seja específico com números — cite os valores recebidos.
- Evite elogios genéricos e jargão de marketing.
- Nunca prometa resultados futuros como certos.
- Formate a resposta em markdown com seções claras (## Resumo Executivo, etc).
- Não invente dados que não estão no snapshot. Se um dado estiver zerado, comente o que isso indica.`;

function buildUserPrompt(snapshot: unknown): string {
  const period = (snapshot as { periodo?: string })?.periodo ?? "30d";
  return `Analise os dados operacionais da plataforma para o período de ${period} e gere um relatório executivo completo.

DADOS DO PERÍODO:
${JSON.stringify(snapshot, null, 2)}

O relatório deve conter exatamente estas seções, nesta ordem:

## Resumo Executivo
Um parágrafo de 3-4 linhas com o estado geral da plataforma.

## Saúde do Funil Comercial
Análise do funil de conversão — onde está o maior gargalo e o que pode estar causando.

## Engajamento dos Consultores
Análise de retenção, uso de IA, módulos mais acessados e comportamento de uso.

## Qualidade do Produto
Análise de feedbacks, bugs reportados, performance técnica e satisfação inferida.

## Comunidade
Estado da comunidade — se está gerando valor, se consultores estão participando.

## 3 Recomendações Prioritárias
Lista numerada com as 3 ações mais importantes para melhorar a plataforma nas próximas 2 semanas. Cada recomendação deve ter: o problema identificado, a ação sugerida e o impacto esperado.

## Alertas
Lista de itens que requerem atenção imediata (se houver). Se não houver, escreva "Nenhum alerta crítico identificado."`;
}

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (!isOriginAllowed(cors)) return jsonResponse({ error: "Origem não permitida" }, 403, cors);

  // AuthN+AuthZ canônica: getUser() (assinatura/expiração) + has_role('admin').
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    return jsonResponse(
      { error: auth.status === 401 ? "Unauthorized" : "Acesso negado. Apenas administradores." },
      auth.status,
      cors,
    );
  }
  logAuth(FN, auth.userId);

  // Rate limit baixo — relatório é caro. Chave verificada por user, não IP.
  if (!checkRateLimit(`u:${auth.userId}`, { max: 5, windowMs: 60_000 })) {
    return jsonResponse({ error: "Muitas requisições. Aguarde 1 minuto." }, 429, cors);
  }

  try {
    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse({ error: "Snapshot inválido", details: parsed.error.flatten().fieldErrors }, 400, cors);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Chave de IA não configurada" }, 500, cors);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5.2",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(parsed.data.snapshot) },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Limite da IA excedido. Tente em instantes." }, 429, cors);
      if (response.status === 402) return jsonResponse({ error: "Créditos de IA esgotados." }, 402, cors);
      const body = await response.text();
      logEdgeError(FN, new Error(`AI gateway ${response.status}`), { context: "ai_gateway", body });
      return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
    }

    const json = await response.json();
    const markdown = json?.choices?.[0]?.message?.content ?? "";
    if (!markdown) {
      logEdgeError(FN, new Error("Resposta vazia da IA"), { context: "empty_response" });
      return jsonResponse({ error: "IA retornou resposta vazia" }, 502, cors);
    }

    return jsonResponse(
      { markdown, generatedAt: new Date().toISOString(), model: "openai/gpt-5.2" },
      200,
      cors,
    );
  } catch (e) {
    logEdgeError(FN, e, { context: "unhandled" });
    return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
  }
});
