/**
 * Categoria: Lógica de domínio (consórcio, vendas, pós-venda, scoring).
 * Barrel re-export — ver src/utils/index.ts.
 *
 * Observação: cálculos financeiros canônicos vivem em '@/core/finance'.
 * Este barrel agrupa apenas heurísticas de UI/CRM (priorização,
 * oportunidades, scoring de cliente, próximas ações).
 */
export * from '../proposalPriority';
export * from '../opportunityAnalysis';
export * from '../clientScoring';
export * from '../nextActionSuggestion';
export * from '../salesForecast';
export * from '../objectionRecommender';
export * from '../decisionEngine';
export * from '../mipRates';
export * from '../getSubObjetivoTexto';
export * from '../salesPitchGenerator';
export * from '../buildMessageContext';
