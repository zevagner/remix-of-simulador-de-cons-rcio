/**
 * Cadence Rules — fonte ÚNICA de verdade para regras temporais do pipeline.
 *
 * Onda 5 — Calibração:
 *   • SLA por coluna (warn/critical específicos), em vez de cadência global.
 *   • Período de graça pós-criação para o badge "sem próxima ação".
 *   • Helpers para hierarquia visual (qual alerta tem precedência).
 *
 * Onda 4 unificou as constantes globais; Onda 5 as torna sensíveis ao estágio:
 *   prospeccao         → warn 5d / critical 10d  (qualificação tem mais respiro)
 *   aguardando_retorno → warn 3d / critical 7d   (cliente já mexeu, follow-up curto)
 *   em_avaliacao       → warn 4d / critical 8d
 *   proposta_ajustada  → warn 4d / critical 8d
 */
import type { ProposalStatus } from '@/services/proposals';

/** SLA por coluna ativa. Valores em dias. */
export const COLUMN_SLA: Record<ProposalStatus, { warn: number; critical: number }> = {
  prospeccao:         { warn: 5, critical: 10 },
  aguardando_retorno: { warn: 3, critical: 7 },
  em_avaliacao:       { warn: 4, critical: 8 },
  proposta_ajustada:  { warn: 4, critical: 8 },
  fechado:            { warn: Infinity, critical: Infinity },
  perdido:            { warn: Infinity, critical: Infinity },
};

/**
 * Compatibilidade Onda 4 — defaults mais "conservadores" usados por componentes
 * agregadores (AlertsCenter, DailyAgenda) que ainda olham a frota inteira sem
 * desagregar por coluna. Quando faz sentido por-coluna, prefira getStaleness().
 */
export const STALE_DAYS_WARN = 3;
export const STALE_DAYS_CRITICAL = 7;

/** Statuses ativos (não-terminais) que entram em alertas/agenda. */
export const ACTIVE_STATUSES: ReadonlySet<ProposalStatus> = new Set([
  'prospeccao',
  'aguardando_retorno',
  'em_avaliacao',
  'proposta_ajustada',
]);

/** Período de graça pós-criação: leads recém-criados não recebem badge "defina ação". */
export const NEW_LEAD_GRACE_HOURS = 48;

/**
 * Onda 7.1 — Graduação do sinal "missing-action" proporcional ao SLA da coluna,
 * com janela soft mínima garantida.
 *
 *   soft   → começa quando termina a graça (48h)
 *   strong → começa em max(graça + MIN_SOFT_WINDOW_HOURS, ratio × warn)
 *
 * A correção `max(...)` impede que colunas com warn curto (ex.: aguardando_retorno=3d
 * → 0.5×3d = 1.5d = 36h) "engulam" a janela soft (que só começa em 48h). Garante
 * que o usuário sempre veja pelo menos 24h de "convite suave" antes do badge forte.
 *
 * Exemplos resultantes:
 *   prospeccao (warn 5d):        soft 48h → strong 60h (2.5d)
 *   em_avaliacao (warn 4d):      soft 48h → strong 72h (max(72, 48))
 *   proposta_ajustada (warn 4d): soft 48h → strong 72h
 *   aguardando_retorno (warn 3d):soft 48h → strong 72h (max(72, 36))
 */
export const MISSING_ACTION_STRONG_SLA_RATIO = 0.5;
export const MISSING_ACTION_MIN_SOFT_WINDOW_HOURS = 24;

/** Calcula dias desde uma data ISO (sempre >= 0). */
export function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)));
}

/** Calcula horas desde uma data ISO (sempre >= 0). */
export function hoursSince(iso: string): number {
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60));
}

/** Classifica inatividade de uma proposta com base na cadência única. */
export type StalenessLevel = 'fresh' | 'warn' | 'critical';

/**
 * Versão compatibilidade (cadência global) — mantida para AlertsCenter/DailyAgenda
 * que operam sobre a frota inteira sem desagregar por coluna.
 */
export function getStalenessLevel(updatedAt: string): StalenessLevel {
  const d = daysSince(updatedAt);
  if (d >= STALE_DAYS_CRITICAL) return 'critical';
  if (d >= STALE_DAYS_WARN) return 'warn';
  return 'fresh';
}

/**
 * Classificação por SLA da coluna. Use isto nos cards (que conhecem o status).
 * Devolve 'fresh' para terminais (Infinity).
 */
export function getStalenessForStatus(updatedAt: string, status: ProposalStatus): StalenessLevel {
  const d = daysSince(updatedAt);
  const sla = COLUMN_SLA[status];
  if (d >= sla.critical) return 'critical';
  if (d >= sla.warn) return 'warn';
  return 'fresh';
}

/** Helper: a proposta tem próxima ação definida? */
export function hasNextAction(p: { next_action_type?: string | null }): boolean {
  return Boolean(p.next_action_type);
}

/**
 * Lead está dentro do período de graça pós-criação?
 * Onda 5: usado para suprimir o badge "🎯 Defina a próxima ação" em leads novos
 * (especialmente em prospecção, onde o vendedor ainda está qualificando).
 */
export function isInGracePeriod(createdAt: string): boolean {
  return hoursSince(createdAt) < NEW_LEAD_GRACE_HOURS;
}

/**
 * Hierarquia visual — Onda 5.
 *
 * Regras:
 *   • critical (faixa vermelha) ABSORVE qualquer outro alerta — ele já comunica
 *     a urgência máxima; mostrar "defina ação" em cima vira ruído.
 *   • warn (faixa amarela) ABSORVE o badge "defina ação" pelo mesmo motivo:
 *     o usuário já é puxado a abrir o card; ao fazê-lo, define a ação ali.
 *   • Badge "defina ação" só aparece quando NÃO há staleness E o lead já
 *     passou do período de graça.
 *
 * Devolve qual sinal exibir como "primário" para o card.
 */
export type CardAlertLevel =
  | 'critical'
  | 'warn'
  | 'missing-action-strong'
  | 'missing-action-soft'
  | 'none';

export function getCardAlertLevel(p: {
  status: ProposalStatus;
  updated_at: string;
  created_at: string;
  next_action_type?: string | null;
}): CardAlertLevel {
  if (!ACTIVE_STATUSES.has(p.status)) return 'none';
  const staleness = getStalenessForStatus(p.updated_at, p.status);
  if (staleness === 'critical') return 'critical';
  if (staleness === 'warn') return 'warn';
  if (hasNextAction(p)) return 'none';
  if (isInGracePeriod(p.created_at)) return 'none';
  // Onda 7.1: limiar strong = max(graça + janela soft mínima, ratio × warn da coluna).
  // Garante que a janela soft tenha sempre ≥ MISSING_ACTION_MIN_SOFT_WINDOW_HOURS,
  // mesmo em colunas com SLA curto (ex.: aguardando_retorno warn=3d).
  const ageHours = hoursSince(p.created_at);
  const warnHours = COLUMN_SLA[p.status].warn * 24;
  const strongThresholdHours = Math.max(
    NEW_LEAD_GRACE_HOURS + MISSING_ACTION_MIN_SOFT_WINDOW_HOURS,
    warnHours * MISSING_ACTION_STRONG_SLA_RATIO,
  );
  return ageHours >= strongThresholdHours ? 'missing-action-strong' : 'missing-action-soft';
}
