/**
 * Centralised logger utility.
 *
 * In production builds (`import.meta.env.PROD`) only `warn` and `error` are
 * emitted; `debug` and `info` are silenced to keep the console clean and avoid
 * leaking potentially sensitive diagnostics.
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.info('[module]', 'message', data);
 *   logger.error('[module]', 'something failed', error);
 */

const isProd = typeof import.meta !== 'undefined' && import.meta.env?.PROD;

function noop(..._args: unknown[]) {}

export const logger = {
  /** Verbose / trace-level – silenced in production */
  debug: isProd ? noop : console.debug.bind(console),
  /** Informational – silenced in production */
  info: isProd ? noop : console.info.bind(console),
  /** General log – silenced in production */
  log: isProd ? noop : console.log.bind(console),
  /** Warnings – always emitted */
  warn: console.warn.bind(console),
  /** Errors – always emitted */
  error: console.error.bind(console),
};
