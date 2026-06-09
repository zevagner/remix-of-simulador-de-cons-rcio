import React from 'react';
import { defaultObjections } from '@/utils/proposalPdf/narrative';
import { THEME, PAGE } from '../theme';
import { Header, Footer, PageBody, SectionTitle } from '../primitives';
import type { PdfPropostaCompletaData } from '../types';

/**
 * Corpo puro do bloco OBJEÇÕES — sem PAGE/Header/Footer.
 * Reutilizado em (1) ObjectionsPage standalone e (2) ArgumentsObjectionsPage combinada.
 */
export function ObjectionsBody({ data }: { data: PdfPropostaCompletaData }) {
  const list = (data.objectionsList && data.objectionsList.length > 0
    ? data.objectionsList
    : defaultObjections()
  ).slice(0, 3);

  return (
    <div>
      <SectionTitle kicker="Dúvidas" title="O que costuma aparecer na cabeça do cliente" />
      <p style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.6, margin: '12pt 0 14pt' }}>
        Antes de decidir, é natural ter dúvidas. Aqui estão as mais comuns — respondidas com transparência.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12pt' }}>
        {list.map((o, i) => (
          <div key={i} style={{
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
            borderLeft: `3pt solid ${THEME.primary}`,
            borderRadius: '6pt',
            padding: '12pt 14pt',
          }}>
            <div style={{ fontSize: '10.5pt', fontWeight: 700, color: THEME.primary, marginBottom: '6pt', lineHeight: 1.4 }}>
              {o.q}
            </div>
            <div style={{ fontSize: '10pt', color: THEME.text, lineHeight: 1.55 }}>
              {o.a}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Página — OBJEÇÕES E RESPOSTAS (standalone).
 * Usada quando o bloco `objections` está selecionado SEM o `arguments`.
 */
export function ObjectionsPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  return (
    <div style={PAGE}>
      <Header data={data} />
      <PageBody>
        <ObjectionsBody data={data} />
      </PageBody>
      <Footer data={data} totalPages={totalPages} />
    </div>
  );
}

