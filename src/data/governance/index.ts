/**
 * Governance content registry.
 * Cada seção é um módulo isolado e pode evoluir sozinha.
 *
 * Wave 2026-05-13: adicionados grupos `runtime` e `policy`,
 * + 7 novas seções institucionais (Architecture Map, Engines Financeiras,
 * Runtime Governance, Performance Intelligence, Bundle, Anti-XSS, CI, Policy Hub).
 */
import type { GovernanceSection } from './types';
import { architecture } from './sections/architecture';
import { architectureMap } from './sections/architectureMap';
import { financialEngines } from './sections/financialEngines';
import { infrastructure } from './sections/infrastructure';
import { security } from './sections/security';
import { securityIsolation } from './sections/securityIsolation';
import { securityXss } from './sections/securityXss';
import { compliance } from './sections/compliance';
import { lgpd } from './sections/lgpd';
import { multitenant } from './sections/multitenant';
import { ai } from './sections/ai';
import { storage } from './sections/storage';
import { audits } from './sections/audits';
import { observability } from './sections/observability';
import { runtimeGovernance } from './sections/runtimeGovernance';
import { performanceIntelligence } from './sections/performanceIntelligence';
import { bundlePerformance } from './sections/bundlePerformance';
import { ciQuality } from './sections/ciQuality';
import { policyHub } from './sections/policyHub';
import { changelog } from './sections/changelog';
import { roadmap } from './sections/roadmap';
import { status } from './sections/status';

export { changelogEntries } from './sections/changelog';
export type {
  GovernanceSection,
  GovernanceBlock,
  ChangelogEntry,
  GovernanceCriticality,
  GovernanceStatus,
  GovernanceMaturity,
} from './types';

export const governanceSections: GovernanceSection[] = [
  architecture,
  architectureMap,
  financialEngines,
  infrastructure,
  security,
  securityXss,
  securityIsolation,
  multitenant,
  compliance,
  lgpd,
  ai,
  storage,
  runtimeGovernance,
  performanceIntelligence,
  bundlePerformance,
  observability,
  audits,
  ciQuality,
  policyHub,
  changelog,
  roadmap,
  status,
];

export const groupLabels: Record<GovernanceSection['group'], string> = {
  foundations: 'Fundações',
  security: 'Segurança & Compliance',
  runtime: 'Runtime & Performance',
  product: 'Produto',
  policy: 'Políticas & Governance',
  operations: 'Operações',
};

/** Ordem oficial de iteração dos grupos no menu lateral. */
export const groupOrder: Array<GovernanceSection['group']> = [
  'foundations',
  'security',
  'runtime',
  'product',
  'policy',
  'operations',
];
