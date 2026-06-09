/**
 * Business Rules Enricher
 *
 * Função única de pós-processamento que aplica regras de negócio a QUALQUER
 * mensagem comercial gerada (templates WhatsApp, smart messages, sales copy,
 * sales pitch, IA, etc).
 *
 * Princípios:
 * - NÃO altera a estrutura ou conteúdo principal da mensagem.
 * - Apenas ENRIQUECE a mensagem ao final com informações faltantes.
 * - É idempotente: se a regra já está mencionada, não duplica.
 *
 * Como adicionar uma nova regra:
 * 1. Adicione um campo no BusinessRulesContext.
 * 2. Crie uma função `appendXxxRule(text, ctx)` que retorne o texto enriquecido.
 * 3. Chame-a dentro de `applyBusinessRules`.
 */

export interface BusinessRulesContext {
  /** Estratégia de parcela reduzida ativa no simulador */
  reducedInstallment?: boolean;
  /** Formato de saída (define o estilo das linhas adicionadas) */
  format?: 'whatsapp' | 'plain' | 'formal' | 'markdown';
}

// ─── Detectores de menção (idempotência) ───

/**
 * Detecta se o texto já menciona a estratégia de parcela reduzida.
 * Usa regex case-insensitive cobrindo as variações usadas pelos templates atuais.
 */
function alreadyMentionsReducedInstallment(text: string): boolean {
  return /parcela[s]?\s+(reduzida|menor[es]?)|começamos com parcelas menores|primeiras parcelas (são|s\u00e3o) menores|estrat[eé]gia de parcela reduzida/i.test(text);
}

// ─── Construtores de linhas por formato ───

function buildReducedInstallmentLine(format: BusinessRulesContext['format']): string {
  switch (format) {
    case 'formal':
      return '\n\nEstratégia de parcela reduzida: valor inicial inferior com reajuste programado ao longo do plano.';
    case 'plain':
      return '\n\n💡 Parcela reduzida: começamos com parcelas menores no início, facilitando a entrada, e depois ajustamos ao longo do plano.';
    case 'markdown':
      return '\n\n💡 **Parcela reduzida:** começamos com parcelas menores no início, facilitando a entrada, e depois ajustamos ao longo do plano.';
    case 'whatsapp':
    default:
      return '\n\n💡 *Parcela reduzida:* começamos com parcelas menores no início, facilitando a entrada, e depois ajustamos ao longo do plano.';
  }
}

// ─── Aplicadores individuais ───

function appendReducedInstallmentRule(text: string, ctx: BusinessRulesContext): string {
  if (!ctx.reducedInstallment) return text;
  if (alreadyMentionsReducedInstallment(text)) return text;
  return text + buildReducedInstallmentLine(ctx.format);
}

// ─── Função pública única ───

/**
 * Enriquece uma mensagem comercial com as regras de negócio ativas no contexto.
 * Aplique este wrapper em TODOS os pontos de geração de mensagem para garantir
 * consistência sem perder a flexibilidade dos múltiplos templates.
 */
export function applyBusinessRules(message: string, ctx: BusinessRulesContext): string {
  if (!message) return message;
  let result = message;
  result = appendReducedInstallmentRule(result, ctx);
  return result;
}
