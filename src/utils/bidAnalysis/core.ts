/**
 * Utilitário de Análise de Lances
 * 
 * Analisa o comportamento histórico de lances dos últimos 6 meses
 * para fornecer recomendações qualificadas de lance.
 * 
 * v2: Modelo estatístico aprimorado com:
 * - Ponderação temporal (meses recentes têm mais peso)
 * - Zona conservadora baseada em lances mínimos (não máximos)
 * - Validação de dados antes da análise
 * - Função de estimativa probabilística preparada
 */

import { AssemblyRecord } from '@/types/consortium';
import { hasUsefulBidData, parseAssemblyMonth } from '../assemblyData';
import { logger } from '@/utils/logger';

// Tipos para análise de comportamento
export type GroupBehavior = 'competitivo' | 'previsivel' | 'volatil';

export type ZoneType = 'conservadora' | 'equilibrada' | 'agressiva';

export interface ContemplationZone {
  type: ZoneType;
  minBid: number;
  maxBid: number;
  occurrences: number;
  totalMonths: number;
  confidence: string;
}

export interface BidRecommendation {
  primaryBid: number;
  alternativeBid: number;
  aggressiveBid: number;
  riskLevel: 'baixo' | 'medio' | 'alto';
  justification: string;
  warnings: string[];
}

export interface GroupBehaviorAnalysis {
  behavior: GroupBehavior;
  behaviorLabel: string;
  behaviorDescription: string;
  trend: 'alta' | 'estavel' | 'queda';
  trendDescription: string;
  predominance: 'sorteio' | 'lance' | 'equilibrado';
  predominanceDescription: string;
}

export type DataQualityLevel = 'completo' | 'parcial' | 'minimo';

export interface MonthDataQuality {
  month: string;
  level: DataQualityLevel;
  hasBidData: boolean;
  hasContemplationData: boolean;
  hasParticipants: boolean;
  confidence: number; // 0-1 weight multiplier
  missingFields: string[];
}

export interface TrendInsight {
  type: 'opportunity' | 'warning' | 'neutral';
  icon: 'trending-down' | 'trending-up' | 'minus' | 'sparkles' | 'alert';
  title: string;
  description: string;
}

export interface BidAnalysisResult {
  months: string[];
  minBids: number[];
  avgBids: number[];
  maxBids: number[];
  contemplationsBySorteio: number[];
  contemplationsByLance: number[];
  totalContemplations: number[];
  behaviorAnalysis: GroupBehaviorAnalysis;
  zones: {
    conservadora: ContemplationZone;
    equilibrada: ContemplationZone;
    agressiva: ContemplationZone;
  };
  recommendation: BidRecommendation;
  stats: {
    minOfMinBids: number;
    maxOfMaxBids: number;
    avgOfAvgBids: number;
    lastMonthMinBid: number;
    variance: number;
    stdDev: number;
    range: number;
    strongThreshold: number;
    scenarioOffset: number;
  };
  monthQuality: MonthDataQuality[];
  trendInsights: TrendInsight[];
}

// ─── Ponderação Temporal ───────────────────────────────────────────

/**
 * Retorna pesos temporais para N meses (do mais antigo ao mais recente).
 * O mês mais recente recebe peso 1.5, o segundo 1.3, o terceiro 1.2, demais 1.0.
 */
function getTemporalWeights(n: number): number[] {
  const weights = new Array(n).fill(1.0);
  if (n >= 1) weights[n - 1] = 1.5;
  if (n >= 2) weights[n - 2] = 1.3;
  if (n >= 3) weights[n - 3] = 1.2;
  return weights;
}

/**
 * Média ponderada temporal. Ignora valores <= 0.
 */
function weightedAverage(values: number[], weights: number[]): number {
  let sumWV = 0;
  let sumW = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > 0) {
      const w = weights[i] ?? 1.0;
      sumWV += values[i] * w;
      sumW += w;
    }
  }
  return sumW > 0 ? sumWV / sumW : 0;
}

/**
 * Percentil ponderado (interpolação linear com pesos temporais).
 * Apenas valores > 0 são considerados.
 */
function weightedPercentile(values: number[], weights: number[], p: number): number {
  // Filtrar pares válidos (valor > 0)
  const pairs: { value: number; weight: number }[] = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] > 0) {
      pairs.push({ value: values[i], weight: weights[i] ?? 1.0 });
    }
  }
  if (pairs.length === 0) return 0;

  // Ordenar por valor
  pairs.sort((a, b) => a.value - b.value);

  const totalWeight = pairs.reduce((s, pr) => s + pr.weight, 0);
  const target = p * totalWeight;

  let cumulative = 0;
  for (let i = 0; i < pairs.length; i++) {
    cumulative += pairs[i].weight;
    if (cumulative >= target) {
      return pairs[i].value;
    }
  }
  return pairs[pairs.length - 1].value;
}

/**
 * Percentil por interpolação linear sobre array ORDENADO ascendentemente.
 * Fonte única reutilizada por `projection.ts`. Comportamento idêntico ao
 * antigo `percentile` de `bidsEngine` — não altera resultados existentes.
 */
export function interpolatedPercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// ─── Validação de Dados ────────────────────────────────────────────

/**
 * Retorna true se o registro é válido para análise.
 */
function isValidRecord(record: AssemblyRecord): boolean {
  if (!hasUsefulBidData(record)) {
    logger.warn(
      `[bidAnalysis] Registro ignorado: grupo ${record.groupNumber}, ` +
      `mês ${record.assemblyMonth} — sem dados de lance útil.`
    );
    return false;
  }

  return true;
}

// ─── Análise de Comportamento ──────────────────────────────────────

function analyzeGroupBehavior(
  minBids: number[],
  avgBids: number[],
  maxBids: number[],
  contemplationsBySorteio: number[],
  contemplationsByLance: number[],
  weights: number[]
): GroupBehaviorAnalysis {
  const validMinBids = minBids.filter(v => v > 0);
  const validMaxBids = maxBids.filter(v => v > 0);

  // Calcular variância entre min e max
  const ranges = validMinBids.map((min, i) => {
    const max = validMaxBids[i] || 0;
    return max > 0 ? max - min : 0;
  }).filter(v => v > 0);

  const avgRange = ranges.length > 0
    ? ranges.reduce((a, b) => a + b, 0) / ranges.length
    : 0;

  // Tendência: comparar primeira metade com segunda metade usando pesos
  let trend: 'alta' | 'estavel' | 'queda' = 'estavel';
  let trendDescription = 'O lance mínimo se manteve estável ao longo do período analisado.';

  if (validMinBids.length >= 4) {
    const mid = Math.floor(validMinBids.length / 2);
    const firstHalf = validMinBids.slice(0, mid);
    const secondHalf = validMinBids.slice(mid);

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const variation = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (variation > 10) {
      trend = 'alta';
      trendDescription = `O lance mínimo apresenta tendência de ALTA (+${variation.toFixed(1)}%), indicando ambiente mais competitivo.`;
    } else if (variation < -10) {
      trend = 'queda';
      trendDescription = `O lance mínimo apresenta tendência de QUEDA (${variation.toFixed(1)}%), indicando oportunidade de lances menores.`;
    }
  }

  // Predominância de contemplação
  const totalSorteio = contemplationsBySorteio.reduce((a, b) => a + b, 0);
  const totalLance = contemplationsByLance.reduce((a, b) => a + b, 0);
  const total = totalSorteio + totalLance;

  let predominance: 'sorteio' | 'lance' | 'equilibrado' = 'equilibrado';
  let predominanceDescription = 'As contemplações estão equilibradas entre sorteio e lance.';

  if (total > 0) {
    const sorteioPercent = (totalSorteio / total) * 100;
    if (sorteioPercent > 60) {
      predominance = 'sorteio';
      predominanceDescription = `${sorteioPercent.toFixed(0)}% das contemplações foram por sorteio. Maior chance de ser contemplado sem lance.`;
    } else if (sorteioPercent < 40) {
      predominance = 'lance';
      predominanceDescription = `${(100 - sorteioPercent).toFixed(0)}% das contemplações foram por lance. Ambiente competitivo requer lance.`;
    }
  }

  // Comportamento: usar média ponderada dos lances mínimos para CV
  let behavior: GroupBehavior = 'previsivel';
  let behaviorLabel = 'Previsível';
  let behaviorDescription = 'O grupo apresenta comportamento previsível com lances estáveis.';

  if (validMinBids.length >= 3) {
    const wAvg = weightedAverage(minBids, weights);
    const variance = validMinBids.reduce((sum, v) => sum + Math.pow(v - wAvg, 2), 0) / validMinBids.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = wAvg > 0 ? (stdDev / wAvg) * 100 : 0;

    if (coefficientOfVariation > 20 || avgRange > 15) {
      behavior = 'volatil';
      behaviorLabel = 'Volátil';
      behaviorDescription = `Grande variação entre lances (CV: ${coefficientOfVariation.toFixed(1)}%). Difícil prever lance vencedor.`;
    } else if (trend === 'alta' && predominance === 'lance') {
      behavior = 'competitivo';
      behaviorLabel = 'Competitivo';
      behaviorDescription = 'Ambiente competitivo com tendência de alta nos lances mínimos.';
    }
  }

  return {
    behavior, behaviorLabel, behaviorDescription,
    trend, trendDescription,
    predominance, predominanceDescription,
  };
}

// ─── Zonas de Contemplação ─────────────────────────────────────────

function calculateContemplationZones(
  minBids: number[],
  maxBids: number[],
  weights: number[],
  totalMonths: number
): { conservadora: ContemplationZone; equilibrada: ContemplationZone; agressiva: ContemplationZone } {
  const validMinBids = minBids.filter(v => v > 0);
  const validMaxBids = maxBids.filter(v => v > 0);

  if (validMinBids.length === 0) {
    return {
      conservadora: { type: 'conservadora', minBid: 0, maxBid: 0, occurrences: 0, totalMonths, confidence: '0 de 6' },
      equilibrada: { type: 'equilibrada', minBid: 0, maxBid: 0, occurrences: 0, totalMonths, confidence: '0 de 6' },
      agressiva: { type: 'agressiva', minBid: 0, maxBid: 0, occurrences: 0, totalMonths, confidence: '0 de 6' },
    };
  }

  const maxOfMax = validMaxBids.length > 0 ? Math.max(...validMaxBids) : 0;

  // ── Zona Conservadora ──
  // Percentil 83% dos lances MÍNIMOS (não máximos).
  // Representa o valor necessário para contemplar em ~5 de 6 assembleias.
  const conservadoraThreshold = weightedPercentile(minBids, weights, 0.83);
  const conservadoraOccurrences = validMinBids.filter(min => conservadoraThreshold >= min).length;

  // ── Zona Equilibrada ──
  // Média ponderada dos lances mínimos e máximos (ponto médio ponderado)
  const wAvgMin = weightedAverage(minBids, weights);
  const wAvgMax = weightedAverage(maxBids, weights);
  const equilibradaThreshold = (wAvgMin + wAvgMax) / 2;
  const equilibradaOccurrences = validMinBids.filter(min => equilibradaThreshold >= min).length;

  // ── Zona Agressiva ──
  // Menor lance mínimo histórico (ponderação não se aplica ao mínimo absoluto)
  const agressivaThreshold = Math.min(...validMinBids);
  const agressivaOccurrences = validMinBids.filter(min => agressivaThreshold >= min).length;

  return {
    conservadora: {
      type: 'conservadora',
      minBid: conservadoraThreshold,
      maxBid: maxOfMax * 1.05,
      occurrences: conservadoraOccurrences,
      totalMonths,
      confidence: `${Math.min(conservadoraOccurrences, totalMonths)} de ${totalMonths} assembleias`,
    },
    equilibrada: {
      type: 'equilibrada',
      minBid: equilibradaThreshold * 0.95,
      maxBid: equilibradaThreshold * 1.05,
      occurrences: equilibradaOccurrences,
      totalMonths,
      confidence: `${Math.min(equilibradaOccurrences, totalMonths)} de ${totalMonths} assembleias`,
    },
    agressiva: {
      type: 'agressiva',
      minBid: agressivaThreshold * 0.9,
      maxBid: agressivaThreshold,
      occurrences: agressivaOccurrences,
      totalMonths,
      confidence: `${Math.min(agressivaOccurrences, totalMonths)} de ${totalMonths} assembleias`,
    },
  };
}

// ─── Recomendação ──────────────────────────────────────────────────

function generateRecommendation(
  behaviorAnalysis: GroupBehaviorAnalysis,
  zones: { conservadora: ContemplationZone; equilibrada: ContemplationZone; agressiva: ContemplationZone },
  lastMonthMinBid: number,
  hasEmbeddedBid: boolean,
  embeddedBidMaxPercent: number
): BidRecommendation {
  const warnings: string[] = [];
  let riskLevel: 'baixo' | 'medio' | 'alto' = 'medio';

  let primaryBid = zones.conservadora.minBid;
  let alternativeBid = zones.equilibrada.minBid;
  let aggressiveBid = zones.agressiva.minBid;

  if (behaviorAnalysis.predominance === 'sorteio') {
    warnings.push('Predominância de contemplação por sorteio. Considere aguardar sorteio antes de ofertar lance alto.');
    riskLevel = 'baixo';
  }

  if (behaviorAnalysis.predominance === 'lance') {
    warnings.push('Maioria das contemplações por lance. Recomenda-se ofertar lance para aumentar chances.');
    riskLevel = 'alto';
  }

  if (lastMonthMinBid > aggressiveBid) {
    aggressiveBid = lastMonthMinBid;
    warnings.push(`O último mês mostrou lance mínimo de ${lastMonthMinBid.toFixed(2)}%. Evite ofertar abaixo desse patamar.`);
  }

  if (behaviorAnalysis.behavior === 'volatil') {
    warnings.push('Grupo volátil: grande variação nos lances. Maior incerteza na previsão.');
    riskLevel = 'alto';
  }

  if (behaviorAnalysis.behavior === 'competitivo') {
    warnings.push('Ambiente competitivo: lances tendem a subir. Considere ofertar na faixa Alta Segurança.');
  }

  if (hasEmbeddedBid && embeddedBidMaxPercent > 0) {
    warnings.push(`O grupo aceita lance embutido de até ${embeddedBidMaxPercent}%. Isso pode reduzir o desembolso inicial.`);
  }

  primaryBid = Math.max(primaryBid, alternativeBid, aggressiveBid);
  alternativeBid = Math.max(alternativeBid, aggressiveBid);

  let justification = '';
  switch (behaviorAnalysis.behavior) {
    case 'previsivel':
      justification = `Grupo previsível com lance estável. A faixa Alta Segurança (${primaryBid.toFixed(2)}%) oferece alta probabilidade de contemplação.`;
      break;
    case 'competitivo':
      justification = `Ambiente competitivo com tendência de alta. Recomenda-se lance na faixa Alta Segurança (${primaryBid.toFixed(2)}%) para garantir contemplação.`;
      break;
    case 'volatil':
      justification = `Grupo volátil com grande variação. A faixa Alta Segurança (${primaryBid.toFixed(2)}%) oferece maior segurança, mas sem garantias.`;
      break;
  }

  return { primaryBid, alternativeBid, aggressiveBid, riskLevel, justification, warnings };
}

// ─── Estimativa Probabilística (preparação futura) ─────────────────

/**
 * Estima a probabilidade de contemplação para um dado lance,
 * baseada na distribuição histórica dos lances mínimos contemplados.
 *
 * Lógica: calcula a fração ponderada de assembleias históricas em que
 * o lance informado teria sido igual ou superior ao lance mínimo contemplado.
 *
 * @param bidPercent - Valor do lance (%) que o cliente deseja ofertar
 * @param minBids - Array de lances mínimos históricos (ordenados do mais antigo ao mais recente)
 * @param weights - Pesos temporais correspondentes
 * @returns Probabilidade estimada entre 0 e 1
 */
export function estimateBidSuccessProbability(
  bidPercent: number,
  minBids: number[],
  weights: number[]
): number {
  if (minBids.length === 0 || bidPercent <= 0) return 0;

  let weightedSuccess = 0;
  let totalWeight = 0;

  for (let i = 0; i < minBids.length; i++) {
    const w = weights[i] ?? 1.0;
    if (minBids[i] > 0) {
      totalWeight += w;
      if (bidPercent >= minBids[i]) {
        weightedSuccess += w;
      }
    }
  }

  return totalWeight > 0 ? weightedSuccess / totalWeight : 0;
}

// ─── Função Principal ──────────────────────────────────────────────

export function analyzeBidHistory(
  records: AssemblyRecord[],
  excludeCurrentMonth: boolean = false
): BidAnalysisResult | null {
  if (records.length === 0) return null;

  const importedMonths = [...new Set(records.map(r => r.assemblyMonth))]
    .sort((a, b) => parseAssemblyMonth(a).getTime() - parseAssemblyMonth(b).getTime());

  // Validar registros antes da análise
  const validRecords = records.filter(isValidRecord);

  const validMonths = [...new Set(validRecords.map(r => r.assemblyMonth))]
    .sort((a, b) => parseAssemblyMonth(a).getTime() - parseAssemblyMonth(b).getTime());

  const discardedMonths = importedMonths.filter(month => !validMonths.includes(month));
  logger.info(`[bidAnalysis][diag] Meses importados: ${importedMonths.join(', ') || 'nenhum'}`);
  logger.info(`[bidAnalysis][diag] Meses válidos (lance): ${validMonths.join(', ') || 'nenhum'}`);
  if (discardedMonths.length > 0) {
    logger.warn(
      `[bidAnalysis][diag] Meses descartados da análise: ${discardedMonths.join(', ')} (sem dados de lance útil)`
    );
  }

  if (validRecords.length === 0) {
    logger.warn('[bidAnalysis] Nenhum registro válido para análise após validação.');
    return null;
  }

  // Ordenar do mais antigo ao mais recente
  const sortedRecords = [...validRecords].sort((a, b) =>
    parseAssemblyMonth(a.assemblyMonth).getTime() - parseAssemblyMonth(b.assemblyMonth).getTime()
  );

  const allMonths = [...new Set(sortedRecords.map(r => r.assemblyMonth))];

  const analysisMonths = excludeCurrentMonth
    ? allMonths.slice(0, -1).slice(-6)
    : allMonths.slice(-6);

  if (analysisMonths.length === 0) return null;

  // Extrair dados por mês
  const months: string[] = [];
  const minBids: number[] = [];
  const avgBids: number[] = [];
  const maxBids: number[] = [];
  const contemplationsBySorteio: number[] = [];
  const contemplationsByLance: number[] = [];
  const totalContemplations: number[] = [];

  const monthQuality: MonthDataQuality[] = [];

  for (const month of analysisMonths) {
    const record = sortedRecords.find(r => r.assemblyMonth === month);
    if (record) {
      months.push(month);
      const minBid = record.minBidLastAssembly || record.minBidPercentage || 0;
      const avgBid = record.avgBid3Months || record.avgBidPercentage || 0;
      const maxBid = record.maxBidLastAssembly || record.maxBidPercentage || 0;
      minBids.push(minBid);
      avgBids.push(avgBid);
      maxBids.push(maxBid);
      contemplationsBySorteio.push(record.contemplationsBySorteio || 0);
      contemplationsByLance.push(
        (record.contemplationsByLanceLivre || 0) + (record.contemplationsByLanceFixo || 0)
      );
      totalContemplations.push(record.totalContemplations || 0);

      // Avaliar qualidade dos dados deste mês
      const hasBid = minBid > 0 || avgBid > 0 || maxBid > 0;
      const hasContemp = (record.contemplationsBySorteio || 0) > 0 ||
        (record.contemplationsByLanceLivre || 0) > 0 ||
        (record.contemplationsByLanceFixo || 0) > 0 ||
        (record.totalContemplations || 0) > 0;
      const hasPart = (record.participants || 0) > 0;
      const missing: string[] = [];
      if (!hasBid) missing.push('lances');
      if (!hasContemp) missing.push('contemplações');
      if (!hasPart) missing.push('participantes');

      let level: DataQualityLevel = 'completo';
      let confidence = 1.0;
      if (!hasBid && !hasContemp) { level = 'minimo'; confidence = 0.3; }
      else if (!hasBid || !hasContemp || !hasPart) { level = 'parcial'; confidence = 0.6; }

      monthQuality.push({
        month, level, hasBidData: hasBid, hasContemplationData: hasContemp,
        hasParticipants: hasPart, confidence, missingFields: missing,
      });
    }
  }

  if (months.length === 0) return null;

  // Pesos temporais ajustados pela confiabilidade dos dados
  const baseWeights = getTemporalWeights(months.length);
  const weights = baseWeights.map((w, i) => w * (monthQuality[i]?.confidence ?? 1.0));

  const latestRecord = sortedRecords.reduce((latest, current) => {
    const latestTime = parseAssemblyMonth(latest.assemblyMonth).getTime();
    const currentTime = parseAssemblyMonth(current.assemblyMonth).getTime();
    return currentTime > latestTime ? current : latest;
  });
  const hasEmbeddedBid = latestRecord.hasEmbeddedBid || false;
  const embeddedBidMaxPercent = latestRecord.embeddedBidMaxPercent || 0;

  // Análise de comportamento (usa pesos)
  const behaviorAnalysis = analyzeGroupBehavior(
    minBids, avgBids, maxBids,
    contemplationsBySorteio, contemplationsByLance,
    weights
  );

  // Zonas (usa pesos e baseada em minBids/maxBids, não avgBids)
  const zones = calculateContemplationZones(minBids, maxBids, weights, months.length);

  // Estatísticas consolidadas
  const validMinBids = minBids.filter(v => v > 0);
  const validMaxBids = maxBids.filter(v => v > 0);

  const minOfMinBids = validMinBids.length > 0 ? Math.min(...validMinBids) : 0;
  const maxOfMaxBids = validMaxBids.length > 0 ? Math.max(...validMaxBids) : 0;

  const validAvgBids = avgBids.filter(v => v > 0);
  const avgOfAvgBids = validAvgBids.length > 0
    ? validAvgBids.reduce((a, b) => a + b, 0) / validAvgBids.length
    : 0;

  const lastMonthMinBid = minBids[minBids.length - 1] || 0;

  const avgOfMinBids = validMinBids.length > 0
    ? validMinBids.reduce((a, b) => a + b, 0) / validMinBids.length
    : 0;
  const variance = validMinBids.length > 1
    ? validMinBids.reduce((sum, v) => sum + Math.pow(v - avgOfMinBids, 2), 0) / validMinBids.length
    : 0;

  // ── Parâmetros adaptativos baseados na volatilidade ──
  const stdDev = Math.sqrt(variance);
  const range = maxOfMaxBids - minOfMinBids;
  const strongThreshold = Math.max(2, stdDev * 0.5);
  const scenarioOffset = Math.max(2, range * 0.2);

  logger.info(`[bidAnalysis][adaptive] stdDev=${stdDev.toFixed(2)}, range=${range.toFixed(2)}, strongThreshold=${strongThreshold.toFixed(2)}, scenarioOffset=${scenarioOffset.toFixed(2)}`);

  const recommendation = generateRecommendation(
    behaviorAnalysis, zones, lastMonthMinBid, hasEmbeddedBid, embeddedBidMaxPercent
  );

  // Gerar insights de tendência
  const trendInsights = generateTrendInsights(
    minBids, avgBids, maxBids, months, behaviorAnalysis, monthQuality,
    contemplationsBySorteio, contemplationsByLance
  );

  return {
    months, minBids, avgBids, maxBids,
    contemplationsBySorteio, contemplationsByLance, totalContemplations,
    behaviorAnalysis, zones, recommendation,
    stats: { minOfMinBids, maxOfMaxBids, avgOfAvgBids, lastMonthMinBid, variance, stdDev, range, strongThreshold, scenarioOffset },
    monthQuality, trendInsights,
  };
}

// ─── Insights de Tendência ─────────────────────────────────────────

function generateTrendInsights(
  minBids: number[],
  avgBids: number[],
  maxBids: number[],
  months: string[],
  behaviorAnalysis: GroupBehaviorAnalysis,
  monthQuality: MonthDataQuality[],
  contemplationsBySorteio: number[],
  contemplationsByLance: number[],
): TrendInsight[] {
  const insights: TrendInsight[] = [];
  const validMin = minBids.filter(v => v > 0);

  // Dados incompletos
  const partialMonths = monthQuality.filter(q => q.level !== 'completo');
  if (partialMonths.length > 0) {
    insights.push({
      type: 'neutral',
      icon: 'alert',
      title: `${partialMonths.length} mês(es) com dados incompletos`,
      description: `Os meses ${partialMonths.map(m => m.month).join(', ')} possuem dados parciais (${partialMonths[0].missingFields.join(', ')}). Seu peso na análise foi reduzido automaticamente.`,
    });
  }

  // Tendência de queda nos lances mínimos (últimos 3 meses)
  if (validMin.length >= 3) {
    const last3 = minBids.slice(-3).filter(v => v > 0);
    if (last3.length >= 2) {
      let consecutive = 0;
      for (let i = 1; i < last3.length; i++) {
        if (last3[i] < last3[i - 1]) consecutive++;
      }
      if (consecutive === last3.length - 1 && last3.length >= 2) {
        const drop = ((last3[0] - last3[last3.length - 1]) / last3[0] * 100).toFixed(1);
        insights.push({
          type: 'opportunity',
          icon: 'trending-down',
          title: 'Tendência de queda nos lances',
          description: `O lance mínimo caiu ${drop}% nos últimos ${last3.length} meses. Momento potencialmente favorável para ofertar lance.`,
        });
      }
    }
  }

  // Tendência de alta
  if (validMin.length >= 3) {
    const last3 = minBids.slice(-3).filter(v => v > 0);
    if (last3.length >= 2) {
      let consecutive = 0;
      for (let i = 1; i < last3.length; i++) {
        if (last3[i] > last3[i - 1]) consecutive++;
      }
      if (consecutive === last3.length - 1) {
        const rise = ((last3[last3.length - 1] - last3[0]) / last3[0] * 100).toFixed(1);
        insights.push({
          type: 'warning',
          icon: 'trending-up',
          title: 'Lances em alta',
          description: `O lance mínimo subiu ${rise}% nos últimos ${last3.length} meses. Ambiente cada vez mais competitivo.`,
        });
      }
    }
  }

  // Predominância de sorteio = oportunidade
  const totalSorteio = contemplationsBySorteio.reduce((a, b) => a + b, 0);
  const totalLance = contemplationsByLance.reduce((a, b) => a + b, 0);
  if (totalSorteio + totalLance > 0 && totalSorteio > totalLance * 1.5) {
    insights.push({
      type: 'opportunity',
      icon: 'sparkles',
      title: 'Grupo com alta taxa de sorteio',
      description: `${((totalSorteio / (totalSorteio + totalLance)) * 100).toFixed(0)}% das contemplações são por sorteio. Chance de contemplação sem lance elevado.`,
    });
  }

  // Estabilidade = previsibilidade
  if (behaviorAnalysis.behavior === 'previsivel' && behaviorAnalysis.trend === 'estavel') {
    insights.push({
      type: 'opportunity',
      icon: 'minus',
      title: 'Grupo previsível e estável',
      description: 'Comportamento consistente facilita o planejamento do lance com maior segurança.',
    });
  }

  // Volatilidade = risco
  if (behaviorAnalysis.behavior === 'volatil') {
    insights.push({
      type: 'warning',
      icon: 'alert',
      title: 'Alta volatilidade detectada',
      description: 'Grande variação entre assembleias. Considere lance na faixa Alta Segurança para maior proteção.',
    });
  }

  return insights;
}

// ─── Simulação Monte Carlo ─────────────────────────────────────────

/**
 * Estima a probabilidade de contemplação para um lance específico
 * usando simulação Monte Carlo baseada na distribuição histórica.
 *
 * Para cada simulação:
 * 1. Seleciona aleatoriamente um lance mínimo histórico
 * 2. Aplica variação aleatória de ±2% sobre esse valor
 * 3. Compara com o lance do cliente
 *
 * @param bidValue - Lance informado pelo cliente (%)
 * @param historicalMinBids - Histórico de lances mínimos contemplados
 * @param simulations - Número de simulações (default: 10000)
 * @returns Probabilidade estimada (0–100)
 */
export function estimateBidProbabilityMonteCarlo(
  bidValue: number,
  historicalMinBids: number[],
  simulations: number = 10000,
  groupStdDev?: number
): number {
  const validBids = historicalMinBids.filter(v => v > 0);
  if (validBids.length === 0 || bidValue <= 0) return 0;

  // Usar stdDev real do grupo como perturbação; fallback para ±2% relativo
  const useAdaptive = groupStdDev !== undefined && groupStdDev > 0;

  let contemplated = 0;

  for (let i = 0; i < simulations; i++) {
    const baseIndex = Math.floor(Math.random() * validBids.length);
    const baseBid = validBids[baseIndex];

    let simulatedWinningBid: number;
    if (useAdaptive) {
      // Perturbação com desvio padrão real (distribuição uniforme ±stdDev)
      const variation = (Math.random() * 2 - 1) * groupStdDev!;
      simulatedWinningBid = baseBid + variation;
    } else {
      // Fallback: ±2% relativo
      const variation = (Math.random() * 4 - 2) / 100;
      simulatedWinningBid = baseBid * (1 + variation);
    }

    if (bidValue >= simulatedWinningBid) {
      contemplated++;
    }
  }

  return (contemplated / simulations) * 100;
}

// ─── Helpers de Exibição ───────────────────────────────────────────

export function formatBidPercent(value: number): string {
  return value > 0 ? `${value.toFixed(2)}%` : '-';
}

export function getZoneColor(type: ZoneType): string {
  switch (type) {
    case 'conservadora': return 'success';
    case 'equilibrada': return 'warning';
    case 'agressiva': return 'destructive';
  }
}

export function getZoneLabel(type: ZoneType): string {
  switch (type) {
    case 'conservadora': return 'Conservadora';
    case 'equilibrada': return 'Equilibrada';
    case 'agressiva': return 'Agressiva';
  }
}
