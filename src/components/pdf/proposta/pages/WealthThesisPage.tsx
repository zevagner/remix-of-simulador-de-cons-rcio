import React from 'react';
import { THEME, PAGE } from '../theme';
import {
  Header, Footer, PageBody, SectionTitle, MetricCard, MetricGrid,
  PdfTable, MissingDataNote,
} from '../primitives';
import type { PdfPropostaCompletaData } from '../types';

/**
 * Página TESE PATRIMONIAL — bloco `wealth-thesis`.
 *
 * Reflete a estratégia patrimonial ATIVA escolhida no Wealth/Compare V2.
 * NÃO exporta a biblioteca inteira — apenas a tese personalizada do caso.
 */
export function WealthThesisPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const w = data.wealth;

  return (
    <div style={PAGE}>
      <Header data={data} />
      <PageBody>
        <div>
          <SectionTitle kicker="Tese patrimonial" title={w?.title ?? 'Estratégia patrimonial'} />
          {!w ? (
            <MissingDataNote>
              Selecione uma estratégia patrimonial na biblioteca ou no Compare para personalizar
              esta seção. Sem uma escolha consultiva, a tese permanece em aberto.
            </MissingDataNote>
          ) : (
            <>
              {w.tagline && (
                <p style={{ fontSize: '11pt', color: THEME.text, fontStyle: 'italic', margin: '8pt 0 14pt' }}>
                  {w.tagline}
                </p>
              )}

              {w.howItWorks && (
                <div style={{ margin: '0 0 14pt' }}>
                  <div style={{ fontSize: '8.5pt', fontWeight: 700, color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4pt' }}>
                    Como funciona
                  </div>
                  <p style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.55, margin: 0 }}>
                    {w.howItWorks}
                  </p>
                </div>
              )}

              {w.patrimonialLogic && (
                <div style={{ margin: '0 0 14pt' }}>
                  <div style={{ fontSize: '8.5pt', fontWeight: 700, color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4pt' }}>
                    Racional patrimonial
                  </div>
                  <p style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.55, margin: 0 }}>
                    {w.patrimonialLogic}
                  </p>
                </div>
              )}

              {w.kpis && w.kpis.length > 0 && (
                <div style={{ margin: '8pt 0 14pt' }}>
                  <MetricGrid cols={Math.min(3, w.kpis.length) as 2 | 3}>
                    {w.kpis.slice(0, 3).map((k, i) => (
                      <MetricCard key={i} label={k.label} value={k.value} tone={i === 0 ? 'primary' : 'default'} />
                    ))}
                  </MetricGrid>
                </div>
              )}

              {(w.advantages?.length || w.risks?.length) ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14pt', marginTop: '6pt' }}>
                  {w.advantages && w.advantages.length > 0 && (
                    <div>
                      <div style={{ fontSize: '8.5pt', fontWeight: 700, color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4pt' }}>
                        Vantagens
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '14pt', fontSize: '10pt', color: THEME.text, lineHeight: 1.5 }}>
                        {w.advantages.slice(0, 4).map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}
                  {w.risks && w.risks.length > 0 && (
                    <div>
                      <div style={{ fontSize: '8.5pt', fontWeight: 700, color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4pt' }}>
                        Pontos de atenção
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '14pt', fontSize: '10pt', color: THEME.text, lineHeight: 1.5 }}>
                        {w.risks.slice(0, 4).map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}

              <p style={{ fontSize: '9pt', color: THEME.muted, lineHeight: 1.4, margin: '18pt 0 0', fontStyle: 'italic' }}>
                Tese personalizada · origem: {w.source === 'compare-winner' ? 'vencedora do Compare' : w.source === 'wealth-library' ? 'biblioteca patrimonial' : 'seleção do gerente'}.
              </p>
            </>
          )}
        </div>
      </PageBody>
      <Footer data={data} totalPages={totalPages} />
    </div>
  );
}
