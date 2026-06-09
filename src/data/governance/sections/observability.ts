import type { GovernanceSection } from '../types';

export const observability: GovernanceSection = {
  id: 'observability',
  label: 'Observabilidade & Operação',
  subtitle: 'Acompanhar saúde e operação contínua',
  group: 'operations',
  updatedAt: '2026-05-12',
  owner: 'Operações',
  tags: ['logs', 'analytics', 'audit', 'rollback', 'incident', 'health'],
  blocks: [
    {
      kind: 'paragraph',
      text: 'A operação é acompanhada por três camadas complementares: eventos analíticos de uso (analytics_events), logs de auditoria de ações críticas (audit_logs) e logs operacionais das edge functions. O Admin centraliza visualização e filtragem destas três fontes, permitindo investigar incidentes sem acesso a infraestrutura.',
    },
    {
      kind: 'kv',
      title: 'Camadas observáveis',
      pairs: [
        { label: 'Uso', value: 'analytics_events com fingerprint anti-duplicidade' },
        { label: 'Ações críticas', value: 'audit_logs em propostas, pós-venda, geração de PDF e admin' },
        { label: 'IA', value: 'Painel Admin → Performance IA cobre cache hit/miss e latência por edge' },
        { label: 'Edges', value: 'Logs estruturados por requestId, persistidos pelo backend gerenciado' },
        { label: 'Pipeline CRM', value: 'pipelineMetrics agrega conversão, tempo por coluna e ticket médio' },
      ],
    },
    {
      kind: 'bullets',
      title: 'Capacidades operacionais',
      items: [
        'Rollback de release frontend pelo histórico de versões publicadas',
        'Reexecução manual de edges pelo Admin para casos isolados',
        'Auditoria de ação por user_id, timestamp, contexto e diff resumido',
        'Changelog institucional vivo nesta área de Governança',
        'Status manual dos componentes principais (Status da plataforma)',
      ],
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Próximas evoluções operacionais',
      since: 'Roadmap',
      text: 'Health-check automatizado de edges e banco, incident log estruturado e feature flags com escopo por tenant entram na próxima onda — sem refatoração desta área.',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/sprint-a-performance-hardening-report.md',
      auditDescription: 'Hardening de performance e observabilidade',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/ai-edges-map.md',
      auditDescription: 'Mapa vivo das edges de IA e métricas',
    },
  ],
};
