/**
 * Shared analytics funnel data service.
 *
 * Funil revisado (2026-05) — mede o CAMINHO DOMINANTE da plataforma cruzando
 * `analytics_events` + `audit_logs`, contando USUÁRIOS ÚNICOS (não eventos
 * totais) em cada etapa.
 *
 * Cobre métricas ricas adicionais que reaproveitam dados já existentes:
 *  - Conversão real da Carteira (audit_logs)
 *  - Funil de PDFs (gerados vs enviados)
 *  - Engajamento por módulo (module_access)
 *  - Retenção semanal simples (session_login)
 */
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────

export interface RawAnalyticsEvent {
  event_name: string;
  created_at: string;
  event_data: Record<string, unknown> | null;
  user_id?: string | null;
}

export interface RawAuditLog {
  user_id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface EventCount {
  event_name: string;
  count: number;
}

export interface DailyCount {
  day: string;
  count: number;
}

export interface FunnelStep {
  key: string;
  name: string;
  description: string;
  count: number; // unique users
}

export interface FunnelBottleneck {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  rate: number;
}

export interface CarteiraMetrics {
  created: number;
  closed: number;
  lost: number;
  deleted: number;
  closeRate: number | null; // closed / (closed + lost) * 100
  avgDaysToClose: number | null;
  avgDaysToLose: number | null;
  avgTicketByType: Record<string, { avg: number; count: number }>;
}

export interface PdfFunnelMetrics {
  generated: number;
  sent: number;
  sendRate: number | null; // sent / generated * 100
}

export interface ModuleEngagementMetrics {
  top: Array<{ module: string; uniqueUsers: number; total: number }>;
  avgModulesPerUser: number | null;
}

export interface RetentionMetrics {
  retained: number; // usuários com login em 2+ semanas ISO da janela
  atRisk: number; // logaram só em 1 semana
  totalActiveUsers: number;
}

export interface AnalyticsSummary {
  events: RawAnalyticsEvent[];
  eventCounts: EventCount[];
  dailyCounts: DailyCount[];
  scenarioCounts: Record<string, number>;
  typeCounts: Record<string, number>; // mantido para compat; vazio (argument_generated removido)
  funnel: FunnelStep[];
  totalEvents: number;
  bottleneck: FunnelBottleneck | null;
  overallConversionRate: number | null;
  carteira: CarteiraMetrics;
  pdfFunnel: PdfFunnelMetrics;
  moduleEngagement: ModuleEngagementMetrics;
  retention: RetentionMetrics;
}

// ─── Funnel Config ────────────────────────────────────────────────────────

interface FunnelStepConfig {
  key: string;
  name: string;
  description: string;
  events?: readonly string[]; // OR-match em analytics_events
  auditAction?: string; // match em audit_logs.action
}

/**
 * Funil dominante da plataforma. Cada etapa = COUNT(DISTINCT user_id).
 *
 *   simulação → intenção de proposta → lead na carteira → proposta enviada → fechamento
 *
 * `proposal_intent` agrega "Salvar como Proposta" (caminho real, ~247/30d) e
 * a abertura da aba Proposta (caminho legado, ~48/30d) — OR.
 * `proposal_sent` agrega PDF gerado, cópia da proposta e cópia de conteúdo IA.
 * `deal_closed` vem de audit_logs (close_proposal).
 */
export const FUNNEL_STEPS_CONFIG: readonly FunnelStepConfig[] = [
  {
    key: 'simulation_generated',
    name: 'Simulações Geradas',
    description: 'Usuário gerou ao menos uma simulação',
    events: ['simulation_generated'],
  },
  {
    key: 'proposal_intent',
    name: 'Intenção de Proposta',
    description: 'Clicou em "Salvar como Proposta" ou abriu a aba Proposta',
    events: ['simulator_save_as_proposal_click', 'proposal_tab_viewed'],
  },
  {
    key: 'lead_created',
    name: 'Lead Criado na Carteira',
    description: 'Proposta criada no pipeline',
    events: ['pipeline_lead_created'],
  },
  {
    key: 'proposal_sent',
    name: 'Proposta Enviada',
    description: 'PDF gerado ou proposta copiada',
    events: ['pdf_generated', 'proposal_copied', 'ai_content_copied'],
  },
  {
    key: 'deal_closed',
    name: 'Negócio Fechado',
    description: 'Proposta movida para fechado',
    auditAction: 'close_proposal',
  },
] as const;

// ─── Fetchers ─────────────────────────────────────────────────────────────

/**
 * Eventos consumidos pelo dashboard. Filtramos server-side por
 * `event_name IN (...)` para evitar que o cap de 30k linhas (ordenado desc)
 * descarte eventos raros e antigos — ex.: `proposal_pdf_sent` (~61 registros
 * em 30d) ficava perdido entre dezenas de milhares de `module_access` /
 * `navigation_changed`, fazendo o card "Funil de PDFs" mostrar 0 enviados.
 */
const TRACKED_EVENT_NAMES = [
  // Funil
  'simulation_generated',
  'simulator_save_as_proposal_click',
  'proposal_tab_viewed',
  'pipeline_lead_created',
  'pdf_generated',
  'proposal_copied',
  'ai_content_copied',
  'proposal_pdf_sent',
  // Métricas ricas
  'simulate_from_bids',
  'module_access',
  'session_login',
] as const;

export async function fetchAnalyticsEvents(days = 30): Promise<RawAnalyticsEvent[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from('analytics_events')
    .select('event_name, created_at, event_data, user_id')
    .gte('created_at', since)
    .in('event_name', TRACKED_EVENT_NAMES as unknown as string[])
    .order('created_at', { ascending: false })
    .range(0, 30000);
  return (data as RawAnalyticsEvent[]) || [];
}

export async function fetchAuditLogsForAnalytics(days = 30): Promise<RawAuditLog[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from('audit_logs')
    .select('user_id, action, entity, entity_id, metadata, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .range(0, 10000);
  return (data as RawAuditLog[]) || [];
}

export interface AnalyticsBundle {
  events: RawAnalyticsEvent[];
  auditLogs: RawAuditLog[];
}

export async function fetchAnalyticsBundle(days = 30): Promise<AnalyticsBundle> {
  const [events, auditLogs] = await Promise.all([
    fetchAnalyticsEvents(days),
    fetchAuditLogsForAnalytics(days),
  ]);
  return { events, auditLogs };
}

// ─── Processing ───────────────────────────────────────────────────────────

export function processAnalyticsBundle(
  bundle: AnalyticsBundle,
  userFilter?: string,
): AnalyticsSummary {
  const events = userFilter
    ? bundle.events.filter(e => e.user_id === userFilter)
    : bundle.events;
  const auditLogs = userFilter
    ? bundle.auditLogs.filter(l => l.user_id === userFilter)
    : bundle.auditLogs;

  const counts: Record<string, number> = {};
  const daily: Record<string, number> = {};
  const scenarios: Record<string, number> = {};

  for (const event of events) {
    counts[event.event_name] = (counts[event.event_name] || 0) + 1;
    if (event.created_at) {
      const day = event.created_at.slice(0, 10);
      daily[day] = (daily[day] || 0) + 1;
    }
    if (event.event_name === 'simulate_from_bids' && event.event_data) {
      const scenario = String(event.event_data.scenario || 'desconhecido');
      scenarios[scenario] = (scenarios[scenario] || 0) + 1;
    }
    // `argument_generated` removido — sem call site no projeto, agregação morta.
  }

  const eventCounts = Object.entries(counts)
    .map(([event_name, count]) => ({ event_name, count }))
    .sort((a, b) => b.count - a.count);

  const dailyCounts = buildDailyCounts(daily, 14);

  // Funil — usuários únicos por etapa
  const funnel: FunnelStep[] = FUNNEL_STEPS_CONFIG.map(step => {
    const users = new Set<string>();
    if (step.events) {
      for (const e of events) {
        if (e.user_id && step.events.includes(e.event_name)) users.add(e.user_id);
      }
    }
    if (step.auditAction) {
      for (const l of auditLogs) {
        if (l.user_id && l.action === step.auditAction) users.add(l.user_id);
      }
    }
    return { key: step.key, name: step.name, description: step.description, count: users.size };
  });

  const totalEvents = eventCounts.reduce((sum, ec) => sum + ec.count, 0);
  const bottleneck = findBottleneck(funnel);

  const first = funnel[0].count;
  const last = funnel[funnel.length - 1].count;
  const overallConversionRate = first > 0 ? (last / first) * 100 : null;

  return {
    events,
    eventCounts,
    dailyCounts,
    scenarioCounts: scenarios,
    typeCounts: {},
    funnel,
    totalEvents,
    bottleneck,
    overallConversionRate,
    carteira: computeCarteiraMetrics(auditLogs),
    pdfFunnel: computePdfFunnel(counts),
    moduleEngagement: computeModuleEngagement(events),
    retention: computeRetention(events),
  };
}

/** Back-compat: API antiga, sem audit_logs. */
export function processAnalyticsEvents(
  events: RawAnalyticsEvent[],
  userFilter?: string,
): AnalyticsSummary {
  return processAnalyticsBundle({ events, auditLogs: [] }, userFilter);
}

// ─── Métricas ricas ──────────────────────────────────────────────────────

function computeCarteiraMetrics(logs: RawAuditLog[]): CarteiraMetrics {
  let created = 0;
  let closed = 0;
  let lost = 0;
  let deleted = 0;
  const createdAtById: Record<string, string> = {};
  const ticketsByType: Record<string, { sum: number; n: number }> = {};

  for (const l of logs) {
    if (l.entity !== 'proposal') continue;
    if (l.action === 'create_proposal') {
      created++;
      if (l.entity_id) createdAtById[l.entity_id] = l.created_at;
      const md = l.metadata || {};
      const cv = Number(md.credit_value);
      const ct = String(md.consortium_type || 'desconhecido');
      if (Number.isFinite(cv) && cv > 0) {
        if (!ticketsByType[ct]) ticketsByType[ct] = { sum: 0, n: 0 };
        ticketsByType[ct].sum += cv;
        ticketsByType[ct].n += 1;
      }
    } else if (l.action === 'close_proposal') {
      closed++;
    } else if (l.action === 'lose_proposal') {
      lost++;
    } else if (l.action === 'delete_proposal') {
      deleted++;
    }
  }

  // Durações precisam do mapa de criação pronto
  const closeDurations: number[] = [];
  const loseDurations: number[] = [];
  for (const l of logs) {
    if (l.entity !== 'proposal' || !l.entity_id) continue;
    const cAt = createdAtById[l.entity_id];
    if (!cAt) continue;
    const days = (new Date(l.created_at).getTime() - new Date(cAt).getTime()) / 86400000;
    if (days < 0) continue;
    if (l.action === 'close_proposal') closeDurations.push(days);
    else if (l.action === 'lose_proposal') loseDurations.push(days);
  }

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const closeRate = closed + lost > 0 ? (closed / (closed + lost)) * 100 : null;

  const avgTicketByType: Record<string, { avg: number; count: number }> = {};
  for (const [k, v] of Object.entries(ticketsByType)) {
    avgTicketByType[k] = { avg: v.sum / v.n, count: v.n };
  }

  return {
    created,
    closed,
    lost,
    deleted,
    closeRate,
    avgDaysToClose: avg(closeDurations),
    avgDaysToLose: avg(loseDurations),
    avgTicketByType,
  };
}

function computePdfFunnel(counts: Record<string, number>): PdfFunnelMetrics {
  const generated = counts['pdf_generated'] || 0;
  const sent = counts['proposal_pdf_sent'] || 0;
  // Cap em 100%: `sent` pode incluir PDFs cuja geração ocorreu fora da janela.
  const rawRate = generated > 0 ? (sent / generated) * 100 : null;
  return {
    generated,
    sent,
    sendRate: rawRate === null ? null : Math.min(rawRate, 100),
  };
}

function computeModuleEngagement(events: RawAnalyticsEvent[]): ModuleEngagementMetrics {
  const perModule: Record<string, { users: Set<string>; total: number }> = {};
  const modulesPerUser: Record<string, Set<string>> = {};

  for (const e of events) {
    if (e.event_name !== 'module_access') continue;
    const m = String(e.event_data?.module || '').trim();
    if (!m) continue;
    if (!perModule[m]) perModule[m] = { users: new Set(), total: 0 };
    perModule[m].total++;
    if (e.user_id) {
      perModule[m].users.add(e.user_id);
      if (!modulesPerUser[e.user_id]) modulesPerUser[e.user_id] = new Set();
      modulesPerUser[e.user_id].add(m);
    }
  }

  const top = Object.entries(perModule)
    .map(([module, v]) => ({ module, uniqueUsers: v.users.size, total: v.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const userSets = Object.values(modulesPerUser);
  const avgModulesPerUser = userSets.length
    ? userSets.reduce((acc, s) => acc + s.size, 0) / userSets.length
    : null;

  return { top, avgModulesPerUser };
}

function isoWeekKey(date: Date): string {
  // Chave ISO YYYY-Www (semana começando na segunda)
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function computeRetention(events: RawAnalyticsEvent[]): RetentionMetrics {
  const weeksByUser: Record<string, Set<string>> = {};
  for (const e of events) {
    if (e.event_name !== 'session_login' || !e.user_id || !e.created_at) continue;
    const key = isoWeekKey(new Date(e.created_at));
    if (!weeksByUser[e.user_id]) weeksByUser[e.user_id] = new Set();
    weeksByUser[e.user_id].add(key);
  }
  let retained = 0;
  let atRisk = 0;
  for (const set of Object.values(weeksByUser)) {
    if (set.size >= 2) retained++;
    else atRisk++;
  }
  return { retained, atRisk, totalActiveUsers: retained + atRisk };
}

// ─── Bottleneck ──────────────────────────────────────────────────────────

export function findBottleneck(funnel: FunnelStep[]): FunnelBottleneck | null {
  let worst: FunnelBottleneck | null = null;
  let worstRate = Infinity;

  for (let i = 1; i < funnel.length; i++) {
    const prev = funnel[i - 1];
    const curr = funnel[i];
    if (prev.count === 0) continue;

    const rate = (curr.count / prev.count) * 100;
    if (rate < worstRate) {
      worstRate = rate;
      worst = {
        from: prev.key,
        to: curr.key,
        fromName: prev.name,
        toName: curr.name,
        rate,
      };
    }
  }

  return worst;
}

export function getStepConversionRate(
  funnel: FunnelStep[],
  fromKey: string,
  toKey: string,
): number | null {
  const from = funnel.find(s => s.key === fromKey);
  const to = funnel.find(s => s.key === toKey);
  if (!from || !to || from.count === 0) return null;
  return (to.count / from.count) * 100;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildDailyCounts(daily: Record<string, number>, days: number): DailyCount[] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 86400000);
    const key = date.toISOString().slice(0, 10);
    return {
      day: `${date.getDate()}/${date.getMonth() + 1}`,
      count: daily[key] || 0,
    };
  });
}
