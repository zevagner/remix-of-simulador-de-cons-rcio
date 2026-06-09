/**
 * Wrapper centralizado para o Lovable AI Gateway.
 */
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type AIModel =
  | "google/gemini-2.5-flash"
  | "google/gemini-2.5-flash-lite"
  | "google/gemini-2.5-pro"
  | "google/gemini-3-flash-preview"
  | "google/gemini-3.1-flash-image-preview"
  | "openai/gpt-5"
  | "openai/gpt-5-mini"
  | "openai/gpt-5-nano"
  | "openai/gpt-5.2";

export interface AIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
}

export interface AICallOptions {
  model: AIModel;
  messages: AIMessage[];
  temperature?: number;
  tools?: unknown[];
  tool_choice?: unknown;
  response_format?: unknown;
}

export interface AIResult {
  text: string;
  toolCall: { name: string; arguments: unknown } | null;
  raw: any;
}

export class AIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: "rate_limit" | "no_credits" | "config" | "gateway" | "empty",
  ) {
    super(message);
    this.name = "AIError";
  }
}

export async function callAI(opts: AICallOptions): Promise<AIResult> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new AIError("LOVABLE_API_KEY ausente", 500, "config");

  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
  };
  if (opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.tools) body.tools = opts.tools;
  if (opts.tool_choice) body.tool_choice = opts.tool_choice;
  if (opts.response_format) body.response_format = opts.response_format;

  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) throw new AIError("AI gateway rate limit", 429, "rate_limit");
  if (res.status === 402) throw new AIError("AI gateway sem créditos", 402, "no_credits");
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new AIError(`AI gateway erro ${res.status}: ${txt.slice(0, 200)}`, res.status, "gateway");
  }

  const data = await res.json();
  const choice = data?.choices?.[0]?.message;
  const text: string = choice?.content ?? "";

  let toolCall: AIResult["toolCall"] = null;
  const tc = choice?.tool_calls?.[0];
  if (tc?.function?.name) {
    let parsed: unknown = tc.function.arguments;
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch { /* keep raw */ }
    }
    toolCall = { name: tc.function.name, arguments: parsed };
  }

  if (!text && !toolCall) throw new AIError("Resposta vazia da IA", 500, "empty");
  return { text: text.trim(), toolCall, raw: data };
}

export interface RetryOptions extends AICallOptions {
  maxRetries?: number;
  validate?: (r: AIResult) => string | null;
  buildRetryNote?: (reason: string) => string;
}

export async function callAIWithRetry(opts: RetryOptions): Promise<AIResult> {
  const max = Math.max(1, opts.maxRetries ?? 1);
  const validate = opts.validate;
  const buildNote = opts.buildRetryNote ??
    ((r) => `Sua resposta anterior foi rejeitada: ${r}. Refaça respeitando TODAS as regras.`);

  let messages = [...opts.messages];
  let last: AIResult | null = null;
  let lastReason: string | null = null;

  for (let attempt = 0; attempt < max; attempt++) {
    const result = await callAI({ ...opts, messages });
    last = result;
    if (!validate) return result;
    const reason = validate(result);
    if (reason === null) return result;
    lastReason = reason;
    messages = [
      ...messages,
      { role: "assistant", content: result.text || JSON.stringify(result.toolCall) },
      { role: "user", content: buildNote(reason) },
    ];
  }

  if (last) {
    console.warn("[callAIWithRetry] esgotou retries:", lastReason);
    return last;
  }
  throw new AIError("Sem resposta da IA após retries", 500, "empty");
}
