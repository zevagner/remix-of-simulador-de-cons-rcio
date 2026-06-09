import type { GovernanceSection } from '../types';

export const securityXss: GovernanceSection = {
  id: 'security-xss',
  label: 'Anti-XSS Governance',
  subtitle: 'Bloquear injeção HTML institucionalmente',
  group: 'security',
  updatedAt: '2026-05-13',
  owner: 'Segurança',
  criticality: 'critical',
  status: 'enforced',
  maturity: 'mature',
  executiveSummary:
    'Renderização de HTML dinâmico é institucionalmente impossível: ESLint bloqueia 7 padrões perigosos, CI gate falha builds com regressão, e SafeNarrative é o único renderer aprovado para conteúdo formatado.',
  impact:
    'Risco de XSS reduzido a zero por construção. Pipelines IA permanecem seguros mesmo com prompts adversariais.',
  risk:
    'Allowlist mínima (safeFormattedText + getter pdfGenerator). Qualquer exceção exige aprovação documentada e teste de vetor.',
  tags: ['xss', 'segurança', 'eslint', 'ci', 'sanitização'],
  blocks: [
    {
      kind: 'paragraph',
      text:
        'A política institucional anti-XSS combina três camadas: renderer único (SafeNarrative/renderSafeFormattedText), ESLint hardening (no-restricted-syntax: error) e CI gate (anti-xss-gate.mjs). Nenhuma narrativa IA, conteúdo de usuário ou markdown chega ao DOM via dangerouslySetInnerHTML.',
    },
    {
      kind: 'kv',
      title: 'Padrões bloqueados',
      pairs: [
        { label: 'dangerouslySetInnerHTML', value: 'ESLint error + CI gate' },
        { label: '.innerHTML / .outerHTML write', value: 'ESLint error (apenas getter permitido em pdfGenerator)' },
        { label: 'insertAdjacentHTML', value: 'ESLint error' },
        { label: 'document.write', value: 'ESLint error' },
        { label: 'DOMParser', value: 'ESLint error' },
      ],
    },
    {
      kind: 'kv',
      title: 'Allowlist institucional',
      pairs: [
        { label: 'src/utils/safeFormattedText.tsx', value: 'Renderer aprovado oficial' },
        { label: 'src/utils/pdfGenerator.tsx', value: 'Apenas getter para serialização Browserless' },
      ],
    },
    {
      kind: 'callout',
      tone: 'critical',
      title: 'Princípio absoluto',
      text:
        'React renderiza apenas JSX seguro. HTML dinâmico é impossível. Reintrodução é bloqueada antes do commit (lint) e antes do deploy (CI gate). 14 testes de vetores XSS validam o renderer.',
    },
    {
      kind: 'policy',
      policyPath: 'docs/security/html-injection-policy.md',
      policyDescription: 'HTML Injection Security Policy',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/anti-xss-governance-hardening.md',
      auditDescription: 'Onda Anti-XSS Governance Hardening',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/xss-hardening-commercial-insights.md',
      auditDescription: 'Hardening XSS — CommercialInsights',
    },
  ],
};
