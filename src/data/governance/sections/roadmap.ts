import type { GovernanceSection } from '../types';

export const roadmap: GovernanceSection = {
  id: 'roadmap',
  label: 'Roadmap técnico',
  subtitle: 'Visualizar próximas evoluções',
  group: 'operations',
  updatedAt: '2026-05-14',
  owner: 'Plataforma',
  tags: ['roadmap', 'próximos passos', 'pós-2.4.0'],
  blocks: [
    {
      kind: 'bullets',
      title: 'Próximas ondas (pós v2.4.0)',
      items: [
        'Health-check automatizado: integração real-time de status das edges, banco e gateway de IA',
        'Release notes públicos automáticos a partir do changelog institucional',
        'Bundle gate em CI: bloquear PRs que aumentem chunks acima do limite definido em docs/performance/bundle-policy.md',
        'Feature flags com escopo por tenant',
        'Auditoria contínua: lints adicionais para regras de negócio hardcoded',
        'Expansão do Adaptive Consultive Intelligence com novos sinais determinísticos',
      ],
    },
    {
      kind: 'callout',
      tone: 'info',
      text: 'Roadmap é direcional, não contratual. Prioridades evoluem conforme uso real e feedback consultivo.',
    },
  ],
};
