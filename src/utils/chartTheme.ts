/**
 * Chart theme utilities for dark mode support.
 * Provides CSS-variable-aware colors for Recharts components.
 */

// Institutional colors that work in both themes (saturated enough to be visible)
// Brand colors come from CSS vars (--caixa-*) for single source of truth.
export const CHART_COLORS = {
  blue: 'var(--caixa-blue)',
  orange: 'var(--caixa-orange)',
  green: '#4CAF50',
  gray: '#888888',
  grayLight: '#AAAAAA',
  red: '#dc2626',
  greenDark: '#16a34a',
  purple: '#9C27B0',
  pink: '#ec4899',
  cyan: '#06b6d4',
} as const;

/** Returns theme-aware props for chart axes, grids and tooltips */
export function useChartTheme() {
  // We read from CSS variables at render time
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const axisColor = isDark ? '#9ca3af' : '#333333';
  const gridColor = isDark ? '#374151' : '#E5E5E5';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#E5E5E5';
  const labelColor = isDark ? '#d1d5db' : '#333333';

  return {
    axisColor,
    gridColor,
    labelColor,
    axisProps: { stroke: axisColor, tick: { fill: axisColor } },
    gridProps: { strokeDasharray: '3 3', stroke: gridColor },
    tooltipStyle: {
      backgroundColor: tooltipBg,
      border: `1px solid ${tooltipBorder}`,
      borderRadius: '4px',
      color: labelColor,
    },
  };
}
