/**
 * PdfOperacoesEstruturadas — template de Operações Estruturadas.
 *
 * Estrutura visual alinhada ao padrão "Singular Premium CAIXA"
 * (mesmas topbar/footer do PdfSimulador / PdfEstudoLances):
 *  - Capa: PdfCover
 *  - Páginas de conteúdo:
 *      • Topbar navy full-width (logo + "CAIXA Consórcio" + nome do módulo)
 *      • Seções
 *      • Footer navy grudado na base (marginTop: auto) com paginação à direita
 *
 * CONSUMIDOR PASSIVO — não calcula nada. Tudo vem pronto via props.
 */
import React from 'react';
import { PdfSection, PdfMetricGrid, PdfMetric, PdfDataTable, PdfBarChart } from './primitives';
import { PdfCover } from '@/components/pdf/proposalPdf/PdfCover';
import { PdfPieChart, type PdfPieItem } from './PdfPieChart';
import { DISCLAIMERS } from '@/config/copy';
import { formatCurrency } from '@/utils/format';
import { PRESTAMISTA_RATE_CURRENT } from '@/core/finance/prestamista';
import type { CreditCard, CardResult, ConsolidatedResult } from '@/components/modules/structured-ops/structuredOpsTypes';
import { typeLabels } from '@/components/modules/structured-ops/structuredOpsConstants';

export interface PdfOperacoesChartsData {
  lancesComposition: PdfPieItem[];
  custosComposition: PdfPieItem[];
  parcelasComparison: { name: string; value: number; color?: string }[];
}

export interface PdfOperacoesData {
  cards: CreditCard[];
  results: CardResult[];
  consolidated: ConsolidatedResult;
  effectiveRate: number;
  chartsData?: PdfOperacoesChartsData;
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

const CARD_COLORS = ['#003641', '#F5821F', '#005F7F', '#16a34a', '#7c3aed'];

export function PdfOperacoesEstruturadas({ data }: { data: PdfOperacoesData }) {
  const {
    cards,
    results,
    consolidated,
    effectiveRate,
    chartsData,
    managerName,
    agencyName,
    clientName,
    managerRole,
    managerEmail,
    logoDataUrl,
  } = data;

  // Campos derivados (sem cálculo de negócio — apenas subtração visual).
  const valorEmprestado = consolidated.totalCreditValue - consolidated.totalBid;
  const custoDasTaxas = consolidated.totalPaid - valorEmprestado;

  const totalPages = 3;

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
          opacity: 0.85,
          fontSize: '10px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Operações Estruturadas
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
          {DISCLAIMERS.PDF_OPERACOES_ESTRUTURADAS}
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

  const PremissaWarning = (
    <div style={{
      background: '#FEF3C7',
      border: '1px solid #F59E0B',
      borderLeft: '4px solid #D97706',
      borderRadius: '4pt',
      padding: '8pt 12pt',
      marginBottom: '12pt',
      fontSize: '8pt',
      color: '#78350F',
      ...AVOID_BREAK,
    }}>
      <strong>Premissa do cenário:</strong> Cenário hipotético considerando contemplação no primeiro mês para todas as cartas. Os resultados reais dependem da contemplação efetiva (sorteio ou lance) em cada grupo.
    </div>
  );

  return (
    <div style={{ width: '210mm', margin: '0 auto', background: '#fff' }}>
      {/* Suprime o watermark global apenas neste PDF — paginação no footer navy. */}
      <style>{`.pdf-watermark, [data-pdf-watermark] { display: none !important; }`}</style>

      {/* ═══════ CAPA ═══════ */}
      <PdfCover
        moduleName="Operações Estruturadas"
        clientName={clientName}
        consultorName={managerName || undefined}
        creditValue={formatCurrency(consolidated.totalCreditValue)}
        logoDataUrl={logoDataUrl}
      />

      {/* ═══════ PÁGINA 2 — Premissa + Cartas individuais + Comparativo ═══════ */}
      <div data-pdf-page style={pageStyle}>
        <div>
          {Topbar}
          <div style={{ marginTop: '12pt' }}>
            {PremissaWarning}

            {cards.map((card, index) => {
              const result = results[index];
              const color = CARD_COLORS[index % CARD_COLORS.length];
              return (
                <div key={card.id} style={AVOID_BREAK}>
                  <PdfSection
                    title={`Carta ${index + 1} — ${typeLabels[card.consortiumType]}`}
                    titleColor={color}
                    borderLeftColor={color}
                  >
                    <PdfMetricGrid cols={4}>
                      <PdfMetric label="Tipo" value={typeLabels[card.consortiumType]} />
                      <PdfMetric label="Cotas" value={card.quantity} />
                      <PdfMetric label="Valor da Carta" value={formatCurrency(card.creditValue)} tone="primary" />
                      <PdfMetric label="Prazo" value={`${card.termMonths} meses`} />
                      <PdfMetric label="Taxa Adm." value={`${card.adminFeePercent.toFixed(2).replace('.', ',')}%`} />
                      <PdfMetric label="Fundo Reserva" value={`${card.reserveFundPercent.toFixed(2).replace('.', ',')}%`} />
                      <PdfMetric
                        label="Seguro Prestamista"
                        value={
                          (card.personType ?? 'PF') === 'PJ'
                            ? 'N/A (PJ)'
                            : card.insuranceEnabled
                              ? `${(PRESTAMISTA_RATE_CURRENT * 100).toFixed(4).replace('.', ',')}%/mês`
                              : 'Desab.'
                        }
                      />
                      <PdfMetric label="Lance Livre (desembolso)" value={formatCurrency(result.freeBidValue)} />
                      <PdfMetric label={`Lance Embutido (${card.embeddedBidPercent.toFixed(0)}%)`} value={formatCurrency(result.embeddedBidValue)} />
                      <PdfMetric label="Parcela Inicial" value={formatCurrency(result.initialInstallment)} tone="primary" />
                      <PdfMetric label="Parcela Pós Contemp." value={formatCurrency(result.installmentAfterContemplation)} tone="success" />
                      <PdfMetric label="Crédito Disponível" value={formatCurrency(result.availableCredit)} />
                    </PdfMetricGrid>
                  </PdfSection>
                </div>
              );
            })}

            <PdfSection title="Comparativo por Carta">
              <PdfDataTable
                columns={[
                  { header: 'Carta' },
                  { header: 'Crédito', align: 'right' },
                  { header: 'Cotas', align: 'right' },
                  { header: 'Parcela Inicial', align: 'right' },
                  { header: 'Pós Contemp.', align: 'right' },
                  { header: 'Lance Total', align: 'right' },
                  { header: 'Crédito Disp.', align: 'right' },
                ]}
                rows={results.map((r) => [
                  typeLabels[r.consortiumType],
                  formatCurrency(r.creditValue),
                  r.quantity,
                  formatCurrency(r.totalInitialInstallment),
                  formatCurrency(r.totalInstallmentAfterContemplation),
                  formatCurrency(r.totalBid),
                  formatCurrency(r.availableCredit),
                ])}
              />
            </PdfSection>
          </div>
        </div>
        {renderFooter(`2 / ${totalPages}`)}
      </div>

      {/* ═══════ PÁGINA 3 — Resultado Consolidado + Análise Visual ═══════ */}
      <div data-pdf-page style={pageStyle}>
        <div>
          {Topbar}
          <div style={{ marginTop: '12pt' }}>
            <PdfSection title="Resultado Consolidado">
              <PdfMetricGrid cols={4}>
                <PdfMetric card label="Total das Cartas" value={formatCurrency(consolidated.totalCreditValue)} tone="primary" />
                <PdfMetric card label="Total de Cotas" value={consolidated.totalQuantity} />
                <PdfMetric card label="Parcela Inicial Total" value={formatCurrency(consolidated.totalInitialInstallment)} tone="primary" />
                <PdfMetric card label="Parcela Pós Contemp." value={formatCurrency(consolidated.totalInstallmentAfterContemplation)} tone="success" />
                <PdfMetric card label="Lance Total" value={formatCurrency(consolidated.totalBid)} />
                <PdfMetric card label="Valor Emprestado" value={formatCurrency(valorEmprestado)} />
                <PdfMetric card label="Custo das Taxas" value={formatCurrency(custoDasTaxas)} />
                <PdfMetric card label="Crédito Disponível" value={formatCurrency(consolidated.availableCredit)} />
                <PdfMetric card label="Total a Pagar" value={formatCurrency(consolidated.totalPaid)} tone="primary" />
                <PdfMetric card label="Taxa Efetiva" value={`${effectiveRate.toFixed(2).replace('.', ',')}%`} />
              </PdfMetricGrid>
            </PdfSection>

            {chartsData && (
              <PdfSection title="Análise Visual">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12pt', marginBottom: '12pt' }}>
                  <PdfPieChart title="Composição dos Lances" items={chartsData.lancesComposition} />
                  <PdfPieChart title="Composição dos Custos" items={chartsData.custosComposition} />
                </div>
                <PdfBarChart
                  title="Comparação de Parcelas"
                  items={chartsData.parcelasComparison.map((p) => ({ label: p.name, value: p.value, color: p.color }))}
                />
              </PdfSection>
            )}
          </div>
        </div>
        {renderFooter(`3 / ${totalPages}`)}
      </div>
    </div>
  );
}
