import type { GovernanceSection } from '../types';

export const runtimeGovernance: GovernanceSection = {
  id: 'runtime-governance',
  label: 'Runtime Governance',
  subtitle: 'Medir antes de otimizar',
  group: 'runtime',
  updatedAt: '2026-05-13',
  owner: 'Plataforma',
  criticality: 'high',
  status: 'enforced',
  maturity: 'mature',
  executiveSummary:
    'Building blocks oficiais (PerfProfiler, VirtualList, Web Vitals) com política institucional "medir antes de otimizar". Virtualização restrita a >200 itens ou schedules ≥120 linhas para evitar perda de UX nativa.',
  impact:
    'Garante runtime previsível em ambientes corporativos (Citrix/VPN/low-end PC) sem regressão de UX nem virtualização especulativa.',
  risk:
    'Ausência de medição em produção pode mascarar hot paths reais. Mitigado por Web Vitals + Performance Intelligence Dashboard.',
  tags: ['profiler', 'virtualization', 'web-vitals', 'render', 'runtime'],
  blocks: [
    {
      kind: 'paragraph',
      text:
        'A plataforma adota uma política runtime institucional: nada é otimizado por intuição. Toda decisão de virtualização, memoização ou code-splitting exige medição prévia. Os building blocks oficiais são compartilhados, opt-in e zero-overhead em produção sem flag.',
    },
    {
      kind: 'kv',
      title: 'Building blocks oficiais',
      pairs: [
        { label: '<PerfProfiler>', value: '@/lib/perfProfiler — opt-in via ?perf=1 ou localStorage; loga commits >16ms' },
        { label: '<VirtualList>', value: '@/components/perf/VirtualList — @tanstack/react-virtual; só >200 itens ou schedules ≥120' },
        { label: 'initWebVitals()', value: '@/lib/webVitals — FCP/LCP/CLS/INP/TTFB → console + Sentry breadcrumbs' },
        { label: 'runtimeMetrics', value: '@/lib/runtimeMetrics — pipeline pub/sub central; buffer circular 500; zero polling' },
      ],
    },
    {
      kind: 'callout',
      tone: 'positive',
      title: 'Política — medir antes de otimizar',
      since: 'Runtime Wave',
      text:
        'Virtualização especulativa está proibida. PerfProfiler é a porta de entrada de qualquer hipótese de hot path. Decisões devem ser apoiadas por Web Vitals reais ou commits >16ms registrados.',
    },
    {
      kind: 'policy',
      policyPath: 'docs/performance/runtime-policy.md',
      policyDescription: 'Runtime Performance & Virtualization Policy',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/runtime-performance-virtualization-wave.md',
      auditDescription: 'Onda Runtime Performance & Virtualization',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/performance-hardening-wave.md',
      auditDescription: 'Hardening de performance estrutural',
    },
  ],
};
