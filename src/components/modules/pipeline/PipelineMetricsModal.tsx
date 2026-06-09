/**
 * Onda 4: Modal com métricas de pipeline (conversão, tempo por etapa, ticket médio).
 */
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Clock, DollarSign, ArrowRight, Download, Filter, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { computePipelineMetrics, computePreviousPeriodKpis, downloadMetricsCSV, type PeriodKpis, type PipelineMetrics, type RangeDays } from '@/services/pipelineMetrics';
import { COLUMNS } from './pipelineConstants';
import { cn } from '@/lib/utils';

import { logger } from '@/utils/logger';
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RANGE_OPTIONS: { value: RangeDays; label: string }[] = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
  { value: 'all', label: 'Todo período' },
];

const STATUS_LABEL: Record<string, string> = COLUMNS.reduce((acc, c) => {
  acc[c.status] = c.label;
  return acc;
}, {} as Record<string, string>);

const STATUS_EMOJI: Record<string, string> = COLUMNS.reduce((acc, c) => {
  acc[c.status] = c.emoji;
  return acc;
}, {} as Record<string, string>);

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const fmtPct = (v: number) => `${(v * 100).toFixed(0)}%`;

const fmtDays = (v: number) => {
  if (v < 1) return `${(v * 24).toFixed(1)}h`;
  return `${v.toFixed(1)}d`;
};

/**
 * Badge de variação vs período anterior.
 * `lowerIsBetter`: true para métricas onde queda = melhora (ex.: tempo médio).
 */
function DeltaBadge({
  current,
  previous,
  lowerIsBetter = false,
  format,
}: {
  current: number;
  previous: number | null;
  lowerIsBetter?: boolean;
  format: 'pct' | 'brl' | 'days';
}) {
  if (previous === null) return null;
  // Se o anterior é 0, só mostramos seta se houve criação no atual.
  if (previous === 0 && current === 0) {
    return <span className="text-caption text-muted-foreground flex items-center gap-0.5"><Minus className="h-3 w-3" /> sem dados</span>;
  }
  const diff = current - previous;
  const pctChange = previous !== 0 ? (diff / Math.abs(previous)) * 100 : 100;
  const isUp = diff > 0;
  const isFlat = Math.abs(diff) < 1e-9 || Math.abs(pctChange) < 0.5;
  const improved = isFlat ? null : lowerIsBetter ? !isUp : isUp;
  const colorCls = improved === null
    ? 'text-muted-foreground'
    : improved
      ? 'text-success'
      : 'text-destructive';
  const Icon = isFlat ? Minus : isUp ? ArrowUp : ArrowDown;

  const fmtAbs = (v: number) => {
    if (format === 'pct') return `${(v * 100).toFixed(1)}pp`;
    if (format === 'brl') return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    return v < 1 ? `${(v * 24).toFixed(1)}h` : `${v.toFixed(1)}d`;
  };

  return (
    <span className={cn('text-caption flex items-center gap-0.5 font-medium', colorCls)} title={`Período anterior: ${fmtAbs(previous)}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(pctChange).toFixed(0)}% ({isUp ? '+' : ''}{fmtAbs(Math.abs(diff))})
    </span>
  );
}

export function PipelineMetricsModal({ open, onOpenChange }: Props) {
  const [range, setRange] = useState<RangeDays>(30);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [previousKpis, setPreviousKpis] = useState<PeriodKpis | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setPreviousKpis(null);
    Promise.all([
      computePipelineMetrics(range),
      computePreviousPeriodKpis(range),
    ])
      .then(([m, prev]) => {
        if (cancelled) return;
        setMetrics(m);
        setPreviousKpis(prev);
      })
      .catch(err => { logger.error('[PipelineMetricsModal]', err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, range]);

  const overallConversion = useMemo(() => {
    if (!metrics) return 0;
    const first = metrics.stageConversion[0];
    const last = metrics.stageConversion[metrics.stageConversion.length - 1];
    if (!first || !last || first.entered === 0) return 0;
    // % de prospecções que chegaram a fechado
    return last.advanced / first.entered;
  }, [metrics]);

  /** Volume absoluto por etapa do funil (Prospecção → ... → Fechado). */
  const funnelStages = useMemo(() => {
    if (!metrics || metrics.stageConversion.length === 0) return [];
    const stages = metrics.stageConversion.map(s => ({
      status: s.fromStatus,
      count: s.entered,
    }));
    // Última etapa = quem efetivamente chegou ao último toStatus (fechado)
    const last = metrics.stageConversion[metrics.stageConversion.length - 1];
    stages.push({ status: last.toStatus, count: last.advanced });
    return stages;
  }, [metrics]);

  const funnelMax = useMemo(
    () => funnelStages.reduce((m, s) => Math.max(m, s.count), 0),
    [funnelStages],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Métricas do Pipeline
          </DialogTitle>
          <DialogDescription>
            Indicadores agregados sobre o histórico de mudanças de cada lead.
          </DialogDescription>
        </DialogHeader>

        {/* Seletor de período */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs text-muted-foreground">Período:</span>
          {RANGE_OPTIONS.map(opt => (
            <Button
              key={String(opt.value)}
              size="sm"
              variant={range === opt.value ? 'default' : 'outline'}
              className="h-7 px-3 text-xs"
              onClick={() => setRange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs ml-auto gap-1.5"
            disabled={loading || !metrics}
            onClick={() => metrics && downloadMetricsCSV(metrics)}
            title="Exportar métricas em CSV"
          >
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </Button>
        </div>

        {loading || !metrics ? (
          <div className="space-y-3 pt-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* KPIs topo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="p-card-sm bg-success/5 border-success/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <DollarSign className="h-3.5 w-3.5" /> Ticket médio fechado
                </div>
                <div className="text-2xl font-bold text-success">
                  {metrics.avgClosedTicket.closedCount > 0
                    ? fmtBRL(metrics.avgClosedTicket.avgCredit)
                    : '—'}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-caption text-muted-foreground">
                    {metrics.avgClosedTicket.closedCount} venda{metrics.avgClosedTicket.closedCount !== 1 ? 's' : ''} no período
                  </div>
                  <DeltaBadge
                    current={metrics.avgClosedTicket.avgCredit}
                    previous={previousKpis ? previousKpis.avgClosedTicket : null}
                    format="brl"
                  />
                </div>
              </Card>

              <Card className="p-card-sm bg-primary/5 border-primary/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Conversão geral
                </div>
                <div className="text-2xl font-bold text-primary">
                  {metrics.stageConversion[0]?.entered ? fmtPct(overallConversion) : '—'}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-caption text-muted-foreground">
                    Prospecção → Fechado
                  </div>
                  <DeltaBadge
                    current={overallConversion}
                    previous={previousKpis ? previousKpis.overallConversion : null}
                    format="pct"
                  />
                </div>
              </Card>

              <Card className="p-card-sm bg-warning/5 border-warning/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3.5 w-3.5" /> Tempo médio total
                </div>
                <div className="text-2xl font-bold text-warning">
                  {(() => {
                    const total = metrics.avgTimePerStatus.reduce((s, x) => s + x.avgDays, 0);
                    return total > 0 ? fmtDays(total) : '—';
                  })()}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-caption text-muted-foreground">
                    Soma das etapas ativas
                  </div>
                  <DeltaBadge
                    current={metrics.avgTimePerStatus.reduce((s, x) => s + x.avgDays, 0)}
                    previous={previousKpis ? previousKpis.avgTotalTimeDays : null}
                    format="days"
                    lowerIsBetter
                  />
                </div>
              </Card>
            </div>

            {/* Funil visual */}
            <Card className="p-card-sm">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" /> Funil de leads no período
              </h3>
              {funnelMax === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Sem leads no período selecionado.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {funnelStages.map((stage, idx) => {
                    const widthPct = funnelMax > 0 ? (stage.count / funnelMax) * 100 : 0;
                    const prev = idx > 0 ? funnelStages[idx - 1].count : null;
                    const dropPct = prev && prev > 0 ? ((prev - stage.count) / prev) * 100 : 0;
                    return (
                      <div key={stage.status} className="flex items-center gap-3">
                        <div className="w-36 shrink-0 text-xs text-foreground truncate">
                          {STATUS_EMOJI[stage.status]} {STATUS_LABEL[stage.status]}
                        </div>
                        <div className="flex-1 relative h-7 bg-muted/40 rounded">
                          <div
                            className={cn(
                              'h-full rounded flex items-center justify-end px-2 transition-[colors,box-shadow,transform]',
                              idx === funnelStages.length - 1
                                ? 'bg-success/80'
                                : 'bg-primary/70',
                            )}
                            style={{ width: `${Math.max(2, widthPct)}%` }}
                          >
                            <span className="text-caption font-semibold text-primary-foreground">
                              {stage.count}
                            </span>
                          </div>
                        </div>
                        <div className="w-16 shrink-0 text-right text-caption text-muted-foreground">
                          {idx === 0 ? 'topo' : dropPct > 0 ? `−${dropPct.toFixed(0)}%` : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Conversão por etapa */}
            <Card className="p-card-sm">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" /> Conversão por etapa
              </h3>
              {metrics.stageConversion.every(s => s.entered === 0) ? (
                <p className="text-xs text-muted-foreground">Sem dados suficientes no período selecionado.</p>
              ) : (
                <div className="space-y-2">
                  {metrics.stageConversion.map(stage => (
                    <div key={`${stage.fromStatus}-${stage.toStatus}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground">
                          {STATUS_EMOJI[stage.fromStatus]} {STATUS_LABEL[stage.fromStatus]}
                          <span className="mx-1.5 text-muted-foreground">→</span>
                          {STATUS_EMOJI[stage.toStatus]} {STATUS_LABEL[stage.toStatus]}
                        </span>
                        <span className="font-mono font-semibold">
                          <span className={cn(
                            stage.rate >= 0.5 ? 'text-success' : stage.rate >= 0.25 ? 'text-warning' : 'text-destructive',
                          )}>
                            {fmtPct(stage.rate)}
                          </span>
                          <span className="text-muted-foreground ml-2 text-caption">
                            ({stage.advanced}/{stage.entered})
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-[colors,box-shadow,transform]',
                            stage.rate >= 0.5 ? 'bg-success' : stage.rate >= 0.25 ? 'bg-warning' : 'bg-destructive',
                          )}
                          style={{ width: `${Math.max(2, stage.rate * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Tempo médio por coluna */}
            <Card className="p-card-sm">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" /> Tempo médio em cada etapa
              </h3>
              {metrics.avgTimePerStatus.every(x => x.sampleSize === 0) ? (
                <p className="text-xs text-muted-foreground">
                  Ainda não há mudanças de status registradas no período.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {metrics.avgTimePerStatus.map(item => (
                    <div key={item.status} className="rounded-md border border-border p-3 bg-muted/20">
                      <div className="text-caption text-muted-foreground mb-1 truncate">
                        {STATUS_EMOJI[item.status]} {STATUS_LABEL[item.status]}
                      </div>
                      <div className="text-lg font-bold">
                        {item.sampleSize > 0 ? fmtDays(item.avgDays) : '—'}
                      </div>
                      <div className="text-caption text-muted-foreground">
                        n={item.sampleSize}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <p className="text-caption text-muted-foreground text-center">
              Cálculos baseados em <code className="font-mono">proposal_events</code> · janela: {range === 'all' ? 'todo o período' : `últimos ${range} dias`}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
