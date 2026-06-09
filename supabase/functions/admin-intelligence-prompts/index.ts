/**
 * admin-intelligence-prompts
 * ──────────────────────────
 * Segunda chamada da Inteligência: dado o relatório já gerado + snapshot,
 * devolve exatamente 3 prompts prontos para colar no Lovable.
 *
 * Admin-only · não persiste · fire-and-forget no cliente.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";
import { SAFE_FALLBACK } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";
import { authenticateAdmin, logAuth } from "../_shared/auth.ts";

const FN = "admin-intelligence-prompts";

const RequestSchema = z.object({
  report: z.string().min(20).max(20_000),
  snapshot: z.object({ periodo: z.string().max(10) }).passthrough(),
});

const SYSTEM_PROMPT = `Você é um especialista em desenvolvimento de produto que trabalha com a ferramenta Lovable (gerador de código no-code).
Sua função é transformar insights de produto em prompts prontos para colar no Lovable e gerar melhorias de código.
Cada prompt deve ser autocontido, específico, técnico o suficiente para o Lovable entender, e focado em uma única melhoria.
Nunca sugira mudanças em motor financeiro, RLS, schema de banco ou lógica de negócio crítica.
Foque em melhorias de UX, fluxo, comunicação, onboarding e engajamento.
Responda SEMPRE em JSON puro, sem markdown, sem cercas \`\`\`json, sem texto antes ou depois.`;

function buildUserPrompt(report: string, snapshot: unknown): string {
  return `Com base no relatório de inteligência abaixo e nos dados operacionais, gere exatamente 3 prompts prontos para colar no Lovable.

RELATÓRIO:
${report}

DADOS:
${JSON.stringify(snapshot, null, 2)}

Para cada prompt:
1. Título curto da melhoria (ex: "CTA pós-simulação", "Onboarding D+1", "Badge de progresso")
2. Categoria — uma de: "UX", "Fluxo", "Engajamento"
3. Problema que resolve (1 linha)
4. O prompt completo pronto para colar no Lovable — deve ser detalhado, incluir componentes afetados, comportamento esperado e restrições

Formato de resposta — JSON puro sem markdown:
[
  { "titulo": "...", "categoria": "UX", "problema": "...", "prompt": "..." },
  { "titulo": "...", "categoria": "Fluxo", "problema": "...", "prompt": "..." },
  { "titulo": "...", "categoria": "Engajamento", "problema": "...", "prompt": "..." }
]`;
}

function stripCodeFence(s: string): string {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
}

const PromptItemSchema = z.object({
  titulo: z.string().min(1).max(120),
  categoria: z.string().min(1).max(40),
  problema: z.string().min(1).max(400),
  prompt: z.string().min(20).max(8_000),
});

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
  logAuth("admin-intelligence-prompts", auth.userId);

  if (!checkRateLimit(`u:${auth.userId}`, { max: 5, windowMs: 60_000 })) {
    return jsonResponse({ error: "Muitas requisições. Aguarde 1 minuto." }, 429, cors);
  }

  try {
    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse({ error: "Payload inválido", details: parsed.error.flatten().fieldErrors }, 400, cors);
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
          { role: "user", content: buildUserPrompt(parsed.data.report, parsed.data.snapshot) },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Limite da IA excedido." }, 429, cors);
      if (response.status === 402) return jsonResponse({ error: "Créditos de IA esgotados." }, 402, cors);
      const body = await response.text();
      logEdgeError(FN, new Error(`AI gateway ${response.status}`), { context: "ai_gateway", body });
      return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
    }

    const json = await response.json();
    const raw = json?.choices?.[0]?.message?.content ?? "";
    if (!raw) return jsonResponse({ error: "IA retornou resposta vazia" }, 502, cors);

    let arr: unknown;
    try {
      arr = JSON.parse(stripCodeFence(raw));
    } catch {
      logEdgeError(FN, new Error("JSON inválido"), { context: "parse", raw: raw.slice(0, 400) });
      return jsonResponse({ error: "Resposta da IA fora do formato esperado" }, 502, cors);
    }

    const items = z.array(PromptItemSchema).min(1).max(5).safeParse(arr);
    if (!items.success) {
      return jsonResponse({ error: "Itens fora do formato esperado" }, 502, cors);
    }

    return jsonResponse(
      { prompts: items.data.slice(0, 3), generatedAt: new Date().toISOString(), model: "openai/gpt-5.2" },
      200,
      cors,
    );
  } catch (e) {
    logEdgeError(FN, e, { context: "unhandled" });
    return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
  }
});
