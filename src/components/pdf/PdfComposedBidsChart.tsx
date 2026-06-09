import React from 'react';

/**
 * Espelho SVG (estático) do `BidsChart` (Recharts) usado na tela.
 *
 * Não recebe nada que precise ser calculado: consome `chartData` direto do
 * `BidsContext` (mesma fonte da tela). Renderiza barras Sorteio + Por Lance
 * (eixo esquerdo, contagens) e linhas Mín/Méd/Máx (eixo direito, %),
 * com a mesma faixa sombreada e mesmas cores do componente da tela.
 *
 * Sem Recharts/ResponsiveContainer (não funcionam no clone off-screen
 * usado pelo gerador de PDF).
 */

export interface PdfComposedBidsChartRow {
  month: string;
  sorteio: number;
  lanceLivre: number;
  lanceMinimo: number;
  lanceMedio: number;
  lanceMaximo: number;
}

const COLORS = {
  lanceMedio: '#2563eb',
  lanceMaximo: '#ef4444',
  lanceMinimo: '#64748b',
  faixa: '#94a3b8',
  lanceLivre: '#f97316',
  sorteio: '#60a5fa',
};

interface Props {
  data: PdfComposedBidsChartRow[];
  width?: number;
  height?: number;
}

export function PdfComposedBidsChart({ data, width = 620, height = 280 }: Props) {
  const padding = { top: 24, right: 60, bottom: 56, left: 56 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const n = data.length;
  if (n === 0) {
    return (
      <div style={{ background: '#fff', padding: '8pt', border: '1px solid #E5E5E5', borderRadius: '4pt', textAlign: 'center', color: '#666', fontSize: '9pt' }}>
        Sem dados para exibir
      </div>
    );
  }

  // Domínios — mesma lógica do BidsChart (com padding de 3% nos %s e 2 nas contagens).
  const allPercents = data.flatMap(d => [d.lanceMinimo, d.lanceMedio, d.lanceMaximo]).filter(v => v > 0);
  const allConts = data.flatMap(d => [d.sorteio, d.lanceLivre]);

  const minP = allPercents.length ? Math.min(...allPercents) : 0;
  const maxP = allPercents.length ? Math.max(...allPercents) : 100;
  const yPMin = Math.max(0, Math.floor(minP - 3));
  const yPMax = Math.min(100, Math.ceil(maxP + 3));
  const pSpan = Math.max(yPMax - yPMin, 1);

  const maxC = allConts.length ? Math.max(...allConts) : 10;
  const yCMax = Math.max(Math.ceil(maxC + 2), 1);

  // Helpers de coordenadas
  const slotW = chartW / n;
  const xCenter = (i: number) => padding.left + slotW * i + slotW / 2;
  const yPercent = (v: number) => padding.top + chartH - ((v - yPMin) / pSpan) * chartH;
  const yCount = (v: number) => padding.top + chartH - (v / yCMax) * chartH;

  // Grid (5 linhas, baseadas no eixo esquerdo de contagens)
  const gridSteps = 5;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const c = (yCMax / gridSteps) * i;
    const p = yPMin + (pSpan / gridSteps) * i;
    const y = padding.top + chartH - (i / gridSteps) * chartH;
    return { c, p, y };
  });

  // Barras agrupadas (Sorteio + Por Lance) — duas barras por mês.
  const groupBarsW = Math.min(slotW * 0.7, 56);
  const barW = groupBarsW / 2 - 1;

  // Path da área (faixa entre Mín e Máx) — só inclui pontos válidos (>0 em ambos)
  const areaPoints: Array<{ x: number; yMax: number; yMin: number }> = [];
  data.forEach((d, i) => {
    if (d.lanceMaximo > 0 && d.lanceMinimo > 0) {
      areaPoints.push({ x: xCenter(i), yMax: yPercent(d.lanceMaximo), yMin: yPercent(d.lanceMinimo) });
    }
  });
  let areaPath = '';
  if (areaPoints.length >= 2) {
    areaPath = `M ${areaPoints[0].x} ${areaPoints[0].yMax}`;
    for (let i = 1; i < areaPoints.length; i++) areaPath += ` L ${areaPoints[i].x} ${areaPoints[i].yMax}`;
    for (let i = areaPoints.length - 1; i >= 0; i--) areaPath += ` L ${areaPoints[i].x} ${areaPoints[i].yMin}`;
    areaPath += ' Z';
  }

  // Helper: gera path de linha pulando valores 0
  const linePath = (key: 'lanceMinimo' | 'lanceMedio' | 'lanceMaximo') => {
    let d = '';
    let started = false;
    data.forEach((row, i) => {
      const v = row[key];
      if (v > 0) {
        const x = xCenter(i);
        const y = yPercent(v);
        d += `${started ? ' L' : 'M'} ${x} ${y}`;
        started = true;
      } else {
        started = false;
      }
    });
    return d;
  };

  return (
    <div style={{ background: '#fff', padding: '8pt', border: '1px solid #E5E5E5', borderRadius: '4pt', width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', maxWidth: '100%' }}>
        {/* Grid + ticks (esquerda contagens, direita %) */}
        {gridLines.map((g, i) => (
          <g key={`g-${i}`}>
            <line x1={padding.left} x2={width - padding.right} y1={g.y} y2={g.y} stroke="#E5E5E5" strokeDasharray="3 3" />
            <text x={padding.left - 6} y={g.y + 3} fontSize="9" fill="#666" textAnchor="end">
              {Math.round(g.c)}
            </text>
            <text x={width - padding.right + 6} y={g.y + 3} fontSize="9" fill="#666" textAnchor="start">
              {Math.round(g.p)}%
            </text>
          </g>
        ))}

        {/* Eixos */}
        <line x1={padding.left} x2={width - padding.right} y1={padding.top + chartH} y2={padding.top + chartH} stroke="#cbd5e1" />
        <line x1={padding.left} x2={padding.left} y1={padding.top} y2={padding.top + chartH} stroke="#cbd5e1" />
        <line x1={width - padding.right} x2={width - padding.right} y1={padding.top} y2={padding.top + chartH} stroke="#cbd5e1" />

        {/* Rótulos dos eixos */}
        <text x={padding.left - 42} y={padding.top + chartH / 2} fontSize="9" fill="#666" textAnchor="middle"
          transform={`rotate(-90 ${padding.left - 42} ${padding.top + chartH / 2})`}>
          Contemplados
        </text>
        <text x={width - padding.right + 44} y={padding.top + chartH / 2} fontSize="9" fill="#666" textAnchor="middle"
          transform={`rotate(90 ${width - padding.right + 44} ${padding.top + chartH / 2})`}>
          Lance %
        </text>

        {/* Barras agrupadas */}
        {data.map((row, i) => {
          const cx = xCenter(i);
          const xSorteio = cx - barW - 1;
          const xLance = cx + 1;
          const ySorteio = yCount(row.sorteio);
          const yLance = yCount(row.lanceLivre);
          const baseY = padding.top + chartH;
          return (
            <g key={`bar-${i}`}>
              {row.sorteio > 0 && (
                <rect x={xSorteio} y={ySorteio} width={barW} height={baseY - ySorteio} fill={COLORS.sorteio} opacity={0.85} rx="2" />
              )}
              {row.lanceLivre > 0 && (
                <>
                  <rect x={xLance} y={yLance} width={barW} height={baseY - yLance} fill={COLORS.lanceLivre} opacity={0.9} rx="2" />
                  <text x={xLance + barW / 2} y={yLance - 3} fontSize="8" fill="#475569" textAnchor="middle" fontWeight="600">
                    {row.lanceLivre}
                  </text>
                </>
              )}
              {/* Label X */}
              <text x={cx} y={height - padding.bottom + 14} fontSize="8" fill="#475569" textAnchor="middle">
                {row.month}
              </text>
            </g>
          );
        })}

        {/* Faixa Mín/Máx (área sombreada) */}
        {areaPath && <path d={areaPath} fill={COLORS.faixa} opacity={0.12} />}

        {/* Linha Mínimo (tracejada, discreta) */}
        <path d={linePath('lanceMinimo')} fill="none" stroke={COLORS.lanceMinimo} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.7} />
        {/* Linha Máximo (tracejada vermelha) */}
        <path d={linePath('lanceMaximo')} fill="none" stroke={COLORS.lanceMaximo} strokeWidth={1.4} strokeDasharray="4 3" opacity={0.7} />
        {/* Linha Médio (sólida, principal) */}
        <path d={linePath('lanceMedio')} fill="none" stroke={COLORS.lanceMedio} strokeWidth={2.4} />

        {/* Pontos da linha do médio + labels de % no topo */}
        {data.map((row, i) => {
          if (row.lanceMedio <= 0) return null;
          const x = xCenter(i);
          const y = yPercent(row.lanceMedio);
          return (
            <g key={`pm-${i}`}>
              <circle cx={x} cy={y} r={3.2} fill={COLORS.lanceMedio} stroke="#fff" strokeWidth={1.2} />
              <text x={x} y={y - 7} fontSize="8" fill={COLORS.lanceMedio} textAnchor="middle" fontWeight="700">
                {row.lanceMedio.toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legenda — mesma ordem da tela */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14pt', marginTop: '6pt', fontSize: '8pt', color: '#475569' }}>
        <LegendLine color={COLORS.lanceMedio} solid label="Lance Médio" bold />
        <LegendLine color={COLORS.lanceMaximo} dashed label="Lance Máximo" />
        <LegendLine color={COLORS.lanceMinimo} dashed label="Lance Mínimo" />
        <LegendBar color={COLORS.lanceLivre} label="Por Lance" />
        <LegendBar color={COLORS.sorteio} label="Sorteio" />
      </div>
    </div>
  );
}

function LegendBar({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4pt' }}>
      <span style={{ display: 'inline-block', width: '9pt', height: '9pt', background: color, borderRadius: '1.5pt' }} />
      {label}
    </span>
  );
}

function LegendLine({ color, label, dashed, solid, bold }: { color: string; label: string; dashed?: boolean; solid?: boolean; bold?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4pt', fontWeight: bold ? 700 : 400, color: bold ? '#0f172a' : '#475569' }}>
      <svg width="18" height="6">
        <line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth={solid ? 2.2 : 1.4} strokeDasharray={dashed ? '3 2' : undefined} strokeLinecap="round" />
      </svg>
      {label}
    </span>
  );
}
