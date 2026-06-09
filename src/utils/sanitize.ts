/**
 * Shared input sanitization utility.
 */
export function sanitizeInput(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}
