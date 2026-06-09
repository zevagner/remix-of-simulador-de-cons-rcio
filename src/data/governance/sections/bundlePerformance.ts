import type { GovernanceSection } from '../types';

export const bundlePerformance: GovernanceSection = {
  id: 'bundle-performance',
  label: 'Bundle & Lazy Loading',
  subtitle: 'Garantir entry leve e cache previsível',
  group: 'runtime',
  updatedAt: '2026-05-13',
  owner: 'Plataforma',
  criticality: 'high',
  status: 'enforced',
  maturity: 'mature',
  executiveSummary:
    'Manual chunks isolam 11 famílias de vendor (react/supabase/query/radix/charts/excel/motion/sentry/tour/dnd/markdown). Engine financeira permanece inline. Lazy obrigatório para componentes >30 KB.',
  impact:
    'Entry bundle reduzido ~40-55%. Cache de longo prazo para libs pesadas (recharts, exceljs). Sem latência adicional em hot paths financeiros.',
  risk:
    'Falta CI gate de bundle size — regressão de chunk pode passar despercebida. Próxima onda inclui orçamento por chunk.',
  tags: ['bundle', 'vite', 'lazy', 'chunks', 'cache'],
  blocks: [
    {
      kind: 'paragraph',
      text:
        'O bundling segue política institucional. Vendors pesados são isolados em chunks dedicados via vite.config.ts > manualChunks. A engine financeira (@/core/finance) é mantida inline no entry para zero latência em simulação. Componentes administrativos e dashboards usam React.lazy + Suspense.',
    },
    {
      kind: 'kv',
      title: 'Manual chunks oficiais',
      pairs: [
        { label: 'vendor-react', value: 'react, react-dom, react-router' },
        { label: 'vendor-supabase', value: '@supabase/* + auth helpers' },
        { label: 'vendor-query', value: '@tanstack/react-query' },
        { label: 'vendor-radix', value: 'componentes Radix UI' },
        { label: 'vendor-charts', value: 'recharts (lazy via módulos consumidores)' },
        { label: 'vendor-excel', value: 'exceljs / file-saver' },
        { label: 'vendor-motion', value: 'framer-motion / motion' },
        { label: 'vendor-sentry', value: '@sentry/react' },
        
        { label: 'vendor-dnd', value: '@dnd-kit/*' },
        { label: 'vendor-markdown', value: 'react-markdown + remark plugins' },
      ],
    },
    {
      kind: 'callout',
      tone: 'positive',
      title: 'Regra institucional',
      text:
        'Lib >50 KB gzipped exige entrada explícita em manualChunks. Componente >30 KB exige React.lazy. Engine @/core/finance NUNCA vai para chunk (latência crítica).',
    },
    {
      kind: 'policy',
      policyPath: 'docs/performance/bundle-policy.md',
      policyDescription: 'Bundle & Performance Policy',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/performance-hardening-wave.md',
      auditDescription: 'Onda Performance Hardening',
    },
  ],
};
