/**
 * Bids Engine — Camada de cálculo puro do módulo "Estudo de Lances"
 *
 * Todas as funções são puras (sem side-effects, sem dependência de React).
 * Os componentes de UI devem consumir este módulo e apenas renderizar os resultados.
 */

import { interpolatedPercentile } from './core';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ScenarioType = 'conservador' | 'competitivo' | 'agressivo' | 'cliente';

export type AdvantageStatus = 'abaixo' | 'competitivo' | 'forte';

export type SituationType = 'alta_chance' | 'fixo_livre' | 'aumente' | 'venda' | 'aguardar';

export interface Percentis {
  p25: number;
  p50: number;
  p75: number;
}

export interface GroupStats {
  avgBid: number;
  minBid: number;
  maxBid: number;
  trend: 'alta' | 'estavel' | 'queda';
  behavior: string;
  percentis: Percentis;
  strongThreshold: number;
  scenarioOffset: number;
}

export interface MonthProjection {
  month: number;
  lanceCliente: number;
  lanceNecessario: number;
  vantagem: number;
  status: AdvantageStatus;
}

export interface BidProjection {
  months: MonthProjection[];
  milestoneCompetitivo: number | null;
  milestoneForte: number | null;
}

export interface ScenarioResult {
  type: Exclude<ScenarioType, 'cliente'>;
  lanceLivre: number;
  valorReais: number | null;
}

export interface StatusConfig {
  label: string;
  className: string;
  emoji: string;
}

// ─── Pure calculation functions ──────────────────────────────────────────────

/**
 * Adaptador interno: delega ao percentil interpolado de `core.ts`,
 * que é a fonte única para esse cálculo. Mantém a mesma assinatura
 * para preservar comportamento numérico.
 */
function getPercentile(sorted: number[], p: number): number {
  return interpolatedPercentile(sorted, p);
}

/**
 * @deprecated Use `interpolatedPercentile` de `./core` (fonte única).
 * Mantido como re-export para compatibilidade externa; internamente
 * `projection.ts` usa `getPercentile`.
 */
export function percentile(sorted: number[], p: number): number {
  return interpolatedPercentile(sorted, p);
}

/**
 * Calcula o lance necessário para um dado mês futuro usando distribuição
 * percentílica dos lances contemplados históricos.
 *
 * Passagem por 3 pontos de referência:
 *   Mês 1  → topo (≈ P75 + ajuste controlado, limitado a P75 + 4pp)
 *   Mês 6  → P50 (mediana)
 *   Mês 12 → P25 (piso realista)
 */
export function calcularLanceNecessario(
  month: number,
  _minBid: number,
  _maxBid: number,
  avgBid: number,
  trend: 'alta' | 'estavel' | 'queda',
  horizonte: number = 12,
  percentis?: Percentis,
): number {
  const p25 = percentis?.p25 ?? _minBid;
  const p50 = percentis?.p50 ?? avgBid;
  const p75 = percentis?.p75 ?? avgBid + Math.min((_maxBid - avgBid) * 0.4, 6);

  const ajuste = Math.min((_maxBid - p75) * 0.3, 4);
  const topo = p75 + Math.max(ajuste, 0);
  const piso = trend === 'alta' ? Math.max(p50, p25) : p25;

  if (topo <= piso) return piso;

  const trendFactor = trend === 'queda' ? 1.3 : trend === 'alta' ? 0.7 : 1.0;
  const meio = horizonte / 2;
  let lance: number;

  if (month <= meio) {
    const stepA = ((topo - p50) / meio) * trendFactor;
    lance = topo - stepA * month;
  } else {
    const stepB = ((p50 - piso) / meio) * trendFactor;
    lance = p50 - stepB * (month - meio);
  }

  return Math.max(lance, piso);
}

/**
 * Classifica a vantagem do lance do cliente.
 */
export function getAdvantageStatus(vantagem: number, strongThreshold: number = 2): AdvantageStatus {
  if (vantagem < 0) return 'abaixo';
  if (vantagem < strongThreshold) return 'competitivo';
  return 'forte';
}

/**
 * Retorna configuração visual para um status de vantagem.
 */
export function getStatusConfig(status: AdvantageStatus): StatusConfig {
  switch (status) {
    case 'forte': return { label: 'Forte', className: 'text-emerald-600 dark:text-emerald-400', emoji: '🟢' };
    case 'competitivo': return { label: 'Competitivo', className: 'text-amber-600 dark:text-amber-400', emoji: '🟡' };
    case 'abaixo': return { label: 'Abaixo', className: 'text-red-500 dark:text-red-400', emoji: '🔴' };
  }
}

/**
 * @deprecated Não consumido por nenhum componente. A fonte única de
 * recomendação comercial é `bidAnalysis.recommendation` (gerada por
 * `generateRecommendation` em `core.ts`), que considera comportamento,
 * tendência, predominância e warnings de forma integrada.
 *
 * Mantida apenas para compatibilidade externa.
 */
export function determineSituation(
  scenarioLance: number,
  avgBid: number,
  trend: 'alta' | 'estavel' | 'queda',
  behavior: string,
): SituationType {
  const diff = scenarioLance - avgBid;

  if (diff >= 3) return 'alta_chance';
  if (behavior === 'volatil' && trend !== 'queda') return 'aguardar';
  if (diff < -5 && behavior === 'competitivo') return 'venda';
  if (diff < 0) return 'aumente';
  return 'fixo_livre';
}

/**
 * @deprecated Resumo técnico de milestones do lance ativo. Para a mensagem
 * de recomendação comercial do grupo, use `bidAnalysis.recommendation.justification`
 * (fonte única). Esta função permanece apenas como complemento opcional para
 * descrever a posição temporal do cenário escolhido — não deve ser usada
 * como recomendação principal.
 */
export function buildStrategySummary(milestoneCompetitivo: number | null, milestoneForte: number | null): string {
  if (milestoneForte && milestoneCompetitivo) {
    return `Com este lance, você se torna competitivo no mês ${milestoneCompetitivo} e forte a partir do mês ${milestoneForte}.`;
  }
  if (milestoneCompetitivo) {
    return `Com este lance, você se torna competitivo no mês ${milestoneCompetitivo}. A posição forte pode levar mais de 12 meses.`;
  }
  return 'Com este lance, a posição competitiva pode levar mais de 12 meses. Considere aumentar o percentual.';
}

// ─── Composite functions ─────────────────────────────────────────────────────

/**
 * @deprecated Prefira `computeGroupStatsFromAnalysis(bidAnalysis, ...)` — fonte única via BidAnalysisResult.
 * Mantida para compatibilidade. Recalcula avg/min/max a partir dos arrays brutos do studyData.
 */
export function computeGroupStats(
  lanceMedio: number[],
  lanceMinimo: number[],
  lanceMaximo: number[],
  trend: 'alta' | 'estavel' | 'queda',
  behavior: string,
  strongThreshold: number,
  scenarioOffset: number,
): GroupStats {
  const validAvg = lanceMedio.filter(v => v > 0);
  const avgBid = validAvg.length > 0 ? validAvg.reduce((a, b) => a + b, 0) / validAvg.length : 0;

  const validMin = lanceMinimo.filter(v => v > 0);
  const minBid = validMin.length > 0 ? Math.min(...validMin) : 0;

  const validMax = lanceMaximo.filter(v => v > 0);
  const maxBid = validMax.length > 0 ? Math.max(...validMax) : avgBid * 1.5;

  const sortedMin = [...validMin].sort((a, b) => a - b);
  const percentis: Percentis = {
    p25: getPercentile(sortedMin, 25),
    p50: getPercentile(sortedMin, 50),
    p75: getPercentile(sortedMin, 75),
  };

  return { avgBid, minBid, maxBid, trend, behavior, percentis, strongThreshold, scenarioOffset };
}

/**
 * Versão preferida: deriva avgBid/minBid/maxBid/threshold/offset diretamente do
 * BidAnalysisResult (fonte única já calculada por analyzeBidHistory). Apenas
 * complementa com os percentis P25/P50/P75 sobre `minBids` (não expostos no result).
 *
 * Mantém a MESMA estrutura de retorno (GroupStats) que `computeGroupStats`.
 * Fallback para `avgBid * 1.5` quando maxOfMaxBids é 0, preservando comportamento
 * histórico em grupos sem dados de máximo.
 */
export function computeGroupStatsFromAnalysis(
  bidAnalysis: {
    minBids: number[];
    stats: {
      avgOfAvgBids: number;
      minOfMinBids: number;
      maxOfMaxBids: number;
      strongThreshold: number;
      scenarioOffset: number;
    };
    behaviorAnalysis: { trend: 'alta' | 'estavel' | 'queda'; behavior: string };
  },
): GroupStats {
  const { stats, behaviorAnalysis, minBids } = bidAnalysis;
  const avgBid = stats.avgOfAvgBids;
  const minBid = stats.minOfMinBids;
  const maxBid = stats.maxOfMaxBids > 0 ? stats.maxOfMaxBids : avgBid * 1.5;

  const validMin = minBids.filter(v => v > 0);
  const sortedMin = [...validMin].sort((a, b) => a - b);
  const percentis: Percentis = {
    p25: getPercentile(sortedMin, 25),
    p50: getPercentile(sortedMin, 50),
    p75: getPercentile(sortedMin, 75),
  };

  return {
    avgBid,
    minBid,
    maxBid,
    trend: behaviorAnalysis.trend,
    behavior: behaviorAnalysis.behavior,
    percentis,
    strongThreshold: stats.strongThreshold,
    scenarioOffset: stats.scenarioOffset,
  };
}

/**
 * Gera os 3 cenários predefinidos (conservador, competitivo, agressivo).
 */
export function computeScenarios(
  avgBid: number,
  scenarioOffset: number,
  creditValue: number | null,
): ScenarioResult[] {
  const types: Exclude<ScenarioType, 'cliente'>[] = ['conservador', 'competitivo', 'agressivo'];
  const offsets: Record<Exclude<ScenarioType, 'cliente'>, number> = {
    conservador: -scenarioOffset,
    competitivo: 0,
    agressivo: scenarioOffset,
  };

  return types.map(type => {
    const lanceLivre = Math.min(100, Math.max(avgBid + offsets[type], 0));
    const valorReais = creditValue ? (lanceLivre / 100) * creditValue : null;
    return { type, lanceLivre, valorReais };
  });
}

/**
 * Versão preferida: deriva os 3 cenários diretamente das `zones` já calculadas
 * por `analyzeBidHistory` (percentis históricos ponderados), eliminando a
 * duplicação conceitual com `computeScenarios` (que usa avgBid ± offset).
 *
 * Mantém a MESMA estrutura de retorno (`ScenarioResult`) para preservar
 * compatibilidade com todos os consumers (sem alteração de labels/tipos).
 *
 * Mapeamento:
 *   conservadora → conservador
 *   equilibrada  → competitivo
 *   agressiva    → agressivo
 *
 * O valor usado de cada zona é `minBid` (threshold base de cada faixa),
 * que corresponde ao "% do lance livre" projetado pelas zonas.
 */
export function computeScenariosFromZones(
  zones: {
    conservadora: { minBid: number };
    equilibrada: { minBid: number };
    agressiva: { minBid: number };
  },
  creditValue: number | null,
): ScenarioResult[] {
  const mapping: { type: Exclude<ScenarioType, 'cliente'>; pct: number }[] = [
    { type: 'conservador', pct: zones.conservadora.minBid },
    { type: 'competitivo', pct: zones.equilibrada.minBid },
    { type: 'agressivo', pct: zones.agressiva.minBid },
  ];

  return mapping.map(({ type, pct }) => {
    const lanceLivre = Math.min(100, Math.max(pct, 0));
    const valorReais = creditValue ? (lanceLivre / 100) * creditValue : null;
    return { type, lanceLivre, valorReais };
  });
}

/**
 * Resolve o lance ativo com base no cenário selecionado.
 */
export function resolveActiveLance(
  selectedScenario: ScenarioType,
  scenarios: ScenarioResult[],
  clientBidStr: string,
): number | null {
  if (selectedScenario === 'cliente') {
    const parsed = parseFloat(clientBidStr);
    if (isNaN(parsed) || parsed <= 0) return null;
    return parsed;
  }
  const scenario = scenarios.find(s => s.type === selectedScenario);
  return scenario?.lanceLivre ?? null;
}

/**
 * Calcula a projeção mês a mês (12 meses) incluindo milestones.
 */
export function calculateBidProjection(
  activeLance: number,
  stats: GroupStats,
  horizonte: number = 12,
): BidProjection {
  const months: MonthProjection[] = [];

  for (let m = 1; m <= horizonte; m++) {
    const lanceNecessario = calcularLanceNecessario(
      m, stats.minBid, stats.maxBid, stats.avgBid, stats.trend, horizonte, stats.percentis,
    );
    const vantagem = activeLance - lanceNecessario;
    const status = getAdvantageStatus(vantagem, stats.strongThreshold);

    months.push({ month: m, lanceCliente: activeLance, lanceNecessario, vantagem, status });
  }

  const milestoneCompetitivo = months.find(m => m.vantagem >= 0)?.month ?? null;
  const milestoneForte = months.find(m => m.vantagem >= stats.strongThreshold)?.month ?? null;

  return { months, milestoneCompetitivo, milestoneForte };
}
