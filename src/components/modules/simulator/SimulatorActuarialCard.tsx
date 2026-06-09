import { memo, useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, type TooltipProps } from 'recharts';
import { ShieldAlert, LineChart as LineChartIcon } from 'lucide-react';
import { useSimulatorInput, useSimulatorResult } from './SimulatorContext';
import { formatCurrency } from '@/core/finance';

/**
 * Card de Evolução Financeira do Plano.
 * Linha principal = saldo devedor. Seguro aparece como área secundária discreta.
 * KPIs hierarquizados: Custo efetivo (principal) > Pago total > Seguro acumulado / Reajustes.
 */

const CustomTooltip = memo(({ active, payload, label, insuranceEnabled }: TooltipProps<any, any> & { insuranceEnabled: boolean }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload as { semSeguro: number; comSeguro: number };
  const seguroAPagar = Math.max(0, item.comSeguro - item.semSeguro);
  return (
    <div className="bg-background border border-border rounded-md px-2.5 py-2 text-caption shadow-sm space-y-1">
      <p className="font-medium text-foreground">Mês {label}</p>
      <div className="flex justify-between gap-6">
        <span className="text-muted-foreground">Sem seguro:</span>
        <span className="tabular-nums text-foreground">{formatCurrency(item.semSeguro)}</span>
      </div>
      {insuranceEnabled && (
        <>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Com seguro:</span>
            <span className="tabular-nums text-foreground">{formatCurrency(item.comSeguro)}</span>
          </div>
          <div className="flex justify-between gap-6 pt-1 border-t border-border/60">
            <span className="text-muted-foreground">Seguro a pagar:</span>
            <span className="tabular-nums text-primary font-medium">{formatCurrency(seguroAPagar)}</span>
          </div>
        </>
      )}
    </div>
  );
});

export const SimulatorActuarialCard = memo(function SimulatorActuarialCard() {
  const { annualAdjustmentPercent, insuranceEnabled } = useSimulatorInput();
  const { monthlySchedule, isValidSimulation, ageTermValidation } = useSimulatorResult();
  const [showTable, setShowTable] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: monthlySchedule.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const [paddingTop, paddingBottom] = virtualItems.length > 0 
    ? [
        virtualItems[0].start,
        totalSize - virtualItems[virtualItems.length - 1].end
      ]
    : [0, 0];

  const chartData = useMemo(() => {
    const rows = monthlySchedule.rows;
    if (rows.length === 0) return [];
    const totalInsurance = monthlySchedule.totalInsurance;
    let cumInsurance = 0;
    const enriched = rows.map(r => {
      cumInsurance += r.insurance;
      const semSeguro = Math.max(0, Math.round(r.balanceEnd));
      // Obrigação remanescente = saldo devedor + seguro ainda por pagar.
      // No último mês: balanceEnd→0 e cumInsurance→totalInsurance, portanto comSeguro→0.
      const remainingInsurance = Math.max(0, totalInsurance - cumInsurance);
      const comSeguro = Math.max(0, Math.round(r.balanceEnd + remainingInsurance));
      return { mes: r.month, semSeguro, comSeguro };
    });
    const step = Math.max(1, Math.ceil(enriched.length / 60));
    return enriched.filter((_, i) => i % step === 0 || i === enriched.length - 1);
  }, [monthlySchedule]);

  if (!isValidSimulation) return null;

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <LineChartIcon className="h-4 w-4 text-primary" />
          Evolução do Saldo do Plano
        </CardTitle>
        <CardDescription className="text-xs">
          Compare o saldo do plano com e sem seguro prestamista ao longo do tempo.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!ageTermValidation.valid && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription className="text-xs">{ageTermValidation.message}</AlertDescription>
          </Alert>
        )}

        {/* KPIs hierarquizados */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Principal */}
          <div className="px-3 py-2 rounded-md bg-primary/5 border border-primary/15 col-span-2 lg:col-span-1">
            <p className="text-caption uppercase text-muted-foreground tracking-wide">Custo efetivo</p>
            <p className="font-semibold text-base tabular-nums mt-0.5 text-primary">{formatCurrency(monthlySchedule.effectiveClientCost)}</p>
          </div>
          {/* Secundário */}
          <div className="px-3 py-2 rounded-md bg-muted/30">
            <p className="text-caption uppercase text-muted-foreground tracking-wide">Pago total</p>
            <p className="font-medium text-sm tabular-nums mt-0.5">{formatCurrency(monthlySchedule.totalPaid)}</p>
          </div>
          {/* Terciários — peso reduzido */}
          <div className="px-3 py-2 rounded-md bg-muted/15">
            <p className="text-caption uppercase text-muted-foreground/70 tracking-wide">Seguro acumulado</p>
            <p className="font-normal text-body tabular-nums mt-0.5 text-muted-foreground">{formatCurrency(monthlySchedule.totalInsurance)}</p>
          </div>
          <div className="px-3 py-2 rounded-md bg-muted/15">
            <p className="text-caption uppercase text-muted-foreground/70 tracking-wide">Reajustes</p>
            <p className="font-normal text-body tabular-nums mt-0.5 text-muted-foreground">{formatCurrency(monthlySchedule.totalAdjustments)}</p>
          </div>
        </div>

        {/* Reajuste agora é controlado exclusivamente pelo card Dados do Consórcio. */}


        {/* Gráfico — Obrigação remanescente: saldo devedor + seguro a pagar.
            Ambas as séries zeram matematicamente no último mês. */}
        {chartData.length > 1 && (
          <div className="space-y-1">
            <div className="flex items-center gap-6 text-caption text-muted-foreground px-1 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-0.5 bg-primary rounded" />
                Saldo sem seguro
              </span>
              {insuranceEnabled && (
                <span className="flex items-center gap-1.5">
                  <svg width="16" height="2" className="overflow-visible">
                    <line x1="0" y1="1" x2="16" y2="1" stroke="hsl(var(--primary) / 0.55)" strokeWidth="1.75" strokeDasharray="4 3" />
                  </svg>
                  Saldo com seguro
                </span>
              )}
            </div>
            <div className="h-72 pb-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart style={{ background: "transparent" }} data={chartData} margin={{ top: 10, right: 20, left: 60, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'mês', position: 'insideBottom', offset: -2, fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={<CustomTooltip insuranceEnabled={insuranceEnabled} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="semSeguro"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={false}
                    name="Saldo sem seguro"
                    isAnimationActive={false}
                  />
                  {insuranceEnabled && (
                    <Line
                      type="monotone"
                      dataKey="comSeguro"
                      stroke="hsl(var(--primary) / 0.55)"
                      strokeWidth={1.75}
                      strokeDasharray="4 3"
                      dot={false}
                      name="Saldo com seguro"
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowTable(s => !s)}
          className="block mt-2 text-xs text-primary hover:underline text-left"
        >
          {showTable ? 'Ocultar' : 'Ver'} tabela mês a mês ({monthlySchedule.rows.length} meses)
        </button>

        {showTable && (
          <div 
            ref={parentRef}
            className="max-h-80 overflow-auto border rounded-md"
          >
            <table className="w-full text-caption border-collapse">
              <thead className="sticky top-0 bg-muted z-10">
                <tr>
                  <th className="text-left p-2 bg-muted">Mês</th>
                  <th className="text-right p-2 bg-muted">Saldo início</th>
                  <th className="text-right p-2 bg-muted">Parcela base</th>
                  <th className="text-right p-2 bg-muted">Seguro</th>
                  <th className="text-right p-2 bg-muted">Lance</th>
                  <th className="text-right p-2 bg-muted">Reajuste</th>
                  <th className="text-right p-2 bg-muted">Saldo fim</th>
                </tr>
              </thead>
              <tbody>
                {paddingTop > 0 && (
                  <tr>
                    <td colSpan={7} style={{ height: `${paddingTop}px` }} />
                  </tr>
                )}
                {virtualItems.map((virtualRow) => {
                  const r = monthlySchedule.rows[virtualRow.index];
                  return (
                    <tr 
                      key={virtualRow.key} 
                      className="border-t hover:bg-muted/40"
                    >
                      <td className="p-2">{r.month}</td>
                      <td className="text-right p-2">{formatCurrency(r.balanceStart)}</td>
                      <td className="text-right p-2">{formatCurrency(r.baseInstallment)}</td>
                      <td className="text-right p-2 text-destructive">{formatCurrency(r.insurance)}</td>
                      <td className="text-right p-2 text-primary">{r.bidApplied > 0 ? formatCurrency(r.bidApplied) : '—'}</td>
                      <td className="text-right p-2 text-muted-foreground">{r.adjustmentApplied > 0 ? formatCurrency(r.adjustmentApplied) : '—'}</td>
                      <td className="text-right p-2">{formatCurrency(r.balanceEnd)}</td>
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td colSpan={7} style={{ height: `${paddingBottom}px` }} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-caption text-muted-foreground/80 leading-relaxed">
          Cada linha representa a <strong>obrigação financeira ainda a quitar</strong> em cada mês.
          Sem seguro = saldo devedor remanescente (crédito + adm + FR
          {annualAdjustmentPercent > 0 ? ' + reajuste anual' : ''}).
          {insuranceEnabled && ' Com seguro = mesmo saldo somado ao seguro prestamista ainda não pago. A distância entre as linhas é o seguro a desembolsar daquele mês em diante; ambas zeram no último mês do plano.'}
        </p>
      </CardContent>
    </Card>
  );
});
