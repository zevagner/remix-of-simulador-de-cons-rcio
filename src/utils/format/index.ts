/**
 * Categoria: Formatação (apresentação)
 * ────────────────────────────────────
 * Barrel re-export. Os arquivos físicos permanecem em src/utils/* para
 * preservar os ~120 imports existentes. Código novo deve importar daqui:
 *
 *   import { formatCurrency } from '@/utils/format';
 */
export {
  formatCurrency,
  formatCurrencyShort,
  formatCurrencyBRL,
  formatPercent,
} from '../format';
export { formatCreditRange } from '../formatCreditRange';
export { CHART_COLORS, useChartTheme } from '../chartTheme';
export { getClientInitials, getClientAvatarColor } from '../clientAvatar';
