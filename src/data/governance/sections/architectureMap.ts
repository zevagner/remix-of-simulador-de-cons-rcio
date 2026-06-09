import type { GovernanceSection } from '../types';

export const architectureMap: GovernanceSection = {
  id: 'architecture-map',
  label: 'Architecture Map',
  subtitle: 'Mapear engines, runtime e CI',
  group: 'foundations',
  updatedAt: '2026-05-13',
  owner: 'Plataforma',
  criticality: 'high',
  status: 'active',
  maturity: 'mature',
  executiveSummary:
    'Mapa funcional dos pilares estruturais: engine financeira canônica, pipeline runtime, observabilidade, IA, PDF e CI.',
  impact:
    'Visão arquitetural única para TI corporativa, compliance e onboarding de engenheiros.',
  tags: ['arquitetura', 'mapa', 'pipeline', 'engines'],
  blocks: [
    {
      kind: 'kv',
      title: 'Pipelines estruturais',
      pairs: [
        { label: 'Financeiro', value: 'UI → @/core/finance → reconcileWithSchedule → PDF/IA (consumers puros)' },
        { label: 'Runtime', value: 'webVitals + perfProfiler → runtimeMetrics → Performance Intelligence' },
        { label: 'Observabilidade', value: 'analytics_events + audit_logs + Sentry breadcrumbs + Web Vitals' },
        { label: 'IA', value: 'Edges Supabase → centralAI fachada → SafeNarrative renderer (sem cálculo financeiro)' },
        { label: 'PDF', value: 'useProposalData() (fachada única) → Browserless edge → Chromium real' },
        { label: 'Segurança', value: 'ESLint anti-XSS → CI gate → SafeNarrative → testes de vetores' },
        { label: 'CI Quality', value: 'Lint → Vitest (golden snapshots) → CI gates (XSS, financeiro)' },
      ],
    },
    {
      kind: 'paragraph',
      title: 'Princípios cruzados',
      text:
        'Cada pipeline tem fonte única, consumers puros e ponto de bloqueio institucional contra drift. Camadas IA e UI nunca executam matemática financeira; renderização nunca usa HTML dinâmico; runtime nunca otimiza sem medição.',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/definitive-platform-code-performance-audit.md',
      auditDescription: 'Auditoria definitiva — código e performance',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/wave6-systemic-convergence-report.md',
      auditDescription: 'Convergência sistêmica — Onda 6',
    },
  ],
};
