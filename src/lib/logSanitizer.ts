/**
 * Global Log Sanitizer — Enterprise Observability Pass
 *
 * Camada única de sanitização de payloads para logs, traces, Sentry,
 * breadcrumbs, telemetry e qualquer outro sink de observabilidade.
 *
 * Objetivo: preservar debugging/rastreabilidade SEM expor PII.
 * Removes: e-mails, CPF, telefones, UUIDs (tokenizados), nomes em campos
 * conhecidos (clientName/nome), payloads de proposta inteiros, comparativos
 * identificáveis e headers sensíveis.
 *
 * Uso:
 *   import { sanitizeLogPayload } from '@/lib/logSanitizer';
 *   logger.info(sanitizeLogPayload(payload));
 */

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const PHONE_RE = /(\+?55\s*)?\(?\d{2}\)?\s*9?\d{4}-?\d{4}\b/g;
const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

const SENSITIVE_KEYS = new Set([
  'clientname',
  'client_name',
  'nome',
  'name',
  'email',
  'phone',
  'client_phone',
  'cpf',
  'cnpj',
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'apikey',
  'api_key',
  'cookie',
  'set-cookie',
  'proposal_content',
  'message',
  'admin_response',
  'public_summary',
  'notes',
  'next_action_notes',
  'body',
  'summary',
  'payload',
]);

const MAX_STRING_LEN = 500;
const MAX_DEPTH = 6;

function tokenize(prefix: string, value: string): string {
  const tail = value.slice(-4);
  return `[${prefix}:…${tail}]`;
}

export function sanitizeString(input: string): string {
  if (!input) return input;
  let out = input;
  out = out.replace(EMAIL_RE, '[EMAIL]');
  out = out.replace(CPF_RE, '[CPF]');
  out = out.replace(PHONE_RE, '[PHONE]');
  out = out.replace(UUID_RE, (m) => tokenize('id', m));
  if (out.length > MAX_STRING_LEN) {
    out = `${out.slice(0, MAX_STRING_LEN)}…[truncated:${out.length}]`;
  }
  return out;
}

export function sanitizeLogPayload<T = unknown>(value: T, depth = 0): T {
  if (value == null) return value;
  if (depth > MAX_DEPTH) return '[max-depth]' as unknown as T;

  if (typeof value === 'string') return sanitizeString(value) as unknown as T;
  if (typeof value === 'number' || typeof value === 'boolean') return value;

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => sanitizeLogPayload(v, depth + 1)) as unknown as T;
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const lower = k.toLowerCase();
      if (SENSITIVE_KEYS.has(lower)) {
        if (typeof v === 'string') {
          out[k] = `[REDACTED:${lower}]`;
        } else if (v == null) {
          out[k] = v;
        } else {
          out[k] = '[REDACTED]';
        }
        continue;
      }
      out[k] = sanitizeLogPayload(v, depth + 1);
    }
    return out as unknown as T;
  }

  return value;
}

/**
 * Helper para console wrappers — sanitiza todos os args.
 */
export function sanitizeArgs(args: unknown[]): unknown[] {
  return args.map((a) => sanitizeLogPayload(a));
}
