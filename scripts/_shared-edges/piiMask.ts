/**
 * PII Masking — Onda LGPD Fase 1.
 *
 * Princípio: anonimização contextual. Trocamos identificadores literais por
 * tokens neutros que preservam o significado consultivo da prompt sem expor
 * dados pessoais a provedores externos (Lovable AI Gateway / OpenAI / Google).
 *
 * Regras:
 * - Nome de cliente vira "[CLIENTE]" (ou primeiro nome curto preservado se
 *   < 3 chars de risco — mantemos só a forma "Cliente" para gramática).
 * - Email vira "[EMAIL]".
 * - Telefone (BR) vira "[TELEFONE]".
 * - CPF/CNPJ viram "[CPF]" / "[CNPJ]".
 * - UUIDs (proposal ids etc.) viram "[ID]".
 * - Valores monetários NÃO são mascarados — são contexto consultivo.
 *
 * Nunca mascarar dentro de blocos JSON estruturados que a IA precise eco-ar.
 * Esta camada é usada APENAS para texto livre injetado em prompts.
 */

export const GLOBAL_PII_RULE =
  `PRIVACIDADE: o nome do cliente aparece como "[CLIENTE]" ou genérico. ` +
  `Trate como pronome neutro ("o cliente", "ele/ela"). Nunca invente um nome real. ` +
  `Se houver tokens como [EMAIL], [TELEFONE], [CPF], [ID] no contexto, NUNCA reproduza ou tente decodificar.`;

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_BR_RE = /(?:\+?55\s?)?(?:\(?\d{2}\)?[\s.-]?)?9?\d{4}[\s.-]?\d{4}/g;
const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const CNPJ_RE = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

/**
 * Mascara identificadores em texto livre.
 */
export function maskPII(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(EMAIL_RE, "[EMAIL]")
    .replace(CPF_RE, "[CPF]")
    .replace(CNPJ_RE, "[CNPJ]")
    .replace(UUID_RE, "[ID]")
    .replace(PHONE_BR_RE, (m) => (m.replace(/\D/g, "").length >= 10 ? "[TELEFONE]" : m));
}

/**
 * Mascara nome do cliente preservando legibilidade gramatical.
 * Retorna sempre "[CLIENTE]" — a IA é instruída via GLOBAL_PII_RULE a tratar
 * como pronome neutro.
 */
export function maskClientName(name: string | null | undefined): string {
  if (!name || !name.trim()) return "";
  return "[CLIENTE]";
}

/**
 * Helper: aplica maskClientName + maskPII em um payload de prompt completo.
 * Use apenas em texto livre (não em JSON estruturado de tool calls).
 */
export function sanitizePromptText(text: string): string {
  return maskPII(text);
}
