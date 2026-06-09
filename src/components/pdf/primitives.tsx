import React from 'react';
import { pdfStyles as s } from './PdfLayout';

/**
 * PDF Primitives — wrappers finos sobre `pdfStyles` para eliminar
 * markup duplicado nos 5 PDFs do projeto.
 *
 * REGRA: estes primitivos NÃO inventam estilos novos. Eles apenas
 * encapsulam combinações que se repetiam literalmente em PdfSimulador,
 * PdfInvestimento, PdfEstudoLances, PdfOperacoesEstruturadas e PdfComparador.
 * Qualquer mudança visual deve ser feita em `pdfStyles` (PdfLayout.tsx).
 */

// ─── Section ─────────────────────────────────────────────────────────

interface PdfSectionProps {
  title?: string;
  /** Cor customizada do título (default: azul institucional via pdfStyles) */
  titleColor?: string;
  /** Borda lateral colorida (usado em Operações Estruturadas) */
  borderLeftColor?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function PdfSection({ title, titleColor, borderLeftColor, style, children }: PdfSectionProps) {
  // P7: evitar quebras no meio de seções/cards/tabelas durante geração do PDF.
  const baseAvoidBreak: React.CSSProperties = {
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
  };

  const sectionStyle: React.CSSProperties = borderLeftColor
    ? { ...s.section, borderLeft: `4px solid ${borderLeftColor}`, paddingLeft: '12pt', ...baseAvoidBreak, ...style }
    : { ...s.section, ...baseAvoidBreak, ...style };

  const titleStyle: React.CSSProperties = titleColor
    ? { ...s.sectionTitle, color: titleColor }
    : s.sectionTitle;

  return (
    <div style={sectionStyle}>
      {title && <div style={titleStyle}>{title}</div>}
      {children}
    </div>
  );
}

// ─── MetricGrid ──────────────────────────────────────────────────────

interface PdfMetricGridProps {
  cols?: 2 | 3 | 4;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function PdfMetricGrid({ cols = 4, style, children }: PdfMetricGridProps) {
  const gridStyle = cols === 2 ? s.grid2 : cols === 3 ? s.grid3 : s.grid4;
  return <div style={{ ...gridStyle, ...style }}>{children}</div>;
}

// ─── Metric ──────────────────────────────────────────────────────────

type MetricTone = 'default' | 'primary' | 'success' | 'warning';

interface PdfMetricProps {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: MetricTone;
  /** Renderiza o metric dentro de um card (background + borda) */
  card?: boolean;
  /** Cor customizada do valor (sobrescreve `tone`) */
  valueColor?: string;
  /** Estilo extra aplicado ao container externo */
  style?: React.CSSProperties;
}

export function PdfMetric({ label, value, tone = 'default', card, valueColor, style }: PdfMetricProps) {
  const valueStyle: React.CSSProperties = valueColor
    ? { ...s.value, color: valueColor }
    : tone === 'primary' ? s.valuePrimary
    : tone === 'success' ? s.valueSuccess
    : tone === 'warning' ? s.valueWarning
    : s.value;

  const containerStyle: React.CSSProperties = card
    ? { ...s.card, ...style }
    : style ?? {};

  return (
    <div style={containerStyle}>
      <div style={s.label}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );
}

// ─── DataTable ───────────────────────────────────────────────────────

export interface PdfTableColumn {
  header: React.ReactNode;
  align?: 'left' | 'right';
}

interface PdfDataTableProps {
  columns: PdfTableColumn[];
  /** Cada linha é um array de células alinhadas com `columns` */
  rows: React.ReactNode[][];
  /** Estilo extra aplicado por linha (índice = linha). Útil para destacar totais. */
  rowStyles?: (React.CSSProperties | undefined)[];
  /** Estilo extra por célula: cellStyles[rowIdx]?.[colIdx] */
  cellStyles?: (React.CSSProperties | undefined)[][];
}

export function PdfDataTable({ columns, rows, rowStyles, cellStyles }: PdfDataTableProps) {
  const tableStyle: React.CSSProperties = { ...s.table, width: '100%', maxWidth: '100%', tableLayout: 'fixed' };
  const cellWrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'break-word' };
  return (
    <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{ ...(col.align === 'right' ? s.thRight : s.th), ...cellWrap }}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} style={rowStyles?.[rIdx]}>
              {row.map((cell, cIdx) => {
                const baseStyle = columns[cIdx]?.align === 'right' ? s.tdRight : s.td;
                const extra = cellStyles?.[rIdx]?.[cIdx];
                return (
                  <td key={cIdx} style={extra ? { ...baseStyle, ...cellWrap, ...extra } : { ...baseStyle, ...cellWrap }}>
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Disclaimer ──────────────────────────────────────────────────────

export function PdfDisclaimer({ children }: { children: React.ReactNode }) {
  return <div style={s.disclaimer}>{children}</div>;
}

// ─── BarChart (SVG puro, html2canvas-friendly) ──────────────────────

export interface PdfBarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface PdfBarChartProps {
  title?: string;
  items: PdfBarChartItem[];
  /** Largura total do SVG em pixels (default 520) */
  width?: number;
  /** Altura total do SVG em pixels (default 240) */
  height?: number;
  /** Formatador do valor exibido no topo de cada barra */
  formatValue?: (v: number) => string;
  /** Formatador dos ticks do eixo Y (default: moeda em R$ Xk) */
  yTickFormat?: (v: number) => string;
}

/**
 * Bar chart estático em SVG inline — renderiza fielmente no PDF
 * (html2canvas converte SVG inline sem perder dimensões).
 * Não usa Recharts/ResponsiveContainer (que dependem de medidas do DOM
 * vivo e ficam invisíveis no clone off-screen).
 */
export function PdfBarChart({
  title,
  items,
  width = 520,
  height = 240,
  formatValue = (v) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`,
  yTickFormat = (v: number) => `R$ ${Math.round(v / 1000)}k`,
}: PdfBarChartProps) {
  const padding = { top: 28, right: 12, bottom: 36, left: 56 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = items.map((i) => (Number.isFinite(i.value) ? i.value : 0));
  const maxVal = Math.max(...values, 1);
  const niceMax = maxVal * 1.1;

  const barCount = items.length;
  const slotW = chartW / barCount;
  const barW = Math.min(slotW * 0.65, 48);

  // 4 grid lines horizontais
  const gridSteps = 4;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const v = (niceMax / gridSteps) * i;
    const y = padding.top + chartH - (v / niceMax) * chartH;
    return { v, y };
  });

  return (
    <div style={{ background: '#fff', padding: '8pt', border: '1px solid #E5E5E5', borderRadius: '4pt', width: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
      {title && (
        <div style={{ fontSize: '9pt', fontWeight: 600, textAlign: 'center', color: '#333', marginBottom: '4pt' }}>
          {title}
        </div>
      )}
      {/* `width="100%"` + viewBox preservam o aspect-ratio e impedem clipping
          em containers estreitos (ex.: grid 1fr 1fr do Comparativo Financeiro). */}
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', maxWidth: '100%' }}>

        {/* Grid */}
        {gridLines.map((g, i) => (
          <g key={`g-${i}`}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={g.y}
              y2={g.y}
              stroke="#E5E5E5"
              strokeDasharray="3 3"
            />
            <text x={padding.left - 6} y={g.y + 3} fontSize="9" fill="#666" textAnchor="end">
              {yTickFormat(g.v)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {items.map((item, i) => {
          const v = Number.isFinite(item.value) ? item.value : 0;
          const h = niceMax > 0 ? (v / niceMax) * chartH : 0;
          const x = padding.left + slotW * i + (slotW - barW) / 2;
          const y = padding.top + chartH - h;
          const color = item.color || '#005CA9';
          return (
            <g key={`b-${i}`}>
              <rect x={x} y={y} width={barW} height={h} fill={color} rx="2" />
              {v > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 4}
                  fontSize="8"
                  fill="#333"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {formatValue(v)}
                </text>
              )}
              <text
                x={padding.left + slotW * i + slotW / 2}
                y={height - padding.bottom + 14}
                fontSize="8"
                fill="#333"
                textAnchor="middle"
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + chartH}
          y2={padding.top + chartH}
          stroke="#333"
        />
        <line
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={padding.top + chartH}
          stroke="#333"
        />
      </svg>
    </div>
  );
}
