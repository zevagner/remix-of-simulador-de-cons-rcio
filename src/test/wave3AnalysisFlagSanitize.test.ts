import { describe, it, expect, beforeEach } from 'vitest';
import { runWave3Sanitize } from '@/utils/storage/wave3Sanitize';

describe('Wave 3 — Analysis Force-Flag Consolidation sanitize', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('removes the three legacy analysis flags on first run', () => {
    localStorage.setItem('analysis:lastTab', 'investment');
    sessionStorage.setItem('analysis:force-default', '1');
    sessionStorage.setItem('analysis:force-overview', '1');

    const report = runWave3Sanitize();

    expect(report.ran).toBe(true);
    expect(report.removedLocal).toContain('analysis:lastTab');
    expect(report.removedSession).toEqual(
      expect.arrayContaining(['analysis:force-default', 'analysis:force-overview']),
    );
    expect(localStorage.getItem('analysis:lastTab')).toBeNull();
    expect(sessionStorage.getItem('analysis:force-default')).toBeNull();
    expect(sessionStorage.getItem('analysis:force-overview')).toBeNull();
    expect(localStorage.getItem('wave3:sanitized:v2')).toBe('1');
  });

  it('does NOT touch the canonical navState keys', () => {
    localStorage.setItem('nav:lastModule', 'analysis');
    localStorage.setItem('nav:lastSubmodule', 'wealth');

    runWave3Sanitize();

    expect(localStorage.getItem('nav:lastModule')).toBe('analysis');
    expect(localStorage.getItem('nav:lastSubmodule')).toBe('wealth');
  });

  it('is idempotent — second run is a no-op', () => {
    runWave3Sanitize();
    localStorage.setItem('analysis:lastTab', 'reintroduced');

    const report = runWave3Sanitize();

    expect(report.ran).toBe(false);
    expect(report.removedLocal).toEqual([]);
    // Idempotent: not removed on subsequent runs (flag already set).
    expect(localStorage.getItem('analysis:lastTab')).toBe('reintroduced');
  });
});
