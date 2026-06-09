import React from 'react';

export interface PdfPieItem {
  name: string;
  value: number;
  color?: string;
}

interface Props {
  title?: string;
  items: PdfPieItem[];
  width?: number;
  height?: number;
  formatValue?: (v: number) => string;
}

const DEFAULT_COLORS = ['#005CA9', '#F39200', '#4CAF50', '#9C27B0', '#00ACC1'];

/**
 * Pie chart estático em SVG inline para o PDF.
 * Não recalcula valores — usa diretamente `value` e o total dos itens recebidos.
 */
export function PdfPieChart({
  title,
  items,
  width = 260,
  height = 220,
  formatValue = (v) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`,
}: Props) {
  const total = items.reduce((sum, it) => sum + (Number.isFinite(it.value) ? it.value : 0), 0);
  const cx = 90;
  const cy = height / 2;
  const r = Math.min(cy - 10, 80);

  let acc = 0;
  const slices = items.map((it, i) => {
    const v = Number.isFinite(it.value) ? it.value : 0;
    const startAngle = total > 0 ? (acc / total) * Math.PI * 2 : 0;
    acc += v;
    const endAngle = total > 0 ? (acc / total) * Math.PI * 2 : 0;
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.sin(startAngle);
    const y1 = cy - r * Math.cos(startAngle);
    const x2 = cx + r * Math.sin(endAngle);
    const y2 = cy - r * Math.cos(endAngle);
    const path =
      total > 0
        ? `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
        : '';
    return { path, color: it.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length], item: it, value: v };
  });

  return (
    <div style={{ background: '#fff', padding: '8pt', border: '1px solid #E5E5E5', borderRadius: '4pt' }}>
      {title && (
        <div style={{ fontSize: '9pt', fontWeight: 600, textAlign: 'center', color: '#333', marginBottom: '4pt' }}>
          {title}
        </div>
      )}
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        {total > 0 ? (
          slices.filter(s => s.value > 0).length === 1 ? (
            // Caso especial: uma única fatia = 100%. Arco SVG fecha em si mesmo
            // e fica invisível; renderiza um círculo sólido no lugar.
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={(slices.find(s => s.value > 0) || slices[0]).color}
              stroke="#fff"
              strokeWidth="1"
            />
          ) : (
            slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="1" />)
          )
        ) : (
          <text x={cx} y={cy} fontSize="9" fill="#999" textAnchor="middle">Sem dados</text>
        )}
        {/* Legenda */}
        {slices.map((s, i) => {
          const ly = 20 + i * 16;
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <g key={`l-${i}`}>
              <rect x={190} y={ly - 8} width={10} height={10} fill={s.color} />
              <text x={204} y={ly} fontSize="8" fill="#333">
                {s.item.name}
              </text>
              <text x={204} y={ly + 9} fontSize="7" fill="#666">
                {formatValue(s.value)} ({pct.toFixed(0)}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
