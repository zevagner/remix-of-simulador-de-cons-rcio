/**
 * Fase 5 — Testes de invariância de navegação.
 *
 * Garante o contrato do `navState` pós Fases 1-4:
 *  - IDs canônicos resolvem para si mesmos sem fallback.
 *  - Aliases legados (`strategies`, `compare`) resolvem para canônico + emitem telemetria.
 *  - IDs inválidos NÃO mascarados como Cockpit (module: null).
 *  - Persistência de storage migra valores legados one-shot.
 *  - URL `?m=`, `?module=`, `?tab=` são lidos; legados emitem telemetria.
 *  - `writeUrlNavTarget` é idempotente e limpa params legados.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock antes do import do navState para capturar trackEvent.
const trackEventMock = vi.fn();
vi.mock('@/services/analyticsTracker', () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));
vi.mock('@/utils/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  isValidModuleId,
  resolveTarget,
  persistNavState,
  readLastNavState,
  clearNavSession,
  readUrlNavTarget,
  writeUrlNavTarget,
} from '@/utils/navState';

function setUrl(search: string) {
  window.history.replaceState({}, '', `/app${search}`);
}

beforeEach(() => {
  trackEventMock.mockClear();
  localStorage.clear();
  setUrl('');
});

describe('isValidModuleId', () => {
  it('aceita módulos top-level canônicos', () => {
    expect(isValidModuleId('simulator')).toBe(true);
    expect(isValidModuleId('proposal')).toBe(true);
    expect(isValidModuleId('analysis')).toBe(true);
  });

  it('aceita submódulos da Análise', () => {
    expect(isValidModuleId('wealth')).toBe(true);
    expect(isValidModuleId('comparator')).toBe(true);
    expect(isValidModuleId('bids')).toBe(true);
  });

  it('rejeita IDs vazios ou desconhecidos', () => {
    expect(isValidModuleId('')).toBe(false);
    expect(isValidModuleId('xyz')).toBe(false);
    // 'strategies' não é ID válido (só alias) — validação é estrita.
    expect(isValidModuleId('strategies')).toBe(false);
  });
});

describe('resolveTarget', () => {
  it('canônico resolve para si mesmo sem fallback nem telemetria de legado', () => {
    const r = resolveTarget('wealth');
    expect(r).toEqual({ module: 'wealth', submodule: 'wealth', fallbackUsed: false });
    expect(trackEventMock).not.toHaveBeenCalledWith('navigation_legacy_id', expect.anything());
  });

  it('alias legado "strategies" resolve para wealth + emite navigation_legacy_id', () => {
    const r = resolveTarget('strategies');
    expect(r.module).toBe('wealth');
    expect(r.fallbackUsed).toBe(false);
    expect(trackEventMock).toHaveBeenCalledWith(
      'navigation_legacy_id',
      expect.objectContaining({ attempted: 'strategies', resolved: 'wealth' }),
    );
  });

  it('alias legado "compare" resolve para comparator', () => {
    const r = resolveTarget('compare');
    expect(r.module).toBe('comparator');
    expect(r.fallbackUsed).toBe(false);
  });

  it('ID inválido retorna module=null + fallbackUsed (não vai para Cockpit)', () => {
    const r = resolveTarget('xyz');
    expect(r).toEqual({ module: null, submodule: null, fallbackUsed: true });
    expect(trackEventMock).toHaveBeenCalledWith(
      'navigation_invalid_target',
      expect.objectContaining({ attempted: 'xyz' }),
    );
  });

  it('Análise (sem submódulo default) resolve para analysis + submodule=null', () => {
    const r = resolveTarget('analysis');
    expect(r.module).toBe('analysis');
    expect(r.submodule).toBeNull();
    expect(r.fallbackUsed).toBe(false);
  });

  it('alias legado "analysis-overview" resolve para analysis sem submódulo', () => {
    const r = resolveTarget('analysis-overview');
    expect(r.module).toBe('analysis');
    expect(r.submodule).toBeNull();
    expect(r.fallbackUsed).toBe(false);
  });

});

describe('persistência (localStorage)', () => {
  it('persistNavState + readLastNavState round-trip canônico', () => {
    persistNavState('wealth', 'wealth');
    const r = readLastNavState();
    expect(r).toEqual({ module: 'wealth', submodule: 'wealth' });
  });

  it('migra one-shot valor legado "strategies" → "wealth" e regrava', () => {
    localStorage.setItem('nav:lastModule', 'strategies');
    localStorage.setItem('nav:lastSubmodule', '');
    const r = readLastNavState();
    expect(r?.module).toBe('wealth');
    expect(localStorage.getItem('nav:lastModule')).toBe('wealth');
    expect(trackEventMock).toHaveBeenCalledWith(
      'navigation_legacy_id',
      expect.objectContaining({ source: 'storage_migration' }),
    );
  });

  it('limpa storage corrompido (não cai em Cockpit)', () => {
    localStorage.setItem('nav:lastModule', 'qwerty-invalid');
    const r = readLastNavState();
    expect(r).toBeNull();
    expect(localStorage.getItem('nav:lastModule')).toBeNull();
  });

  it('clearNavSession remove ambas as chaves', () => {
    persistNavState('simulator', null);
    clearNavSession();
    expect(localStorage.getItem('nav:lastModule')).toBeNull();
    expect(localStorage.getItem('nav:lastSubmodule')).toBeNull();
  });
});

describe('URL sync', () => {
  it('readUrlNavTarget lê ?m= canônico', () => {
    setUrl('?m=wealth');
    expect(readUrlNavTarget()).toBe('wealth');
  });

  it('readUrlNavTarget aceita alias ?m=strategies e emite telemetria', () => {
    setUrl('?m=strategies');
    expect(readUrlNavTarget()).toBe('wealth');
    expect(trackEventMock).toHaveBeenCalledWith(
      'navigation_legacy_id',
      expect.objectContaining({ source: 'url_alias' }),
    );
  });

  it('readUrlNavTarget aceita param legado ?module=', () => {
    setUrl('?module=wealth');
    expect(readUrlNavTarget()).toBe('wealth');
    expect(trackEventMock).toHaveBeenCalledWith(
      'navigation_legacy_id',
      expect.objectContaining({ source: 'url_param:module' }),
    );
  });

  it('readUrlNavTarget aceita param legado ?tab= como fallback', () => {
    setUrl('?tab=comparator');
    expect(readUrlNavTarget()).toBe('comparator');
  });

  it('readUrlNavTarget retorna null para ID inválido', () => {
    setUrl('?m=xyz');
    expect(readUrlNavTarget()).toBeNull();
  });

  it('writeUrlNavTarget canoniza e remove params legados', () => {
    setUrl('?module=strategies&tab=foo&other=keep');
    writeUrlNavTarget('wealth');
    const params = new URLSearchParams(window.location.search);
    expect(params.get('m')).toBe('wealth');
    expect(params.has('module')).toBe(false);
    expect(params.has('tab')).toBe(false);
    expect(params.get('other')).toBe('keep');
  });

  it('writeUrlNavTarget é idempotente quando nada muda', () => {
    setUrl('?m=wealth');
    const before = window.location.search;
    writeUrlNavTarget('wealth');
    expect(window.location.search).toBe(before);
  });
});
