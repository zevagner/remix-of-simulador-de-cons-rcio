import type { GovernanceSection } from '../types';

export const performanceIntelligence: GovernanceSection = {
  id: 'performance-intelligence',
  label: 'Performance Intelligence',
  subtitle: 'Visualizar Web Vitals e hot paths',
  group: 'runtime',
  updatedAt: '2026-05-13',
  owner: 'Operações',
  criticality: 'high',
  status: 'enforced',
  maturity: 'mature',
  executiveSummary:
    'Dashboard Admin lazy-loaded que consolida Web Vitals, render hotspots e runtime warnings em tempo real, com cards executivos (Runtime/Mobile/Citrix/React) e thresholds oficiais.',
  impact:
    'Visibilidade operacional consolidada: ambiente corporativo (Citrix/VPN), mobile e estabilidade React em uma única tela auditável.',
  risk:
    'Métricas hoje são in-memory por sessão (sem persistência cross-session). Próxima evolução: agregação tenant-aware e CI bundle gate.',
  tags: ['observabilidade', 'web-vitals', 'lcp', 'inp', 'cls', 'dashboard'],
  blocks: [
    {
      kind: 'paragraph',
      text:
        'Performance Intelligence é o painel institucional de saúde runtime. Consome o pipeline runtimeMetrics e expõe Web Vitals com thresholds oficiais (web.dev/vitals), render hotspots (via PerfProfiler) e feed de eventos recentes. Lazy-loaded — zero overhead até o admin abrir a aba.',
    },
    {
      kind: 'metric',
      title: 'Baselines institucionais',
      metrics: [
        { label: 'LCP', value: '≤ 2500 ms', tone: 'positive' },
        { label: 'INP', value: '≤ 200 ms', tone: 'positive' },
        { label: 'CLS', value: '≤ 0.1', tone: 'positive' },
        { label: 'FCP', value: '≤ 1800 ms', tone: 'positive' },
        { label: 'TTFB', value: '≤ 800 ms', tone: 'positive' },
      ],
    },
    {
      kind: 'kv',
      title: 'Cards executivos',
      pairs: [
        { label: 'Runtime Health', value: 'poor vitals + render storms' },
        { label: 'Mobile Health', value: 'derivado de INP' },
        { label: 'Citrix/VPN Ready', value: 'derivado de TTFB' },
        { label: 'React Stability', value: 'commits >16ms / total' },
      ],
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Hardening',
      text:
        'Buffer circular cap 500, re-render via requestAnimationFrame, sem PII, sem polling, sem persistência. Pipeline emite O(1) sem listeners ativos.',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/performance-intelligence-dashboard-wave.md',
      auditDescription: 'Onda Performance Intelligence Dashboard',
    },
  ],
};
