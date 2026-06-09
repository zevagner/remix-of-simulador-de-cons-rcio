/**
 * Navegação livre + estado consistente (Onda navegação — pós remoção de guards).
 *
 * Responsabilidades:
 * - Validar IDs de módulo contra o registry central (`src/config/modules.ts`).
 * - Persistir/restaurar último módulo top-level e último submódulo da Análise.
 * - Emitir telemetria leve `navigation_changed` para análise de fluxo real.
 *
 * NÃO bloqueia navegação. IDs inválidos caem em fallback seguro (analysis-overview)
 * e a tentativa é registrada para auditoria.
 */
import {
  MODULE_ORDER,
  ANALYSIS_TAB_IDS,
  isAnalysisTabId,
  type AnalysisTabId,
} from '@/config/modules';
import { trackEvent } from '@/services/analyticsTracker';
import { logger } from '@/utils/logger';

const LAST_MODULE_KEY = 'nav:lastModule';
const LAST_SUB_KEY = 'nav:lastSubmodule';


export type NavSource = 'sidebar' | 'bottom-nav' | 'cta' | 'restore' | 'deep-link' | 'onboarding';

/** True se o ID corresponde a um módulo top-level OU a um submódulo de Análise. */
export function isValidModuleId(id: string): boolean {
  if (!id) return false;
  if (id === 'analysis') return true;
  if (isAnalysisTabId(id)) return true;
  return MODULE_ORDER.includes(id);
}

/** Persiste último módulo (top-level) + submódulo (sub-aba da Análise). */
export function persistNavState(module: string, submodule?: string | null): void {
  try {
    localStorage.setItem(LAST_MODULE_KEY, module);
    localStorage.setItem(LAST_SUB_KEY, submodule ?? '');
  } catch { /* noop */ }
}

/**
 * Lê último estado salvo. Retorna null se inválido/ausente.
 *
 * Fase 4: migração defensiva de valores legados. Se `nav:lastModule` ou
 * `nav:lastSubmodule` contiver um alias (ex.: `strategies`, `compare`),
 * mapeia para o ID canônico via LEGACY_ID_MAP e regrava one-shot.
 * Valores inválidos após mapeamento são limpos (não voltam a Cockpit).
 */
export function readLastNavState(): { module: string; submodule: AnalysisTabId | null } | null {
  try {
    const rawModule = localStorage.getItem(LAST_MODULE_KEY);
    const rawSub = localStorage.getItem(LAST_SUB_KEY);
    if (!rawModule) return null;

    const mappedModule = LEGACY_ID_MAP[rawModule] ?? rawModule;
    if (!isValidModuleId(mappedModule)) {
      clearNavSession();
      return null;
    }

    const mappedSubRaw = rawSub ? (LEGACY_ID_MAP[rawSub] ?? rawSub) : '';
    const submodule = mappedSubRaw && isAnalysisTabId(mappedSubRaw)
      ? (mappedSubRaw as AnalysisTabId)
      : null;

    if (mappedModule !== rawModule || (mappedSubRaw && mappedSubRaw !== rawSub)) {
      persistNavState(mappedModule, submodule);
      trackEvent('navigation_legacy_id', {
        attempted: rawModule,
        resolved: mappedModule,
        source: 'storage_migration',
      });
    }

    return { module: mappedModule, submodule };
  } catch { return null; }
}

/** Limpa estado de navegação (útil ao trocar de cliente / logout). */
export function clearNavSession(): void {
  try {
    localStorage.removeItem(LAST_MODULE_KEY);
    localStorage.removeItem(LAST_SUB_KEY);
  } catch { /* noop */ }
}

/** Emite evento de telemetria de navegação (fire-and-forget). */
export function trackNavigation(params: {
  fromModule: string;
  toModule: string;
  fromSub?: string | null;
  toSub?: string | null;
  source: NavSource;
}): void {
  trackEvent('navigation_changed', {
    from_module: params.fromModule,
    to_module: params.toModule,
    from_sub: params.fromSub ?? null,
    to_sub: params.toSub ?? null,
    source: params.source,
  });
}

/**
 * Mapeamento explícito de IDs legados → submódulo canônico atual.
 * Aplicado ANTES do fallback de inválido, para preservar navegação correta
 * em CTAs/hooks legados sem sequestrar para o Cockpit.
 */
const LEGACY_ID_MAP: Record<string, string> = {
  investment: 'wealth',
  patrimonial: 'wealth',
  wealth: 'wealth',
  compare: 'comparator',
  comparator: 'comparator',
  strategies: 'wealth',
  bids: 'bids',
  advanced: 'advanced',
  assemblies: 'assemblies',
  // Onda Cockpit Removal: overview deixou de existir → redireciona ao pai 'analysis'
  // (que renderiza a tela própria do módulo).
  'analysis-overview': 'analysis',
};

/**
 * Resolve um ID alvo.
 *
 * Mudança Fase 1 (analysis decouple):
 * - IDs inválidos NÃO são mais mascarados como `analysis-overview`. Retorna
 *   `module: null` + `fallbackUsed: true`, e o caller decide (tipicamente:
 *   não navegar, apenas logar). Antes, qualquer ID desconhecido jogava o
 *   usuário no Cockpit silenciosamente — esse era o sequestro principal.
 * - `analysis` continua resolvendo para `analysis` + overview (semântica de
 *   "pai"), mas o caller (`setActiveModule`) decide se realmente abre o
 *   Cockpit ou se é no-op (quando já está dentro da família).
 */
export function resolveTarget(targetId: string): { module: string | null; submodule: AnalysisTabId | null; fallbackUsed: boolean } {
  const mapped = LEGACY_ID_MAP[targetId] ?? targetId;
  if (!isValidModuleId(mapped)) {
    logger.warn('[nav] ID inválido — navegação ignorada', targetId);
    trackEvent('navigation_invalid_target', { attempted: targetId });
    return { module: null, submodule: null, fallbackUsed: true };
  }
  // Fase 4: telemetria + warn one-shot quando um alias legado é resolvido.
  if (mapped !== targetId) {
    warnLegacyIdOnce(targetId, mapped);
    trackEvent('navigation_legacy_id', { attempted: targetId, resolved: mapped, source: 'resolve_target' });
  }
  // Cockpit Removal: 'analysis' resolve para pai SEM submódulo default.
  if (mapped === 'analysis') return { module: 'analysis', submodule: null, fallbackUsed: false };

  if (isAnalysisTabId(mapped)) return { module: mapped, submodule: mapped as AnalysisTabId, fallbackUsed: false };
  return { module: mapped, submodule: null, fallbackUsed: false };
}

// One-shot warn por ID legado por sessão (evita spam em loops de render).
const __legacyWarned = new Set<string>();
function warnLegacyIdOnce(attempted: string, resolved: string): void {
  if (__legacyWarned.has(attempted)) return;
  __legacyWarned.add(attempted);
  logger.warn(`[nav] ID legado '${attempted}' → '${resolved}'. Atualize o call site para o ID canônico.`);
}

// ────────────────────────────────────────────────────────────────────────────
// URL sync (Fase 3 analysis-decouple + Fase 4 compat de aliases antigos)
// ────────────────────────────────────────────────────────────────────────────
// Padrão canônico: `?m=<id>`. Compat de leitura: `?module=<id>` e `?tab=<id>`
// (usados em links antigos/indexados). Quando detectados, a URL é reescrita
// para `?m=<canonical>` no primeiro write, sem poluir history.

const URL_PARAM = 'm';
const URL_LEGACY_PARAMS = ['module', 'tab'] as const;

/** Lê o alvo de navegação da URL atual. Retorna null se ausente/inválido. */
export function readUrlNavTarget(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    let v = params.get(URL_PARAM);
    let fromLegacyParam: string | null = null;
    if (!v) {
      for (const key of URL_LEGACY_PARAMS) {
        const candidate = params.get(key);
        if (candidate) { v = candidate; fromLegacyParam = key; break; }
      }
    }
    if (!v) return null;
    const mapped = LEGACY_ID_MAP[v] ?? v;
    if (!isValidModuleId(mapped)) return null;
    if (fromLegacyParam || mapped !== v) {
      trackEvent('navigation_legacy_id', {
        attempted: v,
        resolved: mapped,
        source: fromLegacyParam ? `url_param:${fromLegacyParam}` : 'url_alias',
      });
    }
    return mapped;
  } catch { return null; }
}

/**
 * Atualiza o parâmetro `?m=` na URL sem navegar nem rolar.
 * Idempotente: se o valor já é o mesmo, não faz nada (evita entradas
 * espúrias de history e re-renders externos).
 */
export function writeUrlNavTarget(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    // Fase 4: limpa params legados (`module`, `tab`) e canoniza para `?m=`.
    let mutated = false;
    for (const key of URL_LEGACY_PARAMS) {
      if (url.searchParams.has(key)) { url.searchParams.delete(key); mutated = true; }
    }
    if (url.searchParams.get(URL_PARAM) !== id) {
      url.searchParams.set(URL_PARAM, id);
      mutated = true;
    }
    if (!mutated) return;
    window.history.replaceState(window.history.state, '', url.toString());
  } catch { /* noop */ }
}

export { ANALYSIS_TAB_IDS };
