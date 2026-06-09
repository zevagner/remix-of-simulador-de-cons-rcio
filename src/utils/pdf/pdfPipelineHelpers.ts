/**
 * Pure helpers for the PDF pipeline — extracted from pdfGenerator.tsx
 * to enable unit testing without spinning up React/DOM.
 *
 * Sprint B.2 — PDF hardening.
 *
 * Rules:
 *  - No imports from React, supabase client, or browser APIs.
 *  - All helpers must be deterministic and pure.
 *  - Path builders are the canonical source for both write and dual-read.
 */

export const PDF_BUCKET = 'proposal-pdfs' as const;

/**
 * Tenant-aware storage path. Used since M3-C as the canonical write path
 * when the user has a `company_id`.
 */
export function buildTenantPath(companyId: string, proposalId: string): string {
  if (!companyId) throw new Error('buildTenantPath: companyId required');
  if (!proposalId) throw new Error('buildTenantPath: proposalId required');
  return `companies/${companyId}/proposals/${proposalId}/proposta.pdf`;
}

/**
 * Legacy path — kept ONLY for dual-read on existing PDFs that were uploaded
 * before M3-C. New writes always use buildTenantPath when companyId exists.
 */
export function buildLegacyPath(userId: string, proposalId: string): string {
  if (!userId) throw new Error('buildLegacyPath: userId required');
  if (!proposalId) throw new Error('buildLegacyPath: proposalId required');
  return `${userId}/${proposalId}.pdf`;
}

/**
 * Resolves the canonical write path. Tenant-aware when companyId is present,
 * legacy fallback otherwise. Single source of truth.
 */
export function resolveWritePath(opts: {
  userId: string;
  proposalId: string;
  companyId: string | null;
}): string {
  return opts.companyId
    ? buildTenantPath(opts.companyId, opts.proposalId)
    : buildLegacyPath(opts.userId, opts.proposalId);
}

/**
 * Returns the candidate paths to try, in order, when reading a cached PDF.
 * Always: registered storage_path → tenant path (if companyId) → legacy path.
 * De-duplicates so the same path is never tried twice.
 */
export function dualReadCandidates(opts: {
  registeredPath: string | null;
  userId: string;
  proposalId: string;
  companyId: string | null;
}): string[] {
  const list: string[] = [];
  if (opts.registeredPath) list.push(opts.registeredPath);
  if (opts.companyId) list.push(buildTenantPath(opts.companyId, opts.proposalId));
  if (opts.userId) list.push(buildLegacyPath(opts.userId, opts.proposalId));
  return Array.from(new Set(list));
}

/**
 * Sanitizes a filename for the Content-Disposition header — same logic as
 * the edge function applies, kept here as a defense-in-depth + for testing.
 */
export function sanitizePdfFilename(raw: string | null | undefined): string {
  const fallback = 'documento.pdf';
  if (!raw || typeof raw !== 'string') return fallback;
  const cleaned = raw.replace(/[^\w.\-]/g, '_').slice(0, 200);
  return cleaned.length > 0 ? cleaned : fallback;
}

/**
 * Maps an HTTP error from the generate-pdf edge function to a user-facing
 * message. Centralized so toast/sentry/logger receive consistent strings.
 */
export function classifyPdfError(opts: { status: number; body?: string }): {
  kind: 'rate_limit' | 'unauthorized' | 'too_large' | 'upstream' | 'unknown';
  message: string;
} {
  switch (opts.status) {
    case 401:
      return { kind: 'unauthorized', message: 'Sessão expirada. Faça login novamente.' };
    case 413:
      return { kind: 'too_large', message: 'Documento maior que o limite (8MB). Reduza os blocos selecionados.' };
    case 429:
      return {
        kind: 'rate_limit',
        message: 'Você atingiu o limite de geração de PDFs. Tente novamente em alguns minutos.',
      };
    case 502:
    case 503:
    case 504:
      return { kind: 'upstream', message: 'Serviço de geração temporariamente indisponível. Tente novamente.' };
    default:
      return {
        kind: 'unknown',
        message: `Falha ao gerar PDF (${opts.status}): ${(opts.body ?? '').slice(0, 200)}`,
      };
  }
}

/**
 * In-memory mutex per proposalId — prevents the same proposal from triggering
 * two concurrent generations (rate-limit waste + cache thrash + double-toast).
 *
 * Returns the in-flight promise if one exists; otherwise registers and runs.
 * Cleans up on settle. Use ONLY for client-side debounce — does not span tabs.
 */
const inflight = new Map<string, Promise<unknown>>();

export function withProposalMutex<T>(
  key: string,
  task: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = task().finally(() => {
    if (inflight.get(key) === p) inflight.delete(key);
  });
  inflight.set(key, p);
  return p;
}

/** Test helper — clears the mutex registry. */
export function __resetProposalMutex(): void {
  inflight.clear();
}
