/**
 * src/utils — índice geral
 * ════════════════════════
 *
 * Categorias (barrels) — preferir estes caminhos em código novo:
 *
 *   @/utils/format       → formatadores pt-BR (moeda, percentual, faixas, gráficos)
 *   @/utils/validation   → validação e normalização de entradas
 *   @/utils/data         → ingestão de Excel e assembleias
 *   @/utils/dom          → interações de browser (clipboard, WhatsApp, tour)
 *   @/utils/system       → logger, navegação, cache, telemetria
 *   @/utils/domain       → heurísticas de domínio (priorização, scoring, etc.)
 *
 * Subpastas de domínio com motor próprio (mantidas inalteradas):
 *
 *   @/utils/bidAnalysis  → motor de análise de lances
 *   @/utils/community    → utilitários do módulo Comunidade
 *   @/utils/proposalPdf  → narrativa e seções do PDF de proposta
 *   @/utils/salesScript  → engine de script de vendas
 *
 * Cálculo financeiro (IR, simulação, schedule, reconciliação) NÃO mora
 * aqui — fachada única em '@/core/finance' (ver src/core/finance/README.md).
 *
 * Os arquivos físicos permanecem em src/utils/* para não invalidar os
 * imports existentes (~120 sites). Esta organização é puramente
 * arquitetural via re-export.
 */
export * as format from './format';
export * as validation from './validation';
export * as data from './data';
export * as dom from './dom';
export * as system from './system';
export * as domain from './domain';
