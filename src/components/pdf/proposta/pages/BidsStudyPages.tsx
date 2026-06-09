import React from 'react';
import { formatCurrency } from '@/utils/format';
import { PdfBarChart } from '../../primitives';
import { defaultArguments } from '@/utils/proposalPdf/narrative';
import { THEME, PAGE, PAGE_COMPACT } from '../theme';
import {
  Header, Footer, FooterCompact, PageBody, PageBodyCompact, SectionTitle, MetricCard, MetricGrid,
  PdfTable, ChartCaption, MissingDataNote,
} from '../primitives';
import { buildNarrativeContext } from '../narrativeContext';
import type { PdfPropostaCompletaData } from '../types';

/**
 * Corpo puro do bloco ARGUMENTOS — sem PAGE/Header/Footer.
 * Reutilizado em (1) ArgumentsPage standalone e (2) ArgumentsObjectionsPage combinada.
 */
export function ArgumentsBody({ data }: { data: PdfPropostaCompletaData }) {
  const ctx = buildNarrativeContext(data);
  const args = (data.argumentsList && data.argumentsList.length
    ? data.argumentsList
    : defaultArguments(ctx)
  ).slice(0, 3);

  return (
    <div>
      <SectionTitle kicker="Motivos" title="Por que seguir agora" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10pt', marginTop: '14pt' }}>
        {args.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: '10pt', padding: '12pt 14pt', background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: '6pt' }}>
            <div style={{ flexShrink: 0, width: '22pt', height: '22pt', borderRadius: '11pt', background: THEME.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11pt' }}>
              {i + 1}
            </div>
            <div style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.55 }}>{a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Página ARGUMENTOS standalone — usada quando o bloco `arguments` está
 * selecionado SEM o `objections`. Caso ambos estejam presentes, o pipeline
 * combina os dois corpos em `ArgumentsObjectionsPage`.
 */
export function ArgumentsPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  return (
    <div style={PAGE}>
      <Header data={data} />
      <PageBody>
        <ArgumentsBody data={data} />
      </PageBody>
      <Footer data={data} totalPages={totalPages} />
    </div>
  );
}

export function BidsStudyPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const s = data.bidsStudy ?? {};
  const items: Array<{ label: string; value: number; color?: string }> = [];
  if (s.minBid != null) items.push({ label: 'Mínimo', value: s.minBid, color: THEME.success });
  if (s.avgBid != null) items.push({ label: 'Médio', value: s.avgBid, color: THEME.primary });
  if (s.maxBid != null) items.push({ label: 'Máximo', value: s.maxBid, color: '#dc2626' });
  if (s.recommendedBid != null) items.push({ label: 'Recomendado', value: s.recommendedBid, color: THEME.accent });
  const hasAny = items.length > 0 || !!s.groupNumber;

  return (
    <div style={PAGE}>
      <Header data={data} />
      <PageBody>
        <div>
          <SectionTitle kicker="Prova" title="O que o histórico mostra" />
          <p style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.65, margin: '14pt 0 18pt' }}>
            Dados do <strong>histórico real de assembleias</strong> deste grupo, usados para calibrar o lance.
          </p>
          {items.length > 0 ? (
            <>
              <PdfBarChart
                title="Distribuição de lances no grupo (% do crédito)"
                width={620}
                height={220}
                items={items}
                formatValue={(v) => `${v.toFixed(1)}%`}
              />
              <ChartCaption>
                O lance recomendado fica posicionado de forma competitiva em relação ao histórico real do grupo.
              </ChartCaption>
            </>
          ) : (
            <MissingDataNote>
              Selecione um grupo no Simulador para carregar o histórico real de lances. A leitura — calibrar o lance pelo histórico — segue o método correto.
            </MissingDataNote>
          )}
        </div>

        {hasAny && (
          <div>
            <MetricGrid cols={4}>
              {s.groupNumber && <MetricCard label="Grupo" value={s.groupNumber} />}
              {s.minBid != null && <MetricCard label="Lance mínimo" value={`${s.minBid.toFixed(2)}%`} tone="success" />}
              {s.avgBid != null && <MetricCard label="Lance médio" value={`${s.avgBid.toFixed(2)}%`} tone="primary" />}
              {s.recommendedBid != null && <MetricCard label="Recomendado" value={`${s.recommendedBid.toFixed(2)}%`} tone="accent" />}
            </MetricGrid>

            <div style={{ marginTop: '14pt' }}>
              <h3 style={{ fontSize: '12pt', fontWeight: 700, color: THEME.primary, margin: '0 0 8pt' }}>
                Posicionamento estatístico do lance
              </h3>
              <PdfTable
                headers={['Indicador', 'Valor (% do crédito)', 'Em R$', 'Leitura']}
                align={['left', 'right', 'right', 'left']}
                rows={[
                  s.minBid != null ? ['Lance mínimo histórico', `${s.minBid.toFixed(2)}%`, formatCurrency((s.minBid / 100) * data.simulation.creditValue), 'Quem entra com menos'] : null,
                  s.avgBid != null ? ['Lance médio histórico', `${s.avgBid.toFixed(2)}%`, formatCurrency((s.avgBid / 100) * data.simulation.creditValue), 'Centro do grupo'] : null,
                  s.maxBid != null ? ['Lance máximo histórico', `${s.maxBid.toFixed(2)}%`, formatCurrency((s.maxBid / 100) * data.simulation.creditValue), 'Estratégia agressiva'] : null,
                  s.recommendedBid != null ? ['Lance recomendado', `${s.recommendedBid.toFixed(2)}%`, formatCurrency((s.recommendedBid / 100) * data.simulation.creditValue), 'Calibrado pela mediana'] : null,
                ].filter(Boolean) as Array<Array<string>>}
              />
            </div>

            {s.monthsAnalyzed && (
              <p style={{ fontSize: '9pt', color: THEME.muted, fontStyle: 'italic', marginTop: '12pt' }}>
                Análise baseada em {s.monthsAnalyzed} meses de assembleias reais. Não constitui garantia de contemplação (Lei 11.795/2008).
              </p>
            )}
          </div>
        )}
      </PageBody>
      <Footer data={data} totalPages={totalPages} />
    </div>
  );
}

/** Página de Análise de Contemplação — bloco `contemplation`. */
export function ContemplationPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const s = data.bidsStudy ?? {};
  return (
    <div style={PAGE_COMPACT}>
      <Header data={data} />
      <PageBodyCompact>
        <div>
          <SectionTitle kicker="Probabilidade" title="Quando a contemplação tende a acontecer" />
          <p style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.65, margin: '14pt 0 14pt' }}>
            Estimativas estatísticas com base no <strong>histórico real</strong> deste grupo —
            usadas como referência consultiva, sem promessa de prazo.
          </p>
          {(s.avgBid != null || s.recommendedBid != null || s.monthsAnalyzed != null) ? (
            <MetricGrid cols={3}>
              {s.avgBid != null && <MetricCard label="Lance médio histórico" value={`${s.avgBid.toFixed(2)}%`} tone="primary" />}
              {s.recommendedBid != null && <MetricCard label="Lance recomendado" value={`${s.recommendedBid.toFixed(2)}%`} tone="accent" />}
              {s.monthsAnalyzed != null && <MetricCard label="Meses analisados" value={`${s.monthsAnalyzed}`} />}
            </MetricGrid>
          ) : (
            <MissingDataNote>
              Para exibir as probabilidades específicas deste grupo, selecione-o no Simulador. A leitura — análise estatística do histórico — segue válida como método.
            </MissingDataNote>
          )}
          <p style={{ fontSize: '9pt', color: THEME.muted, fontStyle: 'italic', marginTop: '14pt', lineHeight: 1.5 }}>
            Lei 11.795/2008: o sistema de consórcio não garante prazo de contemplação. Esta análise
            é estatística e educativa.
          </p>
        </div>
      </PageBodyCompact>
      <FooterCompact data={data} totalPages={totalPages} />
    </div>
  );
}
