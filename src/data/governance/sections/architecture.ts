import type { GovernanceSection } from '../types';

export const architecture: GovernanceSection = {
  id: 'architecture',
  label: 'Arquitetura',
  subtitle: 'Entender a estrutura da plataforma',
  group: 'foundations',
  updatedAt: '2026-05-27',
  owner: 'Plataforma',
  tags: ['react', 'vite', 'supabase', 'edge functions', 'spa', 'v2.10.1'],
  blocks: [
    {
      kind: 'paragraph',
      text: 'Plataforma SaaS consultiva construída como Single Page Application moderna, com backend gerenciado, banco relacional, edge functions sob demanda e geração de PDF server-side. A arquitetura é orientada a módulos consultivos (simulação, comparador, propostas, CRM, pós-venda) com motores determinísticos de cálculo financeiro isolados da camada de IA.',
    },
    {
      kind: 'kv',
      title: 'Camadas principais',
      pairs: [
        { label: 'Frontend', value: 'React 18 + Vite + TypeScript + Tailwind' },
        { label: 'Backend gerenciado', value: 'Postgres + Auth + Storage + Edge Functions' },
        { label: 'Cálculo financeiro', value: 'Motor determinístico em src/core/finance (fonte única)' },
        { label: 'IA', value: 'Camada conversacional via gateway; nunca executa cálculo financeiro' },
        { label: 'PDFs', value: 'Geração via edge function + Browserless (Chromium real)' },
        { label: 'Observabilidade', value: 'Analytics events + audit logs internos' },
      ],
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Princípio arquitetural',
      text: 'Motores financeiros e regras de negócio são determinísticos e auditáveis. IA atua apenas em comunicação, narrativa e roteiros consultivos — nunca em valores, taxas ou parcelas.',
    },
    {
      kind: 'kv',
      title: 'Estado visual atual (v2.10.1)',
      pairs: [
        { label: 'Autenticação', value: 'Domínio @caixa.gov.br + confirmação de email = acesso automático. Admin pode bloquear via approved=false. Verificação periódica de aprovação a cada 5min durante sessão ativa.' },
        { label: 'Canvas', value: 'Canonical Module Canvas + ModuleHeader unificado em todos os módulos (sem logo interno)' },
        { label: 'Design System', value: 'Navy #003641 como cor primária universal — token --primary migrado, sidebar, ModuleHeader, PillToggle, Switches' },
        { label: 'PillToggle', value: 'Componente compartilhado em src/components/ui/ — usado em Simulador, Assembleias, Estudo de Lances, Op. Estruturadas (tap target 44px / WCAG 2.5.5)' },
        { label: 'Sistema editorial', value: 'Eyebrow + counter + headline em itálico (editorial-section)' },
        { label: 'Sidebar', value: 'Navy #003641 com texto claro e item ativo branco — fluxo linear de 6 passos, recolhível no desktop; aba Análise expandida por padrão; Op. Estruturadas logo abaixo do Comparador' },
        { label: 'Motion', value: 'Sistema tonal/polish institucional sem animações decorativas' },
        { label: 'Onboarding', value: 'Central de Ajuda como fonte única (Tour Guiado descontinuado em 2.4.0)' },
        { label: 'Cockpit', value: 'Hub de roteamento — indica, não resolve (sem KPIs replicados)' },
        { label: 'Comunidade', value: 'Feed de atividade cronológico com avatares, curtidas e barra de ações estilo Twitter' },
        { label: 'StructuredOps', value: 'Motor canônico (calculateMonthlySchedule + reconcileWithSchedule); aviso "Valores nominais — sem projeção de reajuste INPC" abaixo do Resultado Consolidado' },
        { label: 'Admin Inteligência', value: 'Nível 1: botões de ação contextual ("Agir agora" navegam para o módulo); Nível 2: geração de prompts Lovable com marcação de implementado' },
        { label: 'Wealth', value: 'ModuleHeader navy adicionado; botão PDF inerte removido (fluxo canônico via WealthPdfSelectionBar)' },
        { label: 'Reajuste INPC', value: 'Toggle no card Dados do Consórcio — desabilitado por padrão, propagação via SimulatorContext para todos os módulos (motor, Investimento, Comparador, PDF, Proposta, IA)' },
        { label: 'Login', value: 'Fundo navy #003641, card branco, identidade visual consistente com a plataforma' },
        { label: 'Rate limiting', value: 'generate-pdf (5/min), account-purge (3/h), data-export (5/h), data-retention-purge (2/h) — checkRateLimit em todas as edges críticas' },
        { label: 'Sentry', value: 'tracing gated por consent — erros como interesse legítimo, performance só com aceite' },
        { label: 'Dependabot', value: '.github/dependabot.yml — PRs semanais automáticos de segurança' },
      ],
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/super-auditoria-tecnica-completa.md',
      auditDescription: 'Auditoria técnica completa da plataforma',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/sprint-b-modularization-report.md',
      auditDescription: 'Modularização e separação de responsabilidades',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/governance-helpcenter-versioning-alignment-wave.md',
      auditDescription: 'Onda 37 — Governance + Help Center + Versioning Alignment (v2.4.0)',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/guided-tour-full-removal-audit-wave.md',
      auditDescription: 'Remoção integral do Tour Guiado (intro.js)',
    },
  ],
};
