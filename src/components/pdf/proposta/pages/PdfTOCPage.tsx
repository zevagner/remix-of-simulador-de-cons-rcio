import React from 'react';
import { PAGE_COMPACT, THEME } from '../theme';
import { Header, FooterCompact, PageBodyCompact, SectionTitle } from '../primitives';
import type { PdfPropostaCompletaData } from '../types';

export interface TOCEntry {
  id: string;
  label: string;
  pageNumber: number;
}

/**
 * PdfTOCPage — Sumário (índice) automático da Proposta Completa.
 * Renderiza após a Capa, antes do conteúdo. Listagem reflete apenas os
 * blocos realmente presentes no pipeline (gates já aplicados).
 */
export function PdfTOCPage({ pages, data, totalPages }: { pages: TOCEntry[]; data: PdfPropostaCompletaData; totalPages?: number }) {
  return (
    <div style={PAGE_COMPACT}>
      <Header data={data} />
      <PageBodyCompact>
        <SectionTitle kicker="ÍNDICE" title="O que está neste estudo" />

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '6pt' }}>
          {pages.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8pt',
                padding: '10pt 0',
                borderBottom: i < pages.length - 1 ? `0.5pt solid ${THEME.border}` : 'none',
              }}
            >
              <div
                style={{
                  fontSize: '9pt',
                  fontWeight: 700,
                  color: THEME.primary,
                  minWidth: '18pt',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '11pt', color: THEME.ink, fontWeight: 500 }}>{p.label}</div>
              <div
                style={{
                  flex: 1,
                  borderBottom: `1px dotted ${THEME.border}`,
                  margin: '0 6pt',
                  transform: 'translateY(-3pt)',
                }}
              />
              <div
                style={{
                  fontSize: '10pt',
                  color: THEME.muted,
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: '20pt',
                  textAlign: 'right',
                }}
              >
                {p.pageNumber}
              </div>
            </div>
          ))}
        </div>
      </PageBodyCompact>
      <FooterCompact data={data} totalPages={totalPages} />
    </div>
  );
}
