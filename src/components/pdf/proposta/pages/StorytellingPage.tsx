import React from 'react';
import { formatCurrency } from '@/utils/format';
import { CONSORTIUM_TYPE_LABELS } from '@/types/consortium';
import { THEME, PAGE_COMPACT } from '../theme';
import { Header, FooterCompact, PageBodyCompact, SectionTitle } from '../primitives';
import type { PdfPropostaCompletaData } from '../types';

/**
 * Página VISÃO — bloco `storytelling`.
 *
 * Redesign premium (alinhada ao padrão "Vale a pena?" / OpeningImpactPage):
 *  1. Kicker "Visão" + título "E daqui a algum tempo?"
 *  2. Card escuro com 3 métricas-chave (Carta de crédito · Parcela mensal · Prazo)
 *  3. Parágrafo consultivo determinístico construído a partir dos dados disponíveis
 *  4. Footer institucional (consultor + disclaimer)
 *
 * Sem cálculo aqui — apenas leitura de `data.simulation` + `data.clientName`.
 */
export function StorytellingPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const { simulation, clientName } = data;
  const typeLabel = CONSORTIUM_TYPE_LABELS[simulation.consortiumType] ?? 'consórcio';
  const installment =
    simulation.installment ||
    simulation.fullInstallment ||
    simulation.installmentBeforeContemplation ||
    0;

  const firstName = (clientName?.trim() || 'você').split(/\s+/)[0];

  // Texto consultivo determinístico — usa apenas dados já disponíveis.
  const narrative =
    `Em ${simulation.termMonths} meses, ${firstName} terá acessado ` +
    `${formatCurrency(simulation.creditValue)} em ${typeLabel.toLowerCase()}, ` +
    `pagando ${formatCurrency(installment)}/mês — sem juros bancários, ` +
    `com custo total previsível de ${formatCurrency(simulation.totalCost)}.`;

  return (
    <div style={PAGE_COMPACT}>
      <Header data={data} />
      <PageBodyCompact>
        <div>
          <SectionTitle kicker="Visão" title="E daqui a algum tempo?" />
        </div>

        {/* Card escuro — mesmo padrão visual de "Vale a pena?" (OpeningImpactPage) */}
        <div
          style={{
            background: THEME.ink,
            color: '#fff',
            borderRadius: '12pt',
            padding: '22pt 24pt',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20pt',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '9pt',
                color: '#FDBA74',
                textTransform: 'uppercase',
                letterSpacing: '1.2pt',
                fontWeight: 700,
                marginBottom: '6pt',
              }}
            >
              Carta de crédito
            </div>
            <div style={{ fontSize: '22pt', fontWeight: 700, color: THEME.accent, lineHeight: 1.05 }}>
              {formatCurrency(simulation.creditValue)}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '9pt',
                color: '#93C5FD',
                textTransform: 'uppercase',
                letterSpacing: '1.2pt',
                fontWeight: 700,
                marginBottom: '6pt',
              }}
            >
              Parcela mensal
            </div>
            <div style={{ fontSize: '22pt', fontWeight: 700, color: '#fff', lineHeight: 1.05 }}>
              {formatCurrency(installment)}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '9pt',
                color: '#86EFAC',
                textTransform: 'uppercase',
                letterSpacing: '1.2pt',
                fontWeight: 700,
                marginBottom: '6pt',
              }}
            >
              Prazo
            </div>
            <div style={{ fontSize: '22pt', fontWeight: 700, color: '#fff', lineHeight: 1.05 }}>
              {simulation.termMonths} meses
            </div>
          </div>
        </div>

        {/* Texto consultivo — fecha a página com leitura humana das métricas */}
        <p
          style={{
            fontSize: '11pt',
            color: THEME.text,
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          {narrative}
        </p>
      </PageBodyCompact>
      <FooterCompact data={data} totalPages={totalPages} />
    </div>
  );
}
