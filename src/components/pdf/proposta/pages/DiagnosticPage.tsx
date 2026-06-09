import React from 'react';
import { formatCurrency } from '@/utils/format';
import { CONSORTIUM_TYPE_LABELS } from '@/types/consortium';
import { diagnosticIntro } from '@/utils/proposalPdf/narrative';
import { THEME, PAGE } from '../theme';
import { Header, Footer, PageBody, SectionTitle, Lead, MetricCard, MetricGrid, DiagnosticDimension } from '../primitives';
import { OBJETIVO_LABELS, PRIORIDADE_LABELS, URGENCIA_LABELS, SITUACAO_LABELS } from '../labels';
import { buildNarrativeContext } from '../narrativeContext';
import type { PdfPropostaCompletaData } from '../types';

/**
 * Página DIAGNÓSTICO — bloco `diagnostic`. Versão COMPLETA.
 *
 * Estrutura (densidade total, sem versão resumida):
 *   1) Intro narrativa contextual
 *   2) Bloco "Objetivo" — objetivo principal + sub-objetivo + situação inferida
 *   3) Bloco "Capacidade financeira" — capacidade mensal + capital disponível + tipo de consórcio
 *   4) Bloco "Janela & Prioridade" — urgência declarada + critério de decisão
 *   5) Síntese consultiva — frase-chave que amarra perfil + estratégia
 *
 * Regra: TODOS os campos do wizard de Diagnóstico aparecem. Sem omissão silenciosa.
 */
export function DiagnosticPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const ctx = buildNarrativeContext(data);
  const { simulation, diagnostic } = data;

  const objetivoKey = diagnostic.objetivo || '';
  const objetivoMeta = OBJETIVO_LABELS[objetivoKey];
  const prioridadeMeta = diagnostic.prioridade ? PRIORIDADE_LABELS[diagnostic.prioridade] : null;
  const urgenciaMeta = diagnostic.urgencia ? URGENCIA_LABELS[diagnostic.urgencia] : null;
  const situacaoTexto = diagnostic.situacao ? SITUACAO_LABELS[diagnostic.situacao] : null;

  const capPercent = diagnostic.capacidadeMensal > 0 && simulation.installment > 0
    ? Math.min((simulation.installment / diagnostic.capacidadeMensal) * 100, 999)
    : null;

  return (
    <div style={PAGE}>
      <Header data={data} />
      <PageBody>
        <div>
          <SectionTitle kicker="Contexto" title="Sobre você" />
          <div style={{ marginTop: '14pt' }}>
            <Lead>{diagnosticIntro(ctx)}</Lead>
          </div>
        </div>

        {/* DIMENSÃO 1 — OBJETIVO */}
        <DiagnosticDimension kicker="Dimensão 1 de 3" title="Objetivo declarado">
          {objetivoMeta ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10pt', marginBottom: '8pt' }}>
                <span style={{ fontSize: '22pt' }}>{objetivoMeta.emoji}</span>
                <div>
                  <div style={{ fontSize: '12pt', fontWeight: 700, color: THEME.primary }}>{objetivoMeta.label}</div>
                  {diagnostic.subObjetivo && (
                    <div style={{ fontSize: '9.5pt', color: THEME.muted, marginTop: '2pt' }}>
                      Refinamento: <strong style={{ color: THEME.ink }}>{diagnostic.subObjetivo}</strong>
                    </div>
                  )}
                </div>
              </div>
              <p style={{ fontSize: '10pt', color: THEME.text, lineHeight: 1.55, margin: '6pt 0 0' }}>
                Em essência, o objetivo é <strong>{objetivoMeta.narrativa}</strong>. Toda a estratégia
                a seguir é construída a partir desse ponto de partida.
              </p>
              {situacaoTexto && (
                <p style={{ fontSize: '9.5pt', color: THEME.muted, fontStyle: 'italic', lineHeight: 1.5, margin: '8pt 0 0' }}>
                  Situação atual: {situacaoTexto}
                </p>
              )}
            </>
          ) : (
            <p style={{ fontSize: '10pt', color: THEME.muted, fontStyle: 'italic', margin: 0 }}>
              Objetivo ainda não declarado no Diagnóstico.
            </p>
          )}
        </DiagnosticDimension>

        {/* DIMENSÃO 2 — CAPACIDADE FINANCEIRA */}
        <DiagnosticDimension kicker="Dimensão 2 de 3" title="Capacidade financeira">
          <MetricGrid cols={3}>
            <MetricCard
              label="Capacidade mensal"
              value={diagnostic.capacidadeMensal > 0 ? formatCurrency(diagnostic.capacidadeMensal) : '—'}
              tone="primary"
            />
            <MetricCard
              label="Capital disponível"
              value={diagnostic.temCapital && diagnostic.capitalDisponivel > 0
                ? formatCurrency(diagnostic.capitalDisponivel)
                : 'Não declarado'}
              tone={diagnostic.temCapital && diagnostic.capitalDisponivel > 0 ? 'success' : 'default'}
            />
            <MetricCard
              label="Tipo de consórcio"
              value={CONSORTIUM_TYPE_LABELS[simulation.consortiumType]}
            />
          </MetricGrid>

          {capPercent !== null && (
            <div style={{
              marginTop: '12pt',
              background: '#fff',
              border: `1px solid ${THEME.border}`,
              borderRadius: '6pt',
              padding: '10pt 12pt',
            }}>
              <div style={{ fontSize: '8pt', color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.4pt', marginBottom: '4pt', fontWeight: 700 }}>
                Comprometimento da capacidade
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8pt' }}>
                <div style={{ fontSize: '20pt', fontWeight: 700, color: capPercent <= 100 ? THEME.success : THEME.accent, lineHeight: 1 }}>
                  {capPercent.toFixed(0)}%
                </div>
                <div style={{ fontSize: '9.5pt', color: THEME.text, lineHeight: 1.4 }}>
                  da capacidade mensal será usada na parcela de <strong>{formatCurrency(simulation.installment)}</strong>.
                </div>
              </div>
            </div>
          )}

          {diagnostic.temCapital && diagnostic.capitalDisponivel > 0 && (
            <p style={{ fontSize: '9.5pt', color: THEME.muted, lineHeight: 1.5, margin: '10pt 0 0' }}>
              O capital disponível destrava cenários como <strong>lance fixo</strong>,
              <strong> aceleração da contemplação</strong> ou <strong>comparação direta com compra à vista</strong>.
            </p>
          )}
        </DiagnosticDimension>

        {/* DIMENSÃO 3 — URGÊNCIA & PRIORIDADE */}
        <DiagnosticDimension kicker="Dimensão 3 de 3" title="Janela de execução & critério de decisão">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12pt' }}>
            {/* Urgência */}
            <div style={{ background: '#fff', border: `1px solid ${THEME.border}`, borderRadius: '6pt', padding: '10pt 12pt' }}>
              <div style={{ fontSize: '8pt', color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.4pt', fontWeight: 700, marginBottom: '6pt' }}>
                Urgência declarada
              </div>
              {urgenciaMeta ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6pt', marginBottom: '4pt' }}>
                    <span style={{ fontSize: '14pt' }}>{urgenciaMeta.emoji}</span>
                    <span style={{ fontSize: '11pt', fontWeight: 700, color: THEME.primary }}>{urgenciaMeta.label}</span>
                  </div>
                  <div style={{ fontSize: '9pt', color: THEME.muted, marginBottom: '6pt' }}>{urgenciaMeta.janela}</div>
                  <div style={{ fontSize: '9.5pt', color: THEME.text, lineHeight: 1.5 }}>
                    Implica <strong>{urgenciaMeta.estrategia}</strong>.
                  </div>
                </>
              ) : (
                <span style={{ fontSize: '10pt', color: THEME.muted, fontStyle: 'italic' }}>Não declarada</span>
              )}
            </div>

            {/* Prioridade */}
            <div style={{ background: '#fff', border: `1px solid ${THEME.border}`, borderRadius: '6pt', padding: '10pt 12pt' }}>
              <div style={{ fontSize: '8pt', color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.4pt', fontWeight: 700, marginBottom: '6pt' }}>
                Critério de decisão
              </div>
              {prioridadeMeta ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6pt', marginBottom: '4pt' }}>
                    <span style={{ fontSize: '14pt' }}>{prioridadeMeta.emoji}</span>
                    <span style={{ fontSize: '11pt', fontWeight: 700, color: THEME.primary }}>{prioridadeMeta.label}</span>
                  </div>
                  <div style={{ fontSize: '9.5pt', color: THEME.text, lineHeight: 1.5 }}>
                    {prioridadeMeta.descricao}
                  </div>
                </>
              ) : (
                <span style={{ fontSize: '10pt', color: THEME.muted, fontStyle: 'italic' }}>Não declarada</span>
              )}
            </div>
          </div>
        </DiagnosticDimension>

        {/* SÍNTESE */}
        <div style={{
          background: THEME.highlight,
          border: `1px solid ${THEME.accent}`,
          borderRadius: '8pt',
          padding: '14pt 18pt',
          breakInside: 'avoid' as const,
        }}>
          <div style={{ fontSize: '8pt', color: THEME.accent, fontWeight: 700, letterSpacing: '1pt', textTransform: 'uppercase', marginBottom: '6pt' }}>
            Síntese consultiva
          </div>
          <p style={{ fontSize: '11pt', color: THEME.ink, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
            {data.clientName || 'O cliente'}{objetivoMeta ? ` quer ${objetivoMeta.narrativa}` : ' tem um objetivo a estruturar'}
            {urgenciaMeta ? `, com horizonte ${urgenciaMeta.label.toLowerCase()}` : ''}
            {prioridadeMeta ? ` e priorizando ${prioridadeMeta.label.toLowerCase()}` : ''}.
            {' '}A estratégia a seguir foi calibrada exatamente para esse perfil — não é genérica.
          </p>
        </div>
      </PageBody>
      <Footer data={data} totalPages={totalPages} />
    </div>
  );
}
