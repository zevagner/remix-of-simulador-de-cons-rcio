import { useState, useCallback } from 'react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { useSimulatorInput, useSimulatorResult } from './simulator/SimulatorContext';
import { Button } from '@/components/ui/button';
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { PdfDownloadButton } from '@/components/pdf/PdfDownloadButton';
import { PdfSimulador } from '@/components/pdf/PdfSimulador';

// Simulator sections
import { SimulatorConsortiumDataCard } from './simulator/SimulatorConsortiumDataCard';
import { SimulatorResultsSection } from './simulator/SimulatorResultsSection';
import { SimulatorContemplationCard } from './simulator/SimulatorContemplationCard';
import { SimulatorBidImpactCard } from './simulator/SimulatorBidImpactCard';
import { SimulatorBidStrategyCard } from './simulator/SimulatorBidStrategyCard';
import { SimulatorActuarialCard } from './simulator/SimulatorActuarialCard';
import { SimulatorDisclaimerCard } from './simulator/SimulatorDisclaimerCard';
import { PostSimulationCTA } from './simulator/PostSimulationCTA';
import { SimulatorObjectionProactive } from './simulator/SimulatorObjectionProactive';
import { PrintHeader } from '@/components/print/PrintHeader';

import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintableParams } from '@/components/print/PrintableParams';

import { formatCurrency, getEffectiveClientCost } from '@/core/finance';
import type { PdfSimuladorCompositionRow, PdfSimuladorSummaryItem } from '@/components/pdf/PdfSimulador';
// (Onda 2B) Label canônico fixo: "sobre saldo devedor".
import { ResetButton } from '@/components/ui/ResetButton';
import { useAssemblies } from '@/hooks/useAssemblies';
import { DataUpdateBadge } from '@/components/ui/DataUpdateBadge';
import { useDiagnosticContextSafe } from '@/components/modules/diagnostic/DiagnosticContext';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Stethoscope, ArrowRight } from 'lucide-react';
import { NextStepCTA } from '@/components/layout/NextStepCTA';
import { useTrackModuleAccess } from '@/hooks/useTrackModuleAccess';

export function SimulatorModule() {
  return <SimulatorModuleContent />;
}

function SimulatorModuleContent() {
  useTrackModuleAccess('simulator');
  const inputCtx = useSimulatorInput();
  const resultCtx = useSimulatorResult();
  const { input, insuranceEnabled, contemplated, contemplationMonth, typeLabels, onReset, suggestedBidFromStudy } = inputCtx;
  const { result, monthlySchedule, effectiveAdminFeePercent, mipRate, actualFreeBidValue, actualEmbeddedBidValue, isValidSimulation } = resultCtx;
  const hasBidImpact = isValidSimulation && Boolean(suggestedBidFromStudy);
  const ctx = inputCtx; // alias para `ctx.maxReducedMonths` legado abaixo
  const { assemblies } = useAssemblies();
  const diagnostic = useDiagnosticContextSafe();
  const { navigateTo } = useModuleNavigation();


  const printSummaryItems = [
    { label: 'Valor da Carta', value: formatCurrency(input.creditValue) },
    { label: 'Prazo', value: `${input.termMonths} meses` },
    { label: 'Parcela', value: formatCurrency(result.installmentAfterContemplation) },
    { label: 'Total', value: formatCurrency(result.totalCost) },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // PDF PAYLOAD — derivado EXCLUSIVAMENTE do monthlySchedule (fonte única).
  // Sem fórmulas de negócio, apenas agregação direta das linhas do schedule
  // e formatação visual. PDF recebe valores prontos e renderiza passivamente.
  // ─────────────────────────────────────────────────────────────────────────
  const pdfPayload = (() => {
    if (!monthlySchedule || monthlySchedule.rows.length === 0) return null;
    const rows = monthlySchedule.rows;

    const totalCost = monthlySchedule.costWithInsurance;
    const totalInsurance = monthlySchedule.totalInsurance;
    const effectiveClientCost = getEffectiveClientCost(monthlySchedule);
    const totalBidOffered = (actualFreeBidValue || 0) + (actualEmbeddedBidValue || 0);

    // ── ONDA A — PARCELA OFICIAL ÚNICA ──
    // PDF consome a parcela canônica reconciliada (mesma do card Resultados
    // e do card Composição), eliminando a divergência tela ↔ PDF que existia
    // quando o PDF lia firstRow.payment isolado do schedule.
    const officialInstallment = result.fullInstallment;

    // Componentes da parcela oficial decompostos a partir do `result` reconciliado.
    const monthlyCommonFund = input.creditValue / input.termMonths;
    const monthlyAdminFeeFlat = result.adminFee / input.termMonths;
    const monthlyReserveFundFlat = result.reserveFund / input.termMonths;
    const monthlyInsuranceAvg = insuranceEnabled ? result.monthlyInsurance : 0;

    // Totais agregados do plano (continuam vindos diretamente do schedule).
    const totalCommonFund = rows.reduce((s, r) => s + r.amortCredit, 0);
    const totalAdminFee = rows.reduce((s, r) => s + r.amortAdminFee, 0);
    const totalReserveFund = rows.reduce((s, r) => s + r.amortReserveFund, 0);

    const fmtPct = (total: number) =>
      totalCost > 0 ? `${((total / totalCost) * 100).toFixed(1)}%` : '0%';

    const composition: PdfSimuladorCompositionRow[] = [
      {
        name: 'Fundo Comum',
        monthlyLabel: formatCurrency(monthlyCommonFund),
        totalLabel: formatCurrency(totalCommonFund),
        percentLabel: fmtPct(totalCommonFund),
      },
      {
        name: 'Taxa de Administração',
        monthlyLabel: formatCurrency(monthlyAdminFeeFlat),
        totalLabel: formatCurrency(totalAdminFee),
        percentLabel: fmtPct(totalAdminFee),
      },
      {
        name: 'Fundo de Reserva',
        monthlyLabel: formatCurrency(monthlyReserveFundFlat),
        totalLabel: formatCurrency(totalReserveFund),
        percentLabel: fmtPct(totalReserveFund),
      },
      ...(insuranceEnabled
        ? [{
            name: 'Seguro Prestamista',
            monthlyLabel: formatCurrency(monthlyInsuranceAvg),
            totalLabel: formatCurrency(totalInsurance),
            percentLabel: fmtPct(totalInsurance),
          }]
        : []),
    ];

    const summaryItems: PdfSimuladorSummaryItem[] = [
      { label: 'Valor da Carta', value: formatCurrency(input.creditValue) },
      { label: 'Prazo', value: `${input.termMonths} meses` },
      { label: 'Parcela Inicial', value: formatCurrency(officialInstallment) },
      { label: 'Custo Total do Plano', value: formatCurrency(totalCost) },
    ];

    return {
      initialInstallmentLabel: formatCurrency(officialInstallment),
      totalCostLabel: formatCurrency(totalCost),
      totalBidOfferedLabel: formatCurrency(totalBidOffered),
      effectiveClientCostLabel: formatCurrency(effectiveClientCost),
      composition,
      summaryItems,
    };
  })();

  return (
    <div className="space-y-3 animate-fade-in" data-signature-shell="true">
      <ModuleHeader title="Simulador" moduleId="simulator" />


      {/* Print-only */}
      <PrintHeader
        moduleName="Simulador de Consórcio"
        consortiumType={typeLabels[input.consortiumType]}
        summaryItems={printSummaryItems}
        conclusion={`Consórcio ${typeLabels[input.consortiumType]} de ${formatCurrency(input.creditValue)} em ${input.termMonths}x de ${formatCurrency(result.installmentAfterContemplation)}`}
      />
      <PrintableParams
        title="Parâmetros da Simulação"
        params={[
          { label: 'Tipo de Consórcio', value: typeLabels[input.consortiumType] },
          { label: 'Valor da Carta', value: formatCurrency(input.creditValue) },
          { label: 'Prazo Total', value: `${input.termMonths} meses` },
          { label: 'Taxa Adm. Efetiva', value: `${effectiveAdminFeePercent.toFixed(2).replace('.', ',')}%` },
          { label: 'Seguro (MIP)', value: insuranceEnabled ? `${mipRate.toFixed(4).replace('.', ',')}%/mês (sobre saldo devedor)` : 'Desabilitado' },
          { label: 'Lance Rec. Próprios', value: formatCurrency(actualFreeBidValue) },
          { label: 'Lance Embutido', value: formatCurrency(actualEmbeddedBidValue) },
          { label: 'Contemplação', value: contemplated ? `Mês ${contemplationMonth}` : 'Não simulada' },
        ]}
      />

      {/* ═══════ SIMULAÇÃO ═══════ */}
      <div className="space-y-4" data-spatial-shell="true">
        <div className="hidden sm:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
          <div>
            <DataUpdateBadge className="mt-1" assemblies={assemblies} compact showTrust />
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial"><ResetButton onReset={onReset} moduleName="o Simulador" /></div>
            
            <div className="flex-1 sm:flex-initial">
              <PdfDownloadButton
                disabled={!isValidSimulation || !pdfPayload}
                moduleName="Simulador"
                defaultClientName={diagnostic?.data?.clientName || ''}
                buildPdfElement={(pdfCtx) => (
                  <PdfSimulador data={{
                    input, result, monthlySchedule,
                    initialInstallmentLabel: pdfPayload!.initialInstallmentLabel,
                    totalCostLabel: pdfPayload!.totalCostLabel,
                    totalBidOfferedLabel: pdfPayload!.totalBidOfferedLabel,
                    effectiveClientCostLabel: pdfPayload!.effectiveClientCostLabel,
                    composition: pdfPayload!.composition,
                    summaryItems: pdfPayload!.summaryItems,
                    effectiveAdminFeePercent, mipRate, insuranceEnabled,
                    actualFreeBidValue, actualEmbeddedBidValue, contemplated, contemplationMonth,
                    typeLabels, maxReducedMonths: ctx.maxReducedMonths,
                    managerName: pdfCtx.managerName, agencyName: pdfCtx.agencyName,
                    clientName: pdfCtx.clientName,
                    managerRole: pdfCtx.managerRole, managerPhone: pdfCtx.phone,
                    managerWhatsapp: pdfCtx.whatsapp, managerEmail: pdfCtx.email,
                    logoDataUrl: pdfCtx.logoDataUrl,
                  }} />
                )}
              />
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.5fr)_minmax(0,1.5fr)] gap-x-6 gap-y-6 items-stretch"
          data-signature-chapter="01"
          data-signature-label="Parâmetros & Resultado"
          data-spatial-stage="hero"
        >
          <section
            aria-label="Parâmetros"
            className="print:hidden min-w-0 flex flex-col h-full [&>*]:h-full [&>*]:flex [&>*]:flex-col"
            data-spatial-zone="console"
            data-cockpit-form="true"
          >
            <SimulatorConsortiumDataCard />
          </section>

          <section
            id="simulator-results"
            aria-label="Resultados"
            data-cockpit-hero="true"
            data-spatial-zone="hero"
            className="min-w-0 flex flex-col h-full [&>*]:h-full [&>*]:flex [&>*]:flex-col"
          >
            <SimulatorResultsSection variant="summary" />
          </section>
        </div>

        {/* 2. Estratégia de Lance — faixa cinematográfica */}
        <section
          data-cockpit-strip="true"
          data-signature-chapter="02"
          data-signature-label="Estratégia de Lance"
          data-spatial-zone="strip"
          aria-label="Lance"
          className="min-w-0"
        >
          <SimulatorBidStrategyCard />
        </section>

        {/* 3. Cenário Pós-Contemplação + 4. Evolução Atuarial — board cinematográfico */}
        <section
          data-cockpit-board="true"
          data-signature-chapter="03"
          data-signature-label="Pós-Contemplação & Evolução"
          data-spatial-zone="board"
          aria-label="Estratégia"
          className="space-y-4 min-w-0"
        >
          <div data-spatial-board-grid="true" data-spatial-board-layout={hasBidImpact ? 'split' : 'single'}>
            <div data-spatial-board-cell="primary"><SimulatorContemplationCard /></div>
            {hasBidImpact && <div data-spatial-board-cell="secondary"><SimulatorBidImpactCard /></div>}
            <div data-spatial-board-cell="full"><SimulatorActuarialCard /></div>
          </div>
        </section>

        {/* 04 — Detalhamento analítico (composição + distribuição) */}
        <section
          data-spatial-zone="analytical"
          data-signature-chapter="04"
          data-signature-label="Detalhamento Analítico"
          aria-label="Detalhamento"
          className="min-w-0"
        >
          <SimulatorResultsSection variant="extras" />
        </section>

        {/* 05 — Camada contextual (informações importantes) */}
        <section
          data-spatial-zone="contextual"
          aria-label="Informações importantes"
          className="min-w-0"
        >
          <SimulatorDisclaimerCard />
        </section>

        {/* 06 — Camada de conversão */}
        <section
          data-spatial-zone="conversion"
          data-signature-chapter="05"
          data-signature-label="Próximos Passos"
          aria-label="Conversão"
          className="min-w-0 space-y-4"
        >
          <SimulatorObjectionProactive />
          <PostSimulationCTA />


          {isValidSimulation && (
            <NextStepCTA
              targetModule="analysis"
              label="Ver análise do cenário"
              description="Com base nesta simulação, abra o Módulo Análise para investigar lance, investimento, comparativos e assembleias."
            />
          )}
        </section>

        <PrintFooter />
      </div>
    </div>
  );
}
