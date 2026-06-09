/**
 * Espelho client-side dos validators de IA.
 *
 * ⚠️ Mantém PARIDADE com `supabase/functions/_shared/validators.ts` e
 * `supabase/functions/_shared/promptFragments.ts`. Ao alterar o servidor,
 * atualize aqui também (testado em src/test/aiInvariants.test.ts).
 *
 * Por que duplicar? O Vitest roda em Node, e edges em Deno. Mantemos a
 * lógica em ambos lados para validação simétrica e testes rápidos.
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

const REPLY_HOOK_SIGNALS: ReadonlyArray<RegExp> = [
  /\?/,
  /\b(faz sentido|topa|consegue|prefere|me diz|me avisa|me confirma|posso te ligar)\b/i,
  /\b\d{1,2}h(\d{2})?\s+ou\s+\d{1,2}h(\d{2})?\b/i,
];

export function hasReplyHook(text: string): boolean {
  return REPLY_HOOK_SIGNALS.some((re) => re.test(text));
}

export const GLOBAL_AI_RULES = `REGRAS GLOBAIS (NUNCA QUEBRE):
- NUNCA prometa contemplação, resultado ou retorno garantido. Use "histórico mostra", "tende a", "aumenta a chance".
- NUNCA invente números — use apenas os dados fornecidos no contexto.
- Linguagem objetiva e prática, sem termos vagos.
- Disclaimer de simulação ilustrativa quando exibir valores financeiros.`;

// === Prompt fragments (espelho de promptFragments.ts) ===

export const CONSULTATIVE_TONE = `TOM CONSULTIVO:
- Fale como consultor, não como vendedor. Foque em ajudar o cliente a decidir.
- Use frases curtas (até 18 palavras). Sem jargão técnico desnecessário.
- Reconheça riscos antes de listar benefícios. Transparência > entusiasmo.`;

export const TRUST_REINFORCEMENT = `REFORÇO DE CONFIANÇA:
- Cite dados concretos (histórico de grupos, taxas reais, prazos).
- Substitua "vamos conseguir" por "o histórico mostra que é viável".
- Quando citar Caixa/marca, posicione como instituição sólida — sem superlativos.`;

export const OBJECTION_HANDLING = `TRATAMENTO DE OBJEÇÃO:
1. Valide o sentimento ("entendo a preocupação com X").
2. Reframe com dado concreto do contexto.
3. Ofereça próximo passo pequeno (não fechamento direto).
Nunca minimize a dúvida do cliente. Nunca diga "isso não é problema".`;

export const URGENCY_FRAMING = `URGÊNCIA HONESTA:
- Só cite urgência quando o dado existir (data de assembleia real, prazo de campanha).
- Proibido inventar "última vaga", "preço sobe amanhã" sem dado no payload.
- Prefira ancorar no objetivo do cliente ("seu objetivo é X em Y meses").`;

export const REPLY_HOOK_INSTRUCTION = `GANCHO DE RESPOSTA:
Toda mensagem direta ao cliente deve terminar com pergunta ou CTA específico.`;

export function composePromptFragments(...fragments: string[]): string {
  return fragments.filter(Boolean).join("\n\n");
}
