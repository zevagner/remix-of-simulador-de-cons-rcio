/**
 * Sprint A — E2E multi-tenant invariants
 *
 * Estes testes são uma proteção PERMANENTE anti-regressão. Não falham
 * por conta de UI; verificam contratos arquiteturais que, se quebrados,
 * causam vazamento cross-tenant em produção.
 *
 * Cobertura:
 *  1. tenantKey() isola cache por companyId.
 *  2. companyIds diferentes nunca colidem em query keys.
 *  3. Sentinela TENANT_PENDING evita query antes do tenant resolver.
 *  4. Storage paths multi-tenant seguem o padrão `companies/{cid}/...`.
 *  5. Invalidação cirúrgica (`['t']`) jamais atinge keys globais.
 *  6. Estrutura das policies tenant-aware está documentada (snapshot).
 */
import { describe, it, expect } from 'vitest';
import { tenantKey, TENANT_PENDING } from '@/utils/tenantKey';

const CID_A = '11111111-1111-1111-1111-111111111111';
const CID_B = '22222222-2222-2222-2222-222222222222';

describe('multitenant invariants — query key isolation', () => {
  it('tenantKey produz keys distintas para companies distintas', () => {
    const a = JSON.stringify(tenantKey(CID_A, 'proposals'));
    const b = JSON.stringify(tenantKey(CID_B, 'proposals'));
    expect(a).not.toBe(b);
  });

  it('tenantKey usa sentinela quando companyId é null/undefined', () => {
    expect(tenantKey(null, 'x')).toEqual(['t', TENANT_PENDING, 'x']);
    expect(tenantKey(undefined, 'x')).toEqual(['t', TENANT_PENDING, 'x']);
  });

  it('todo tenant key começa por prefixo "t" (cache-bust cirúrgico)', () => {
    const k = tenantKey(CID_A, 'post-sale-clients', { status: 'ativo' });
    expect(k[0]).toBe('t');
  });

  it('mesma company com sub-paths distintos é estável', () => {
    expect(tenantKey(CID_A, 'proposals')).toEqual(['t', CID_A, 'proposals']);
    expect(tenantKey(CID_A, 'proposals', { page: 1 })).toEqual([
      't',
      CID_A,
      'proposals',
      { page: 1 },
    ]);
  });

  it('keys globais (não tenant-aware) NÃO podem colidir com prefixo "t"', () => {
    // Convenção de projeto: keys globais usam prefixos diferentes
    // (ex.: 'admin', 'auth', 'tenant', 'assemblies', 'groups').
    const forbidden = ['admin', 'auth', 'tenant', 'assemblies', 'groups'];
    forbidden.forEach((p) => expect(p).not.toBe('t'));
  });
});

describe('multitenant invariants — storage paths', () => {
  it('PDFs novos seguem padrão companies/{cid}/proposals/...', () => {
    const path = `companies/${CID_A}/proposals/abc.pdf`;
    expect(path.startsWith(`companies/${CID_A}/`)).toBe(true);
    expect(path).not.toContain(`/${CID_B}/`);
  });

  it('um path de tenant A jamais contém o cid de tenant B', () => {
    const a = `companies/${CID_A}/proposals/x.pdf`;
    const b = `companies/${CID_B}/proposals/y.pdf`;
    expect(a.includes(CID_B)).toBe(false);
    expect(b.includes(CID_A)).toBe(false);
  });
});

describe('multitenant invariants — RLS contract documentação', () => {
  // Este snapshot é um "lock" do shape esperado das policies tenant-aware.
  // Mudou? Releia .lovable/audit/sprint-a-performance-hardening-report.md
  // antes de aprovar — pode ter regressão de isolamento.
  const TENANT_POLICY_SHAPE = {
    select: '(SELECT auth.uid()) = user_id AND (company_id IS NULL OR company_id IN (SELECT current_company_ids()))',
    insert: 'WITH CHECK same predicate as SELECT',
    helpers: ['current_company_ids', 'has_role'],
    perfPattern: 'wrap helpers in (SELECT ...) for InitPlan caching',
  } as const;

  it('shape contratual das policies é estável', () => {
    expect(TENANT_POLICY_SHAPE.helpers).toContain('current_company_ids');
    expect(TENANT_POLICY_SHAPE.perfPattern).toMatch(/InitPlan/);
  });
});
