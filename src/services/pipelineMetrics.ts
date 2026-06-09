/**
 * pipelineMetrics — agregações de funil sobre proposal_events + proposals.
 * Toda a aritmética é determinística e roda no cliente a partir dos eventos imutáveis.
 */
import { supabase } from '@/integrations/supabase/client';
import type { ProposalStatus } from '@/services/proposals';
import type { ProposalEvent } from '@/services/proposalEvents';

import { logger } from '@/utils/logger';
export type RangeDays = 7 | 30 | 90 | 'all';

export interface PipelineMetrics {
  /** Conversão entre etapas consecutivas da jornada ativa. */
  stageConversion: Array<{
    fromStatus: ProposalStatus;
    toStatus: ProposalStatus;
    entered: number;   // leads que passaram por fromStatus no período
    advanced: number;  // dos que entraram, quantos chegaram a toStatus (ou além)
    rate: number;      // 0..1
  }>;
  /** Tempo médio (em dias) que um lead passa em cada coluna antes de sair. */
  avgTimePerStatus: Array<{
    status: ProposalStatus;
    avgDays: number;
    sampleSize: number;
  }>;
  /** Ticket médio dos leads que entraram em "fechado" no período. */
  avgClosedTicket: {
    avgCredit: number;
    closedCount: number;
  };
  /** Lista de propostas fechadas no período (para exportação). */
  closedProposals: Array<{
    id: string;
    client_name: string;
    consortium_type: string;
    credit_value: number;
    updated_at: string;
  }>;
  rangeDays: RangeDays;
  /** Quando rangeDays === 'all' isto é null. */
  cutoffISO: string | null;
}

/** Ordem canônica do funil para cálculo de avanços. */
const FUNNEL_ORDER: ProposalStatus[] = [
  'prospeccao',
  'aguardando_retorno',
  'em_avaliacao',
  'proposta_ajustada',
  'fechado',
];

const STATUS_RANK: Record<ProposalStatus, number> = {
  prospeccao: 0,
  aguardando_retorno: 1,
  em_avaliacao: 2,
  proposta_ajustada: 3,
  fechado: 4,
  perdido: -1, // saída lateral, não conta como avanço
};

function cutoffFor(rangeDays: RangeDays): Date | null {
  if (rangeDays === 'all') return null;
  const d = new Date();
  d.setDate(d.getDate() - rangeDays);
  return d;
}

/** KPIs agregados de um intervalo `[since, until)` — usado para comparação. */
export interface PeriodKpis {
  overallConversion: number; // 0..1 (prospeccao → fechado)
  avgTotalTimeDays: number;  // soma das médias por etapa ativa
  avgClosedTicket: number;   // R$
  closedCount: number;
  enteredCount: number;      // leads que tocaram prospeccao no período
}

/** Limite de proteção: nunca mais que isso por chamada agregada. */
const PIPELINE_EVENTS_LIMIT = 20000;

/** Colunas mínimas necessárias para os cálculos agregados. */
const EVENT_AGG_COLS = 'id,proposal_id,event_type,from_status,to_status,created_at';

async function computeKpisForRange(since: Date | null, until: Date | null): Promise<PeriodKpis> {
  // Eventos no intervalo — só os tipos que afetam status/funil, com colunas mínimas.
  let q = supabase
    .from('proposal_events')
    .select(EVENT_AGG_COLS)
    .in('event_type', ['status_change', 'created'])
    .order('created_at', { ascending: true })
    .range(0, PIPELINE_EVENTS_LIMIT - 1);
  if (since) q = q.gte('created_at', since.toISOString());
  if (until) q = q.lt('created_at', until.toISOString());
  const { data: evData } = await q;
  const events = (evData ?? []) as ProposalEvent[];

  // Conversão Prospecção → Fechado
  const reached = new Map<string, Set<ProposalStatus>>();
  for (const ev of events) {
    if (ev.event_type !== 'status_change' && ev.event_type !== 'created') continue;
    const status = ev.to_status;
    if (!status) continue;
    if (!reached.has(ev.proposal_id)) reached.set(ev.proposal_id, new Set());
    reached.get(ev.proposal_id)!.add(status);
    const rank = STATUS_RANK[status];
    if (rank >= 0) {
      for (const s of FUNNEL_ORDER) {
        if (STATUS_RANK[s] <= rank) reached.get(ev.proposal_id)!.add(s);
      }
    }
  }
  let entered = 0, advanced = 0;
  for (const set of reached.values()) {
    if (set.has('prospeccao')) {
      entered += 1;
      if (set.has('fechado')) advanced += 1;
    }
  }

  // Tempo médio por etapa (timeline completa das propostas tocadas)
  const proposalIds = Array.from(reached.keys());
  let allEv: ProposalEvent[] = events;
  if (proposalIds.length > 0 && since) {
    const { data: full } = await supabase
      .from('proposal_events')
      .select(EVENT_AGG_COLS)
      .in('proposal_id', proposalIds)
      .in('event_type', ['status_change', 'created'])
      .order('created_at', { ascending: true })
      .range(0, PIPELINE_EVENTS_LIMIT - 1);
    allEv = (full ?? []) as ProposalEvent[];
  }
  const byProp = new Map<string, ProposalEvent[]>();
  for (const ev of allEv) {
    if (ev.event_type !== 'status_change' && ev.event_type !== 'created') continue;
    if (!byProp.has(ev.proposal_id)) byProp.set(ev.proposal_id, []);
    byProp.get(ev.proposal_id)!.push(ev);
  }
  const timeAcc: Partial<Record<ProposalStatus, { totalMs: number; count: number }>> = {};
  for (const list of byProp.values()) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (let i = 0; i < list.length - 1; i++) {
      const cur = list[i], next = list[i + 1];
      const st = cur.to_status;
      if (!st) continue;
      const delta = new Date(next.created_at).getTime() - new Date(cur.created_at).getTime();
      if (delta <= 0) continue;
      const acc = timeAcc[st] ?? { totalMs: 0, count: 0 };
      acc.totalMs += delta;
      acc.count += 1;
      timeAcc[st] = acc;
    }
  }
  let avgTotalTimeDays = 0;
  for (const st of FUNNEL_ORDER) {
    if (st === 'fechado') continue;
    const acc = timeAcc[st];
    if (acc && acc.count > 0) avgTotalTimeDays += acc.totalMs / acc.count / 86400000;
  }

  // Ticket médio fechado no intervalo
  let pq = supabase.from('proposals').select('credit_value, updated_at').eq('status', 'fechado').range(0, 5000);
  if (since) pq = pq.gte('updated_at', since.toISOString());
  if (until) pq = pq.lt('updated_at', until.toISOString());
  const { data: closed } = await pq;
  const closedCount = (closed ?? []).length;
  const avgClosedTicket = closedCount > 0
    ? (closed ?? []).reduce((s, p) => s + Number(p.credit_value || 0), 0) / closedCount
    : 0;

  return {
    overallConversion: entered > 0 ? advanced / entered : 0,
    avgTotalTimeDays,
    avgClosedTicket,
    closedCount,
    enteredCount: entered,
  };
}

/** KPIs do período imediatamente anterior ao range atual (mesma duração). Null para 'all'. */
export async function computePreviousPeriodKpis(rangeDays: RangeDays): Promise<PeriodKpis | null> {
  if (rangeDays === 'all') return null;
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() - rangeDays);
  const since = new Date(until);
  since.setDate(since.getDate() - rangeDays);
  return computeKpisForRange(since, until);
}

export async function computePipelineMetrics(rangeDays: RangeDays): Promise<PipelineMetrics> {
  const cutoff = cutoffFor(rangeDays);
  const cutoffISO = cutoff ? cutoff.toISOString() : null;

  // 1) Eventos no período (status_change e created cobrem entradas em status).
  let eventsQuery = supabase
    .from('proposal_events')
    .select(EVENT_AGG_COLS)
    .in('event_type', ['status_change', 'created'])
    .order('created_at', { ascending: true })
    .range(0, PIPELINE_EVENTS_LIMIT - 1);
  if (cutoffISO) eventsQuery = eventsQuery.gte('created_at', cutoffISO);

  const { data: eventsData, error: eventsErr } = await eventsQuery;
  if (eventsErr) {
    logger.error('[pipelineMetrics] events error', eventsErr);
  }
  const events = (eventsData ?? []) as ProposalEvent[];

  // 2) Para tempo-por-status precisamos da TIMELINE COMPLETA por proposta (não só dentro do range).
  //    Buscamos todos os eventos de status das propostas tocadas no período.
  const proposalIds = Array.from(new Set(events.map(e => e.proposal_id)));
  let allEvents: ProposalEvent[] = events;
  if (proposalIds.length > 0 && cutoffISO) {
    const { data: fullData } = await supabase
      .from('proposal_events')
      .select(EVENT_AGG_COLS)
      .in('proposal_id', proposalIds)
      .in('event_type', ['status_change', 'created'])
      .order('created_at', { ascending: true })
      .range(0, PIPELINE_EVENTS_LIMIT - 1);
    allEvents = (fullData ?? []) as ProposalEvent[];
  }

  // 3) Propostas (para credit_value do ticket médio).
  let proposalsQuery = supabase
    .from('proposals')
    .select('id, client_name, consortium_type, credit_value, status, updated_at')
    .eq('status', 'fechado')
    .range(0, 5000);
  if (cutoffISO) proposalsQuery = proposalsQuery.gte('updated_at', cutoffISO);
  const { data: closedData } = await proposalsQuery;
  const closedProposals = closedData ?? [];

  // ─── Conversão por etapa ───
  // Para cada lead, identifica o status MÁXIMO atingido (no período) e os status pelos quais passou.
  const reachedByProposal = new Map<string, Set<ProposalStatus>>();
  for (const ev of events) {
    if (ev.event_type !== 'status_change' && ev.event_type !== 'created') continue;
    const status = ev.to_status;
    if (!status) continue;
    if (!reachedByProposal.has(ev.proposal_id)) reachedByProposal.set(ev.proposal_id, new Set());
    reachedByProposal.get(ev.proposal_id)!.add(status);
    // Se atingiu um status, considera que passou por todos os anteriores no funil.
    const rank = STATUS_RANK[status];
    if (rank >= 0) {
      for (const s of FUNNEL_ORDER) {
        if (STATUS_RANK[s] <= rank) reachedByProposal.get(ev.proposal_id)!.add(s);
      }
    }
  }

  const stageConversion = FUNNEL_ORDER.slice(0, -1).map((from, i) => {
    const to = FUNNEL_ORDER[i + 1];
    let entered = 0, advanced = 0;
    for (const reached of reachedByProposal.values()) {
      if (reached.has(from)) {
        entered += 1;
        if (reached.has(to)) advanced += 1;
      }
    }
    return {
      fromStatus: from,
      toStatus: to,
      entered,
      advanced,
      rate: entered > 0 ? advanced / entered : 0,
    };
  });

  // ─── Tempo médio por status ───
  // Agrupa eventos completos por proposta e mede deltas entre mudanças de status.
  const byProposal = new Map<string, ProposalEvent[]>();
  for (const ev of allEvents) {
    if (ev.event_type !== 'status_change' && ev.event_type !== 'created') continue;
    if (!byProposal.has(ev.proposal_id)) byProposal.set(ev.proposal_id, []);
    byProposal.get(ev.proposal_id)!.push(ev);
  }

  const timeAcc: Record<ProposalStatus, { totalMs: number; count: number }> = {
    prospeccao: { totalMs: 0, count: 0 },
    aguardando_retorno: { totalMs: 0, count: 0 },
    em_avaliacao: { totalMs: 0, count: 0 },
    proposta_ajustada: { totalMs: 0, count: 0 },
    fechado: { totalMs: 0, count: 0 },
    perdido: { totalMs: 0, count: 0 },
  };

  for (const list of byProposal.values()) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (let i = 0; i < list.length - 1; i++) {
      const cur = list[i];
      const next = list[i + 1];
      const status = cur.to_status;
      if (!status) continue;
      const delta = new Date(next.created_at).getTime() - new Date(cur.created_at).getTime();
      if (delta <= 0) continue;
      timeAcc[status].totalMs += delta;
      timeAcc[status].count += 1;
    }
  }

  const avgTimePerStatus = (Object.keys(timeAcc) as ProposalStatus[])
    .filter(s => s !== 'perdido' && s !== 'fechado')
    .map(status => ({
      status,
      avgDays: timeAcc[status].count > 0
        ? timeAcc[status].totalMs / timeAcc[status].count / (1000 * 60 * 60 * 24)
        : 0,
      sampleSize: timeAcc[status].count,
    }));

  // ─── Ticket médio fechado ───
  const closedCount = closedProposals.length;
  const avgCredit = closedCount > 0
    ? closedProposals.reduce((sum, p) => sum + Number(p.credit_value || 0), 0) / closedCount
    : 0;

  return {
    stageConversion,
    avgTimePerStatus,
    avgClosedTicket: { avgCredit, closedCount },
    closedProposals: closedProposals.map(p => ({
      id: p.id,
      client_name: p.client_name ?? '',
      consortium_type: p.consortium_type ?? '',
      credit_value: Number(p.credit_value || 0),
      updated_at: p.updated_at,
    })),
    rangeDays,
    cutoffISO,
  };
}

// ─── Exportação CSV ───

function csvEscape(v: unknown): string {
  const s = String(v ?? '');
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const STATUS_LABEL_PT: Record<ProposalStatus, string> = {
  prospeccao: 'Prospecção',
  aguardando_retorno: 'Aguardando retorno',
  em_avaliacao: 'Em avaliação',
  proposta_ajustada: 'Proposta ajustada',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

export function metricsToCSV(metrics: PipelineMetrics): string {
  const lines: string[] = [];
  const periodo = metrics.rangeDays === 'all' ? 'Todo o período' : `Últimos ${metrics.rangeDays} dias`;

  lines.push(`Relatório de Métricas do Pipeline`);
  lines.push(`Período;${csvEscape(periodo)}`);
  lines.push(`Gerado em;${csvEscape(new Date().toLocaleString('pt-BR'))}`);
  lines.push('');

  lines.push('CONVERSÃO POR ETAPA');
  lines.push('De;Para;Entraram;Avançaram;Taxa (%)');
  for (const s of metrics.stageConversion) {
    lines.push([
      csvEscape(STATUS_LABEL_PT[s.fromStatus]),
      csvEscape(STATUS_LABEL_PT[s.toStatus]),
      s.entered,
      s.advanced,
      (s.rate * 100).toFixed(1).replace('.', ','),
    ].join(';'));
  }
  lines.push('');

  lines.push('TEMPO MÉDIO POR ETAPA');
  lines.push('Etapa;Tempo médio (dias);Amostra (n)');
  for (const t of metrics.avgTimePerStatus) {
    lines.push([
      csvEscape(STATUS_LABEL_PT[t.status]),
      t.avgDays.toFixed(2).replace('.', ','),
      t.sampleSize,
    ].join(';'));
  }
  lines.push('');

  lines.push('TICKET MÉDIO FECHADO');
  lines.push('Vendas no período;Ticket médio (R$)');
  lines.push([
    metrics.avgClosedTicket.closedCount,
    metrics.avgClosedTicket.avgCredit.toFixed(2).replace('.', ','),
  ].join(';'));
  lines.push('');

  lines.push('PROPOSTAS FECHADAS NO PERÍODO');
  lines.push('Cliente;Tipo;Crédito (R$);Data');
  for (const p of metrics.closedProposals) {
    lines.push([
      csvEscape(p.client_name || '—'),
      csvEscape(p.consortium_type),
      p.credit_value.toFixed(2).replace('.', ','),
      csvEscape(new Date(p.updated_at).toLocaleDateString('pt-BR')),
    ].join(';'));
  }

  return lines.join('\n');
}

export function downloadMetricsCSV(metrics: PipelineMetrics): void {
  const csv = metricsToCSV(metrics);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const periodo = metrics.rangeDays === 'all' ? 'todo' : `${metrics.rangeDays}d`;
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `metricas-pipeline-${periodo}-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
