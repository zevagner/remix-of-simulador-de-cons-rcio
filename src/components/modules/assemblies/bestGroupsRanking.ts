import { AssemblyRecord, ConsortiumType } from '@/types/consortium';
import { analyzeBidHistory } from '@/utils/bidAnalysis';
import { getUniqueGroups, getUniqueMonths } from '@/utils/assemblyData';

/**
 * Helper compartilhado de ranking de "Melhores Grupos para Lance".
 * Mantém EXATAMENTE os mesmos critérios usados em BestGroupsForBid.tsx
 * para reuso em geração de PDF (sem recalibrar regras).
 */

export interface GroupRanking {
  groupNumber: number;
  avgBid: number;
  trend: 'alta' | 'estavel' | 'queda';
  stdDev: number;
  remainingTerm: number;
  hasEmbeddedBid: boolean;
}

const TREND_ORDER: Record<string, number> = { queda: 0, estavel: 1, alta: 2 };

const MIN_MONTHS_HISTORY = 3;
const RECENT_ACTIVITY_WINDOW = 3;
const MIN_REMAINING_TERM_ABSOLUTE = 24;

export function computeBestGroupsRanking(
  assemblies: AssemblyRecord[],
  selectedTab: ConsortiumType
): GroupRanking[] {
  const groups = getUniqueGroups(assemblies, selectedTab);
  const monthsForType = getUniqueMonths(assemblies, selectedTab);
  const recentMonths = new Set(monthsForType.slice(0, RECENT_ACTIVITY_WINDOW));

  const latestByGroup = new Map<number, AssemblyRecord>();
  for (const groupNum of groups) {
    const records = assemblies.filter(
      a => a.consortiumType === selectedTab && a.groupNumber === groupNum
    );
    if (records.length === 0) continue;
    const latest = [...records].sort(
      (a, b) => new Date(b.assemblyDate).getTime() - new Date(a.assemblyDate).getTime()
    )[0];
    latestByGroup.set(groupNum, latest);
  }

  const remainingTerms = Array.from(latestByGroup.values())
    .map(r => r.remainingTerm ?? 0)
    .filter(v => v > 0);
  const avgRemainingTerm = remainingTerms.length > 0
    ? remainingTerms.reduce((a, b) => a + b, 0) / remainingTerms.length
    : 0;

  const results: GroupRanking[] = [];

  for (const groupNum of groups) {
    const groupRecords = assemblies.filter(
      a => a.consortiumType === selectedTab && a.groupNumber === groupNum
    );

    const monthsOfGroup = new Set(groupRecords.map(r => r.assemblyMonth));
    if (monthsOfGroup.size < MIN_MONTHS_HISTORY) continue;

    const hasRecentActivity = groupRecords.some(r => recentMonths.has(r.assemblyMonth));
    if (!hasRecentActivity) continue;

    const hasContemplations = groupRecords.some(
      r => (r.totalContemplations ?? 0) > 0
        || (r.contemplationsBySorteio ?? 0) > 0
        || (r.contemplationsByLance ?? 0) > 0
        || (r.contemplationsByLanceLivre ?? 0) > 0
        || (r.contemplationsByLanceFixo ?? 0) > 0
    );
    if (!hasContemplations) continue;

    const latestRecord = latestByGroup.get(groupNum);
    const remainingTerm = latestRecord?.remainingTerm ?? 0;
    const meetsAbsolute = remainingTerm >= MIN_REMAINING_TERM_ABSOLUTE;
    const meetsAvg = avgRemainingTerm > 0 && remainingTerm >= avgRemainingTerm;
    if (!meetsAbsolute && !meetsAvg) continue;

    const analysis = analyzeBidHistory(groupRecords);
    if (!analysis) continue;

    results.push({
      groupNumber: groupNum,
      avgBid: analysis.stats.avgOfAvgBids,
      trend: analysis.behaviorAnalysis.trend,
      stdDev: analysis.stats.stdDev,
      remainingTerm,
      hasEmbeddedBid: latestRecord?.hasEmbeddedBid ?? false,
    });
  }

  results.sort((a, b) => {
    const trendDiff = TREND_ORDER[a.trend] - TREND_ORDER[b.trend];
    if (trendDiff !== 0) return trendDiff;
    const bidDiff = a.avgBid - b.avgBid;
    if (Math.abs(bidDiff) > 0.01) return bidDiff;
    return a.stdDev - b.stdDev;
  });

  return results;
}
