import type { GovernanceSection } from '../types';

export const infrastructure: GovernanceSection = {
  id: 'infrastructure',
  label: 'Infraestrutura',
  subtitle: 'Saber onde a plataforma opera',
  group: 'foundations',
  updatedAt: '2026-05-12',
  owner: 'Plataforma',
  tags: ['stack', 'cloud', 'deploy', 'edge', 'cdn', 'infra'],
  blocks: [
    {
      kind: 'paragraph',
      text: 'A plataforma opera como SaaS gerenciado: frontend estático servido por CDN global, backend gerenciado pelo Lovable Cloud (Postgres + Auth + Storage + Edge Functions) e renderização de PDF delegada a um navegador headless externo. Não há servidores aplicacionais persistentes a manter.',
    },
    {
      kind: 'kv',
      title: 'Stack operacional',
      pairs: [
        { label: 'Frontend', value: 'React 18 · Vite · TypeScript · Tailwind · React Query' },
        { label: 'Backend gerenciado', value: 'Lovable Cloud (Postgres + Auth + Storage + Edge Functions Deno)' },
        { label: 'Renderização PDF', value: 'Edge function → Browserless (Chromium real)' },
        { label: 'Gateway de IA', value: 'Provedor único, sem chaves no cliente' },
        { label: 'Distribuição', value: 'CDN global com fallback SPA automático' },
        { label: 'PWA', value: 'Service Worker com cache versionado por release' },
      ],
    },
    {
      kind: 'kv',
      title: 'Ciclo de release',
      since: 'Onda 6',
      pairs: [
        { label: 'Versionamento', value: 'public/version.json (build hash + data)' },
        { label: 'Deploy frontend', value: 'Build estático imutável, invalidação de CDN automática' },
        { label: 'Deploy edges', value: 'Sob demanda por commit; sem janela de manutenção' },
        { label: 'Migrações', value: 'Versionadas em supabase/migrations e aplicadas linearmente' },
        { label: 'Rollback', value: 'Restaurar release anterior pelo histórico de versões' },
      ],
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Princípio operacional',
      text: 'Zero servidores aplicacionais sob gestão. Toda lógica de runtime vive em edges efêmeras, com escalonamento e isolamento gerenciados.',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/supabase-architecture-dependency-audit.md',
      auditDescription: 'Dependências e arquitetura do backend gerenciado',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/sprint-a-performance-hardening-report.md',
      auditDescription: 'Hardening de performance e capacidade',
    },
  ],
};
