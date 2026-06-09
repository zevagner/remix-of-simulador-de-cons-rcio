/**
 * Centralized module configuration — single source of truth for Sidebar, BottomNav, SwipeableModule.
 *
 * Onda de reorganização: o fluxo principal é linear e os módulos de análise
 * (Investimento, Comparador, Estudo de Lances, Op. Estruturadas, Assembleias)
 * vivem dentro do módulo `analysis` como abas.
 */
import {
  Zap, FileText, MessageSquareQuote, ClipboardList,
  HelpCircle, BarChart3, Stethoscope, Briefcase, Users,
  Compass, TrendingUp, GitCompare, Target, FileCheck2, CalendarCheck, Building2, Layers,
} from 'lucide-react';

export interface ModuleItem {
  id: string;
  label: string;
  icon: React.ElementType;
  hint?: string;
  /** Subitens (ex.: módulos dentro de "Análise"). Quando presentes, o item pai expande no sidebar. */
  children?: ModuleItem[];
}

export interface ModuleGroup {
  label: string;
  items: ModuleItem[];
}

/**
 * Registry tipado dos submódulos do container `analysis`.
 * Fonte única de IDs — use `ANALYSIS_TABS.WEALTH` etc. em código de navegação.
 *
 * Onda Cockpit Removal: `OVERVIEW` foi removido. A entrada do módulo Análise
 * passa a renderizar o conteúdo próprio (blocos de identidade + ferramentas)
 * quando nenhum submódulo está ativo. `DEFAULT_ANALYSIS_TAB = null`.
 */
export const ANALYSIS_TABS = {
  WEALTH: 'wealth',
  INVESTMENT: 'wealth',    // Wave Redirection: investment redireciona para wealth
  PATRIMONIAL: 'wealth',   // Wave Redirection: patrimonial redireciona para wealth
  COMPARATOR: 'comparator',
  BIDS: 'bids',
  ADVANCED: 'advanced',
  ASSEMBLIES: 'assemblies',
} as const;

export type AnalysisTabKey = keyof typeof ANALYSIS_TABS;
export type AnalysisTabId = (typeof ANALYSIS_TABS)[AnalysisTabKey];

export const DEFAULT_ANALYSIS_TAB: AnalysisTabId | null = null;

/**
 * Registries futuros (vazios por ora — preencher quando esses módulos ganharem
 * submódulos persistidos via moduleTabPersistence). Mantidos exportados para
 * que o padrão tipado seja descoberto via autocomplete.
 */
export const PROPOSAL_TABS = {} as const;
export type ProposalTabId = (typeof PROPOSAL_TABS)[keyof typeof PROPOSAL_TABS];

export const POSTSALE_TABS = {} as const;
export type PostSaleTabId = (typeof POSTSALE_TABS)[keyof typeof POSTSALE_TABS];

/**
 * Subitens visíveis na sidebar/breadcrumb (Cockpit + 4 análises).
 *
 * Onda Assemblies Restoration: ASSEMBLEIAS voltou à hierarquia visual.
 * Permanecia rota viva mas invisível, o que violou o princípio de
 * "módulo crítico não pode desaparecer silenciosamente".
 *
 * `ADVANCED` (Operações estruturadas) segue como ID válido fora do menu —
 * acessado via CTA contextual no Cockpit (carta alta ≥ R$ 500k).
 */
export const ANALYSIS_SUBITEMS: ModuleItem[] = [
  { id: ANALYSIS_TABS.WEALTH, label: 'Estratégias Patrimoniais', icon: Building2, hint: 'Curadoria editorial — crescimento, liquidez, proteção e sucessão' },
  { id: ANALYSIS_TABS.COMPARATOR, label: 'Comparador', icon: GitCompare, hint: 'Consórcio vs financiamento' },
  { id: ANALYSIS_TABS.ADVANCED, label: 'Op. Estruturadas', icon: Layers, hint: 'Montagem avançada de operações multi-carta' },
  { id: ANALYSIS_TABS.BIDS, label: 'Estudo de lances', icon: Target, hint: 'Probabilidade de contemplação' },
  { id: ANALYSIS_TABS.ASSEMBLIES, label: 'Assembleias', icon: CalendarCheck, hint: 'Histórico real e ranking de grupos' },
];

/**
 * Presence guard institucional — garante em dev que todo ID de
 * `ANALYSIS_TABS` tenha (a) entrada de sidebar OU (b) registro explícito
 * como rota válida fora do menu. Falha cedo se um módulo crítico for
 * removido silenciosamente da navegação.
 */
const ANALYSIS_HEADLESS_ALLOWLIST: ReadonlySet<string> = new Set([
  // Wave Redirection: investment e patrimonial removidos — agora redirecionam para wealth via LEGACY_ID_MAP
]);
if (import.meta.env?.DEV) {
  const visible = new Set(ANALYSIS_SUBITEMS.map((s) => s.id));
  for (const id of Object.values(ANALYSIS_TABS)) {
    if (!visible.has(id) && !ANALYSIS_HEADLESS_ALLOWLIST.has(id)) {
      // eslint-disable-next-line no-console
      console.error(
        `[modules] Módulo crítico "${id}" sumiu da navegação. ` +
        `Adicione em ANALYSIS_SUBITEMS ou em ANALYSIS_HEADLESS_ALLOWLIST.`,
      );
    }
  }
}

/** IDs (incluindo overview) que vivem dentro do container `analysis`. Derivado do registry. */
export const ANALYSIS_TAB_IDS = Object.values(ANALYSIS_TABS) as readonly AnalysisTabId[];

export function isAnalysisTabId(id: string): id is AnalysisTabId {
  return (ANALYSIS_TAB_IDS as readonly string[]).includes(id);
}


/**
 * Sidebar — agrupamento executivo (Wave 25 IA).
 * Cada grupo representa uma fase real do trabalho consultivo, não uma
 * lista linear de páginas. A reorganização é puramente visual: mesmos IDs,
 * mesma navegação, mesmos hooks — apenas grouping/labels.
 */
export const MODULE_GROUPS: ModuleGroup[] = [
  {
    label: 'Prospecção',
    items: [
      { id: 'diagnostic', label: 'Diagnóstico', icon: Stethoscope, hint: 'Entenda o cliente primeiro' },
      { id: 'simulator', label: 'Simulador', icon: Zap, hint: 'Simule e gere proposta em 1 min' },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      {
        id: 'analysis',
        label: 'Análise',
        icon: BarChart3,
        children: ANALYSIS_SUBITEMS,
      },
    ],
  },
  {
    label: 'Conversão',
    items: [
      { id: 'objections', label: 'Abordagem', icon: MessageSquareQuote, hint: 'Prepare-se para a conversa' },
      { id: 'proposal', label: 'Proposta', icon: FileText, hint: 'Gere e envie ao cliente' },
      { id: 'proposal-pdf', label: 'Proposta Premium', icon: FileCheck2, hint: 'PDF consultivo premium' },
    ],
  },
  {
    label: 'Relacionamento',
    items: [
      { id: 'proposals', label: 'Carteira', icon: ClipboardList, hint: 'Gerencie seu pipeline' },
      { id: 'post-sale', label: 'Pós-venda', icon: Briefcase, hint: 'Acompanhe clientes ativos' },
    ],
  },
  {
    label: 'Suporte',
    items: [
      { id: 'community', label: 'Comunidade', icon: Users, hint: 'Casos anônimos entre colegas' },
      { id: 'help', label: 'Central de Ajuda', icon: HelpCircle, hint: '' },
    ],
  },
];

/** Primary tabs for mobile bottom nav.
 *  Onda Community Discoverability: `community` substitui `objections` no slot
 *  primário para reduzir fricção orgânica de descoberta. `objections` continua
 *  acessível pelo sheet "Mais". */
export const PRIMARY_TABS: ModuleItem[] = [
  { id: 'simulator', label: 'Simulador', icon: Zap },
  { id: 'analysis', label: 'Análise', icon: BarChart3 },
  { id: 'community', label: 'Comunidade', icon: Users },
  { id: 'proposal', label: 'Proposta', icon: FileText },
];

/** Secondary tabs for mobile "more" sheet */
export const MORE_TABS: ModuleItem[] = [
  { id: 'diagnostic', label: 'Diagnóstico', icon: Stethoscope },
  { id: 'objections', label: 'Abordagem', icon: MessageSquareQuote },
  { id: 'proposals', label: 'Carteira', icon: ClipboardList },
  { id: 'post-sale', label: 'Pós-venda', icon: Briefcase },
  { id: 'help', label: 'Central de Ajuda', icon: HelpCircle },
];

/** Ordered list of modules for swipe navigation (apenas top-level). */
export const MODULE_ORDER = [
  'diagnostic', 'simulator', 'analysis', 'objections', 'proposal', 'proposal-pdf', 'proposals', 'post-sale', 'community', 'help',
];
