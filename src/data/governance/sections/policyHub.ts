import type { GovernanceSection } from '../types';

export const policyHub: GovernanceSection = {
  id: 'policy-hub',
  label: 'Policy Hub',
  subtitle: 'Centralizar políticas institucionais',
  group: 'policy',
  updatedAt: '2026-05-13',
  owner: 'Plataforma',
  criticality: 'high',
  status: 'active',
  maturity: 'mature',
  executiveSummary:
    'Centralização institucional das políticas vivas: runtime, bundle, segurança HTML, e regras de negócio canônicas. Cada política é documento versionado em docs/**.',
  impact:
    'Referência única para TI corporativa, compliance e novos engenheiros. Reduz drift de decisões técnicas entre módulos.',
  tags: ['políticas', 'governance', 'docs', 'institucional'],
  blocks: [
    {
      kind: 'paragraph',
      text:
        'O Policy Hub agrega as políticas institucionais ativas. Cada política vive em docs/** versionada com o código, é referenciada em ESLint/CI quando aplicável, e tem owner explícito.',
    },
    {
      kind: 'policy',
      policyPath: 'docs/security/html-injection-policy.md',
      policyDescription: 'HTML Injection Security Policy',
    },
    {
      kind: 'policy',
      policyPath: 'docs/performance/bundle-policy.md',
      policyDescription: 'Bundle & Performance Policy',
    },
    {
      kind: 'policy',
      policyPath: 'docs/performance/runtime-policy.md',
      policyDescription: 'Runtime Performance & Virtualization Policy',
    },
    {
      kind: 'kv',
      title: 'Regras canônicas (código)',
      pairs: [
        { label: 'Regras de negócio', value: 'src/utils/businessRules.ts → consortiumRates.ts' },
        { label: 'Engine financeira', value: 'src/core/finance — fonte única' },
        { label: 'Renderer seguro', value: 'src/utils/security → SafeNarrative' },
        { label: 'Pipeline runtime', value: 'src/lib/runtimeMetrics' },
        { label: 'PDF data façade', value: 'src/contexts/proposal → useProposalData()' },
      ],
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Roadmap',
      text:
        'Próximas políticas: tenant isolation policy, AI prompt governance policy, observability SLA policy.',
    },
  ],
};
