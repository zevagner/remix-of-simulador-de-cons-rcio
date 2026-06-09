import React from 'react';
import { PAGE_COMPACT } from '../theme';
import { Header, FooterCompact, PageBodyCompact } from '../primitives';
import { ArgumentsBody } from './BidsStudyPages';
import { ObjectionsBody } from './ObjectionsPage';
import type { PdfPropostaCompletaData } from '../types';

/**
 * Página combinada ARGUMENTOS + OBJEÇÕES.
 * Renderizada pelo pipeline APENAS quando ambos os blocos `arguments` e
 * `objections` estão selecionados — soma ~180-210mm e cabe nos 255mm úteis
 * da A4. Reusa `ArgumentsBody` e `ObjectionsBody` (zero duplicação de conteúdo).
 *
 * Quando apenas um deles está presente, o pipeline mantém a página standalone
 * (`ArgumentsPage` ou `ObjectionsPage`) com PAGE padrão.
 */
export function ArgumentsObjectionsPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  return (
    <div style={PAGE_COMPACT}>
      <Header data={data} />
      <PageBodyCompact>
        <ArgumentsBody data={data} />
        <ObjectionsBody data={data} />
      </PageBodyCompact>
      <FooterCompact data={data} totalPages={totalPages} />
    </div>
  );
}
