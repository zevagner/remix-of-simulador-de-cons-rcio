/**
 * Observability — Sentry init (opt-in via VITE_SENTRY_DSN).
 *
 * Enterprise Observability Pass:
 * - Não força nenhum upload se DSN não estiver setada (no-op em dev).
 * - Captura React errors via ErrorBoundary existente (chamamos captureException).
 * - tracesSampleRate baixo por padrão para não estourar quota.
 * - Sem PII: scrubs body/breadcrumbs/messages/traces via sanitizeLogPayload.
 */
import * as Sentry from '@sentry/react';
import { sanitizeLogPayload, sanitizeString } from '@/lib/logSanitizer';
import { isAnalyticsAllowed } from '@/lib/consent';

let initialized = false;

function scrubEvent(event: Sentry.Event): Sentry.Event {
  try {
    // Headers e cookies
    if (event.request) {
      const req = event.request as Record<string, unknown>;
      if (req.headers) {
        const h = req.headers as Record<string, unknown>;
        delete h.authorization;
        delete h.apikey;
        delete h.cookie;
        delete h['set-cookie'];
      }
      delete req.cookies;
      if (typeof req.data === 'string' || typeof req.data === 'object') {
        req.data = sanitizeLogPayload(req.data);
      }
      if (typeof req.query_string === 'string') {
        req.query_string = sanitizeString(req.query_string);
      }
      if (typeof req.url === 'string') {
        req.url = sanitizeString(req.url);
      }
    }

    // Mensagem principal
    if ('message' in event && typeof event.message === 'string') {
      event.message = sanitizeString(event.message);
    }

    // Exceptions / stack values
    const exception = (event as Sentry.ErrorEvent).exception;
    if (exception?.values) {
      for (const v of exception.values) {
        if (v.value) v.value = sanitizeString(v.value);
      }
    }

    // Breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((b) => ({
        ...b,
        message: b.message ? sanitizeString(b.message) : b.message,
        data: b.data ? sanitizeLogPayload(b.data) : b.data,
      }));
    }

    // Contexts e extra
    if (event.contexts) event.contexts = sanitizeLogPayload(event.contexts);
    if (event.extra) event.extra = sanitizeLogPayload(event.extra);
    if (event.tags) event.tags = sanitizeLogPayload(event.tags);

    // User: nunca enviar email/nome
    if (event.user) {
      event.user = { id: typeof event.user.id === 'string' ? event.user.id : undefined };
    }
  } catch {
    // jamais quebra envio por falha de scrub
  }
  return event;
}

export function initObservability() {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return; // opt-in: silencioso quando DSN não configurada

  // LGPD: captura de erros = interesse legítimo (necessário para operar o serviço).
  // Performance tracing/breadcrumbs detalhados = só com consent explícito.
  const analyticsGranted = isAnalyticsAllowed();
  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: analyticsGranted ? 0.05 : 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      sendDefaultPii: false,
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
      ],
      beforeSend(event) {
        return scrubEvent(event) as any;
      },
      beforeSendTransaction(event) {
        return scrubEvent(event) as any;
      },
      beforeBreadcrumb(crumb) {
        try {
          return {
            ...crumb,
            message: crumb.message ? sanitizeString(crumb.message) : crumb.message,
            data: crumb.data ? sanitizeLogPayload(crumb.data) : crumb.data,
          };
        } catch {
          return crumb;
        }
      },
    });
    initialized = true;
  } catch {
    // jamais derruba o app por falha de instrumentação
  }
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  try {
    if (!initialized) return;
    Sentry.captureException(
      err,
      context ? { extra: sanitizeLogPayload(context) } : undefined,
    );
  } catch {
    /* noop */
  }
}

export function setUserContext(userId: string | null, companyId?: string | null) {
  try {
    if (!initialized) return;
    if (!userId) {
      Sentry.setUser(null);
      return;
    }
    // Tokeniza: só envia últimos 6 chars do uuid (suficiente para correlação,
    // insuficiente para identificação reversa).
    const tokenized = `…${userId.slice(-6)}`;
    Sentry.setUser({ id: tokenized });
    if (companyId) Sentry.setTag('company_id', `…${companyId.slice(-6)}`);
  } catch {
    /* noop */
  }
}
