import type { GovernanceSection } from '../types';

export const status: GovernanceSection = {
  id: 'status',
  label: 'Status da plataforma',
  subtitle: 'Verificar saúde operacional',
  group: 'operations',
  updatedAt: '2026-05-27',
  owner: 'Operações',
  tags: ['status', 'health', 'sla', 'v2.10.1'],
  blocks: [
    {
      kind: 'kv',
      title: 'Versão',
      pairs: [
        { label: 'Versão atual', value: 'v2.10.1' },
        { label: 'Data de atualização', value: '27/05/2026' },
        { label: 'Status', value: 'Estável' },
        { label: 'Últimas áreas modificadas', value: 'Autenticação, Documentação' },
      ],
    },
    {
      kind: 'kv',
      title: 'Componentes',
      pairs: [
        { label: 'Frontend', value: 'Operacional' },
        { label: 'Banco de dados', value: 'Operacional' },
        { label: 'Edge Functions', value: 'Operacional' },
        { label: 'Geração de PDF', value: 'Operacional' },
        { label: 'Gateway de IA', value: 'Operacional' },
      ],
    },
    {
      kind: 'callout',
      tone: 'info',
      text: 'Status exibido é manual nesta versão. Próxima onda integra health-check automatizado das edges e do banco.',
    },
  ],
};
