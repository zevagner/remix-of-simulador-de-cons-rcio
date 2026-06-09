import React from 'react';
import { formatCurrency } from '@/utils/format';
import { THEME, PAGE } from '../theme';
import {
  Header, Footer, PageBody, SectionTitle, MetricCard, MetricGrid,
  PdfTable, MissingDataNote,
} from '../primitives';
import type { PdfPropostaCompletaData } from '../types';

/**
 * Página OPERAÇÃO ESTRUTURADA — bloco `structured-ops`.
 *
 * Sintetiza a operação multi-cartas em UMA página executiva.
 * Não vira planilha gigante — racional + KPIs consolidados + tabela enxuta.
 */
export function StructuredOpsPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const so = data.structuredOps;

  return (
    <div style={PAGE}>
      <Header data={data} />
      <PageBody>
        <div>
          <SectionTitle kicker="Operação estruturada" title="Estratégia multi-cartas consolidada" />

          {!so ? (
            <MissingDataNote>
              A operação estruturada (multi-cartas) ainda não foi montada nesta sessão.
              Abra o módulo "Operações Estruturadas" para configurar as cotas e o resumo
              consolidado entrará automaticamente aqui.
            </MissingDataNote>
          ) : (
            <>
              <p style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.6, margin: '8pt 0 14pt' }}>
                Operação composta por <b>{so.cardsCount} carta(s)</b> totalizando <b>{so.totalQuantity}</b> cota(s).
                A combinação distribui exposição, aumenta capacidade de aquisição e organiza um fluxo
                operacional único — preservando o racional patrimonial de cada componente.
              </p>

              <MetricGrid cols={3}>
                <MetricCard label="Crédito total" value={formatCurrency(so.totalCreditValue)} tone="primary" />
                <MetricCard label="Parcela consolidada" value={`${formatCurrency(so.totalInstallmentAfterContemplation)}/mês`} />
                <MetricCard label="Lance total" value={formatCurrency(so.totalBid)} />
              </MetricGrid>

              <div style={{ marginTop: '12pt' }}>
                <MetricGrid cols={3}>
                  <MetricCard label="Total a pagar" value={formatCurrency(so.totalPaid)} />
                  <MetricCard label="Parcela inicial" value={`${formatCurrency(so.totalInitialInstallment)}/mês`} />
                  <MetricCard label="Custo efetivo" value={`${so.effectiveRatePercent.toFixed(1)}%`} />
                </MetricGrid>
              </div>

              {so.cards.length > 0 && (
                <div style={{ marginTop: '16pt' }}>
                  <div style={{ fontSize: '8.5pt', fontWeight: 700, color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6pt' }}>
                    Composição
                  </div>
                  <PdfTable
                    headers={['Tipo', 'Qtd', 'Crédito unitário', 'Crédito total', 'Parcela pós-contemplação']}
                    align={['left', 'center', 'right', 'right', 'right']}
                    rows={so.cards.slice(0, 10).map((c) => [
                      c.consortiumType,
                      String(c.quantity),
                      formatCurrency(c.creditValue),
                      formatCurrency(c.totalCreditValue),
                      `${formatCurrency(c.installmentAfterContemplation)}/mês`,
                    ])}
                  />
                </div>
              )}

              <p style={{ fontSize: '9pt', color: THEME.muted, lineHeight: 1.4, margin: '18pt 0 0', fontStyle: 'italic' }}>
                Operação consultiva. Cada carta segue regras canônicas de modalidade, taxa adm. e fundo
                reserva — sem otimizações ocultas. O ganho está na composição e no calendário operacional.
              </p>
            </>
          )}
        </div>
      </PageBody>
      <Footer data={data} totalPages={totalPages} />
    </div>
  );
}
