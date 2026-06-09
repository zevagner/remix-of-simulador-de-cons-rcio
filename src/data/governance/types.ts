/**
 * Governança da Plataforma — tipagem do content registry.
 *
 * Documentação executiva-técnica viva. NÃO substitui código-fonte
 * nem expõe schemas internos: descreve capacidades, garantias e
 * decisões arquiteturais para auditoria, TI e stakeholders.
 *
 * Wave: Governance Expansion & Institutional Update (2026-05-13).
 * Adicionado: criticality/status/maturity/executiveSummary/impact/risk
 * + blocks `metric`/`policy` para runtime status e policy hub.
 */

export type GovernanceBlockKind =
  | 'paragraph'
  | 'bullets'
  | 'kv' // key/value pairs (capabilities matrix)
  | 'callout' // info/warn/positive/critical
  | 'code' // short snippets (no secrets)
  | 'audit-link' // referência a relatório existente em .lovable/audit/
  | 'policy' // referência a política institucional (docs/**)
  | 'metric'; // status runtime (label + value + tone)

export interface GovernanceBlock {
  kind: GovernanceBlockKind;
  title?: string;
  /** Versão/onda em que esta garantia entrou em vigor (ex.: "Onda 6", "2026-03"). */
  since?: string;
  /** paragraph / callout */
  text?: string;
  /** bullets */
  items?: string[];
  /** kv */
  pairs?: Array<{ label: string; value: string }>;
  /** callout tone */
  tone?: 'info' | 'positive' | 'warn' | 'critical';
  /** code */
  code?: string;
  language?: string;
  /** audit-link */
  auditPath?: string;
  auditDescription?: string;
  /** policy */
  policyPath?: string;
  policyDescription?: string;
  /** metric */
  metrics?: Array<{ label: string; value: string; tone?: 'positive' | 'warn' | 'critical' | 'info' }>;
}

/** Nível de criticidade institucional da seção. */
export type GovernanceCriticality = 'critical' | 'high' | 'medium' | 'low';

/** Status operacional da garantia descrita. */
export type GovernanceStatus = 'enforced' | 'active' | 'in-evolution' | 'planned';

/** Maturidade da prática institucional. */
export type GovernanceMaturity = 'foundational' | 'mature' | 'evolving' | 'experimental';

export interface GovernanceSection {
  /** Slug único (URL-safe) */
  id: string;
  /** Título exibido no menu */
  label: string;
  /** Subtítulo curto (verbo no imperativo, ≤ 8 palavras) */
  subtitle: string;
  /** Categoria de agrupamento no menu */
  group: 'foundations' | 'security' | 'product' | 'operations' | 'runtime' | 'policy';
  /** Última revisão (ISO date) */
  updatedAt: string;
  /** Tags para busca */
  tags: string[];
  /** Time/área responsável institucional pela seção. */
  owner?: string;
  /** Criticidade institucional (default 'medium'). */
  criticality?: GovernanceCriticality;
  /** Status operacional atual (default 'active'). */
  status?: GovernanceStatus;
  /** Maturidade da prática (default 'mature'). */
  maturity?: GovernanceMaturity;
  /** Resumo executivo (1-2 frases, foco em decisão e impacto). */
  executiveSummary?: string;
  /** Impacto operacional (clientes, pipeline, runtime, compliance). */
  impact?: string;
  /** Risco residual / o que ainda monitorar. */
  risk?: string;
  /** Conteúdo modular */
  blocks: GovernanceBlock[];
}

export interface ChangelogEntry {
  date: string; // ISO
  title: string;
  area:
    | 'arquitetura'
    | 'segurança'
    | 'crm'
    | 'ia'
    | 'pdf'
    | 'compliance'
    | 'ux'
    | 'runtime'
    | 'performance'
    | 'observabilidade'
    | 'finanças';
  summary: string;
}
