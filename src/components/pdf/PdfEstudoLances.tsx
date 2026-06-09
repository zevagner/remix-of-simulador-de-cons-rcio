/**
 * PdfEstudoLances — template do Estudo de Lances.
 *
 * Estrutura visual alinhada ao padrão "Singular Premium CAIXA"
 * (mesmas topbar/footer do PdfSimulador / PdfConsorcioVsConsorcio):
 *  - Capa: PdfCover (logo, eyebrow "ESTUDO PERSONALIZADO", módulo, cliente, consultor)
 *  - Páginas de conteúdo:
 *      • Topbar navy full-width (logo + "CAIXA Consórcio" + nome do módulo)
 *      • Seções (informações do grupo, gráfico, histórico, zonas, lance do cliente,
 *        projeção 12 meses) — divididas em páginas com pageBreak natural
 *      • Footer navy grudado na base (marginTop: auto) com paginação à direita
 *
 * CONSUMIDOR PASSIVO — não calcula nada. Tudo vem pronto via props.
 */
import React from 'react';
import { PdfSection, PdfMetricGrid, PdfMetric, PdfDataTable } from './primitives';
import { PdfCover } from '@/components/pdf/proposalPdf/PdfCover';
import { PdfComposedBidsChart } from './PdfComposedBidsChart';
import { DISCLAIMERS } from '@/config/copy';
import { formatBidPercent } from '@/utils/bidAnalysis';
import type { BidAnalysisResult } from '@/utils/bidAnalysis';
import type { BidProjectionPdfData, BidStudyData } from '@/components/modules/bids/BidsContext';
import type { ConsortiumType } from '@/types/consortium';
import { CONSORTIUM_TYPE_LABELS } from '@/types/consortium';
import { formatCreditRange } from '@/utils/formatCreditRange';

export interface PdfEstudoLancesData {
  clientBid: number;
  studyData: BidStudyData;
  bidAnalysis: BidAnalysisResult;
  projection: BidProjectionPdfData | null;
  /** Probabilidade Monte Carlo (0-100) do lance do cliente — opcional. */
  monteCarloProbability?: number | null;
}

interface PdfEstudoLancesMeta {
  selectedType: ConsortiumType;
  selectedGroupNumber: string;
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

export function PdfEstudoLances({ data, meta }: { data: PdfEstudoLancesData; meta: PdfEstudoLancesMeta }) {
  const { studyData, bidAnalysis, clientBid, projection, monteCarloProbability } = data;
  const {
    selectedType,
    selectedGroupNumber,
    managerName,
    agencyName,
    clientName,
    managerRole,
    managerEmail,
    logoDataUrl,
  } = meta;
  const typeLabels = CONSORTIUM_TYPE_LABELS;
  const { zones } = bidAnalysis;

  const hasClientBid = clientBid > 0 && !!projection;

  // Total de páginas: capa + página de grupo + página de zonas + (opcional) página do cliente
  const totalPages = hasClientBid ? 4 : 3;

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
        Estudo de Lances{selectedGroupNumber ? ` · Grupo ${selectedGroupNumber} — ${typeLabels[selectedType]}` : ''}
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
          {DISCLAIMERS.PDF_ESTUDO_LANCES(bidAnalysis.months.length)}
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

  const monteCarloLabel =
    typeof monteCarloProbability === 'number' && isFinite(monteCarloProbability)
      ? `${monteCarloProbability.toFixed(1).replace('.', ',')}%`
      : null;

  return (
    <div style={{ width: '210mm', margin: '0 auto', background: '#fff' }}>
      {/* Suprime o watermark global apenas neste PDF — paginação no footer navy. */}
      <style>{`.pdf-watermark, [data-pdf-watermark] { display: none !important; }`}</style>

      {/* ═══════ CAPA ═══════ */}
      <PdfCover
        moduleName="Estudo de Lances"
        clientName={clientName}
        consultorName={managerName || undefined}
        creditValue={formatCreditRange(studyData.creditRange)}
        tagline={selectedGroupNumber ? `Grupo ${selectedGroupNumber} — ${typeLabels[selectedType]}` : undefined}
        logoDataUrl={logoDataUrl}
      />

      {/* ═══════ PÁGINA 2 — Informações do Grupo + Gráfico + Histórico ═══════ */}
      <div data-pdf-page style={pageStyle}>
        <div>
          {Topbar}
          <div style={{ marginTop: '12pt' }}>
            <PdfSection title="Informações do Grupo">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt' }}>
                <div style={{
                  padding: '8pt 10pt',
                  borderRadius: '6pt',
                  border: '1px solid',
                  background: studyData.hasEmbeddedBid ? '#ECFDF5' : '#F4F7F9',
                  borderColor: studyData.hasEmbeddedBid ? '#A7F3D0' : '#E0E4E8',
                }}>
                  <div style={{ fontSize: '8pt', color: '#666' }}>Lance Embutido</div>
                  {studyData.hasEmbeddedBid ? (
                    <>
                      <div style={{ fontSize: '11pt', fontWeight: 700, color: '#16a34a' }}>
                        Permitido até {studyData.embeddedBidMaxPercent}%
                      </div>
                      <div style={{ fontSize: '7pt', color: '#666', marginTop: '3pt' }}>
                        O grupo aceita lance embutido (reduz a carta de crédito).
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '11pt', fontWeight: 700, color: '#666' }}>Não permitido</div>
                      <div style={{ fontSize: '7pt', color: '#a83232', marginTop: '3pt' }}>
                        Lance deverá ser ofertado integralmente com recursos próprios.
                      </div>
                    </>
                  )}
                </div>
                <div style={{
                  padding: '8pt 10pt',
                  borderRadius: '6pt',
                  border: '1px solid #BFDBFE',
                  background: '#EFF6FF',
                }}>
                  <div style={{ fontSize: '8pt', color: '#666' }}>Faixa de Crédito</div>
                  <div style={{ fontSize: '12pt', fontWeight: 700, color: NAVY }}>
                    {formatCreditRange(studyData.creditRange)}
                  </div>
                </div>
              </div>
              <PdfMetricGrid cols={3} style={{ marginTop: '8pt' }}>
                <PdfMetric card label="Média Contemplações/mês" value={studyData.avgContemplationsTotalDisplay} />
                <PdfMetric card label="Média por Sorteio" value={studyData.avgContemplationsBySorteioDisplay} />
                <PdfMetric card label="Média por Lance" value={studyData.avgContemplationsByLanceDisplay} />
              </PdfMetricGrid>
            </PdfSection>

            <PdfSection title="Visualização Gráfica — Histórico de Lances e Contemplações">
              <PdfComposedBidsChart data={studyData.chartData} height={260} />
            </PdfSection>

            <PdfSection title={`Histórico dos Últimos ${studyData.months.length} Meses`}>
              <PdfDataTable
                columns={studyData.historyTablePdf.columns}
                rows={studyData.historyTablePdf.rows}
              />
            </PdfSection>
          </div>
        </div>
        {renderFooter(`2 / ${totalPages}`)}
      </div>

      {/* ═══════ PÁGINA 3 — Como o grupo costuma contemplar ═══════ */}
      <div data-pdf-page style={pageStyle}>
        <div>
          {Topbar}
          <div style={{ marginTop: '12pt' }}>
            <PdfSection title="Como o grupo costuma contemplar">
              <div style={{ fontSize: '8pt', color: '#666', marginBottom: '8pt' }}>
                Faixas de lance ordenadas por chance histórica de contemplação,
                com base nas últimas {bidAnalysis.months.length} assembleias do grupo.
              </div>
              <PdfMetricGrid cols={3}>
                {[
                  {
                    key: 'agressiva' as const,
                    label: 'Baixa chance',
                    subtitle: 'Lance no patamar mais baixo — menor esforço, menor probabilidade',
                    color: '#dc2626',
                  },
                  {
                    key: 'equilibrada' as const,
                    label: 'Chance moderada',
                    subtitle: 'Lance intermediário — equilíbrio entre esforço e chance',
                    color: '#d97706',
                  },
                  {
                    key: 'conservadora' as const,
                    label: 'Alta chance',
                    subtitle: 'Lance no patamar mais alto — máxima probabilidade histórica',
                    color: '#16a34a',
                  },
                ].map(({ key, label, subtitle, color }) => (
                  <div
                    key={key}
                    style={{
                      padding: '8pt 10pt',
                      borderRadius: '6pt',
                      border: '1px solid #E0E4E8',
                      background: '#fff',
                      borderLeft: `4px solid ${color}`,
                    }}
                  >
                    <div style={{ fontSize: '9pt', fontWeight: 700, color }}>{label}</div>
                    <div style={{ fontSize: '7pt', color: '#666', marginTop: '2pt', marginBottom: '6pt' }}>{subtitle}</div>
                    <div style={{ fontSize: '8pt', color: '#666' }}>Faixa de lance</div>
                    <div style={{ fontSize: '14pt', fontWeight: 700, color }}>
                      a partir de {formatBidPercent(zones[key].minBid)}
                    </div>
                    <div style={{ fontSize: '8pt', color: '#444', marginTop: '6pt' }}>
                      Contemplou em <strong style={{ color }}>{zones[key].confidence}</strong> das assembleias
                    </div>
                  </div>
                ))}
              </PdfMetricGrid>

              <div
                style={{
                  marginTop: '10pt',
                  padding: '10pt 12pt',
                  borderRadius: '6pt',
                  border: '1px solid #E0E4E8',
                  background: '#fff',
                  borderLeft: `4px solid ${NAVY}`,
                }}
              >
                <div style={{ fontSize: '8pt', color: '#666' }}>Lance recomendado pelo sistema</div>
                <div style={{ fontSize: '13pt', fontWeight: 700, color: NAVY, marginTop: '2pt' }}>
                  ~{formatBidPercent(bidAnalysis.recommendation.alternativeBid)}
                </div>
                <div style={{ fontSize: '8pt', color: '#444', marginTop: '4pt' }}>
                  Faixa ideal: entre {formatBidPercent(bidAnalysis.recommendation.aggressiveBid)} e {formatBidPercent(bidAnalysis.recommendation.primaryBid)}.
                </div>
              </div>
            </PdfSection>
          </div>
        </div>
        {renderFooter(`3 / ${totalPages}`)}
      </div>

      {/* ═══════ PÁGINA 4 (condicional) — Seu lance + Projeção 12m ═══════ */}
      {hasClientBid && projection && (
        <div data-pdf-page style={pageStyle}>
          <div>
            {Topbar}
            <div style={{ marginTop: '12pt' }}>
              <PdfSection title="Seu lance">
                <PdfMetricGrid cols={3}>
                  <PdfMetric
                    card
                    label="Valor do lance"
                    value={`${clientBid.toFixed(2).replace('.', ',')}%`}
                    valueColor={projection.currentStatusColor}
                  />
                  <PdfMetric
                    card
                    label="Posição vs. média"
                    value={projection.currentGapDisplay}
                    valueColor={projection.currentStatusColor}
                  />
                  <PdfMetric
                    card
                    label="Recomendação do sistema"
                    value={`~${formatBidPercent(bidAnalysis.recommendation.alternativeBid)}`}
                    tone="primary"
                  />
                </PdfMetricGrid>

                <div
                  style={{
                    marginTop: '8pt',
                    padding: '10pt 12pt',
                    borderRadius: '6pt',
                    border: '1px solid #E0E4E8',
                    background: '#fff',
                    borderLeft: `4px solid ${projection.currentStatusColor}`,
                  }}
                >
                  <div style={{ fontSize: '8pt', color: '#666' }}>Posição do lance do cliente</div>
                  <div style={{ fontSize: '11pt', fontWeight: 700, color: projection.currentStatusColor, marginTop: '2pt' }}>
                    {projection.currentStatusLabel}
                  </div>
                  <div style={{ fontSize: '8pt', color: '#555', marginTop: '4pt' }}>{projection.currentStatusDescription}</div>
                </div>

                {monteCarloLabel && (
                  <div
                    style={{
                      marginTop: '8pt',
                      padding: '10pt 12pt',
                      borderRadius: '6pt',
                      border: '1px solid #BFDBFE',
                      background: '#EFF6FF',
                      borderLeft: `4px solid ${NAVY}`,
                    }}
                  >
                    <div style={{ fontSize: '8pt', color: '#666' }}>Probabilidade estimada de contemplação</div>
                    <div style={{ fontSize: '16pt', fontWeight: 700, color: NAVY, marginTop: '2pt' }}>
                      {monteCarloLabel}
                    </div>
                    <div style={{ fontSize: '7pt', color: '#666', marginTop: '4pt', fontStyle: 'italic' }}>
                      Simulação Monte Carlo com 10.000 iterações sobre o histórico do grupo. Estimativa
                      estatística — não constitui promessa de contemplação.
                    </div>
                  </div>
                )}
              </PdfSection>

              <PdfSection title="Quando seu lance pode contemplar">
                <div style={{ fontSize: '8pt', color: '#666', marginBottom: '6pt' }}>
                  Projeção dos próximos 12 meses comparando o lance informado com
                  o lance estimado para contemplação. Mês <strong>★ competitivo</strong>: lance alcança o necessário.
                  Mês <strong>★★ forte</strong>: supera o necessário com margem.
                </div>
                <PdfDataTable
                  columns={[
                    { header: 'Mês' },
                    { header: 'Seu lance', align: 'right' },
                    { header: 'Necessário', align: 'right' },
                    { header: 'Vantagem', align: 'right' },
                    { header: 'Status', align: 'right' },
                  ]}
                  rows={projection.tableRows}
                  rowStyles={projection.tableRowStyles}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt', marginTop: '8pt' }}>
                  <div style={{
                    padding: '8pt 10pt',
                    borderRadius: '6pt',
                    border: '1px solid #FCD34D',
                    background: '#FEF3C7',
                  }}>
                    <div style={{ fontSize: '8pt', color: '#666' }}>★ Mês competitivo</div>
                    <div style={{ fontSize: '12pt', fontWeight: 700, color: '#b45309' }}>
                      {projection.milestoneCompetitivoDisplay}
                    </div>
                    <div style={{ fontSize: '7pt', color: '#666', marginTop: '2pt' }}>
                      Seu lance alcança o necessário do grupo.
                    </div>
                  </div>
                  <div style={{
                    padding: '8pt 10pt',
                    borderRadius: '6pt',
                    border: '1px solid #A7F3D0',
                    background: '#ECFDF5',
                  }}>
                    <div style={{ fontSize: '8pt', color: '#666' }}>★★ Mês forte</div>
                    <div style={{ fontSize: '12pt', fontWeight: 700, color: '#15803d' }}>
                      {projection.milestoneForteDisplay}
                    </div>
                    <div style={{ fontSize: '7pt', color: '#666', marginTop: '2pt' }}>
                      Seu lance supera o necessário com margem.
                    </div>
                  </div>
                </div>
              </PdfSection>
            </div>
          </div>
          {renderFooter(`4 / ${totalPages}`)}
        </div>
      )}
    </div>
  );
}
