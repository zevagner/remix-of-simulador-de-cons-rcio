import { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  calculateSimulationLegacy,
  calculateFinancingCost,
  calculateMonthlySchedule,
  reconcileWithSchedule,
  deriveContemplationType,
  formatCurrency,
} from '@/core/finance';
import {
  DEFAULT_FINANCING_RATE, DEFAULT_FINANCING_MIP_RATE, DEFAULT_FINANCING_DFI_RATE,
  DEFAULT_FINANCING_ADMIN_FEE_MONTHLY,
} from '@/config/consortiumRates';

import { PdfDownloadButton } from '@/components/pdf/PdfDownloadButton';
import { PdfAnaliseFinanceira } from '@/components/pdf/PdfAnaliseFinanceira';
import { PdfConsorcioVsConsorcio } from '@/components/pdf/PdfConsorcioVsConsorcio';
import { PdfCompraAVista } from '@/components/pdf/proposalPdf/PdfCompraAVista';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintableParams } from '@/components/print/PrintableParams';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ResetButton } from '@/components/ui/ResetButton';
import { Button } from '@/components/ui/button';
import { FinancingComparisonTab } from './comparator/FinancingComparisonTab';
import { ConsortiumComparisonTab } from './comparator/ConsortiumComparisonTab';
import { CashComparisonTab, type CashComparisonSnapshot } from './comparator/CashComparisonTab';
import { useSimulatorInput, useSimulatorResult } from './simulator/SimulatorContext';
import { useTrackModuleAccess } from '@/hooks/useTrackModuleAccess';
import { JourneyGuideBanner } from '@/components/layout/JourneyGuideBanner';
import { useJourneyGuidance } from '@/hooks/useJourneyGuidance';
import { AdaptiveSuggestion } from '@/components/adaptive/AdaptiveSuggestion';
import { useAdaptiveProfile } from '@/lib/adaptive/useAdaptiveProfile';
import { suggestNextModule } from '@/lib/adaptive/recommendations';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';

export function ComparatorModule() {
  useTrackModuleAccess('comparator');
  const {
    input: simulatorInput,
    insuranceEnabled,
    adminFeeDiscount,
  } = useSimulatorInput();
  const {
    effectiveInsurancePercent,
    result: simulatorResult,
    actualFreeBidValue,
    actualEmbeddedBidValue,
    effectiveAdminFeePercent,
  } = useSimulatorResult();
  const [comparisonType, setComparisonType] = useState('financing');
  const [useAdjustedScale, setUseAdjustedScale] = useState(true);
  const [useBidAsDownPayment, setUseBidAsDownPayment] = useState(true);
  const [manualDownPayment, setManualDownPayment] = useState(0);
  const [cashSnapshot, setCashSnapshot] = useState<CashComparisonSnapshot | null>(null);
  const handleCashSnapshot = useCallback((snap: CashComparisonSnapshot) => setCashSnapshot(snap), []);

  // Dados do Consórcio 1 vêm diretamente do SimulatorContext — sem recálculo
  const creditValue = simulatorInput.creditValue;
  const termMonths = simulatorInput.termMonths;
  const adminFee = simulatorInput.adminFeePercent;
  const reserveFund = simulatorInput.reserveFundPercent;

  // Consórcio 1 result = resultado central do Simulador
  const consortiumResult = simulatorResult;

  // Financiamento
  const [financingRate, setFinancingRate] = useState(DEFAULT_FINANCING_RATE);
  const [mipRate, setMipRate] = useState(DEFAULT_FINANCING_MIP_RATE);
  const [dfiRate, setDfiRate] = useState(DEFAULT_FINANCING_DFI_RATE);
  const [adminFeeMonthly, setAdminFeeMonthly] = useState(DEFAULT_FINANCING_ADMIN_FEE_MONTHLY);

  // Consórcio 2
  const [adminFee2, setAdminFee2] = useState(simulatorInput.adminFeePercent);
  const [reserveFund2, setReserveFund2] = useState(simulatorInput.reserveFundPercent);

  // ── FASE 1 — Fairness Financeira: toggles de simetria (default OFF) ──
  // INCC/IPCA aplicado ao consórcio (cenários 1 e 2). TR aplicado ao financiamento.
  const [applyConsortiumAdjustment, setApplyConsortiumAdjustment] = useState(false);
  const [consortiumAdjustmentPercent, setConsortiumAdjustmentPercent] = useState(4);
  const [applyTR, setApplyTR] = useState(false);
  const [trMonthlyRate, setTrMonthlyRate] = useState(0.10);

  const handleReset = () => {
    setComparisonType('financing');
    setUseAdjustedScale(true);
    setFinancingRate(DEFAULT_FINANCING_RATE);
    setMipRate(DEFAULT_FINANCING_MIP_RATE);
    setDfiRate(DEFAULT_FINANCING_DFI_RATE);
    setAdminFeeMonthly(DEFAULT_FINANCING_ADMIN_FEE_MONTHLY);
    setAdminFee2(simulatorInput.adminFeePercent);
    setReserveFund2(simulatorInput.reserveFundPercent);
    setUseBidAsDownPayment(true);
    setManualDownPayment(0);
    setApplyConsortiumAdjustment(false);
    setConsortiumAdjustmentPercent(4);
    setApplyTR(false);
    setTrMonthlyRate(0.10);
  };

  // ============ CALCULATIONS ============

  // consortiumResult já vem do SimulatorContext (linha 41) — sem recálculo local

  // ── FASE 1 — Item 2: Consórcios 1/2 agora usam o MOTOR MENSAL canônico
  // (calculateMonthlySchedule + reconcileWithSchedule), mesma fonte de verdade
  // do SimulatorContext. Toggle INCC/IPCA propaga annualAdjustmentPercent.
  // Quando toggle off: annualAdjustmentPercent = 0 → comportamento nominal
  // estritamente equivalente ao legado dentro da tolerância documentada.
  const consortiumAnnualAdjust = applyConsortiumAdjustment ? consortiumAdjustmentPercent : 0;

  const buildConsortiumInput = (adminFeePct: number, reserveFundPct: number) => ({
    creditValue, termMonths, consortiumType: simulatorInput.consortiumType,
    adminFeePercent: adminFeePct, reserveFundPercent: reserveFundPct,
    insurancePercent: effectiveInsurancePercent, proponentAge: simulatorInput.proponentAge,
    reducedInstallment: false, freeBidValue: 0, embeddedBidValue: 0,
  });

  const consortium1ResultBase = useMemo(() => {
    const input = buildConsortiumInput(adminFee, reserveFund);
    const legacy = calculateSimulationLegacy(input);
    const schedule = calculateMonthlySchedule({
      sim: input,
      contemplated: false,
      contemplationType: deriveContemplationType(false, 0, 0),
      annualAdjustmentPercent: consortiumAnnualAdjust,
    });
    return reconcileWithSchedule(legacy, schedule, termMonths, { preserveContemplationInstallment: false });
  }, [creditValue, termMonths, adminFee, reserveFund, effectiveInsurancePercent, simulatorInput.consortiumType, simulatorInput.proponentAge, consortiumAnnualAdjust]);

  const consortium2Result = useMemo(() => {
    const input = buildConsortiumInput(adminFee2, reserveFund2);
    const legacy = calculateSimulationLegacy(input);
    const schedule = calculateMonthlySchedule({
      sim: input,
      contemplated: false,
      contemplationType: deriveContemplationType(false, 0, 0),
      annualAdjustmentPercent: consortiumAnnualAdjust,
    });
    return reconcileWithSchedule(legacy, schedule, termMonths, { preserveContemplationInstallment: false });
  }, [creditValue, termMonths, adminFee2, reserveFund2, effectiveInsurancePercent, simulatorInput.consortiumType, simulatorInput.proponentAge, consortiumAnnualAdjust]);

  // Base de comparação contra financiamento: usa o crédito LÍQUIDO (carta − lance embutido),
  // pois é o valor que o cliente efetivamente recebe e seria o montante a financiar.
  // Quando não há lance embutido, netCreditValue == creditValue (sem efeito colateral).
  // O lance LIVRE é tratado como ENTRADA do financiamento (toggle controlado pelo usuário).
  // Lance embutido NÃO é considerado como entrada — apenas reduz o crédito recebido.
  const propertyValue = consortiumResult.netCreditValue;
  const downPayment = useBidAsDownPayment ? actualFreeBidValue : manualDownPayment;
  const safeDownPayment = Math.min(Math.max(0, downPayment), propertyValue);
  const financingBase = Math.max(propertyValue - safeDownPayment, 0);
  const hasEmbeddedBid = propertyValue < creditValue;

  // ── FASE 1 — Item 1: TR no financiamento (default OFF) ──
  const trEffective = applyTR ? trMonthlyRate : 0;

  const financingResult = useMemo(() =>
    calculateFinancingCost(financingBase, termMonths, financingRate, mipRate, dfiRate, adminFeeMonthly, propertyValue, trEffective),
    [financingBase, termMonths, financingRate, mipRate, dfiRate, adminFeeMonthly, propertyValue, trEffective]
  );

  const financing420Result = useMemo(() =>
    calculateFinancingCost(financingBase, 420, financingRate, mipRate, dfiRate, adminFeeMonthly, propertyValue, trEffective),
    [financingBase, financingRate, mipRate, dfiRate, adminFeeMonthly, propertyValue, trEffective]
  );

  // CUSTO EFETIVO DO CLIENTE = Custo do Plano + Lance Ofertado (livre + embutido).
  // Mesma base usada no card "Resultado" — garante consistência entre todos os
  // blocos do comparador (Resultado, 420 meses, gráficos e savings).
  const effectiveConsortiumCost = consortiumResult.totalCost + (actualFreeBidValue || 0) + (actualEmbeddedBidValue || 0);

  // ── Representação consultiva (não altera cálculos acima) ──────────────────
  // Lance EMBUTIDO sai do próprio crédito → não é desembolso. Apenas reduz o
  // que o cliente recebe. Lance LIVRE é desembolso real do bolso.
  // custoDesembolsado: o que efetivamente sai do bolso ao longo do plano.
  // creditoLiquido:    o que efetivamente entra na mão do cliente.
  // custoEfetivoReal:  razão desembolso/recebido (R$ pago por R$ recebido).
  const custoDesembolsado = consortiumResult.totalCost + (actualFreeBidValue || 0);
  const creditoLiquido = Math.max(creditValue - (actualEmbeddedBidValue || 0), 0);
  const custoEfetivoReal = creditoLiquido > 0 ? custoDesembolsado / creditoLiquido : 0;

  // Para o financiamento, somamos a entrada de volta ao custo total —
  // afinal, a entrada também é desembolso do cliente. Assim a comparação fica justa.
  const priceTotalEffective = financingResult.priceTotalWithInsurance + safeDownPayment;
  const sacTotalEffective = financingResult.sacTotalWithInsurance + safeDownPayment;
  const price420TotalEffective = financing420Result.priceTotalWithInsurance + safeDownPayment;
  const sac420TotalEffective = financing420Result.sacTotalWithInsurance + safeDownPayment;

  const priceSavings = priceTotalEffective - effectiveConsortiumCost;
  const priceDenom = priceTotalEffective || 1;
  const priceSavingsPercent = (priceSavings / priceDenom) * 100;
  const sacSavings = sacTotalEffective - effectiveConsortiumCost;
  const sacDenom = sacTotalEffective || 1;
  const sacSavingsPercent = (sacSavings / sacDenom) * 100;

  const getAdjustedDomain = (values: number[], useAdjusted: boolean): [number, number] => {
    const validValues = values.filter(v => Number.isFinite(v) && v > 0);
    if (validValues.length === 0) return [0, 100];
    if (!useAdjusted) return [0, Math.max(...validValues) * 1.1];
    const minValue = Math.min(...validValues);
    const maxValue = Math.max(...validValues);
    const range = maxValue - minValue;
    const margin = Math.max(range * 0.2, maxValue * 0.05);
    return [Math.max(0, minValue - margin), maxValue + margin];
  };

  const comparisonLabels: Record<string, string> = {
    financing: 'Consórcio vs Financiamento',
    cash: 'Consórcio vs Compra à Vista',
    consortium: 'Consórcio vs Outro Consórcio',
  };

  const getPrintSummaryItems = () => {
    if (comparisonType === 'financing') {
      return [
        { label: 'Valor', value: formatCurrency(creditValue) },
        { label: 'Parcela Consórcio', value: formatCurrency(consortiumResult.installmentAfterContemplation) },
        { label: 'Total Consórcio', value: formatCurrency(consortiumResult.totalCost) },
        { label: 'Diferença Estimada', value: formatCurrency(priceSavings) },
      ];
    } else {
      return [
        { label: 'Valor', value: formatCurrency(creditValue) },
        { label: 'Custo Consórcio 1', value: formatCurrency(consortiumResult.totalCost) },
        { label: 'Custo Consórcio 2', value: formatCurrency(consortium2Result.totalCost) },
        { label: 'Diferença', value: formatCurrency(consortiumResult.totalCost - consortium2Result.totalCost) },
      ];
    }
  };

  const hasValidSimulation = creditValue > 0 && termMonths > 0;
  const guidance = useJourneyGuidance({
    currentModule: 'comparator',
    creditValue,
    termMonths,
    hasSimulationResult: hasValidSimulation,
    hasBidStudy: false,
    hasSelectedGroup: false,
    contemplated: false,
  });
  const profile = useAdaptiveProfile();
  const adaptive = suggestNextModule('comparator', profile);
  const { navigateTo } = useModuleNavigation();

  return (
    <div className="space-y-5 animate-fade-in" data-signature-shell="true" data-signature-variant="analytical">
      <ModuleHeader title="Comparador" subtitle="Compare consórcio com financiamento" moduleId="comparator" />

      <JourneyGuideBanner primary={guidance.primary} secondary={guidance.secondary} />
      {adaptive && (
        <AdaptiveSuggestion
          suggestion={adaptive}
          onAct={(s) => s.targetModule && navigateTo(s.targetModule)}
        />
      )}


      <PrintHeader
        moduleName="Comparativo Financeiro"
        consortiumType={comparisonLabels[comparisonType]}
        summaryItems={getPrintSummaryItems()}
        conclusion={comparisonType === 'financing'
          ? `Diferença financeira estimada de ${formatCurrency(priceSavings)} (${priceSavingsPercent.toFixed(1)}%)`
          : `Diferença de custo estimada de ${formatCurrency(Math.abs(consortiumResult.totalCost - consortium2Result.totalCost))}`}
      />

      <PrintableParams
        title="Parâmetros do Comparativo"
        params={comparisonType === 'financing' ? [
          { label: 'Tipo', value: 'Consórcio vs Financiamento' },
          { label: 'Valor da Carta', value: formatCurrency(creditValue) },
          { label: 'Prazo', value: `${termMonths} meses` },
          { label: 'Taxa Adm.', value: `${adminFee.toFixed(2)}%` },
          { label: 'Fundo de Reserva', value: `${reserveFund.toFixed(2)}%` },
          { label: 'Taxa Financ.', value: `${financingRate.toFixed(2)}% a.a.` },
        ] : [
          { label: 'Tipo', value: 'Consórcio vs Outro Consórcio' },
          { label: 'Valor', value: formatCurrency(creditValue) },
          { label: 'Prazo', value: `${termMonths} meses` },
          { label: 'Taxa Adm. 1', value: `${adminFee.toFixed(2)}%` },
          { label: 'Fundo Reserva 1', value: `${reserveFund.toFixed(2)}%` },
          { label: 'Taxa Adm. 2', value: `${adminFee2.toFixed(2)}%` },
          { label: 'Fundo Reserva 2', value: `${reserveFund2.toFixed(2)}%` },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 print-hide px-4 sm:px-6" data-signature-chapter="01" data-signature-label="Mesa Analítica">
        <div>
          <div className="editorial-section-mark">
            <span className="editorial-counter">01</span>
            <span className="module-eyebrow">Mesa Analítica</span>
          </div>
          <h2 className="editorial-headline">
            Leitura <em>patrimonial</em> entre estratégias
          </h2>
          <p className="editorial-headline-lead">
            Comparativo financeiro estruturado entre consórcio, financiamento e cenários alternativos.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial">
            <ResetButton onReset={handleReset} moduleName="o Comparador" />
          </div>
          <div className="flex-1 sm:flex-initial">
            <PdfDownloadButton
              moduleName="Comparativo"
              filenameSuffix={comparisonType}
              disabled={comparisonType === 'cash' && !cashSnapshot?.cashComparison}
              buildPdfElement={(pdfCtx) => (
                comparisonType === 'cash' ? (
                  cashSnapshot ? (
                    <PdfCompraAVista data={{
                      cashComparison: cashSnapshot.cashComparison,
                      cashPropertyValue: cashSnapshot.cashPropertyValue,
                      cashEmbeddedBidPercent: cashSnapshot.cashEmbeddedBidPercent,
                      cashFreeBidPercent: cashSnapshot.cashFreeBidPercent,
                      cashTermMonths: cashSnapshot.cashTermMonths,
                      cashInvestmentRate: cashSnapshot.cashInvestmentRate,
                      cashCdiRate: cashSnapshot.cashCdiRate,
                      clientName: pdfCtx.clientName,
                      managerName: pdfCtx.managerName,
                      managerRole: pdfCtx.managerRole,
                      agencyName: pdfCtx.agencyName,
                      managerPhone: pdfCtx.phone,
                      managerWhatsapp: pdfCtx.whatsapp,
                      managerEmail: pdfCtx.email,
                      logoDataUrl: pdfCtx.logoDataUrl,
                    }} />
                  ) : null
                ) : comparisonType === 'consortium' ? (
                  <PdfConsorcioVsConsorcio data={{
                    creditValue,
                    termMonths,
                    consortiumResult,
                    adminFee,
                    reserveFund,
                    consortium1Total: consortium1ResultBase.totalCost,
                    consortium2Result,
                    adminFee2,
                    reserveFund2,
                    consortium2Total: consortium2Result.totalCost,
                    consortiumWinnerLabel: (consortium2Result.totalCost - consortium1ResultBase.totalCost) >= 0
                      ? `Consórcio 1 é ${formatCurrency(consortium2Result.totalCost - consortium1ResultBase.totalCost)} mais barato`
                      : `Consórcio 2 é ${formatCurrency(consortium1ResultBase.totalCost - consortium2Result.totalCost)} mais barato`,
                    clientName: pdfCtx.clientName,
                    managerName: pdfCtx.managerName,
                    managerRole: pdfCtx.managerRole,
                    agencyName: pdfCtx.agencyName,
                    managerPhone: pdfCtx.phone,
                    managerWhatsapp: pdfCtx.whatsapp,
                    managerEmail: pdfCtx.email,
                    logoDataUrl: pdfCtx.logoDataUrl,
                  }} />
                ) : (
                <PdfAnaliseFinanceira
                  mode="comparador"
                data={{
                  comparisonType,
                  consortiumResult,
                  creditValue,
                  termMonths,
                  adminFee,
                  reserveFund,
                  financingResult,
                  financing420Result,
                  financingRate,
                  priceSavings,
                  priceSavingsPercent,
                  sacSavings,
                  sacSavingsPercent,
                  // P3: parâmetros do financiamento exibidos na UI
                  freeBidValue: actualFreeBidValue,
                  financedValue: financingBase,
                  netCreditValue: propertyValue,
                  consortium2Result,
                  adminFee2,
                  reserveFund2,
                  // Fonte única: custos efetivos consolidados (mesma base da tela)
                  effectiveConsortiumCost,
                  priceTotalEffective,
                  sacTotalEffective,
                  price420TotalEffective,
                  sac420TotalEffective,
                  // Consórcio×Consórcio — totais e diferença pré-calculados na UI
                  consortium1Total: consortium1ResultBase.totalCost,
                  consortium2Total: consortium2Result.totalCost,
                  consortiumDifference: consortium2Result.totalCost - consortium1ResultBase.totalCost,
                  consortiumWinnerLabel: (consortium2Result.totalCost - consortium1ResultBase.totalCost) >= 0
                    ? `Consórcio 1 é ${formatCurrency(consortium2Result.totalCost - consortium1ResultBase.totalCost)} mais barato`
                    : `Consórcio 2 é ${formatCurrency(consortium1ResultBase.totalCost - consortium2Result.totalCost)} mais barato`,
                  downPayment: safeDownPayment,
                  // Dados do modo "Compra à Vista" (snapshot vivo do CashComparisonTab).
                  cashComparison: cashSnapshot?.cashComparison,
                  cashPropertyValue: cashSnapshot?.cashPropertyValue,
                  cashEmbeddedBidPercent: cashSnapshot?.cashEmbeddedBidPercent,
                  cashFreeBidPercent: cashSnapshot?.cashFreeBidPercent,
                  cashTermMonths: cashSnapshot?.cashTermMonths,
                  cashInvestmentRate: cashSnapshot?.cashInvestmentRate,
                  cashCdiRate: cashSnapshot?.cashCdiRate,
                  managerName: pdfCtx.managerName,
                  agencyName: pdfCtx.agencyName,
                  clientName: pdfCtx.clientName,
                  managerRole: pdfCtx.managerRole,
                  managerPhone: pdfCtx.phone,
                  managerWhatsapp: pdfCtx.whatsapp,
                  managerEmail: pdfCtx.email,
                  logoDataUrl: pdfCtx.logoDataUrl,
                }}
                />
                )
              )}
            />
          </div>
        </div>
      </div>

      <Tabs value={comparisonType} onValueChange={setComparisonType}>
        <div data-signature-chapter="02" data-signature-label="Eixo Comparativo" className="px-4 sm:px-6">
          <TabsList 
            className="flex flex-wrap sm:grid w-full grid-cols-3 h-auto gap-2 bg-transparent border-none p-0"
            data-tabs-keep-pill="true"
          >
            <TabsTrigger 
              value="financing" 
              className="flex-1 whitespace-normal py-3 px-4 rounded-lg font-semibold uppercase text-[10px] sm:text-xs tracking-wider border border-[#1e3a5f] bg-transparent data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white data-[state=active]:border-[#1e3a5f] hover:bg-[#1e3a5f]/10"
            >
              VS Financiamento
            </TabsTrigger>
            <TabsTrigger 
              value="cash" 
              className="flex-1 whitespace-normal py-3 px-4 rounded-lg font-semibold uppercase text-[10px] sm:text-xs tracking-wider border border-[#1e3a5f] bg-transparent data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white data-[state=active]:border-[#1e3a5f] hover:bg-[#1e3a5f]/10"
            >
              VS Compra à Vista
            </TabsTrigger>
            <TabsTrigger 
              value="consortium" 
              className="flex-1 whitespace-normal py-3 px-4 rounded-lg font-semibold uppercase text-[10px] sm:text-xs tracking-wider border border-[#1e3a5f] bg-transparent data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white data-[state=active]:border-[#1e3a5f] hover:bg-[#1e3a5f]/10"
            >
              VS Outro Consórcio
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <section data-analytical-board="true" aria-label="Painel comparativo">

      {comparisonType === 'financing' && (
        <FinancingComparisonTab
          consortiumResult={consortiumResult}
          financingResult={financingResult}
          financing420Result={financing420Result}
          creditValue={creditValue}
          financingBase={financingBase}
          propertyValue={propertyValue}
          hasEmbeddedBid={hasEmbeddedBid}
          freeBidValue={actualFreeBidValue}
          embeddedBidValue={actualEmbeddedBidValue}
          downPayment={safeDownPayment}
          useBidAsDownPayment={useBidAsDownPayment}
          setUseBidAsDownPayment={setUseBidAsDownPayment}
          manualDownPayment={manualDownPayment}
          setManualDownPayment={setManualDownPayment}
          termMonths={termMonths}
          adminFee={adminFee}
          reserveFund={reserveFund}
          financingRate={financingRate} setFinancingRate={setFinancingRate}
          mipRate={mipRate} setMipRate={setMipRate}
          dfiRate={dfiRate} setDfiRate={setDfiRate}
          adminFeeMonthly={adminFeeMonthly} setAdminFeeMonthly={setAdminFeeMonthly}
          priceSavings={priceSavings} priceSavingsPercent={priceSavingsPercent}
          sacSavings={sacSavings} sacSavingsPercent={sacSavingsPercent}
          insuranceEnabled={insuranceEnabled}
          custoDesembolsado={custoDesembolsado}
          creditoLiquido={creditoLiquido}
          custoEfetivoReal={custoEfetivoReal}
          applyTR={applyTR}
          setApplyTR={setApplyTR}
          trMonthlyRate={trMonthlyRate}
          setTrMonthlyRate={setTrMonthlyRate}
          showAsymmetryBadge={!applyConsortiumAdjustment && applyTR}
        />
      )}

      {comparisonType === 'cash' && <CashComparisonTab onSnapshot={handleCashSnapshot} />}

      {comparisonType === 'consortium' && (
        <ConsortiumComparisonTab
          consortiumResult={consortium1ResultBase}
          consortium2Result={consortium2Result}
          creditValue={creditValue}
          termMonths={termMonths}
          adminFee={adminFee}
          reserveFund={reserveFund}
          adminFee2={adminFee2} setAdminFee2={setAdminFee2}
          reserveFund2={reserveFund2} setReserveFund2={setReserveFund2}
          insuranceEnabled={insuranceEnabled}
          reducedInstallment={false}
          adminFeeDiscount={adminFeeDiscount}
          effectiveAdminFeePercent={effectiveAdminFeePercent}
          useAdjustedScale={useAdjustedScale} setUseAdjustedScale={setUseAdjustedScale}
          getAdjustedDomain={getAdjustedDomain}
          applyConsortiumAdjustment={applyConsortiumAdjustment}
          setApplyConsortiumAdjustment={setApplyConsortiumAdjustment}
          consortiumAdjustmentPercent={consortiumAdjustmentPercent}
          setConsortiumAdjustmentPercent={setConsortiumAdjustmentPercent}
          showAsymmetryBadge={applyConsortiumAdjustment && !applyTR}
        />
      )}

      </section>

      <PrintFooter />
    </div>
  );
}
