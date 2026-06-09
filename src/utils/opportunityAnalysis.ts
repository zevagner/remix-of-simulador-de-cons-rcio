/**
 * Análise de oportunidades comerciais para consultores.
 * Processa dados de assembleias e identifica os melhores grupos para venda.
 */

import { AssemblyRecord, ConsortiumType, CONSORTIUM_TYPE_LABELS } from '@/types/consortium';
import { analyzeBidHistory, type BidAnalysisResult } from './bidAnalysis';
import { getUniqueGroups, getUniqueMonths } from './assemblyData';

export interface GroupOpportunity {
  groupNumber: number;
  consortiumType: ConsortiumType;
  typeLabel: string;
  creditRange: string;
  participants: number;
  remainingTerm: number;
  totalTerm: number;
  hasEmbeddedBid: boolean;
  embeddedBidMaxPercent: number;
  // Analysis
  trend: 'alta' | 'estavel' | 'queda';
  behavior: string;
  predominance: 'sorteio' | 'lance' | 'equilibrado';
  riskLevel: 'baixo' | 'medio' | 'alto';
  // Bid zones
  conservadoraBid: number;
  equilibradaBid: number;
  agressivaBid: number;
  // Score (higher = better opportunity)
  opportunityScore: number;
  reason: string;
}

export interface OpportunityInsights {
  bestGroups: GroupOpportunity[];
  decliningBidGroups: GroupOpportunity[];
  highContemplationGroups: GroupOpportunity[];
  summary: {
    totalGroupsAnalyzed: number;
    totalOpportunities: number;
    avgIdealBid: number;
    bidRange: { min: number; max: number };
    dominantRisk: 'baixo' | 'medio' | 'alto';
  };
  generatedAt: string;
}

function scoreGroup(
  record: AssemblyRecord,
  analysis: BidAnalysisResult
): { score: number; reason: string } {
  let score = 50; // base
  const reasons: string[] = [];

  // Tendência de queda = oportunidade (lance mais barato)
  if (analysis.behaviorAnalysis.trend === 'queda') {
    score += 25;
    reasons.push('lance em queda');
  } else if (analysis.behaviorAnalysis.trend === 'estavel') {
    score += 10;
  }

  // Predominância de sorteio = bom (contemplação sem lance alto)
  if (analysis.behaviorAnalysis.predominance === 'sorteio') {
    score += 20;
    reasons.push('alta chance por sorteio');
  }

  // Comportamento previsível = mais seguro
  if (analysis.behaviorAnalysis.behavior === 'previsivel') {
    score += 15;
    reasons.push('comportamento estável');
  } else if (analysis.behaviorAnalysis.behavior === 'volatil') {
    score -= 10;
  }

  // Risco baixo
  if (analysis.recommendation.riskLevel === 'baixo') {
    score += 15;
    reasons.push('risco baixo');
  } else if (analysis.recommendation.riskLevel === 'alto') {
    score -= 5;
  }

  // Lance embutido disponível
  if (record.hasEmbeddedBid) {
    score += 10;
    reasons.push(`lance embutido até ${record.embeddedBidMaxPercent}%`);
  }

  // Prazo remanescente generoso (mais tempo = mais assembleias)
  if (record.remainingTerm > 100) {
    score += 5;
    reasons.push('prazo longo');
  }

  // Lance conservador acessível (< 30%)
  if (analysis.zones.conservadora.minBid > 0 && analysis.zones.conservadora.minBid < 30) {
    score += 10;
    reasons.push('lance conservador acessível');
  }

  return { score: Math.min(100, Math.max(0, score)), reason: reasons.join(', ') };
}

export function analyzeOpportunities(assemblies: AssemblyRecord[]): OpportunityInsights {
  const opportunities: GroupOpportunity[] = [];
  const types: ConsortiumType[] = ['imobiliario', 'auto', 'pesados'];

  for (const type of types) {
    const groups = getUniqueGroups(assemblies, type);

    for (const groupNum of groups) {
      const groupRecords = assemblies
        .filter(a => a.consortiumType === type && a.groupNumber === groupNum)
        .sort((a, b) => new Date(a.assemblyDate).getTime() - new Date(b.assemblyDate).getTime());

      if (groupRecords.length < 3) continue; // need minimum history

      const analysis = analyzeBidHistory(groupRecords);
      if (!analysis) continue;

      const latest = groupRecords[groupRecords.length - 1];
      const { score, reason } = scoreGroup(latest, analysis);

      opportunities.push({
        groupNumber: groupNum,
        consortiumType: type,
        typeLabel: CONSORTIUM_TYPE_LABELS[type],
        creditRange: latest.creditRange,
        participants: latest.participants,
        remainingTerm: latest.remainingTerm,
        totalTerm: latest.totalTerm,
        hasEmbeddedBid: latest.hasEmbeddedBid,
        embeddedBidMaxPercent: latest.embeddedBidMaxPercent,
        trend: analysis.behaviorAnalysis.trend,
        behavior: analysis.behaviorAnalysis.behaviorLabel,
        predominance: analysis.behaviorAnalysis.predominance,
        riskLevel: analysis.recommendation.riskLevel,
        conservadoraBid: analysis.zones.conservadora.minBid,
        equilibradaBid: analysis.zones.equilibrada.minBid,
        agressivaBid: analysis.zones.agressiva.minBid,
        opportunityScore: score,
        reason,
      });
    }
  }

  // Sort by score desc
  opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

  const decliningBid = opportunities.filter(o => o.trend === 'queda').slice(0, 10);
  const highContemp = opportunities.filter(o => o.predominance === 'sorteio').slice(0, 10);
  const best = opportunities.slice(0, 10);

  // Summary stats
  const bids = opportunities.filter(o => o.conservadoraBid > 0).map(o => o.conservadoraBid);
  const avgBid = bids.length > 0 ? bids.reduce((a, b) => a + b, 0) / bids.length : 0;
  const risks = opportunities.map(o => o.riskLevel);
  const riskCounts = { baixo: 0, medio: 0, alto: 0 };
  risks.forEach(r => riskCounts[r]++);
  const dominantRisk = Object.entries(riskCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as 'baixo' | 'medio' | 'alto' || 'medio';

  return {
    bestGroups: best,
    decliningBidGroups: decliningBid,
    highContemplationGroups: highContemp,
    summary: {
      totalGroupsAnalyzed: opportunities.length,
      totalOpportunities: best.filter(o => o.opportunityScore >= 70).length,
      avgIdealBid: avgBid,
      bidRange: {
        min: bids.length > 0 ? Math.min(...bids) : 0,
        max: bids.length > 0 ? Math.max(...bids) : 0,
      },
      dominantRisk,
    },
    generatedAt: new Date().toISOString(),
  };
}
