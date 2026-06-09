import type { GovernanceSection } from '../types';

export const ciQuality: GovernanceSection = {
  id: 'ci-quality',
  label: 'CI & Quality Gates',
  subtitle: 'Bloquear regressão antes do deploy',
  group: 'policy',
  updatedAt: '2026-05-13',
  owner: 'Plataforma',
  criticality: 'high',
  status: 'enforced',
  maturity: 'mature',
  executiveSummary:
    'Gates ativos: ESLint anti-XSS (error), CI grep gate anti-XSS, regras de import legado financeiro (warn → error em Onda 5), golden snapshots financeiros, testes de invariantes de IA.',
  impact:
    'Reintrodução de XSS, drift financeiro ou imports legados é bloqueada antes do merge. Pipeline IA validada por contratos client-mirror.',
  risk:
    'Falta gate de bundle size e gate de Web Vitals. Próxima onda: orçamentos automáticos via Lighthouse CI.',
  tags: ['ci', 'eslint', 'gates', 'qualidade', 'governance'],
  blocks: [
    {
      kind: 'kv',
      title: 'Gates ativos',
      pairs: [
        { label: 'Anti-XSS lint', value: 'no-restricted-syntax: error (7 padrões)' },
        { label: 'Anti-XSS CI', value: 'scripts/ci/anti-xss-gate.mjs (grep + allowlist)' },
        { label: 'Imports financeiros legados', value: 'ESLint warn (Onda 0) → error (Onda 5)' },
        { label: 'Golden snapshot financeiro', value: 'src/test/* — SimulationResult byte-a-byte' },
        { label: 'Invariantes IA', value: 'aiInvariants.test.ts — promptFragments + validators' },
        { label: 'Anti-XSS vetores', value: 'antiXssGovernance.test.tsx — 14 vetores' },
      ],
    },
    {
      kind: 'callout',
      tone: 'positive',
      title: 'Princípio',
      text:
        'Toda regressão estruturalmente perigosa (XSS, drift matemático, import legado) é bloqueada no menor nível possível: lint > teste > CI > review.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Pendências de CI',
      text:
        'Adicionar: bundle size budget por chunk, Web Vitals budget (LCP/INP) via Lighthouse CI, regression detection em build-time.',
    },
  ],
};
