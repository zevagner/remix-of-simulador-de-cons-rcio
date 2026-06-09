import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/core/finance';
import { EmptyStateMessage } from '@/components/ui/EmptyStateMessage';
import { InstallmentCompositionTable } from './InstallmentCompositionTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CHART_COLORS, useChartTheme } from '@/utils/chartTheme';
import { useSimulatorInput, useSimulatorResult, PLAN_MODALITY_LABELS } from './SimulatorContext';
import { HelpTooltip } from '@/components/shared/HelpTooltip';
import { trackEvent } from '@/services/analyticsTracker';
import { RequestCommunityHelpFromSimulationButton } from '@/components/community/RequestCommunityHelpFromSimulationButton';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import type { SimulationSnapshot } from '@/utils/community/anonymize';
import { HelpHint } from '@/components/help/HelpHint';
import { AutoFitText } from '@/components/shared/AutoFitText';

type SimulatorResultsSectionProps = {
  /**
   * 'summary'  → apenas o card "Resultados da Simulação" (lateralizado no topo).
   * 'extras'   → CTA comunidade + composição + gráfico (full-width abaixo).
   * 'all'      → tudo (compat. legada).
   */
  variant?: 'summary' | 'extras' | 'all';
};


const CustomTooltip = memo(({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-background border border-border rounded-md px-2.5 py-2 text-caption shadow-sm">
      <p className="font-medium text-foreground">{data.name}</p>
      <p className="text-primary font-semibold">{formatCurrency(data.value)}</p>
    </div>
  );
});

export const SimulatorResultsSection = memo(function SimulatorResultsSection({ variant = 'all' }: SimulatorResultsSectionProps = {}) {
  const {
    input, adminFeeDiscount, maxReducedMonths, insuranceEnabled,
    isFlexPlan, planModality, contemplated,
  } = useSimulatorInput();
  const {
    // BASE — estrutura ORIGINAL do plano (sem contemplação/lance).
    // Card "Resultados da Simulação" SEMPRE consome base, nunca result.
    baseResult, baseMonthlySchedule,
    // Strategy result — usado apenas para o snapshot enviado à comunidade
    // (que reflete o cenário escolhido pelo consultor).
    result, isValidSimulation,
    effectiveAdminFeePercent, actualEmbeddedBidValue, actualFreeBidValue,
  } = useSimulatorResult();

  // Aliases locais: o card lê valores BASE; mantemos o nome `result` para
  // não tocar no JSX abaixo. Snapshot e CTA continuam refletindo a estratégia.
  const resultBase = baseResult;
  const resultWithoutDiscountBase = baseResult;

  const chartTheme = useChartTheme();
  const lastTracked = useRef<string | null>(null);
  const { navigateTo } = useModuleNavigation();

  const getSnapshot = useCallback((): SimulationSnapshot | null => {
    if (!isValidSimulation) return null;
    const installment = input.reducedInstallment
      ? result.reducedInstallmentValue
      : result.fullInstallment;
    const bidPercent = (() => {
      const credit = Number(input.creditValue) || 0;
      if (!credit) return null;
      const totalBid = (actualFreeBidValue || 0) + (actualEmbeddedBidValue || 0);
      return totalBid > 0 ? (totalBid / credit) * 100 : null;
    })();
    return {
      consortiumType: input.consortiumType,
      creditValue: Number(input.creditValue) || 0,
      termMonths: Number(input.termMonths) || 0,
      installment,
      totalCost: result.totalCost,
      bidPercent,
      bidZone: null,
      planType: planModality ?? 'tradicional',
      reducedInstallment: !!input.reducedInstallment,
      insuranceEnabled,
    };
  }, [
    isValidSimulation, input.reducedInstallment, input.consortiumType, input.creditValue,
    input.termMonths, result.reducedInstallmentValue, result.fullInstallment, result.totalCost,
    actualFreeBidValue, actualEmbeddedBidValue, planModality, insuranceEnabled,
  ]);

  useEffect(() => {
    if (!isValidSimulation) return;
    const key = `${input.consortiumType}-${input.creditValue}-${input.termMonths}`;
    if (lastTracked.current === key) return;
    lastTracked.current = key;
    trackEvent('simulation_generated', {
      consortium_type: input.consortiumType,
      credit_range: `${input.creditValue}`,
      module: 'simulator',
    });
  }, [isValidSimulation, input.consortiumType, input.creditValue, input.termMonths]);

  const chartData = [
    { name: 'Fundo comum', value: input.creditValue, fill: CHART_COLORS.blue },
    { name: 'Taxa de administração estimada', value: resultBase.adminFee, fill: CHART_COLORS.orange },
    { name: 'Fundo de reserva estimado', value: resultBase.reserveFund, fill: CHART_COLORS.gray },
    { name: 'Seguro prestamista estimado', value: resultBase.insuranceTotal, fill: CHART_COLORS.grayLight },
  ];

  if (!isValidSimulation) {
    if (variant === 'extras') return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resultados da Simulação</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyStateMessage title="Dados incompletos" message="Preencha o valor da carta de crédito e o prazo para visualizar os resultados." />
        </CardContent>
      </Card>
    );
  }

  // Usa valores BASE (estrutura original do plano, sem contemplação/lance).
  const { fullInstallment, reducedInstallmentValue, redilutedInstallmentValue } = resultBase;
  const semestralInstallment = fullInstallment * 6;
  const semestralReducedInstallment = reducedInstallmentValue * 6;
  const semestralRedilutedInstallment = redilutedInstallmentValue * 6;
  // Carta líquida derivada apenas do input (não depende do schedule estratégico).
  const netCreditValueDisplay = Math.max(0, input.creditValue - (actualEmbeddedBidValue || 0));

  const shouldHighlight = adminFeeDiscount > 0 || input.reducedInstallment;
  const hasStrategy = contemplated || (actualFreeBidValue || 0) > 0 || (actualEmbeddedBidValue || 0) > 0;

  const showSummary = variant !== 'extras';
  const showExtras = variant !== 'summary';

  return (
    <div className="space-y-6">
      {/* Resumo Executivo */}
      {showSummary && (
      <section
        id="simulator-results-cards"
        aria-label="Resultados da Simulação"
        className={`transition-[colors,box-shadow,transform] duration-300 rounded-lg ${shouldHighlight ? 'bg-amber-50/40 dark:bg-amber-950/15 px-4 py-4 border border-amber-200/70 dark:border-amber-800/40' : 'px-1'}`}
      >
        <div className="editorial-section-mark">
          <span className="editorial-counter">01</span>
          <span className="module-eyebrow">Resultado</span>
        </div>
        <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
          <h2 className="editorial-headline">
            Estrutura <em>original</em> do plano
          </h2>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasStrategy && (
              <a
                href="#post-contemplation-scenario"
                className="text-caption font-medium px-1.5 py-0.5 rounded-sm bg-primary/8 text-primary/80 hover:text-primary hover:bg-primary/12 transition-colors"
                title="Você definiu uma estratégia de contemplação. Veja o impacto abaixo."
              >
                Estratégia aplicada ↓
              </a>
            )}
            {shouldHighlight && (
              <span className="text-caption font-medium px-1.5 py-0.5 rounded-sm bg-amber-100/70 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                Condição aplicada
              </span>
            )}
          </div>
        </div>
        <p className="editorial-headline-lead mb-5">
          Composição base do consórcio, sem contemplação ou lance aplicados.
        </p>

        {isFlexPlan && (
          <div className="mb-5 p-card-sm rounded-lg border border-primary/25 bg-primary/[0.04]">
            <div className="flex items-center gap-2 mb-3">
              <span className="editorial-flag" data-tone="accent">
                {PLAN_MODALITY_LABELS[planModality]}
              </span>
              <span className="text-sm font-medium text-foreground/80">Fluxo Semestral</span>
            </div>
            <div className="space-y-1">
              <p className="metric-cell-label">Parcela semestral estimada</p>
              <p className="text-3xl font-semibold text-primary leading-tight tabular-nums tracking-tight">
                {input.reducedInstallment
                  ? `${formatCurrency(semestralReducedInstallment)} → ${formatCurrency(semestralRedilutedInstallment)}`
                  : formatCurrency(semestralInstallment)}
              </p>
              <p className="text-xs text-foreground/70 pt-1">
                Equivalente mensal:{' '}
                <span className="font-medium text-foreground tabular-nums">
                  {input.reducedInstallment
                    ? `${formatCurrency(reducedInstallmentValue)} → ${formatCurrency(redilutedInstallmentValue)}`
                    : formatCurrency(fullInstallment)}
                </span>
              </p>
              <p className="text-caption text-muted-foreground pt-2 border-t border-primary/10 mt-2">
                Pagamento a cada 6 meses (mensal × 6) — 5 meses sem desembolso entre parcelas.
                Entrada inicial equivalente a 1 parcela semestral (6 mensalidades).
              </p>
            </div>
          </div>
        )}

        {(() => {
          const cells: React.ReactNode[] = [];
          if (input.reducedInstallment) {
            cells.push(
              <div key="reduced" className="metric-cell" data-emphasis="primary">
                <p className="metric-cell-label">
                  Parcela Reduzida
                  <HelpTooltip title="Parcela Reduzida" content="Valor reduzido pago nos primeiros meses do plano, antes da rediluição. Calculado com base no saldo devedor." />
                </p>
                <p className="metric-cell-value"><AutoFitText>{formatCurrency(reducedInstallmentValue)}</AutoFitText></p>
                <p className="metric-cell-hint">1ª a {maxReducedMonths}ª parcela{adminFeeDiscount > 0 ? ' • desconto aplicado' : ''}</p>
              </div>
            );
            cells.push(
              <div key="redil" className="metric-cell">
                <p className="metric-cell-label">
                  Parcela Rediluída
                  <HelpTooltip title="Parcela Rediluída" content="Valor após o período reduzido, recalculado para compensar a diferença paga a menos." />
                </p>
                <p className="metric-cell-value"><AutoFitText>{formatCurrency(redilutedInstallmentValue)}</AutoFitText></p>
                <p className="metric-cell-hint">{maxReducedMonths + 1}ª a {input.termMonths}ª parcela</p>
              </div>
            );
          } else {
            cells.push(
              <div key="full" className="metric-cell" data-emphasis="primary">
                <p className="metric-cell-label">
                  Parcela Mensal
                  <HelpTooltip title="Parcela Mensal" content="Valor mensal estimado, incluindo taxa administrativa, fundo de reserva e seguro (se habilitado)." />
                </p>
                <p className="metric-cell-value"><AutoFitText>{formatCurrency(fullInstallment)}</AutoFitText></p>
                {adminFeeDiscount > 0 && (
                  <p className="metric-cell-hint">Sem desconto: {formatCurrency(resultWithoutDiscountBase.totalCost / input.termMonths)}</p>
                )}
              </div>
            );
          }
          cells.push(
            <div key="total" className="metric-cell">
              <p className="metric-cell-label">
                Custo Total
                <HelpTooltip title="Custo Total do Plano" content="Inclui taxa administrativa e encargos do consórcio (fundo de reserva e seguro). Não inclui o lance ofertado." />
              </p>
              <p className="metric-cell-value"><AutoFitText>{formatCurrency(resultBase.totalCost)}</AutoFitText></p>
              <p className="metric-cell-hint">{input.termMonths} parcelas — adm. + encargos</p>
            </div>
          );
          cells.push(
            <div key="credit" className="metric-cell">
              <p className="metric-cell-label">
                Carta de Crédito
                <HelpTooltip title="Carta de Crédito" content="Valor total da carta contratada, poder de compra após a contemplação." />
              </p>
              <p className="metric-cell-value"><AutoFitText>{formatCurrency(input.creditValue)}</AutoFitText></p>
              {actualEmbeddedBidValue > 0 && (
                <p className="metric-cell-hint">Líquida: {formatCurrency(netCreditValueDisplay)}</p>
              )}
            </div>
          );
          if (actualFreeBidValue > 0 || actualEmbeddedBidValue > 0) {
            cells.push(
              <div key="bid" className="metric-cell">
                <p className="metric-cell-label">
                  Lance Ofertado
                  <HelpTooltip title="Lance Ofertado" content="Recursos próprios + lance embutido. Não está somado ao Custo Total do Plano." />
                </p>
                <p className="metric-cell-value"><AutoFitText>{formatCurrency((actualFreeBidValue || 0) + (actualEmbeddedBidValue || 0))}</AutoFitText></p>
                <p className="metric-cell-hint">
                  {actualFreeBidValue > 0 && `Próprio ${formatCurrency(actualFreeBidValue)}`}
                  {actualFreeBidValue > 0 && actualEmbeddedBidValue > 0 && ' • '}
                  {actualEmbeddedBidValue > 0 && `Embutido ${formatCurrency(actualEmbeddedBidValue)}`}
                </p>
              </div>
            );
          }
          // 1 cell → 1 col; 2 cells → 2 cols; 3+ cells → 2 cols (2×2 ou 2×N), evitando 4 colunas comprimidas.
          const cols = cells.length <= 1 ? 1 : 2;
          return (
            <div className="metric-row metric-row--editorial" style={{ ['--metric-cols' as never]: cols }}>
              {cells}
            </div>
          );
        })()}
      </section>
      )}

      {showExtras && (
        <>
          {/* Callout consultivo — segunda opinião (Comunidade) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-border/70 bg-muted/30 px-3 py-2.5">
            <div className="text-sm">
              <p className="font-medium text-foreground/90 text-body">Quer uma segunda opinião nesse caso?</p>
              <p className="text-caption text-muted-foreground">
                Compartilhe o cenário com outros gerentes. Dados do cliente são anonimizados.
              </p>
            </div>
            <RequestCommunityHelpFromSimulationButton
              getSnapshot={getSnapshot}
              disabled={!isValidSimulation}
              variant="outline"
              size="sm"
              onCaseCreated={() => navigateTo('community')}
            />
          </div>

          {/* Tabela de Composição — bloco técnico secundário */}
          <Card id="simulator-composition-table" className="bg-card border-border/70">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-semibold text-foreground/90">
                  {isFlexPlan ? 'Composição da parcela semestral' : 'Composição da parcela'}
                </CardTitle>
                <HelpHint surfaceId="simulator.installment-composition" />
              </div>
              <p className="text-caption text-muted-foreground">
                {isFlexPlan
                  ? 'Valores agrupados a cada 6 meses (cálculo base mensal × 6).'
                  : 'Detalhamento técnico dos componentes da parcela mensal'}
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <InstallmentCompositionTable
                creditValue={input.creditValue} termMonths={input.termMonths}
                adminFeePercent={effectiveAdminFeePercent} reserveFundPercent={input.reserveFundPercent}
                insuranceEnabled={insuranceEnabled} result={resultBase}
                reducedInstallment={input.reducedInstallment} reducedInstallmentMonths={maxReducedMonths}
                consortiumType={input.consortiumType}
                isFlexPlan={isFlexPlan}
              />
            </CardContent>
          </Card>

          {/* Gráfico colapsável */}
          <CostBreakdownToggle chartData={chartData} chartTheme={chartTheme} />
        </>
      )}

    </div>
  );
});

function CostBreakdownToggle({ chartData, chartTheme }: { chartData: { name: string; value: number; fill: string }[]; chartTheme: ReturnType<typeof useChartTheme> }) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors mb-2"
      >
        {show ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {show ? 'Ocultar distribuição dos custos' : 'Ver distribuição dos custos'}
      </button>
      {show && (
        <Card id="simulator-cost-chart">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Distribuição estimada dos custos do plano</CardTitle>
            <p className="text-xs text-muted-foreground">Valores calculados sobre o total pago ao longo do consórcio</p>
          </CardHeader>
          <CardContent>
            <div className="bg-card border border-border rounded-lg p-card-sm">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart style={{ background: "transparent" }} data={chartData} layout="vertical">
                  <CartesianGrid {...chartTheme.gridProps} stroke="var(--border)" />
                  <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} {...chartTheme.axisProps} tick={{ fill: chartTheme.axisColor, fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={200} {...chartTheme.axisProps} tick={{ fontSize: 11, fill: chartTheme.axisColor }} hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} isAnimationActive={false} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
