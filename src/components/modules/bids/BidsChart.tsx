import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, LabelList } from 'recharts';
import { HelpTooltip } from '@/components/shared/HelpTooltip';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useBidsContext } from './BidsContext';
import { useIsMobile } from '@/hooks/use-mobile';
import type { BidStudyData } from './BidsContext';

const COLORS = {
  lanceMedio: '#2563eb',
  lanceMaximo: '#ef4444',
  lanceMinimo: '#64748b',
  faixa: '#94a3b8',
  lanceLivre: '#f97316',
  sorteio: '#60a5fa',
};

type TooltipPayloadItem = {
  dataKey?: string | number;
  value?: number;
  color?: string;
};
type TooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
};

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const get = (key: string): number | undefined =>
    payload.find((p) => p.dataKey === key)?.value;

  const lanceMedio = get('lanceMedio');
  const lanceMin = get('lanceMinimo');
  const lanceMax = get('lanceMaximo');
  const contemLance = get('lanceLivre');
  const contemSorteio = get('sorteio');

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl p-card-sm text-sm min-w-[200px]">
      <p className="font-semibold text-foreground mb-2.5 text-body">{label}</p>

      {lanceMedio != null && lanceMedio > 0 && (
        <div className="flex items-center justify-between gap-6 mb-1.5">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS.lanceMedio }} />
            <span className="text-muted-foreground text-xs">Lance Médio</span>
          </span>
          <span className="font-bold text-foreground tabular-nums">{lanceMedio.toFixed(2)}%</span>
        </div>
      )}

      {(lanceMin != null || lanceMax != null) && (lanceMin > 0 || lanceMax > 0) && (
        <div className="flex items-center justify-between gap-6 mb-1.5">
          <span className="flex items-center gap-2">
            <span className="w-3 h-[3px] rounded-full" style={{ backgroundColor: COLORS.faixa }} />
            <span className="text-muted-foreground text-xs">Faixa</span>
          </span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {lanceMin > 0 ? `${lanceMin.toFixed(2)}%` : '–'} — {lanceMax > 0 ? `${lanceMax.toFixed(2)}%` : '–'}
          </span>
        </div>
      )}

      <div className="border-t border-border/40 my-2.5" />

      <div className="flex items-center justify-between gap-6 mb-1.5">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.lanceLivre }} />
          <span className="text-muted-foreground text-xs">Por Lance</span>
        </span>
        <span className="font-semibold text-foreground">{contemLance ?? 0}</span>
      </div>

      <div className="flex items-center justify-between gap-6">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.sorteio }} />
          <span className="text-muted-foreground text-xs">Por Sorteio</span>
        </span>
        <span className="font-semibold text-foreground">{contemSorteio ?? 0}</span>
      </div>
    </div>
  );
}


type LegendPayloadItem = {
  dataKey?: string;
  value?: string;
  color?: string;
  type?: string;
  payload?: { strokeDasharray?: string };
};
type LegendProps = { payload?: LegendPayloadItem[] };

function CustomLegend({ payload }: LegendProps) {
  if (!payload) return null;

  const order = ['lanceMedio', 'lanceMaximo', 'lanceMinimo', 'lanceLivre', 'sorteio'];
  const sorted = [...payload].sort((a, b) => {
    const ia = order.indexOf(a.dataKey || a.value || '');
    const ib = order.indexOf(b.dataKey || b.value || '');
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const filtered = sorted.filter(
    (entry) => entry.dataKey !== 'lanceMinimo_area' && entry.value !== 'lanceMinimo_area',
  );

  // Renderiza ícone replicando o estilo exato do gráfico (barra, linha sólida, linha tracejada)
  const renderIcon = (entry: LegendPayloadItem) => {
    const barKeys = ['sorteio', 'lanceLivre'];
    const barTypes = ['rect', 'square'];
    const isBar = barKeys.includes(entry.dataKey || '') || barTypes.includes(entry.type || '');
    if (isBar) {
      const barColor =
        entry.dataKey === 'lanceLivre' ? COLORS.lanceLivre :
        entry.dataKey === 'sorteio' ? COLORS.sorteio :
        entry.color;
      return (
        <span
          className="inline-block w-3 h-3 rounded-sm shadow-sm"
          style={{ backgroundColor: barColor }}
          aria-hidden
        />
      );
    }
    // Linha — detectar se é tracejada via payload original
    const dashArray: string | undefined = entry.payload?.strokeDasharray;
    const isDashed = !!dashArray && dashArray !== '0' && dashArray !== 'none';
    const strokeWidth = entry.dataKey === 'lanceMedio' ? 3 : 2;

    return (
      <svg width="20" height="8" className="inline-block shrink-0" aria-hidden>
        <line
          x1="0"
          y1="4"
          x2="20"
          y2="4"
          stroke={entry.color}
          strokeWidth={strokeWidth}
          strokeDasharray={isDashed ? '4 3' : undefined}
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4 text-xs">
      {filtered.map((entry, index) => {
        const isPrimary = entry.dataKey === 'lanceMedio';
        return (
          <span
            key={index}
            className={`flex items-center gap-1.5 transition-opacity ${
              isPrimary ? 'text-foreground font-semibold' : 'text-muted-foreground opacity-90 hover:opacity-100'
            }`}
          >
            {renderIcon(entry)}
            <span>{entry.value}</span>
          </span>
        );
      })}
    </div>
  );
}

function useSummary(data: BidStudyData) {
  return useMemo(() => {
    const cd = data.chartData;
    const len = cd.length;
    if (len < 2) return null;

    const avg = (arr: number[]) => {
      const v = arr.filter(n => n > 0);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
    };

    // Trend: first half vs second half of lanceMedio
    const half = Math.floor(len / 2);
    const firstHalf = cd.slice(0, half).map(d => d.lanceMedio).filter(v => v > 0);
    const secondHalf = cd.slice(half).map(d => d.lanceMedio).filter(v => v > 0);
    const avgFirst = avg(firstHalf);
    const avgSecond = avg(secondHalf);
    const diff = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

    let trend: 'queda' | 'alta' | 'estável';
    if (diff < -3) trend = 'queda';
    else if (diff > 3) trend = 'alta';
    else trend = 'estável';

    // Current level vs overall average
    const lastMedio = cd[len - 1].lanceMedio;
    const overallAvg = avg(cd.map(d => d.lanceMedio));
    const levelDiff = overallAvg > 0 ? ((lastMedio - overallAvg) / overallAvg) * 100 : 0;

    let level: 'abaixo' | 'acima' | 'próximo';
    if (levelDiff < -3) level = 'abaixo';
    else if (levelDiff > 3) level = 'acima';
    else level = 'próximo';

    // Contemplations trend
    const contFirst = avg(cd.slice(0, half).map(d => d.lanceLivre));
    const contSecond = avg(cd.slice(half).map(d => d.lanceLivre));
    const contDiff = contFirst > 0 ? ((contSecond - contFirst) / contFirst) * 100 : 0;

    let contTrend: 'aumentando' | 'diminuindo' | 'estável';
    if (contDiff > 10) contTrend = 'aumentando';
    else if (contDiff < -10) contTrend = 'diminuindo';
    else contTrend = 'estável';

    return { trend, level, contTrend, lastMedio };
  }, [data]);
}

function ChartSummary({ data }: { data: BidStudyData }) {
  const summary = useSummary(data);
  if (!summary) return null;

  const trendMap = {
    queda: { text: 'em queda recente', color: 'text-green-600', icon: TrendingDown },
    alta: { text: 'em alta recente', color: 'text-red-500', icon: TrendingUp },
    estável: { text: 'estáveis', color: 'text-muted-foreground', icon: Minus },
  };

  const levelMap = {
    abaixo: 'abaixo da média do período',
    acima: 'acima da média do período',
    próximo: 'próximos da média do grupo',
  };

  const contMap = {
    aumentando: 'está aumentando',
    diminuindo: 'está diminuindo',
    estável: 'se mantém estável',
  };

  const t = trendMap[summary.trend];
  const TrendIcon = t.icon;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 dark:bg-muted/10 px-4 py-3">
      <div className="flex items-start gap-2">
        <TrendIcon className={`h-4 w-4 mt-0.5 shrink-0 ${t.color}`} />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Os lances estão{' '}
          <span className={`font-medium ${t.color}`}>{t.text}</span>
          {' '}e atualmente estão {levelMap[summary.level]}, enquanto a quantidade de contemplações por lance{' '}
          <span className="font-medium text-foreground">{contMap[summary.contTrend]}</span>.
        </p>
      </div>
    </div>
  );
}

export function BidsChart() {
  const { studyData } = useBidsContext();
  const isMobile = useIsMobile();

  const { percentDomain, contDomain } = useMemo(() => {
    if (!studyData) return { percentDomain: [0, 100] as [number, number], contDomain: [0, 10] as [number, number] };
    const allPercents = studyData.chartData.flatMap(d => [d.lanceMinimo, d.lanceMedio, d.lanceMaximo]).filter(v => v > 0);
    const allConts = studyData.chartData.flatMap(d => [d.sorteio, d.lanceLivre]);

    const pPad = 3;
    const minP = allPercents.length > 0 ? Math.min(...allPercents) : 0;
    const maxP = allPercents.length > 0 ? Math.max(...allPercents) : 100;
    const percentDomain: [number, number] = [
      Math.max(0, Math.floor(minP - pPad)),
      Math.min(100, Math.ceil(maxP + pPad)),
    ];

    const cPad = 2;
    const maxC = allConts.length > 0 ? Math.max(...allConts) : 10;
    const contDomain: [number, number] = [0, Math.ceil(maxC + cPad)];

    return { percentDomain, contDomain };
  }, [studyData]);

  if (!studyData) return null;

  return (
    <Card id="bids-chart" className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Visualização Gráfica
          <HelpTooltip title="Gráfico de Evolução" content="Barras mostram quantos foram contemplados por Sorteio e por Lance em cada assembleia. Linhas mostram os percentuais de lance praticados (mínimo, médio e máximo). Identifique tendências: se as linhas caem, os lances estão ficando mais acessíveis." />
        </CardTitle>
        <CardDescription>Evolução histórica de contemplações e percentuais de lance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ChartSummary data={studyData} />
        <div className="h-[280px] md:h-[360px] rounded-lg bg-[#f8fafc] dark:bg-muted/20 p-3 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={studyData.chartData} barGap={0} barCategoryGap="20%" margin={{ top: 12, right: 12, left: -4, bottom: 4 }}>
              <defs>
                {/* Gradiente barras lance */}
                <linearGradient id="barLanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.lanceLivre} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={COLORS.lanceLivre} stopOpacity={0.65} />
                </linearGradient>
                {/* Gradiente barras sorteio */}
                <linearGradient id="barSorteioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.sorteio} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={COLORS.sorteio} stopOpacity={0.55} />
                </linearGradient>
                {/* Faixa mín/máx */}
                <linearGradient id="faixaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.faixa} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={COLORS.faixa} stopOpacity={0.03} />
                </linearGradient>
                {/* Glow lance médio */}
                <filter id="glowMedio" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <CartesianGrid
                strokeDasharray="4 6"
                stroke="hsl(var(--border))"
                opacity={0.25}
                vertical={false}
              />

              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 0.5 }}
                dy={4}
              />

              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={32}
                domain={contDomain}
                allowDecimals={false}
                stroke="transparent"
                label={{ value: 'Contemplados', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10, fill: 'hsl(var(--muted-foreground))', opacity: 0.7 } }}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={44}
                domain={percentDomain}
                tickFormatter={(v) => `${v}%`}
                stroke="transparent"
                label={{ value: 'Lance %', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 10, fill: 'hsl(var(--muted-foreground))', opacity: 0.7 } }}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'hsl(var(--muted))', opacity: isMobile ? 0.25 : 0.15, radius: 4 }}
                wrapperStyle={{ zIndex: 50, outline: 'none' }}
                allowEscapeViewBox={{ x: false, y: true }}
                offset={isMobile ? 16 : 8}
              />
              <Legend content={<CustomLegend />} />

              {studyData.chartData.length > 0 && (
                <ReferenceLine
                  yAxisId="left"
                  x={studyData.chartData[studyData.chartData.length - 1].month}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  strokeWidth={0.8}
                  strokeOpacity={0.35}
                  label={{ value: 'Atual', position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 9, opacity: 0.6 }}
                />
              )}

              {/* Faixa mín/máx como área sombreada */}
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="lanceMaximo"
                stroke="none"
                fill="url(#faixaGradient)"
                name="lanceMinimo_area"
                legendType="none"
                tooltipType="none"
              />

              {/* Barras com gradiente */}
              <Bar
                yAxisId="left"
                dataKey="sorteio"
                fill="url(#barSorteioGrad)"
                name="Sorteio"
                radius={[4, 4, 0, 0]}
                barSize={26}
              />
              <Bar
                yAxisId="left"
                dataKey="lanceLivre"
                fill="url(#barLanceGrad)"
                name="Por Lance"
                radius={[4, 4, 0, 0]}
                barSize={26}
              >
                {!isMobile && (
                  <LabelList
                    dataKey="lanceLivre"
                    position="top"
                    fill="#64748b"
                    fontSize={11}
                    formatter={(v: number) => v > 0 ? v : ''}
                    offset={4}
                  />
                )}
              </Bar>

              {/* Linha máximo – discreta (oculta em mobile para reduzir poluição) */}
              {!isMobile && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="lanceMaximo"
                  stroke={COLORS.lanceMaximo}
                  strokeWidth={1.2}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5, fill: COLORS.lanceMaximo, strokeWidth: 0, opacity: 0.6 }}
                  name="Lance Máximo"
                  opacity={0.5}
                />
              )}

              {/* Linha principal – Lance Médio com glow */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="lanceMedio"
                stroke={COLORS.lanceMedio}
                strokeWidth={isMobile ? 2.5 : 3}
                dot={{ r: isMobile ? 4 : 5, fill: COLORS.lanceMedio, strokeWidth: 2.5, stroke: '#fff' }}
                activeDot={{ r: isMobile ? 11 : 8, fill: COLORS.lanceMedio, strokeWidth: 3, stroke: '#fff' }}
                name="Lance Médio"
                filter="url(#glowMedio)"
                label={(p: { x?: number; y?: number; value?: number; index?: number }) => {
                  const { x, y, value, index } = p;
                  if (index !== studyData.chartData.length - 1 || !value || value <= 0) return null;
                  return (
                    <text x={x} y={(y ?? 0) - 12} textAnchor="middle" fill={COLORS.lanceMedio} fontSize={11} fontWeight={600}>
                      {`${Number(value).toFixed(1)}%`}
                    </text>
                  );
                }}
              />

              {/* Linha mínimo – discreta (oculta em mobile) */}
              {!isMobile && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="lanceMinimo"
                  stroke={COLORS.lanceMinimo}
                  strokeWidth={1.2}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5, fill: COLORS.lanceMinimo, strokeWidth: 0, opacity: 0.6 }}
                  name="Lance Mínimo"
                  opacity={0.5}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-caption text-muted-foreground/70 text-right mt-2 italic">Escala ajustada para melhor visualização</p>
      </CardContent>
    </Card>
  );
}
