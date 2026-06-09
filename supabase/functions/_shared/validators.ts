/**
 * Shared input sanitizer for edge functions that forward
 * free-text user fields to LLM prompts.
 *
 * Security M1 (Audit 7): prevents trivial prompt-injection vectors
 * by truncating, redacting common jailbreak patterns and escaping
 * role-delimiter tokens used by chat templates.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|above|all|prior|earlier)\s+(instructions?|prompts?|rules?)/gi,
  /disregard\s+(previous|above|all|prior)\s+(instructions?|prompts?|rules?)/gi,
  /system\s*:/gi,
  /<\|.*?\|>/g,
  /\[\s*INST\s*\]/gi,
  /\[\s*\/\s*INST\s*\]/gi,
  /<<\s*SYS\s*>>/gi,
  /<<\s*\/\s*SYS\s*>>/gi,
];

export function sanitizeUserField(value: unknown, maxLength = 2000): string {
  if (typeof value !== "string") return "";

  let sanitized = value.trim().slice(0, maxLength);

  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[removido]");
  }

  // Escape role/code delimiters that could break out of the user turn.
  sanitized = sanitized
    .replace(/```/g, "'''")
    .replace(/---/g, "—");

  return sanitized;
}
