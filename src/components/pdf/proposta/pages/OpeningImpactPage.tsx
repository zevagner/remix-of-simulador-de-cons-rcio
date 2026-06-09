import React from 'react';
import { formatCurrency } from '@/utils/format';
import { THEME, PAGE } from '../theme';
import { Header, Footer, PageBody, SectionTitle, ManagerNoteBlock } from '../primitives';
import { sanitizeManagerNote, sanitizeImpactValue } from '../narrativeContext';
import type { PdfPropostaCompletaData } from '../types';

/**
 * Página 2 — ABERTURA + IMPACTO (fundidas).
 * Bloco 1: mensagem do gerente. Bloco 2: Você paga / Para acessar / Diferença.
 */
export function OpeningImpactPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const opening = sanitizeManagerNote(data.customOpening)
    ?? `Preparei este estudo pensando no seu momento.`;
  const { simulation } = data;
  const paga = sanitizeImpactValue(simulation.effectiveClientCost) ?? sanitizeImpactValue(simulation.totalCost);
  const acessa = sanitizeImpactValue(simulation.creditValue);
  const diff = paga !== null && acessa !== null ? Math.max(acessa - paga, 0) : 0;

  return (
    <div style={PAGE}>
      <Header data={data} />
      <PageBody>
        <div>
          <SectionTitle kicker="Abertura" title="Vale a pena?" />
          <div style={{ marginTop: '14pt' }}>
            <ManagerNoteBlock
              kicker={data.managerName ? `Mensagem de ${data.managerName}` : 'Mensagem do gerente'}
              text={opening}
            />
          </div>
        </div>

        {paga !== null && acessa !== null && (
          <div style={{
            background: THEME.ink, color: '#fff', borderRadius: '12pt',
            padding: '22pt 24pt',
            display: 'flex', flexDirection: 'column', gap: '16pt',
          }}>
            <div>
              <div style={{ fontSize: '9pt', color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: '1.2pt', fontWeight: 700, marginBottom: '4pt' }}>
                Você paga
              </div>
              <div style={{ fontSize: '28pt', fontWeight: 700, color: '#fff', lineHeight: 1.05 }}>
                {formatCurrency(paga)}
              </div>
            </div>
            <div style={{ borderTop: `1pt solid #334155`, paddingTop: '16pt' }}>
              <div style={{ fontSize: '9pt', color: '#FDBA74', textTransform: 'uppercase', letterSpacing: '1.2pt', fontWeight: 700, marginBottom: '4pt' }}>
                Para acessar
              </div>
              <div style={{ fontSize: '28pt', fontWeight: 700, color: THEME.accent, lineHeight: 1.05 }}>
                {formatCurrency(acessa)}
              </div>
            </div>
            {diff > 0 && (
              <div style={{ borderTop: `1pt solid #334155`, paddingTop: '16pt' }}>
                <div style={{ fontSize: '9pt', color: '#86EFAC', textTransform: 'uppercase', letterSpacing: '1.2pt', fontWeight: 700, marginBottom: '4pt' }}>
                  Diferença a seu favor
                </div>
                <div style={{ fontSize: '28pt', fontWeight: 700, color: THEME.success, lineHeight: 1.05 }}>
                  {formatCurrency(diff)}
                </div>
              </div>
            )}
          </div>
        )}
      </PageBody>
      <Footer data={data} totalPages={totalPages} />
    </div>
  );
}
