/**
 * Fire-and-forget analytics event tracker.
 * Unified event system — replaces both old access_logs and analytics_events.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { logger } from '@/utils/logger';
import { isAnalyticsAllowed } from '@/lib/consent';

export type AnalyticsEventName =
  | 'session_login'
  | 'session_logout'
  | 'module_access'
  // 'argument_generated' removido — sem call site, agregação morta (auditoria 2026-05)
  | 'argument_copied'
  | 'simulate_from_bids'
  | 'simulation_generated'
  | 'simulation_message_generated'
  | 'proposal_generated'
  | 'quick_sale_generated'
  | 'smart_message_copied'
  | 'venda_direta_simulated'
  | 'venda_direta_proposal_generated'
  | 'sales_response_generated'
  | 'sales_response_copied'
  // Granular events
  | 'investment_scenario_expanded'
  | 'investment_recommendation_cta'
  | 'analysis_recommendation_cta'
  | 'proposal_tab_viewed'
  | 'proposal_copied'
  | 'objection_copied'
  | 'bid_ai_recommendation_generated'
  | 'ai_cache_hit'
  | 'investment_storytelling_cache_hit'
  | 'investment_storytelling_cache_miss'
  | 'bid_recommendation_hybrid_local'
  | 'bid_scenario_simulated'
  | 'pipeline_lead_created'
  | 'pipeline_lead_moved'
  | 'trigger_copied'
  | 'contextual_trigger_copied'
  | 'trigger_ai_generated'
  | 'funnel_script_copied'
  | 'funnel_action_generated'
  | 'funnel_action_copied'
  | 'funnel_action_whatsapp'
  | 'closing_script_copied'
  | 'storytelling_generated'
  | 'storytelling_copied'
  | 'investment_storytelling_generated'
  | 'investment_storytelling_copied'
  | 'investment_storytelling_whatsapp'
  | 'niche_storytelling_generated'
  | 'niche_storytelling_copied'
  | 'niche_storytelling_whatsapp'
  | 'sales_script_generated'
  | 'sales_script_copied'
  | 'sales_script_whatsapp'
  // Integridade Carteira (Onda 3)
  | 'proposal_mutation_failed'
  | 'proposal_invalid_status_detected'
  | 'proposals_page_limit_reached'
  // Calibração Carteira (Onda 5) — fricção e fluxo de execução
  | 'proposal_status_change'
  | 'proposal_move_cancelled'
  | 'proposal_next_action_skip'
  // Cobertura mínima de instrumentação (auditoria 2026-04)
  | 'pdf_generated'
  | 'diagnostic_used'
  | 'comparator_used'
  | 'ai_call'
  // Performance / observabilidade IA (Onda final — instrumentação real)
  | 'ai_ttft'
  | 'ai_total_time'
  | 'ai_abandon'
  | 'ai_slow_indicator_shown'
  // Conversão Simulador → Carteira (Onda conversão)
  | 'simulator_save_as_proposal_click'
  | 'simulator_nudge_shown'
  | 'simulator_nudge_dismissed'
  | 'proposal_trigger_required_prompt'
  // Onda 3 — uso real da IA gerada (auditoria de conversão)
  | 'ai_content_copied'
  | 'ai_content_sent_whatsapp'
  | 'share_link_generated'
  | 'share_link_clicked'
  // Bypass capturado: usuário tentou criar proposta sem trigger por caminho automático
  | 'proposal_create_blocked_no_trigger'
  // PDF Premium consultivo (Proposta Completa)
  | 'proposal_pdf_premium_generated'
  | 'proposal_pdf_sent'
  // Follow-up automático a partir do score NPS da Proposta Completa
  | 'followup_message_generated'
  | 'followup_message_sent'
  | 'followup_response_received'
  // Navegação livre (Onda navegação — observabilidade)
  | 'navigation_changed'
  | 'navigation_invalid_target'
  | 'navigation_legacy_id'
  // Strategy Presentation V2 — Wave U8 (Preview Validation & Usage Intelligence)
  // Privacidade: zero PII; payload limitado a ids de blueprint, kinds de KPI,
  // contadores, durações e source ('investment' | 'patrimonial').
  | 'strategyv2_card_view'
  | 'strategyv2_card_select_toggle'
  | 'strategyv2_panel_open'
  | 'strategyv2_panel_close'
  | 'strategyv2_panel_section_toggle'
  | 'strategyv2_compare_open'
  | 'strategyv2_compare_close'
  | 'strategyv2_compare_remove'
  | 'strategyv2_compare_recovered'
  | 'strategyv2_decision_velocity';

export interface AnalyticsEventData {
  module?: string;
  group_number?: number | string;
  consortium_type?: string;
  scenario?: string;
  credit_range?: string;
  bid_percent?: number;
  copy_format?: 'whatsapp' | 'plain';
  [key: string]: unknown;
}

// In-memory cache for the authenticated user ID.
// Updated by AuthProvider via setAnalyticsCachedUserId on every auth state change
// (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, INITIAL_SESSION).
let cachedUserId: string | null = null;
// Pending events that arrived before the auth session was ready.
// Flushed once setAnalyticsCachedUserId receives a non-null id.
type PendingEvent = { eventName: AnalyticsEventName; data?: AnalyticsEventData; ts: string };
const pending: PendingEvent[] = [];
const PENDING_MAX = 50;
const PENDING_TTL_MS = 30_000;

async function resolveUserId(): Promise<string | null> {
  if (cachedUserId) return cachedUserId;
  // Fall back to a live session lookup. getSession() is in-memory (no network),
  // so it's safe to call frequently and won't rate-limit like getUser().
  try {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user?.id ?? null;
    if (id) cachedUserId = id;
    return id;
  } catch {
    return null;
  }
}

async function insertEvent(userId: string, eventName: AnalyticsEventName, data?: AnalyticsEventData): Promise<void> {
  if (import.meta.env.DEV) {
    // Dev visibility — verify real users are flowing through
    // eslint-disable-next-line no-console
    logger.log('[analytics]', eventName, userId, data ?? {});
  }
  const { error } = await supabase.from('analytics_events').insert({
    user_id: userId,
    event_name: eventName,
    event_data: (data || {}) as Json,
  });
  if (error && import.meta.env.DEV) {
    logger.warn('[analytics] insert failed', eventName, error.message);
  }
}

function flushPending(userId: string): void {
  if (pending.length === 0) return;
  const now = Date.now();
  const toSend = pending.splice(0, pending.length).filter(p => now - new Date(p.ts).getTime() < PENDING_TTL_MS);
  for (const p of toSend) {
    insertEvent(userId, p.eventName, p.data).catch(() => {});
  }
}

/**
 * Update the cached userId. Called from AuthProvider's auth state listener
 * to keep the cache in sync. When a real user becomes available, any events
 * queued during the auth-loading window are flushed.
 */
export function setAnalyticsCachedUserId(userId: string | null): void {
  cachedUserId = userId;
  if (userId) flushPending(userId);
}

/**
 * Track an analytics event (fire-and-forget).
 * Never throws. If the user session isn't ready yet (common for events fired
 * during initial app mount, e.g. module_access), the event is queued and sent
 * as soon as auth resolves — preventing silent loss for real users.
 */
export function trackEvent(eventName: AnalyticsEventName, data?: AnalyticsEventData): void {
  // LGPD Fase 2 — consent gate. Sem consentimento explícito, nenhum evento
  // sai do navegador. Eventos críticos de segurança (login/logout) podem ser
  // adicionados a uma allowlist no futuro se forem necessários para auditoria.
  if (!isAnalyticsAllowed()) return;
  // Detector de volume anormal (>50 eventos / 5min) — fire-and-forget,
  // não bloqueia o pipeline normal.
  noteEventForVolumeDetection();
  (async () => {
    try {
      const userId = await resolveUserId();
      if (!userId) {
        // Queue until auth is ready (drops oldest if overflow)
        if (pending.length >= PENDING_MAX) pending.shift();
        pending.push({ eventName, data, ts: new Date().toISOString() });
        return;
      }
      await insertEvent(userId, eventName, data);
    } catch {
      // Silent fail — never break app flow
    }
  })();
}

/**
 * Track event with explicit userId (for auth flows where user isn't cached yet).
 */
export function trackEventWithUser(userId: string, eventName: AnalyticsEventName, data?: AnalyticsEventData): void {
  cachedUserId = userId;
  insertEvent(userId, eventName, data).catch(() => {});
}

// ─── Security alerts ───────────────────────────────────────
// Bypassa o consent gate de analytics: alertas de segurança são essenciais
// para integridade do sistema e não constituem rastreamento comportamental
// (legítimo interesse de proteção). Nunca lança — silenciosamente desiste.

const VOLUME_WINDOW_MS = 5 * 60_000;
const VOLUME_THRESHOLD = 50;
const VOLUME_COOLDOWN_MS = 10 * 60_000;
const recentEventTimestamps: number[] = [];
let lastVolumeAlertAt = 0;

function noteEventForVolumeDetection(): void {
  const now = Date.now();
  recentEventTimestamps.push(now);
  // Poda janela
  const cutoff = now - VOLUME_WINDOW_MS;
  while (recentEventTimestamps.length && recentEventTimestamps[0] < cutoff) {
    recentEventTimestamps.shift();
  }
  if (
    recentEventTimestamps.length > VOLUME_THRESHOLD &&
    now - lastVolumeAlertAt > VOLUME_COOLDOWN_MS
  ) {
    lastVolumeAlertAt = now;
    trackSecurityEvent(
      'high_volume_activity',
      `${recentEventTimestamps.length} eventos em ${Math.round(VOLUME_WINDOW_MS / 60_000)} min`,
      { count: recentEventTimestamps.length, windowMs: VOLUME_WINDOW_MS },
    );
  }
}

export function trackSecurityEvent(
  alertType: string,
  description: string,
  metadata: Record<string, unknown> = {},
): void {
  (async () => {
    try {
      const userId = await resolveUserId();
      if (!userId) return;
      // RPC ainda não tipada no client; cast estreito.
      await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>)('log_security_event', {
        p_user_id: userId,
        p_alert_type: alertType,
        p_description: description,
        p_metadata: metadata as unknown as Json,
      });
    } catch {
      // Silent fail — security event tracking must never break app flow
    }
  })();
}

