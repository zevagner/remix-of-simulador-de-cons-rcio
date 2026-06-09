/**
 * PdfSimulador — template do Simulador de Consórcio.
 *
 * Estrutura visual alinhada ao padrão "Singular Premium CAIXA"
 * (mesmas topbar/footer do PdfConsorcioVsConsorcio / PdfCompraAVista):
 *  - Capa: PdfCover (logo, módulo, cliente, consultor, carta de crédito)
 *  - Página de conteúdo:
 *      • Topbar navy full-width (logo + "CAIXA Consórcio" + nome do módulo)
 *      • Seções (parâmetros, resultados, custos, composição, pós-contemplação)
 *      • Footer navy grudado na base (marginTop: auto) com paginação à direita
 *
 * Nenhum cálculo, valor ou conteúdo foi alterado nesta refatoração — somente
 * a estrutura visual passou a seguir o template aprovado.
 */
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { PdfSection, PdfMetricGrid, PdfMetric, PdfDataTable, PdfDisclaimer } from './primitives';
import { PdfCover } from '@/components/pdf/proposalPdf/PdfCover';
import { DISCLAIMERS } from '@/config/copy';
import { formatCurrency } from '@/utils/format';
import type { SimulationInput, SimulationResult, ConsortiumType } from '@/types/consortium';
import type { MonthlyScheduleResult } from '@/core/finance';
import { logger } from '@/utils/logger';

/**
 * Linha pronta de composição da parcela — montada na camada de módulo
 * a partir do `monthlySchedule`. O PDF apenas renderiza.
 */
export interface PdfSimuladorCompositionRow {
  name: string;
  monthlyLabel: string;
  totalLabel: string;
  percentLabel: string;
}

/**
 * Linha pronta do "Resumo" do cabeçalho — sem cálculo no PDF.
 */
export interface PdfSimuladorSummaryItem {
  label: string;
  value: string;
}

export interface PdfSimuladorData {
  input: SimulationInput;
  result: SimulationResult;
  /**
   * Schedule mensal atuarial — fonte ÚNICA da verdade financeira.
   * OBRIGATÓRIO. Sem fallback. Se ausente, o PDF renderiza erro explícito.
   */
  monthlySchedule: MonthlyScheduleResult;

  // ─── Valores prontos vindos do módulo (zero cálculo no PDF) ───
  initialInstallmentLabel: string;
  totalCostLabel: string;
  totalBidOfferedLabel: string;
  effectiveClientCostLabel: string;
  composition: PdfSimuladorCompositionRow[];
  summaryItems: PdfSimuladorSummaryItem[];

  // ─── Parâmetros estáticos (sem cálculo) ───
  effectiveAdminFeePercent: number;
  mipRate: number;
  insuranceEnabled: boolean;
  actualFreeBidValue: number;
  actualEmbeddedBidValue: number;
  contemplated: boolean;
  contemplationMonth: number;
  typeLabels: Record<ConsortiumType, string>;
  maxReducedMonths: number;
  managerName?: string;
  agencyName?: string;
  clientName?: string;
  managerRole?: string;
  managerPhone?: string;
  managerWhatsapp?: string;
  managerEmail?: string;
  logoDataUrl?: string;
}

// ── Paleta institucional ───────────────────────────────────────────
const NAVY = '#003641';
const ORANGE = '#F5821F';

const AVOID_BREAK: React.CSSProperties = {
  breakInside: 'avoid',
  pageBreakInside: 'avoid',
};

export function PdfSimulador({ data }: { data: PdfSimuladorData }) {
  const {
    input,
    result,
    monthlySchedule,
    initialInstallmentLabel,
    totalCostLabel,
    totalBidOfferedLabel,
    effectiveClientCostLabel,
    composition,
    effectiveAdminFeePercent,
    mipRate,
    insuranceEnabled,
    actualFreeBidValue,
    actualEmbeddedBidValue,
    contemplated,
    contemplationMonth,
    typeLabels,
    maxReducedMonths,
    managerName,
    agencyName,
    clientName,
    managerRole,
    managerEmail,
    logoDataUrl,
  } = data;

  // ⚠️ FONTE ÚNICA: monthlySchedule é OBRIGATÓRIO. Sem fallback legado.
  if (!monthlySchedule) {
    logger.error(
      '[PdfSimulador] ❌ monthlySchedule ausente. PDF não será renderizado. ' +
      'Verifique se SimulatorModule está repassando o schedule do contexto.'
    );
    return (
      <div style={{ padding: '20mm', fontSize: '10pt', color: '#b00020' }}>
        Não foi possível gerar o PDF: o cronograma mensal (fonte única de
        verdade financeira) está ausente. Refaça a simulação e tente novamente.
      </div>
    );
  }

  // 🔍 Validação: log para verificar paridade tela ↔ PDF.
  logger.debug('[PdfSimulador] PDF SIMULADOR DATA', {
    rows: monthlySchedule.rows.length,
    costWithInsurance: monthlySchedule.costWithInsurance,
    totalInsurance: monthlySchedule.totalInsurance,
    effectiveClientCost: monthlySchedule.effectiveClientCost,
    firstPayment: monthlySchedule.rows[0]?.payment,
  });

  const consultor = [managerName, managerRole].filter(Boolean).join(' — ');
  const consultorAgency = [consultor, agencyName].filter(Boolean).join(' — ');

  const Topbar = (
    <div
      style={{
        background: NAVY,
        padding: '10px 28px',
        margin: '0 -22mm',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...AVOID_BREAK,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {logoDataUrl && (
          <img
            src={logoDataUrl}
            alt=""
            style={{ height: '20px', width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        )}
        <span style={{ color: '#fff', fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em' }}>
          CAIXA Consórcio
        </span>
      </div>
      <div
        style={{
          color: '#fff',
          opacity: 0.5,
          fontSize: '10px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Simulador de Consórcio
      </div>
    </div>
  );

  const renderFooter = (pageLabel: string) => (
    <div style={{ marginTop: 'auto' }}>
      <div
        style={{
          background: NAVY,
          padding: '9px 28px',
          margin: '0 -22mm',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          ...AVOID_BREAK,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#fff', opacity: 0.85, fontSize: '11px', lineHeight: 1.4 }}>
            {consultorAgency}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {managerEmail && (
              <>
                <div style={{ color: ORANGE, fontSize: '11px', fontWeight: 600 }}>{managerEmail}</div>
                <div style={{ color: ORANGE, fontSize: '11px', fontWeight: 600 }}>·</div>
              </>
            )}
            <div style={{ color: ORANGE, fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {pageLabel}
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.85)',
            textAlign: 'center',
            marginTop: '6px',
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          {DISCLAIMERS.PDF_SIMULADOR} Simulação ilustrativa. Rentabilidade passada não garante
          rentabilidade futura. Estudo educativo em observância à Lei 11.795/2008.
        </div>
      </div>
    </div>
  );

  const pageStyle: React.CSSProperties = {
    paddingTop: '8mm',
    paddingRight: '22mm',
    paddingBottom: '0mm',
    paddingLeft: '22mm',
    fontSize: '9pt',
    lineHeight: 1.35,
    overflow: 'hidden',
    minHeight: '290mm',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    boxSizing: 'border-box',
  };

  // ─── Chart data (Evolução do Saldo do Plano) ───
  const scheduleRows = monthlySchedule.rows;
  const totalInsurance = monthlySchedule.totalInsurance || 0;
  const step = Math.max(1, Math.ceil(scheduleRows.length / 60));
  let cumInsurance = 0;
  const chartData: { mes: number; semSeguro: number; comSeguro: number }[] = [];
  for (let i = 0; i < scheduleRows.length; i++) {
    const r = scheduleRows[i];
    cumInsurance += r.insurance || 0;
    if (i % step === 0 || i === scheduleRows.length - 1) {
      chartData.push({
        mes: i + 1,
        semSeguro: Math.round(r.balanceEnd),
        comSeguro: Math.round(r.balanceEnd + (totalInsurance - cumInsurance)),
      });
    }
  }

  return (
    <div style={{ width: '210mm', margin: '0 auto', background: '#fff' }}>
      {/* Suprime o watermark global apenas neste PDF — paginação no footer navy. */}
      <style>{`.pdf-watermark, [data-pdf-watermark] { display: none !important; }`}</style>

      <PdfCover
        moduleName="Simulação de Consórcio"
        clientName={clientName}
        consultorName={managerName || undefined}
        creditValue={formatCurrency(input.creditValue)}
        logoDataUrl={logoDataUrl}
      />

      {/* ═══════ PÁGINA 2 — Dados da simulação ═══════ */}
      <div data-pdf-page style={pageStyle}>
        <div>
          {Topbar}
          <div style={{ marginTop: '12pt' }}>
            <PdfSection title="Parâmetros da Simulação">
              <PdfMetricGrid cols={4}>
                <PdfMetric label="Tipo" value={typeLabels[input.consortiumType]} />
                <PdfMetric label="Valor da Carta" value={formatCurrency(input.creditValue)} tone="primary" />
                <PdfMetric label="Prazo Total" value={`${input.termMonths} meses`} />
                <PdfMetric label="Taxa Adm. Efetiva" value={`${effectiveAdminFeePercent.toFixed(2).replace('.', ',')}%`} />
                <PdfMetric label="Fundo de Reserva" value={`${input.reserveFundPercent.toFixed(2).replace('.', ',')}%`} />
                <PdfMetric label="Seguro (MIP)" value={insuranceEnabled ? `${mipRate.toFixed(4).replace('.', ',')}%/mês (sobre saldo devedor)` : 'Desabilitado'} />
                <PdfMetric label="Lance Rec. Próprios" value={formatCurrency(actualFreeBidValue)} />
                <PdfMetric label="Lance Embutido" value={formatCurrency(actualEmbeddedBidValue)} />
              </PdfMetricGrid>
            </PdfSection>

            <PdfSection title="Resultados da Simulação">
              <PdfMetricGrid cols={4}>
                {input.reducedInstallment ? (
                  <>
                    <PdfMetric card label={`Parcela Reduzida (1ª a ${maxReducedMonths}ª)`} value={formatCurrency(result.reducedInstallmentValue)} tone="primary" />
                    <PdfMetric card label={`Parcela Rediluída (${maxReducedMonths + 1}ª a ${input.termMonths}ª)`} value={formatCurrency(result.redilutedInstallmentValue)} tone="primary" />
                  </>
                ) : (
                  <PdfMetric card label="Parcela Inicial (real)" value={initialInstallmentLabel} tone="primary" />
                )}
                <PdfMetric card label="Carta de Crédito" value={formatCurrency(input.creditValue)} />
                {actualEmbeddedBidValue > 0 && (
                  <PdfMetric card label="Carta Líquida" value={formatCurrency(result.netCreditValue)} />
                )}
                <PdfMetric card label="Custo Total do Plano" value={totalCostLabel} tone="primary" />
              </PdfMetricGrid>
            </PdfSection>

            <PdfSection title="Resumo de Custos">
              <PdfMetricGrid cols={3}>
                <PdfMetric card label="Custo Total do Plano" value={totalCostLabel} tone="primary" />
                <PdfMetric card label="Lance Ofertado" value={totalBidOfferedLabel} />
                <PdfMetric card label="Custo Efetivo do Cliente" value={effectiveClientCostLabel} tone="primary" />
              </PdfMetricGrid>
              <p style={{ fontSize: '8pt', color: '#666', marginTop: '4pt', fontStyle: 'italic' }}>
                Custo Total do Plano inclui taxa administrativa, fundo de reserva e seguro prestamista. O lance embutido NÃO é desembolso adicional — vem do próprio crédito. Apenas o lance com recursos próprios entra no Custo Efetivo do Cliente.
              </p>
            </PdfSection>

            <PdfSection title="Composição da Parcela">
              <PdfDataTable
                columns={[
                  { header: 'Componente' },
                  { header: 'Valor Mensal', align: 'right' },
                  { header: 'Total no Plano', align: 'right' },
                  { header: '% do Total', align: 'right' },
                ]}
                rows={composition.map((row) => [
                  row.name,
                  row.monthlyLabel,
                  row.totalLabel,
                  row.percentLabel,
                ])}
              />
            </PdfSection>

            {contemplated && (
              <PdfSection title="Cenário Pós-Contemplação">
                <PdfMetricGrid cols={4}>
                  <PdfMetric card label="Mês da Contemplação" value={`${contemplationMonth}º mês`} />
                  <PdfMetric card label="Saldo Devedor" value={formatCurrency(result.debtAfterContemplation)} tone="warning" />
                  <PdfMetric card label="Parcelas Restantes" value={result.remainingTermAfterContemplation} />
                  <PdfMetric card label="Nova Parcela" value={formatCurrency(result.installmentAfterContemplation)} tone="success" />
                </PdfMetricGrid>
              </PdfSection>
            )}
          </div>
        </div>
        {renderFooter('2 / 3')}
      </div>

      {/* ═══════ PÁGINA 3 — Evolução do Saldo do Plano ═══════ */}
      <div data-pdf-page style={pageStyle}>
        <div>
          {Topbar}
          <div style={{ marginTop: '12pt' }}>
            <PdfSection title="Evolução do Saldo do Plano">
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <LineChart style={{ background: "transparent" }} width={720} height={400} data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#666' }} label={{ value: 'Mês', position: 'insideBottom', offset: -2, fontSize: 9, fill: '#666' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#666' }} tickFormatter={(v) => `R$ ${Math.round(v / 1000)}k`} />
                  <Tooltip />
                  <Line type="monotone" dataKey="semSeguro" stroke={NAVY} strokeWidth={2} dot={false} isAnimationActive={false} name="Sem seguro" />
                  {insuranceEnabled && (
                    <Line type="monotone" dataKey="comSeguro" stroke={ORANGE} strokeWidth={2} dot={false} isAnimationActive={false} name="Com seguro" />
                  )}
                </LineChart>
              </div>
            </PdfSection>
          </div>
        </div>
        {renderFooter('3 / 3')}
      </div>
    </div>
  );
}

