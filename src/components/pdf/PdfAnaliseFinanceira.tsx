/**
 * PdfAnaliseFinanceira — PDF do Comparador (modo único).
 *
 * Onda P3b: markup internalizado. Os antigos `PdfComparador` e
 * `PdfInvestimento` permanecem no repositório como @deprecated mas
 * NÃO são mais importados em nenhum lugar do app.
 *
 * REGRAS desta onda:
 *  - Layout, textos e ordem dos elementos são idênticos aos PDFs antigos.
 *  - Nada de otimização ou unificação de seções (próximas ondas).
 *  - O antigo `mode: 'investimento'` foi removido — sem call sites.
 *    Investimento migrou para `PdfInvestimentoCenarios`.
 */
import React from 'react';
import { PdfLayout, pdfStyles as s } from './PdfLayout';
import { PdfSection, PdfMetricGrid, PdfMetric, PdfDataTable, PdfBarChart } from './primitives';
import { PdfCover } from '@/components/pdf/proposalPdf/PdfCover';
import { formatCurrency } from '@/utils/format';
import { SimulationResult } from '@/types/consortium';


/* ─────────────────────────────────────────────────────────────────
 * Tipos — copiados verbatim de PdfComparador e PdfInvestimento.
 * ───────────────────────────────────────────────────────────────── */

interface FinancingData {
  priceMonthlyPayment: number;
  priceTotalCost: number;
  priceTotalWithInsurance: number;
  priceTotalMIP: number;
  priceTotalDFI: number;
  sacFirstPayment: number;
  sacLastPayment: number;
  sacTotalCost: number;
  sacTotalWithInsurance: number;
  sacTotalMIP: number;
  sacTotalDFI: number;
}

interface CashData {
  creditLetterValue: number;
  embeddedBidValue: number;
  freeBidValue: number;
  totalBidValue: number;
  capitalToInvest: number;
  monthlyInstallment: number;
  monthlyYield: number;
  monthlyResult: number;
  cashFinalPatrimony: number;
  consortiumFinalPatrimony: number;
  accumulatedInvestmentGross: number;
  accumulatedInvestmentNet: number;
  irAliquota: number;
  irValue: number;
  patrimonyDifference: number;
  patrimonyDifferencePercent: number;
}

export interface PdfComparadorData {
  comparisonType: string;
  consortiumResult: SimulationResult;
  creditValue: number;
  termMonths: number;
  adminFee: number;
  reserveFund: number;
  // Financing
  financingResult?: FinancingData;
  financing420Result?: FinancingData;
  financingRate?: number;
  priceSavings?: number;
  priceSavingsPercent?: number;
  sacSavings?: number;
  sacSavingsPercent?: number;
  // P3: Parâmetros adicionais do financiamento.
  // Vêm prontos do ComparatorModule. Sem fallback no PDF.
  freeBidValue?: number;
  financedValue?: number;
  netCreditValue?: number;
  // Cash
  cashComparison?: CashData;
  cashPropertyValue?: number;
  cashEmbeddedBidPercent?: number;
  cashFreeBidPercent?: number;
  cashTermMonths?: number;
  cashInvestmentRate?: number;
  cashCdiRate?: number;
  // Consortium vs Consortium
  consortium2Result?: SimulationResult;
  adminFee2?: number;
  reserveFund2?: number;
  // Custos efetivos consolidados — fonte ÚNICA (calculados em ComparatorModule).
  // Quando ausentes (modo cash), o bloco que depende deles não é renderizado.
  effectiveConsortiumCost?: number;
  priceTotalEffective?: number;
  sacTotalEffective?: number;
  price420TotalEffective?: number;
  sac420TotalEffective?: number;
  // Comparação consórcio×consórcio — totais e textos pré-calculados na tela.
  consortium1Total?: number;
  consortium2Total?: number;
  consortiumDifference?: number;
  /** Texto pronto: "Consórcio 1 é R$ X mais barato" — calculado no módulo. */
  consortiumWinnerLabel?: string;
  downPayment?: number;
  // Header
  managerName?: string;
  agencyName?: string;
  clientName?: string;
  managerRole?: string;
  managerPhone?: string;
  managerWhatsapp?: string;
  managerEmail?: string;
  logoDataUrl?: string;
}


export interface PdfAnaliseFinanceiraProps {
  mode: 'comparador';
  data: PdfComparadorData;
}


/* ─────────────────────────────────────────────────────────────────
 * renderComparador — markup verbatim de PdfComparador.tsx
 * ───────────────────────────────────────────────────────────────── */

/**
 * Renderiza bloco de erro explícito quando dados financeiros essenciais
 * estão ausentes. Padrão idêntico ao `PdfSimulador` — proibido cair em
 * fallback silencioso (`?? 0`, `|| creditValue`).
 */
function renderMissingDataError(moduleName: string) {
  return (
    <PdfLayout
      moduleName={moduleName}
      subtitle="Erro de geração"
      summaryItems={[]}
      conclusion=""
    >
      <PdfSection title="Erro: dados financeiros indisponíveis">
        <p style={{ fontSize: '10pt', color: '#b00020' }}>
          Não foi possível gerar o PDF: os totais consolidados (custo
          efetivo do consórcio e do financiamento) não foram fornecidos
          pelo módulo. Refaça a comparação e tente novamente.
        </p>
      </PdfSection>
    </PdfLayout>
  );
}

function renderComparador(props: PdfComparadorData) {
  const {
    comparisonType, consortiumResult, creditValue, termMonths, adminFee, reserveFund,
    financingResult, financing420Result, financingRate,
    priceSavings = 0, priceSavingsPercent = 0, sacSavings = 0, sacSavingsPercent = 0,
    freeBidValue = 0, financedValue, netCreditValue,
    cashComparison, cashPropertyValue = 0, cashEmbeddedBidPercent = 0, cashFreeBidPercent = 0,
    cashTermMonths = 0, cashInvestmentRate = 0, cashCdiRate = 0,
    consortium2Result, adminFee2 = 0, reserveFund2 = 0,
    effectiveConsortiumCost, priceTotalEffective, sacTotalEffective,
    price420TotalEffective, sac420TotalEffective,
    consortium1Total, consortium2Total, consortiumWinnerLabel,
    downPayment = 0,
    managerName, agencyName,
  } = props;

  // ─────────────────────────────────────────────────────────────────────
  // VALIDAÇÃO ESTRITA — sem fallback financeiro. Se faltar dado consolidado
  // dos modos 'financing' ou 'consortium', renderizamos bloco de erro
  // explícito (padrão PdfSimulador). Modo 'cash' não usa esses campos.
  // ─────────────────────────────────────────────────────────────────────
  const hasFinancingTotals =
    typeof effectiveConsortiumCost === 'number' &&
    typeof priceTotalEffective === 'number' &&
    typeof sacTotalEffective === 'number';
  const hasConsortiumTotals =
    typeof consortium1Total === 'number' &&
    typeof consortium2Total === 'number' &&
    typeof consortiumWinnerLabel === 'string';

  if (comparisonType === 'financing' && !hasFinancingTotals) {
    return renderMissingDataError('Comparador vs Financiamento');
  }
  if (comparisonType === 'consortium' && !hasConsortiumTotals) {
    return renderMissingDataError('Comparador Consórcio × Consórcio');
  }

  // Valores consolidados — sem `?? 0`. TypeScript narrow garante presença
  // depois das validações acima; usamos `!` apenas onde já validamos.
  const consortiumTotal = effectiveConsortiumCost as number;
  const priceTotal = priceTotalEffective as number;
  const sacTotal = sacTotalEffective as number;
  const price420Total = price420TotalEffective as number | undefined;
  const sac420Total = sac420TotalEffective as number | undefined;

  // P1: helper para coerência de valores positivos/negativos.
  const advantageLabel = (positiveLabel: string, value: number) =>
    value >= 0 ? positiveLabel : 'Diferença';
  const advantageTone = (value: number): 'success' | 'warning' =>
    value >= 0 ? 'success' : 'warning';

  const subtitleMap: Record<string, string> = {
    financing: 'Consórcio vs Financiamento',
    cash: 'Consórcio vs Compra à Vista',
    consortium: 'Consórcio vs Outro Consórcio',
  };

  const getSummaryItems = () => {
    if (comparisonType === 'financing' && financingResult) {
      return [
        { label: 'Valor da Carta', value: formatCurrency(creditValue) },
        { label: 'Parcela Consórcio', value: formatCurrency(consortiumResult.installmentAfterContemplation) },
        { label: 'Total Consórcio', value: formatCurrency(consortiumTotal) },
        { label: advantageLabel('Economia vs Price', priceSavings), value: formatCurrency(priceSavings) },
      ];
    }
    if (comparisonType === 'cash' && cashComparison) {
      return [
        { label: 'Valor Imóvel', value: formatCurrency(cashPropertyValue) },
        { label: 'Capital Investido', value: formatCurrency(cashComparison.capitalToInvest) },
        { label: 'Patrimônio Consórcio', value: formatCurrency(cashComparison.consortiumFinalPatrimony) },
        { label: advantageLabel('Vantagem', cashComparison.patrimonyDifference), value: formatCurrency(cashComparison.patrimonyDifference) },
      ];
    }
    if (comparisonType === 'consortium' && consortium2Result) {
      return [
        { label: 'Valor da Carta', value: formatCurrency(creditValue) },
        { label: 'Total Consórcio 1', value: formatCurrency(consortium1Total as number) },
        { label: 'Total Consórcio 2', value: formatCurrency(consortium2Total as number) },
        { label: 'Resultado', value: consortiumWinnerLabel as string },
      ];
    }
    return [];
  };

  const isConsortiumVs = comparisonType === 'consortium';
  return (
    <>
      <style>{`.pdf-watermark, [data-pdf-watermark] { display: none !important; }`}</style>
      <PdfCover
        moduleName={isConsortiumVs ? 'Consórcio × Consórcio' : 'Análise Financeira Comparativa'}
        subtitle={isConsortiumVs ? 'Comparativo entre duas propostas de consórcio imobiliário' : undefined}
        clientName={props.clientName}
        consultorName={managerName}
        creditValue={isConsortiumVs ? undefined : formatCurrency(creditValue)}
        logoDataUrl={props.logoDataUrl}
      />
    <PdfLayout
      moduleName="Comparativo Financeiro"
      subtitle={subtitleMap[comparisonType]}
      summaryItems={getSummaryItems()}
      managerName={managerName}
      agencyName={agencyName}
      clientName={props.clientName}
      managerRole={props.managerRole}
      managerPhone={props.managerPhone}
      managerWhatsapp={props.managerWhatsapp}
      managerEmail={props.managerEmail}
      logoDataUrl={props.logoDataUrl}
      variant={comparisonType === 'financing' ? 'navy' : 'classic'}
    >
      {/* ─── Financing comparison ─── */}
      {comparisonType === 'financing' && financingResult && (() => {
        // Compactação local: reduz margens/paddings dos blocos para caber
        // em uma única página de conteúdo (Capa + p.2). breakInside:avoid
        // já é aplicado por PdfSection.
        const compactSection: React.CSSProperties = { marginBottom: '8pt' };
        const compactCard: React.CSSProperties = { ...s.card, padding: '7pt 10pt', marginBottom: '6pt' };
        const kickerStyle: React.CSSProperties = {
          border: '0.5px solid #F5821F',
          borderRadius: '99px',
          padding: '3px 12px',
          fontSize: '10px',
          color: '#F5821F',
          background: '#FFF3E8',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          display: 'inline-block',
          marginBottom: '6px',
          fontWeight: 600,
        };
        const Kicker = ({ children }: { children: React.ReactNode }) => (
          <div style={kickerStyle}>{children}</div>
        );
        const economyCard: React.CSSProperties = {
          background: '#003641',
          borderRadius: '8px',
          color: '#fff',
          padding: '12pt 14pt',
        };
        const economyLabel: React.CSSProperties = {
          fontSize: '8pt',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '4pt',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        };
        const economyValue: React.CSSProperties = {
          color: '#F5821F',
          fontSize: '18px',
          fontWeight: 700,
        };
        return (
        <>
          <style>{`.pdf-watermark { display: none !important; }`}</style>
          <PdfSection style={compactSection}>
            <Kicker>Parâmetros</Kicker>
            <div style={compactCard}>
              <PdfMetricGrid cols={4}>
                <PdfMetric label="Valor da Carta" value={formatCurrency(creditValue)} />
                <PdfMetric label="Prazo" value={`${termMonths} meses`} />
                <PdfMetric label="Taxa Adm." value={`${adminFee.toFixed(2)}%`} />
                <PdfMetric
                  label="Taxa Financ."
                  value={typeof financingRate === 'number' ? `${financingRate.toFixed(2)}% a.a.` : '—'}
                />
              </PdfMetricGrid>
              {(freeBidValue > 0 || typeof financedValue === 'number' || typeof netCreditValue === 'number') && (
                <PdfMetricGrid cols={3} style={{ marginTop: '6pt' }}>
                  <PdfMetric label="Entrada (lance livre)" value={formatCurrency(freeBidValue)} />
                  <PdfMetric
                    label="Valor financiado"
                    value={typeof financedValue === 'number' ? formatCurrency(financedValue) : '—'}
                  />
                  <PdfMetric
                    label="Crédito líquido recebido"
                    value={typeof netCreditValue === 'number' ? formatCurrency(netCreditValue) : '—'}
                  />
                </PdfMetricGrid>
              )}
              <div style={{ fontSize: '7pt', color: '#666', fontStyle: 'italic', marginTop: '6pt', paddingTop: '4pt', borderTop: '1px solid #EAECEF' }}>
                Comparação ilustrativa. Os prazos podem ser diferentes entre consórcio e financiamento.
              </div>
            </div>
          </PdfSection>

          <PdfSection style={compactSection}>
            <Kicker>Comparativo de Custos</Kicker>
            <PdfDataTable
              columns={[
                { header: 'Item' },
                { header: 'Consórcio', align: 'right' },
                { header: 'Financ. Price', align: 'right' },
                { header: 'Financ. SAC', align: 'right' },
              ]}
              rows={[
                ['Parcela Mensal',
                  formatCurrency(consortiumResult.installmentAfterContemplation),
                  formatCurrency(financingResult.priceMonthlyPayment),
                  `${formatCurrency(financingResult.sacFirstPayment)} ~ ${formatCurrency(financingResult.sacLastPayment)}`],
                ['Principal + Juros',
                  formatCurrency(consortiumTotal),
                  formatCurrency(financingResult.priceTotalCost),
                  formatCurrency(financingResult.sacTotalCost)],
                ['MIP + DFI', '—',
                  formatCurrency(financingResult.priceTotalMIP + financingResult.priceTotalDFI),
                  formatCurrency(financingResult.sacTotalMIP + financingResult.sacTotalDFI)],
                ['Custo Total do Plano',
                  formatCurrency(consortiumTotal),
                  formatCurrency(priceTotal),
                  formatCurrency(sacTotal)],
              ]}
              rowStyles={[undefined, undefined, undefined, { fontWeight: 700 }]}
              cellStyles={[
                undefined,
                undefined,
                undefined,
                [undefined, { color: '#003641', fontWeight: 700 }, undefined, undefined],
              ]}
            />
          </PdfSection>

          <PdfSection style={compactSection}>
            <Kicker>Economia</Kicker>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt' }}>
              <div style={economyCard}>
                <div style={economyLabel}>{advantageLabel('Economia vs Price', priceSavings)}</div>
                <div style={economyValue}>{formatCurrency(priceSavings)}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                  ({priceSavingsPercent.toFixed(1)}%)
                </div>
              </div>
              <div style={economyCard}>
                <div style={economyLabel}>{advantageLabel('Economia vs SAC', sacSavings)}</div>
                <div style={economyValue}>{formatCurrency(sacSavings)}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                  ({sacSavingsPercent.toFixed(1)}%)
                </div>
              </div>
            </div>
          </PdfSection>

          {financing420Result && typeof price420Total === 'number' && typeof sac420Total === 'number' && (
            <PdfSection style={compactSection}>
              <Kicker>Comparativo com 420 Meses (35 Anos)</Kicker>
              <PdfDataTable
                columns={[
                  { header: 'Item' },
                  { header: `Consórcio (${termMonths}m)`, align: 'right' },
                  { header: 'Price (420m)', align: 'right' },
                  { header: 'SAC (420m)', align: 'right' },
                ]}
                rows={[
                  ['Parcela',
                    formatCurrency(consortiumResult.installmentAfterContemplation),
                    formatCurrency(financing420Result.priceMonthlyPayment),
                    formatCurrency(financing420Result.sacFirstPayment)],
                  ['Custo Total do Plano',
                    formatCurrency(consortiumTotal),
                    formatCurrency(price420Total),
                    formatCurrency(sac420Total)],
                ]}
                rowStyles={[undefined, { fontWeight: 700 }]}
                cellStyles={[
                  undefined,
                  [undefined, { color: '#003641', fontWeight: 700 }, undefined, undefined],
                ]}
              />
            </PdfSection>
          )}

          {financing420Result && typeof price420Total === 'number' && typeof sac420Total === 'number' && (
            <PdfSection style={compactSection}>
              <Kicker>Visualização Gráfica</Kicker>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <PdfBarChart
                  title="Custo Total Estimado"
                  width={520}
                  height={230}
                  items={[
                    { label: 'Consórcio', value: consortiumTotal, color: '#003641' },
                    { label: 'Price', value: priceTotal, color: '#F5821F' },
                    { label: 'SAC', value: sacTotal, color: '#66655F' },
                    { label: 'Price 420m', value: price420Total, color: '#005F7F' },
                    { label: 'SAC 420m', value: sac420Total, color: 'rgba(0,54,65,0.7)' },
                  ]}
                />
                <PdfBarChart
                  title="Parcela Mensal"
                  width={520}
                  height={230}
                  items={[
                    { label: 'Consórcio', value: consortiumResult.installmentAfterContemplation, color: '#003641' },
                    { label: 'Price', value: financingResult.priceMonthlyPayment, color: '#F5821F' },
                    { label: 'SAC 1ª', value: financingResult.sacFirstPayment, color: '#66655F' },
                    { label: 'Price 420m', value: financing420Result.priceMonthlyPayment, color: '#005F7F' },
                    { label: 'SAC 420m 1ª', value: financing420Result.sacFirstPayment, color: 'rgba(0,54,65,0.7)' },
                  ]}
                />
              </div>
            </PdfSection>
          )}
        </>
        );
      })()}


      {/* ─── Cash comparison ─── */}
      {comparisonType === 'cash' && cashComparison && (
        <>
          <PdfSection title="Parâmetros da Estratégia">
            <div style={s.card}>
              <PdfMetricGrid cols={4}>
                <PdfMetric label="Valor do Imóvel" value={formatCurrency(cashPropertyValue)} />
                <PdfMetric label="Carta de Crédito (2×)" value={formatCurrency(cashComparison.creditLetterValue)} tone="primary" />
                <PdfMetric label="Lance Embutido" value={`${cashEmbeddedBidPercent}% = ${formatCurrency(cashComparison.embeddedBidValue)}`} />
                <PdfMetric label="Lance Livre" value={`${cashFreeBidPercent}% = ${formatCurrency(cashComparison.freeBidValue)}`} />
              </PdfMetricGrid>
              <PdfMetricGrid cols={4} style={{ marginTop: '8pt' }}>
                <PdfMetric label="Capital Investido" value={formatCurrency(cashComparison.capitalToInvest)} tone="primary" />
                <PdfMetric label="Prazo" value={`${cashTermMonths} meses`} />
                <PdfMetric label="% do CDI" value={`${cashInvestmentRate}%`} />
                <PdfMetric label="CDI Anual" value={`${cashCdiRate}%`} />
              </PdfMetricGrid>
            </div>
          </PdfSection>

          <PdfSection title="Fluxo Mensal">
            <div style={s.card}>
              <PdfMetricGrid cols={3}>
                <PdfMetric label="Parcela Mensal" value={formatCurrency(cashComparison.monthlyInstallment)} />
                <PdfMetric label="Rendimento Mensal" value={`+${formatCurrency(cashComparison.monthlyYield)}`} tone="success" />
                <PdfMetric
                  label="Resultado Mensal"
                  value={`${cashComparison.monthlyResult >= 0 ? '+' : ''}${formatCurrency(cashComparison.monthlyResult)}`}
                  tone={cashComparison.monthlyResult >= 0 ? 'success' : 'warning'}
                />
              </PdfMetricGrid>
            </div>
          </PdfSection>

          <PdfSection title={`Patrimônio Final (${cashTermMonths} meses)`}>
            <PdfDataTable
              columns={[
                { header: 'Cenário' },
                { header: 'Patrimônio Final', align: 'right' },
              ]}
              rows={[
                ['Compra à Vista', formatCurrency(cashComparison.cashFinalPatrimony)],
                ['Consórcio + Investimento', formatCurrency(cashComparison.consortiumFinalPatrimony)],
                [
                  advantageLabel('Vantagem Patrimonial', cashComparison.patrimonyDifference),
                  `${cashComparison.patrimonyDifference >= 0 ? '+' : ''}${formatCurrency(cashComparison.patrimonyDifference)} (${cashComparison.patrimonyDifferencePercent.toFixed(1)}%)`,
                ],
              ]}
              rowStyles={[undefined, undefined, { fontWeight: 700 }]}
              cellStyles={[
                undefined,
                [undefined, { color: '#003641', fontWeight: 700 }],
                [undefined, { color: cashComparison.patrimonyDifference >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }],
              ]}
            />
          </PdfSection>

          <PdfSection>
            <div style={s.card}>
              <PdfMetricGrid cols={2}>
                <PdfMetric label="Investimento Bruto Acumulado" value={formatCurrency(cashComparison.accumulatedInvestmentGross)} />
                <PdfMetric label={`IR (${(cashComparison.irAliquota * 100).toFixed(1)}%)`} value={`-${formatCurrency(cashComparison.irValue)}`} tone="warning" />
              </PdfMetricGrid>
            </div>
          </PdfSection>
        </>
      )}

      {/* ─── Consortium vs Consortium ─── */}
      {comparisonType === 'consortium' && consortium2Result && (() => {
        const AVOID: React.CSSProperties = {
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        };
        const compactSection: React.CSSProperties = { marginBottom: '8pt' };
        const paramCard = (
          accent: string,
          title: string,
          rows: Array<[string, string]>,
        ): React.ReactElement => (
          <div
            style={{
              ...AVOID,
              flex: 1,
              border: `1px solid ${accent}`,
              borderTop: `3pt solid ${accent}`,
              borderRadius: '6pt',
              padding: '8pt 10pt',
              background: '#fff',
            }}
          >
            <div
              style={{
                fontSize: '10pt',
                fontWeight: 700,
                color: accent,
                textTransform: 'uppercase',
                letterSpacing: '0.5pt',
                marginBottom: '6pt',
              }}
            >
              {title}
            </div>
            {rows.map(([k, v], i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '9.5pt',
                  padding: '3pt 0',
                  borderBottom: i < rows.length - 1 ? '1px solid #F1F5F9' : 'none',
                }}
              >
                <span style={{ color: '#555' }}>{k}</span>
                <span style={{ color: '#111', fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        );
        const c1Rows: Array<[string, string]> = [
          ['Valor da Carta', formatCurrency(creditValue)],
          ['Prazo', `${termMonths} meses`],
          ['Taxa Adm.', `${adminFee.toFixed(2)}%`],
          ['Fundo Reserva', `${reserveFund.toFixed(2)}%`],
          ['Parcela Mensal', formatCurrency(consortiumResult.installmentAfterContemplation)],
          ['Custo Total do Plano', formatCurrency(consortium1Total as number)],
        ];
        const c2Rows: Array<[string, string]> = [
          ['Valor da Carta', formatCurrency(creditValue)],
          ['Prazo', `${termMonths} meses`],
          ['Taxa Adm.', `${adminFee2.toFixed(2)}%`],
          ['Fundo Reserva', `${reserveFund2.toFixed(2)}%`],
          ['Parcela Mensal', formatCurrency(consortium2Result.installmentAfterContemplation)],
          ['Custo Total do Plano', formatCurrency(consortium2Total as number)],
        ];
        return (
          <>
            <PdfSection title="Parâmetros lado a lado" style={compactSection}>
              <div style={{ ...AVOID, display: 'flex', gap: '10pt' }}>
                {paramCard('#003641', 'Consórcio 1', c1Rows)}
                {paramCard('#F5821F', 'Consórcio 2', c2Rows)}
              </div>
            </PdfSection>

            <PdfSection title="O que avaliar nesta comparação" style={compactSection}>
              <div
                style={{
                  ...AVOID,
                  background: '#FFF8EC',
                  border: '1px solid #F5821F',
                  borderLeft: '4pt solid #F5821F',
                  borderRadius: '6pt',
                  padding: '10pt 12pt',
                  fontSize: '10pt',
                  lineHeight: 1.55,
                  color: '#1A1A1A',
                }}
              >
                Dois consórcios com o mesmo valor de carta podem ter custos totais muito
                diferentes. Os principais fatores são a <strong>Taxa de Administração</strong> e o{' '}
                <strong>Fundo de Reserva</strong> — quanto menores, menor o custo efetivo do plano.
                Avalie também a parcela mensal e o prazo: um plano mais curto pode ter parcela
                maior, mas custo total menor.
              </div>
            </PdfSection>

            <PdfSection title="Comparativo visual" style={compactSection}>
              <div style={{ ...AVOID, display: 'flex', gap: '10pt' }}>
                <div style={{ ...AVOID, flex: 1 }}>
                  <PdfBarChart
                    title="Custo Total do Plano"
                    width={280}
                    height={170}
                    items={[
                      { label: 'Consórcio 1', value: consortium1Total as number, color: '#003641' },
                      { label: 'Consórcio 2', value: consortium2Total as number, color: '#F5821F' },
                    ]}
                  />
                </div>
                <div style={{ ...AVOID, flex: 1 }}>
                  <PdfBarChart
                    title="Parcela Mensal"
                    width={280}
                    height={170}
                    items={[
                      { label: 'Consórcio 1', value: consortiumResult.installmentAfterContemplation, color: '#003641' },
                      { label: 'Consórcio 2', value: consortium2Result.installmentAfterContemplation, color: '#F5821F' },
                    ]}
                  />
                </div>
              </div>
            </PdfSection>

            <div style={{ ...AVOID, ...s.card, marginTop: '8pt', padding: '8pt 10pt' }}>
              <div style={s.label}>Resultado</div>
              <div style={s.valuePrimary}>{consortiumWinnerLabel}</div>
            </div>
          </>
        );
      })()}
    </PdfLayout>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Componente principal
 * ───────────────────────────────────────────────────────────────── */

export function PdfAnaliseFinanceira(props: PdfAnaliseFinanceiraProps) {
  return renderComparador(props.data);
}

