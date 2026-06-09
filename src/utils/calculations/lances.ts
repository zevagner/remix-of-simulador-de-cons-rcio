/**
 * Cálculos de Análise de Lances
 * 
 * Funções puras para análise estatística de lances, zonas de contemplação,
 * Monte Carlo e comportamento de grupos.
 * Re-exporta do módulo original para manter compatibilidade.
 */
export {
  analyzeBidHistory,
  formatBidPercent,
  getZoneColor,
  getZoneLabel,
  estimateBidProbabilityMonteCarlo,
  type BidAnalysisResult,
  type GroupBehavior,
  type ZoneType,
  type ContemplationZone,
  type BidRecommendation,
  type GroupBehaviorAnalysis,
  type MonthDataQuality,
  type DataQualityLevel,
  type TrendInsight,
} from '../bidAnalysis';
