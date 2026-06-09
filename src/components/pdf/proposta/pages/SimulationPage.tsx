import React from 'react';
import { formatCurrency } from '@/utils/format';
import { THEME, PAGE } from '../theme';
import {
  Header, Footer, PageBody, SectionTitle, MetricCard, MetricGrid,
  PdfTable, PdfLineChart, ChartCaption, MissingDataNote,
} from '../primitives';
import type { PdfPropostaCompletaData } from '../types';

/**
 * Página SIMULAÇÃO — bloco `simulation`. Parcela / carta líquida / custo total.
 */
export function SimulationPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const { simulation } = data;
  const installmentAfter = simulation.installment;
  const reducedMonths = simulation.reducedInstallmentMonths ?? 0;
  const reducedValue = simulation.reducedInstallmentValue ?? 0;
  const installmentBefore = reducedValue > 0
    ? reducedValue
    : (simulation.installmentBeforeContemplation ?? simulation.fullInstallment ?? installmentAfter);
  const embedded = simulation.embeddedBidValue ?? 0;
  const netCredit = Math.max(simulation.creditValue - embedded, 0);
  const totalCost = simulation.effectiveClientCost ?? simulation.totalCost;

  // Schedule mensal denso (vem da fonte única — SimulatorContext).
  const schedule = data.monthlyScheduleSlim ?? [];
  // Amostragem para tabela: a cada ~10% do prazo (8 linhas + último).
  const sampleRows: typeof schedule = [];
  if (schedule.length > 0) {
    const step = Math.max(1, Math.floor(schedule.length / 8));
    for (let i = 0; i < schedule.length; i += step) sampleRows.push(schedule[i]);
    const last = schedule[schedule.length - 1];
    if (last && sampleRows[sampleRows.length - 1]?.month !== last.month) sampleRows.push(last);
  }

  const balanceSeries = schedule.length > 0 ? [{
    name: 'Saldo devedor',
    color: THEME.primary,
    points: schedule.map((r) => ({ x: r.month, y: r.balanceEnd })),
  }] : [];
  const paymentSeries = schedule.length > 0 ? [
    { name: 'Parcela', color: THEME.primary, points: schedule.map((r) => ({ x: r.month, y: r.payment })) },
    { name: 'Seguro', color: THEME.accent, points: schedule.map((r) => ({ x: r.month, y: r.insurance })) },
  ] : [];

  const regimeLabel = (r: string) =>
    r === 'reduced' ? 'Reduzida' : r === 'rediluted' ? 'Rediluída' : r === 'post-bid' ? 'Pós-lance' : 'Plena';

  return (
    <div style={PAGE}>
      <Header data={data} />
      <PageBody>
        <div style={{ breakInside: 'avoid' as const }}>
          <SectionTitle kicker="Cenário" title="Como funciona" />
          <MetricGrid cols={3}>
            <MetricCard label="Parcela inicial" value={formatCurrency(installmentBefore)} tone="primary" />
            <MetricCard label="Parcela plena" value={formatCurrency(installmentAfter)} />
            <MetricCard label="Carta líquida" value={formatCurrency(netCredit)} tone="success" />
          </MetricGrid>
          <MetricGrid cols={3}>
            <MetricCard label="Prazo" value={`${simulation.termMonths} meses`} />
            <MetricCard label="Custo total" value={formatCurrency(totalCost)} tone="accent" />
            <MetricCard
              label="Lance embutido"
              value={embedded > 0 ? formatCurrency(embedded) : '—'}
            />
          </MetricGrid>
          {reducedMonths > 0 && (
            <p style={{ fontSize: '9.5pt', color: THEME.muted, fontStyle: 'italic', margin: '8pt 0 0' }}>
              Parcela reduzida em vigor pelos primeiros {reducedMonths} meses, depois plena.
            </p>
          )}
        </div>

        {balanceSeries.length > 0 && (
          <div style={{ breakInside: 'avoid' as const }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 700, color: THEME.primary, margin: '0 0 8pt' }}>
              Evolução do saldo devedor
            </h3>
            <PdfLineChart
              series={balanceSeries}
              xLabel="Mês"
              yLabel="Saldo (R$)"
              height={200}
            />
            <ChartCaption>
              Trajetória do saldo ao longo de {simulation.termMonths} meses — base atuarial do seguro mensal.
            </ChartCaption>
          </div>
        )}

        {paymentSeries.length > 0 && (
          <div style={{ breakInside: 'avoid' as const }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 700, color: THEME.primary, margin: '0 0 8pt' }}>
              Composição da parcela mês a mês
            </h3>
            <PdfLineChart
              series={paymentSeries}
              xLabel="Mês"
              yLabel="Valor (R$)"
              height={180}
            />
          </div>
        )}

        {sampleRows.length > 0 && (
          <div style={{ breakInside: 'avoid' as const }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 700, color: THEME.primary, margin: '0 0 8pt' }}>
              Amostra mensal ({sampleRows.length} pontos do plano)
            </h3>
            <PdfTable
              headers={['Mês', 'Regime', 'Parcela', 'Seguro', 'Saldo']}
              align={['right', 'left', 'right', 'right', 'right']}
              rows={sampleRows.map((r) => [
                r.month,
                regimeLabel(r.regime),
                formatCurrency(r.payment),
                formatCurrency(r.insurance),
                formatCurrency(r.balanceEnd),
              ])}
            />
          </div>
        )}

        {schedule.length === 0 && (
          <MissingDataNote>
            Para ver a tabela mensal completa e a curva do saldo, abra o Simulador uma vez nesta sessão — o motor atuarial publica os dados automaticamente.
          </MissingDataNote>
        )}
      </PageBody>
      <Footer data={data} totalPages={totalPages} />
    </div>
  );
}
