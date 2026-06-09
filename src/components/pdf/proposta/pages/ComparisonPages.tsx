import React from 'react';
import { formatCurrency } from '@/utils/format';
import { PdfBarChart } from '../../primitives';
import { comparisonIntro } from '@/utils/proposalPdf/narrative';
import { THEME, PAGE } from '../theme';
import {
  Header, Footer, PageBody, SectionTitle, MetricCard, MetricGrid,
  PdfTable, MissingDataNote,
} from '../primitives';
import type { PdfPropostaCompletaData } from '../types';

export function ComparisonFinancingPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const c = data.comparisons ?? {};
  const consortiumCost = data.simulation.effectiveClientCost;
  const financingCost = c.financingTotal ?? 0;
  const economy = Math.max(financingCost - consortiumCost, 0);
  const hasNumbers = consortiumCost > 0 && financingCost > 0;

  return (
    <div style={PAGE}>
      <Header data={data} />
      <PageBody>
        <div>
          <SectionTitle kicker="Comparação" title="É melhor que financiar?" />
          <p style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.65, margin: '14pt 0 18pt' }}>
            {comparisonIntro()}
          </p>

          {hasNumbers ? (
            <>
              <PdfBarChart
                title="Custo total — Consórcio × Financiamento"
                width={620}
                height={240}
                items={[
                  { label: 'Consórcio', value: consortiumCost, color: THEME.success },
                  { label: 'Financiamento', value: financingCost, color: '#dc2626' },
                ]}
              />
              {economy > 0 && (
                <div style={{
                  marginTop: '10pt', display: 'inline-block',
                  background: '#FEE2E2', color: '#991B1B',
                  border: '1px solid #dc2626', borderRadius: '4pt',
                  padding: '6pt 12pt', fontSize: '11pt', fontWeight: 700,
                }}>
                  ⚠ {formatCurrency(economy)} a mais no financiamento
                </div>
              )}
            </>
          ) : (
            <MissingDataNote />
          )}
        </div>

        {hasNumbers && (
          <div>
            <MetricGrid cols={3}>
              <MetricCard label="Consórcio" value={formatCurrency(consortiumCost)} tone="success" />
              <MetricCard label="Financiamento" value={formatCurrency(financingCost)} />
              <MetricCard label="Economia" value={formatCurrency(economy)} tone="success" />
            </MetricGrid>

            <div style={{ marginTop: '14pt' }}>
              <h3 style={{ fontSize: '12pt', fontWeight: 700, color: THEME.primary, margin: '0 0 8pt' }}>
                Comparativo detalhado
              </h3>
              <PdfTable
                headers={['Indicador', 'Consórcio', 'Financiamento', 'Diferença']}
                align={['left', 'right', 'right', 'right']}
                rows={[
                  [
                    'Parcela mensal',
                    formatCurrency(data.simulation.installment),
                    c.financingMonthly ? formatCurrency(c.financingMonthly) : '—',
                    c.financingMonthly ? formatCurrency(Math.max(c.financingMonthly - data.simulation.installment, 0)) : '—',
                  ],
                  [
                    'Custo total',
                    formatCurrency(consortiumCost),
                    formatCurrency(financingCost),
                    formatCurrency(economy),
                  ],
                  [
                    'Prazo',
                    `${data.simulation.termMonths} meses`,
                    `${data.simulation.termMonths} meses`,
                    '—',
                  ],
                  [
                    'Taxa de juros',
                    'Sem juros (taxa adm + FR)',
                    c.financingRate ? `${c.financingRate.toFixed(1)}% a.a.` : '—',
                    '—',
                  ],
                  [
                    'Multiplicador (custo / crédito)',
                    `${(consortiumCost / data.simulation.creditValue).toFixed(2)}x`,
                    `${(financingCost / data.simulation.creditValue).toFixed(2)}x`,
                    '—',
                  ],
                ]}
              />
            </div>

            {c.financingRate && (
              <p style={{ fontSize: '9pt', color: THEME.muted, fontStyle: 'italic', marginTop: '12pt' }}>
                Premissa: financiamento Tabela Price a {c.financingRate.toFixed(1)}% a.a. + MIP/DFI/tarifa, em {data.simulation.termMonths} meses (BUSINESS_RULES).
              </p>
            )}
          </div>
        )}
      </PageBody>
      <Footer data={data} totalPages={totalPages} />
    </div>
  );
}

/**
 * Página — CONSÓRCIO × À VISTA.
 * Renderiza apenas se bloco 'cmp-cash' marcado E houver texto de impacto patrimonial.
 */
export function CashComparisonPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const text = data.comparisons?.cashImpact ?? '';
  return (
    <div style={PAGE}>
      <Header data={data} />
      <PageBody>
        <div>
          <SectionTitle kicker="Comparação" title="E se eu pagar à vista?" />
          <p style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.65, margin: '14pt 0 12pt' }}>
            Pagar tudo de uma vez parece mais simples — mas significa abrir mão da liquidez que
            sustenta sua tranquilidade e novas oportunidades.
          </p>
          {text ? (
            <div style={{
              background: THEME.highlight,
              border: `1px solid ${THEME.accent}`,
              borderLeft: `4pt solid ${THEME.accent}`,
              borderRadius: '8pt',
              padding: '14pt 16pt',
              fontSize: '10.5pt',
              color: THEME.ink,
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
            }}>
              {text}
            </div>
          ) : (
            <MissingDataNote />
          )}
          <p style={{ fontSize: '10pt', color: THEME.muted, fontStyle: 'italic', marginTop: '12pt', lineHeight: 1.5 }}>
            Manter capital disponível dá poder de decisão. Consórcio preserva sua reserva
            enquanto constrói o patrimônio em paralelo.
          </p>
        </div>
      </PageBody>
      <Footer data={data} totalPages={totalPages} />
    </div>
  );
}
