/**
 * Sprint B.2 — PDF pipeline helpers tests.
 * Pure unit tests for path builders, dual-read, error classification, mutex.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildTenantPath,
  buildLegacyPath,
  resolveWritePath,
  dualReadCandidates,
  sanitizePdfFilename,
  classifyPdfError,
  withProposalMutex,
  __resetProposalMutex,
  PDF_BUCKET,
} from '@/utils/pdf/pdfPipelineHelpers';

describe('PDF pipeline helpers — path builders', () => {
  it('PDF_BUCKET is the canonical bucket name', () => {
    expect(PDF_BUCKET).toBe('proposal-pdfs');
  });

  it('buildTenantPath produces companies/{cid}/proposals/{pid}/proposta.pdf', () => {
    expect(buildTenantPath('cid-1', 'pid-1')).toBe('companies/cid-1/proposals/pid-1/proposta.pdf');
  });

  it('buildLegacyPath produces {userId}/{proposalId}.pdf', () => {
    expect(buildLegacyPath('uid-1', 'pid-1')).toBe('uid-1/pid-1.pdf');
  });

  it('rejects empty inputs (defense-in-depth)', () => {
    expect(() => buildTenantPath('', 'pid')).toThrow();
    expect(() => buildLegacyPath('uid', '')).toThrow();
  });

  it('resolveWritePath uses tenant when companyId present', () => {
    expect(resolveWritePath({ userId: 'u', proposalId: 'p', companyId: 'c' }))
      .toBe('companies/c/proposals/p/proposta.pdf');
  });

  it('resolveWritePath falls back to legacy when companyId is null', () => {
    expect(resolveWritePath({ userId: 'u', proposalId: 'p', companyId: null }))
      .toBe('u/p.pdf');
  });
});

describe('PDF pipeline helpers — dual-read', () => {
  it('returns registered + tenant + legacy in order', () => {
    const out = dualReadCandidates({
      registeredPath: 'some/registered/path.pdf',
      userId: 'u', proposalId: 'p', companyId: 'c',
    });
    expect(out).toEqual([
      'some/registered/path.pdf',
      'companies/c/proposals/p/proposta.pdf',
      'u/p.pdf',
    ]);
  });

  it('de-duplicates when registered equals tenant path', () => {
    const out = dualReadCandidates({
      registeredPath: 'companies/c/proposals/p/proposta.pdf',
      userId: 'u', proposalId: 'p', companyId: 'c',
    });
    expect(out).toEqual(['companies/c/proposals/p/proposta.pdf', 'u/p.pdf']);
  });

  it('omits tenant path when companyId is null', () => {
    const out = dualReadCandidates({
      registeredPath: null, userId: 'u', proposalId: 'p', companyId: null,
    });
    expect(out).toEqual(['u/p.pdf']);
  });

  it('returns empty list when no signals available', () => {
    const out = dualReadCandidates({
      registeredPath: null, userId: '', proposalId: 'p', companyId: null,
    });
    expect(out).toEqual([]);
  });
});

describe('PDF pipeline helpers — sanitizePdfFilename', () => {
  it('replaces unsafe chars with underscore', () => {
    expect(sanitizePdfFilename('foo bar*?.pdf')).toBe('foo_bar__.pdf');
  });
  it('falls back to documento.pdf when input is empty/invalid', () => {
    expect(sanitizePdfFilename('')).toBe('documento.pdf');
    expect(sanitizePdfFilename(null)).toBe('documento.pdf');
    expect(sanitizePdfFilename(undefined)).toBe('documento.pdf');
  });
  it('truncates very long filenames defensively', () => {
    const long = 'a'.repeat(500) + '.pdf';
    expect(sanitizePdfFilename(long).length).toBeLessThanOrEqual(200);
  });
});

describe('PDF pipeline helpers — classifyPdfError', () => {
  it('429 → rate_limit', () => {
    const r = classifyPdfError({ status: 429 });
    expect(r.kind).toBe('rate_limit');
    expect(r.message).toMatch(/limite/i);
  });
  it('401 → unauthorized', () => {
    expect(classifyPdfError({ status: 401 }).kind).toBe('unauthorized');
  });
  it('413 → too_large', () => {
    expect(classifyPdfError({ status: 413 }).kind).toBe('too_large');
  });
  it('502/503/504 → upstream', () => {
    expect(classifyPdfError({ status: 502 }).kind).toBe('upstream');
    expect(classifyPdfError({ status: 503 }).kind).toBe('upstream');
    expect(classifyPdfError({ status: 504 }).kind).toBe('upstream');
  });
  it('unknown status preserves body snippet', () => {
    const r = classifyPdfError({ status: 418, body: 'teapot details' });
    expect(r.kind).toBe('unknown');
    expect(r.message).toContain('teapot details');
  });
});

describe('PDF pipeline helpers — withProposalMutex (anti double-submit)', () => {
  beforeEach(() => __resetProposalMutex());

  it('runs task and returns its value', async () => {
    const out = await withProposalMutex('k1', async () => 42);
    expect(out).toBe(42);
  });

  it('coalesces concurrent calls with same key into a single inflight promise', async () => {
    let runs = 0;
    let resolveTask: ((v: string) => void) | undefined;
    const task = () => new Promise<string>((res) => {
      runs += 1;
      resolveTask = res;
    });
    const p1 = withProposalMutex('same-key', task);
    const p2 = withProposalMutex('same-key', task);
    expect(runs).toBe(1); // second call did NOT trigger task
    resolveTask!('done');
    expect(await p1).toBe('done');
    expect(await p2).toBe('done');
  });

  it('different keys run in parallel', async () => {
    let runs = 0;
    const task = async () => { runs += 1; return runs; };
    await Promise.all([
      withProposalMutex('a', task),
      withProposalMutex('b', task),
    ]);
    expect(runs).toBe(2);
  });

  it('cleans up on settle so subsequent calls re-run', async () => {
    let runs = 0;
    const task = async () => { runs += 1; return runs; };
    await withProposalMutex('k', task);
    await withProposalMutex('k', task);
    expect(runs).toBe(2);
  });

  it('cleans up on error too', async () => {
    let runs = 0;
    const failingTask = async () => { runs += 1; throw new Error('boom'); };
    await expect(withProposalMutex('k', failingTask)).rejects.toThrow('boom');
    await expect(withProposalMutex('k', failingTask)).rejects.toThrow('boom');
    expect(runs).toBe(2);
  });
});
