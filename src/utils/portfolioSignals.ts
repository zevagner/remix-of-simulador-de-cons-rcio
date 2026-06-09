/**
 * portfolioSignals — Onda 5: Inteligência Estratégica Silenciosa.
 *
 * Heurísticas leves sobre a Carteira (e variante para Pós-venda) para revelar
 * padrões macro sem virar BI: ritmo, concentração, janelas fortes, cadência.
 *
 * Princípios:
 *  - Determinístico, sem IA generativa.
 *  - Frases curtas, tom consultivo (não-alarmista).
 *  - Máx. 2 sinais visíveis por contexto (caller corta).
 *  - Sem scores agressivos / sem porcentagens excessivas no rótulo.
 */
import type { ProposalWithPriority } from './proposalPriority';
import type { ProposalRecord } from '@/services/proposals';
import { PROSPECT_TRIGGERS } from '@/components/modules/pipeline/pipelineConstants';

export type PortfolioSignalKind =
  | 'cooling_portfolio'
  | 'concentration'
  | 'strong_window'
  | 'cadence_alert';

export type PortfolioSignalTone = 'info' | 'warn' | 'positive';

export interface PortfolioSignal {
  kind: PortfolioSignalKind;
  emoji: string;
  label: string;       // frase curta, sem números pesados
  hint: string;        // tooltip explicativo
  tone: PortfolioSignalTone;
}

const ACTIVE_STATUSES: ReadonlySet<string> = new Set([
  'prospeccao', 'aguardando_retorno', 'em_avaliacao', 'proposta_ajustada',
]);

const TRIGGER_LABEL = new Map<string, string>(
  PROSPECT_TRIGGERS.map(t => [t.value, t.label.replace(/^\S+\s/, '')]),
);

function daysAgo(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Gera os sinais estratégicos para a Carteira.
 * Retorna lista priorizada (mais relevante primeiro). Caller deve cortar em 2.
 */
export function computePortfolioSignals(
  proposals: ProposalWithPriority[],
): PortfolioSignal[] {
  const active = proposals.filter(p => ACTIVE_STATUSES.has(p.status));
  // Carteiras pequenas demais não geram visão macro confiável.
  if (active.length < 6) return [];

  const signals: PortfolioSignal[] = [];
  const total = active.length;

  // ─── 1. Carteira esfriando ────────────────────────────────────────────────
  const hot = active.filter(p => p.priority === 'alta').length;
  const stale = active.filter(p => daysAgo(p.updated_at) >= 7).length;
  const recentMoves = proposals.filter(p => daysAgo(p.updated_at) <= 7).length;

  const hotRatio = hot / total;
  const staleRatio = stale / total;

  if (hotRatio < 0.1 && staleRatio >= 0.4 && recentMoves <= Math.max(2, total * 0.15)) {
    signals.push({
      kind: 'cooling_portfolio',
      emoji: '🌡️',
      label: 'Carteira perdendo ritmo nas últimas semanas',
      hint: 'Poucos clientes quentes e muitas propostas paradas há mais de 7 dias. Vale retomar contato com leads em avaliação.',
      tone: 'warn',
    });
  }

  // ─── 2. Concentração por gatilho de prospecção ────────────────────────────
  const triggerCounts = new Map<string, number>();
  for (const p of active) {
    const t = (p.prospect_trigger ?? '').trim();
    if (!t || t === 'nao_identificado') continue;
    triggerCounts.set(t, (triggerCounts.get(t) ?? 0) + 1);
  }
  const sortedTriggers = [...triggerCounts.entries()].sort((a, b) => b[1] - a[1]);
  if (sortedTriggers.length > 0) {
    const [topKey, topCount] = sortedTriggers[0];
    if (topCount / total >= 0.5 && topCount >= 4) {
      const label = TRIGGER_LABEL.get(topKey) ?? topKey;
      signals.push({
        kind: 'concentration',
        emoji: '⚖️',
        label: `Carteira concentrada em ${label}`,
        hint: 'Mais da metade dos leads ativos vêm do mesmo gatilho. Diversificar perfis reduz risco e abre novas oportunidades patrimoniais.',
        tone: 'info',
      });
    }
  }

  // ─── 3. Janela forte: gatilho com taxa de quentes acima da média ──────────
  if (sortedTriggers.length >= 2 && hot >= 2) {
    const baseHotRate = hot / total;
    let bestTrigger: { key: string; hotRate: number; count: number } | null = null;
    for (const [key, count] of sortedTriggers) {
      if (count < 3) continue;
      const triggerHot = active.filter(
        p => p.prospect_trigger === key && p.priority === 'alta',
      ).length;
      const rate = triggerHot / count;
      if (rate >= 0.5 && rate >= baseHotRate * 1.5) {
        if (!bestTrigger || rate > bestTrigger.hotRate) {
          bestTrigger = { key, hotRate: rate, count };
        }
      }
    }
    if (bestTrigger) {
      const label = TRIGGER_LABEL.get(bestTrigger.key) ?? bestTrigger.key;
      signals.push({
        kind: 'strong_window',
        emoji: '📈',
        label: `Clientes ${label} estão respondendo acima do padrão`,
        hint: 'Esse perfil tem mais leads quentes que a média da carteira. Bom momento para priorizar abordagens com esse gatilho.',
        tone: 'positive',
      });
    }
  }

  // ─── 4. Cadência: muitos sem próxima ação ou follow-up vencido ────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const noNextAction = active.filter(p => !p.next_contact_date).length;
  const overdue = active.filter(p => {
    if (!p.next_contact_date) return false;
    const d = new Date(p.next_contact_date + 'T00:00:00');
    return d.getTime() < today.getTime();
  }).length;

  const cadenceMissRatio = (noNextAction + overdue) / total;
  if (cadenceMissRatio >= 0.4 && (noNextAction + overdue) >= 5) {
    signals.push({
      kind: 'cadence_alert',
      emoji: '⏱️',
      label: 'Alguns clientes importantes estão sem acompanhamento',
      hint: 'Boa parte da carteira está sem próxima ação definida ou com follow-up vencido. Defina a próxima conversa para não perder o timing.',
      tone: 'warn',
    });
  }

  return signals;
}

// ─── Variante leve para Pós-venda ────────────────────────────────────────────

export interface PostSalePortfolioInput {
  total: number;
  riskCount: number;
  preAssemblyCount: number;
  recentlyContemplatedCount: number;
  dormantCount: number;
  noNextActionCount: number;
}

/**
 * Sinais estratégicos do Pós-venda — relacionamento patrimonial macro.
 * Mantém o mesmo tom: 1–2 frases consultivas, sem alarmismo.
 */
export function computePostSalePortfolioSignals(
  input: PostSalePortfolioInput,
): PortfolioSignal[] {
  if (input.total < 6) return [];
  const signals: PortfolioSignal[] = [];

  if (input.recentlyContemplatedCount >= 3) {
    signals.push({
      kind: 'strong_window',
      emoji: '💎',
      label: 'Janela quente de pós-contemplação aberta',
      hint: 'Clientes contemplados nos últimos 90 dias estão no melhor momento para nova operação ou indicação.',
      tone: 'positive',
    });
  }

  if (input.preAssemblyCount >= 2) {
    signals.push({
      kind: 'strong_window',
      emoji: '📅',
      label: 'Várias assembleias se aproximando',
      hint: 'Bom momento para alinhar estratégia de lance e reforçar o relacionamento antes da próxima assembleia.',
      tone: 'info',
    });
  }

  if (input.riskCount >= 2 && input.riskCount / input.total >= 0.15) {
    signals.push({
      kind: 'cooling_portfolio',
      emoji: '🌡️',
      label: 'Atenção: clientes em risco acumulando',
      hint: 'O grupo de clientes em risco crítico está crescendo na carteira. Vale revisar contato e renegociação.',
      tone: 'warn',
    });
  }

  const cadenceMiss = input.noNextActionCount + input.dormantCount;
  if (cadenceMiss >= 5 && cadenceMiss / input.total >= 0.4) {
    signals.push({
      kind: 'cadence_alert',
      emoji: '⏱️',
      label: 'Muitos clientes ativos sem próximo passo',
      hint: 'Boa parte da carteira de pós-venda está sem ação definida ou dormente há tempo. Reativar mantém o relacionamento vivo.',
      tone: 'warn',
    });
  }

  return signals;
}

// Apenas tipos auxiliares — facilita testes determinísticos.
export type { ProposalWithPriority, ProposalRecord };
