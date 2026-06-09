import React from 'react';
import { closingMessage } from '@/utils/proposalPdf/narrative';
import { THEME, PAGE } from '../theme';
import { Header, Footer, PageBody, SectionTitle, ManagerNoteBlock } from '../primitives';
import { sanitizeManagerNote, buildNarrativeContext } from '../narrativeContext';
import type { PdfPropostaCompletaData } from '../types';

/**
 * Página final — FECHAMENTO + DECISÃO (fundidas).
 * Bloco 1: mensagem do gerente + reforço temporal.
 * Bloco 2: escala 0–10 + frase memorável.
 */
export function ClosingDecisionPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const ctx = buildNarrativeContext(data);
  const closing = sanitizeManagerNote(data.customClosing)
    ?? `Se fizer sentido, me chama. Te ajudo a dar o próximo passo no seu tempo.`;

  return (
    // Override `minHeight: 100vh` do PAGE só nesta página: como é a ÚLTIMA folha
    // do PDF, forçar altura mínima de viewport provocava overflow residual e o
    // Chromium emitia uma folha extra em branco após o Footer.
    <div style={{ ...PAGE, minHeight: 'auto' }}>
      <Header data={data} />

      <PageBody>
        <div>
          <SectionTitle kicker="Decisão" title="Quanto antes você começa, mais cedo vira realidade." />
          <p style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.55, margin: '12pt 0 14pt' }}>
            {closingMessage(ctx)}
          </p>
          <ManagerNoteBlock
            kicker={data.managerName ? `Mensagem de ${data.managerName}` : 'Mensagem do gerente'}
            text={closing}
          />
        </div>

        <div>
          <div style={{ fontSize: '11pt', fontWeight: 700, color: THEME.primary, marginBottom: '6pt' }}>
            Qual a probabilidade de você seguir essa estratégia?
          </div>
          <div style={{ fontSize: '8.5pt', color: THEME.muted, marginBottom: '8pt' }}>
            Marque um X de 0 (não vou seguir) a 10 (com certeza)
          </div>
          <div style={{ display: 'flex', gap: '3pt' }}>
            {Array.from({ length: 11 }).map((_, n) => (
              <div key={n} style={{
                flex: 1, height: '28pt',
                border: `1.5pt solid ${n >= 8 ? THEME.success : n >= 5 ? THEME.primary : THEME.border}`,
                borderRadius: '4pt',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11pt', color: n >= 8 ? THEME.success : n >= 5 ? THEME.primary : THEME.muted, fontWeight: 700,
                background: '#fff',
              }}>
                {n}
              </div>
            ))}
          </div>
          <div style={{
            marginTop: '14pt', padding: '10pt 14pt',
            borderTop: `2pt solid ${THEME.accent}`, textAlign: 'center',
          }}>
            <p style={{ fontSize: '12pt', fontWeight: 700, color: THEME.ink, lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>
              "Você pode pagar juros… ou usar esse valor para construir patrimônio."
            </p>
          </div>
        </div>
      </PageBody>
      <Footer data={data} totalPages={totalPages} />
    </div>
  );
}
