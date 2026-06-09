import React from 'react';
import { buildProposalPages, TOC_LABELS } from './proposta/pipeline';
import { PdfTOCPage, type TOCEntry } from './proposta/pages/PdfTOCPage';
import type { PdfPropostaCompletaData } from './proposta/types';

// ════════ RE-EXPORTS (API pública estável) ════════
export type { PdfPropostaCompletaData } from './proposta/types';
export {
  buildProposalPages,
  getMissingDataBlocks,
  BLOCKS,
  type ProposalPageTemplate,
} from './proposta/pipeline';
export { sanitizeManagerNote } from './proposta/narrativeContext';

/**
 * PdfPropostaCompleta — orquestrador leve do PDF.
 * Delega montagem para `buildProposalPages` e injeta um TOC automático
 * como página 2 (após a Capa, antes do conteúdo).
 * REGRA INVIOLÁVEL: este arquivo NÃO contém lógica de cálculo, narrativa, gating ou layout.
 *
 * Paginação X / Y: `totalPages` é calculado aqui (única fonte de verdade) e
 * propagado para cada Footer via prop através de `render(totalPages)`. Não usamos
 * `counter(pages)` CSS (não resolve no Browserless/Chromium) nem script inline.
 */
export function PdfPropostaCompleta({ data }: { data: PdfPropostaCompletaData }) {
  const pages = buildProposalPages(data);

  // Capa = página 1; TOC = página 2; demais blocos a partir de 3.
  const cover = pages.find((p) => p.id === 'cover');
  const contentPages = pages.filter((p) => p.id !== 'cover');

  // Total físico de folhas no PDF = capa + TOC + páginas de conteúdo.
  const totalPages = 1 /* cover */ + 1 /* toc */ + contentPages.length;

  const tocEntries: TOCEntry[] = contentPages.map((p, idx) => ({
    id: p.id,
    label: TOC_LABELS[p.id] ?? p.id,
    pageNumber: idx + 3, // 1=capa, 2=toc, 3..N=conteúdo
  }));

  return (
    <div style={{ width: '210mm', margin: '0 auto', background: '#fff' }}>
      {cover && (
        <div data-pdf-page="cover" style={{ width: '210mm', margin: '0 auto' }}>
          {cover.render(totalPages)}
        </div>
      )}
      <div data-pdf-page="toc" style={{ width: '210mm', margin: '0 auto' }}>
        <PdfTOCPage pages={tocEntries} data={data} totalPages={totalPages} />
      </div>
      {contentPages.map((p) => (
        // Quebra de página é injetada exclusivamente pela regra GLOBAL
        // `[data-pdf-page] { page-break-after: always }` em pdfGenerator.tsx.
        <div
          key={p.id}
          data-pdf-page={p.id}
          style={{ width: '210mm', margin: '0 auto' }}
        >
          {p.render(totalPages)}
        </div>
      ))}
    </div>
  );
}
