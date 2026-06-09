/**
 * Validadores de saída de IA — regras globais do produto.
 */

const FORBIDDEN_PROMISE_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(garantia|garantido|garantida|garante|garantimos)\b/i,
  /\b(certeza absoluta|com certeza vai|você vai ser contemplad)/i,
  /\bvai ser contemplad[ao]\b/i,
  /\bser[áa] contemplad[ao] (em|no|na)\b/i,
  /\b(promet[ao]|prometemos)\b/i,
  /\bsem risco\b/i,
  /\bretorno garantido\b/i,
];

export function findForbiddenPromise(text: string): string | null {
  for (const re of FORBIDDEN_PROMISE_PATTERNS) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

export function isPromiseSafe(text: string): boolean {
  return findForbiddenPromise(text) === null;
}

export const GLOBAL_AI_RULES = `REGRAS GLOBAIS (NUNCA QUEBRE):
- NUNCA prometa contemplação, resultado ou retorno garantido. Use "histórico mostra", "tende a", "aumenta a chance".
- NUNCA invente números — use apenas os dados fornecidos no contexto.
- Linguagem objetiva e prática, sem termos vagos.
- Disclaimer de simulação ilustrativa quando exibir valores financeiros.`;

const REPLY_HOOK_SIGNALS: ReadonlyArray<RegExp> = [
  /\?/,
  /\b(faz sentido|topa|consegue|prefere|me diz|me avisa|me confirma|posso te ligar)\b/i,
  /\b\d{1,2}h(\d{2})?\s+ou\s+\d{1,2}h(\d{2})?\b/i,
];

export function hasReplyHook(text: string): boolean {
  return REPLY_HOOK_SIGNALS.some((re) => re.test(text));
}

export function sanitizeText(text: string): string {
  return text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export const SAFE_FALLBACK =
  "Não consegui montar uma resposta segura agora. Tenta de novo em alguns segundos.";

export const STRICT_NO_PROMISE_PROMPT = `Nunca prometa contemplação, garantia ou certeza de resultado.
Nunca use termos como "garantido", "com certeza", "aprovação imediata".
Sempre trate contemplação como possibilidade, nunca como promessa.`;
