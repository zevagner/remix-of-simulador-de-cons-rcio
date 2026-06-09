import React from 'react';
import { PdfCover } from './PdfCover';
import { THEME, PAGE } from '@/components/pdf/proposta/theme';

/**
 * PdfInvestimentoCenarios — template dedicado ao PDF do módulo Investimento.
 *
 * Substitui o uso anterior de `PdfAnaliseFinanceira` (template do Comparador).
 * Sem `as any`, sem mocks — consome apenas os dados reais publicados pelo
 * `InvestmentResultsContext` (cenários derivados de `useInvestmentCalculations`).
 *
 * REGRA: este arquivo é renderização pura. Nenhum cálculo financeiro aqui.
 * THEME/PAGE importados do canônico (`proposta/theme`) — paleta unificada.
 */

export interface PdfInvestimentoScenario {
  id: string;
  name: string;
  totalPaid: number;
  finalResult: number;
  absoluteGain: number;
  percentGain: number;
  details?: string;
}

export interface PdfInvestimentoCenariosData {
  creditValue: number;
  termMonths: number;
  clientName?: string;
  managerName?: string;
  managerRole?: string;
  agencyName?: string;
  managerPhone?: string;
  managerWhatsapp?: string;
  managerEmail?: string;
  logoDataUrl?: string;
  scenarios: PdfInvestimentoScenario[];
  bestScenarioId?: string;
}

const fmtBRL = (n: number) =>
  Number.isFinite(n)
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : '—';
const fmtPct = (n: number) => (Number.isFinite(n) ? `${n.toFixed(1).replace('.', ',')}%` : '—');

function ScenarioCard({ scenario, isBest }: { scenario: PdfInvestimentoScenario; isBest: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        background: isBest ? THEME.highlight : '#fff',
        border: `1px solid ${isBest ? THEME.accent : THEME.border}`,
        borderRadius: '8pt',
        padding: '14pt 14pt',
        display: 'flex',
        flexDirection: 'column',
        gap: '8pt',
        breakInside: 'avoid' as const,
      }}
    >
      {isBest && (
        <div
          style={{
            fontSize: '7.5pt',
            color: THEME.accent,
            fontWeight: 700,
            letterSpacing: '1pt',
            textTransform: 'uppercase',
          }}
        >
          Cenário recomendado
        </div>
      )}
      <div style={{ fontSize: '12pt', fontWeight: 700, color: THEME.ink, lineHeight: 1.25 }}>
        {scenario.name}
      </div>

      <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: '8pt', display: 'grid', gap: '6pt' }}>
        <Row label="Capital investido" value={fmtBRL(scenario.totalPaid)} />
        <Row label="Resultado final" value={fmtBRL(scenario.finalResult)} valueColor={THEME.primary} />
        <Row label="Ganho absoluto" value={fmtBRL(scenario.absoluteGain)} />
      </div>

      <div
        style={{
          marginTop: '4pt',
          background: '#fff',
          border: `1px solid ${THEME.border}`,
          borderRadius: '6pt',
          padding: '8pt 10pt',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '7.5pt', color: THEME.muted, letterSpacing: '0.4pt', textTransform: 'uppercase' }}>
          Retorno total
        </div>
        <div style={{ fontSize: '20pt', fontWeight: 700, color: THEME.accent, lineHeight: 1.1, marginTop: '2pt' }}>
          {fmtPct(scenario.percentGain)}
        </div>
      </div>

      {scenario.details && (
        <div style={{ fontSize: '8.5pt', color: THEME.muted, lineHeight: 1.45, marginTop: '2pt' }}>
          {scenario.details}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6pt' }}>
      <span style={{ fontSize: '8.5pt', color: THEME.muted }}>{label}</span>
      <span
        style={{
          fontSize: '10pt',
          fontWeight: 600,
          color: valueColor ?? THEME.ink,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function PdfInvestimentoCenarios({ data }: { data: PdfInvestimentoCenariosData }) {
  const scenarios = (data.scenarios ?? []).slice(0, 3);
  const consultor = [data.managerName, data.managerRole].filter(Boolean).join(' — ');
  const contact = [
    data.managerPhone && `Tel: ${data.managerPhone}`,
    data.managerWhatsapp && `WhatsApp: ${data.managerWhatsapp}`,
    data.managerEmail,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <div style={{ width: '210mm', margin: '0 auto', background: '#fff' }}>
      <PdfCover
        moduleName="Análise de Investimento"
        clientName={data.clientName}
        consultorName={consultor || undefined}
        creditValue={fmtBRL(data.creditValue)}
        logoDataUrl={data.logoDataUrl}
      />

      <div data-pdf-page style={PAGE}>
        {/* Cabeçalho */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '8pt',
            marginBottom: '14pt',
            borderBottom: `1px solid ${THEME.border}`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: '8pt',
                color: THEME.accent,
                fontWeight: 700,
                letterSpacing: '1pt',
                textTransform: 'uppercase',
              }}
            >
              Análise de Investimento
            </div>
            <h2 style={{ fontSize: '18pt', fontWeight: 700, color: THEME.primary, margin: '4pt 0 0', lineHeight: 1.2 }}>
              Cenários de investimento comparados
            </h2>
          </div>
          {data.clientName && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '7.5pt', color: THEME.soft, textTransform: 'uppercase', letterSpacing: '0.5pt' }}>
                Cliente
              </div>
              <div style={{ fontSize: '11pt', fontWeight: 700, color: THEME.ink }}>{data.clientName}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20pt', flex: '1 1 auto' }}>
          <p style={{ fontSize: '10pt', color: THEME.text, margin: 0, lineHeight: 1.6 }}>
            Comparativo entre {scenarios.length} estratégias de aplicação da carta de crédito de{' '}
            <strong style={{ color: THEME.ink }}>{fmtBRL(data.creditValue)}</strong>{' '}
            em {data.termMonths} meses. Os números abaixo são projeções determinísticas baseadas nas premissas
            informadas no Simulador — não constituem garantia de rentabilidade.
          </p>

          {/* Grid de cards (até 3 lado a lado) */}
          {scenarios.length > 0 && (
            <div style={{ display: 'flex', gap: '12pt', alignItems: 'stretch' }}>
              {scenarios.map((s) => (
                <ScenarioCard key={s.id} scenario={s} isBest={s.id === data.bestScenarioId} />
              ))}
            </div>
          )}

          {/* Tabela comparativa */}
          {scenarios.length > 0 && (
            <div style={{ breakInside: 'avoid' as const }}>
              <div
                style={{
                  fontSize: '9pt',
                  color: THEME.muted,
                  fontWeight: 700,
                  letterSpacing: '0.6pt',
                  textTransform: 'uppercase',
                  marginBottom: '6pt',
                }}
              >
                Quadro comparativo
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', color: THEME.text }}>
                <thead>
                  <tr style={{ background: THEME.primary, color: '#fff' }}>
                    <th style={th()}>Cenário</th>
                    <th style={thRight()}>Capital investido</th>
                    <th style={thRight()}>Resultado final</th>
                    <th style={thRight()}>Ganho</th>
                    <th style={thRight()}>Retorno</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((s, i) => {
                    const isBest = s.id === data.bestScenarioId;
                    return (
                      <tr key={s.id} style={{ background: isBest ? THEME.highlight : i % 2 === 0 ? '#fff' : THEME.surface }}>
                        <td style={td()}>
                          <strong style={{ color: THEME.ink }}>{s.name}</strong>
                        </td>
                        <td style={tdRight()}>{fmtBRL(s.totalPaid)}</td>
                        <td style={tdRight()}>{fmtBRL(s.finalResult)}</td>
                        <td style={tdRight()}>{fmtBRL(s.absoluteGain)}</td>
                        <td style={{ ...tdRight(), color: THEME.accent, fontWeight: 700 }}>
                          {fmtPct(s.percentGain)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '10pt',
            borderTop: `2pt solid ${THEME.accent}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: '7.5pt',
            color: THEME.muted,
          }}
        >
          <div>
            {consultor && (
              <div style={{ fontWeight: 700, color: THEME.primary, fontSize: '8pt' }}>
                {[consultor, data.agencyName].filter(Boolean).join(' — ')}
              </div>
            )}
            {contact && <div style={{ marginTop: '1pt' }}>{contact}</div>}
          </div>
          <div style={{ fontSize: '7pt', color: THEME.soft, fontStyle: 'italic', maxWidth: '85mm', textAlign: 'right' }}>
            Simulação ilustrativa. Rentabilidade passada não garante rentabilidade futura. Estudo educativo em
            observância à Lei 11.795/2008.
          </div>
        </div>
      </div>
    </div>
  );
}

const th = (): React.CSSProperties => ({
  padding: '6pt 8pt',
  textAlign: 'left',
  fontSize: '8pt',
  fontWeight: 700,
  letterSpacing: '0.3pt',
  textTransform: 'uppercase',
});
const thRight = (): React.CSSProperties => ({ ...th(), textAlign: 'right' });
const td = (): React.CSSProperties => ({
  padding: '6pt 8pt',
  borderBottom: `0.5pt solid ${THEME.border}`,
  fontVariantNumeric: 'tabular-nums',
});
const tdRight = (): React.CSSProperties => ({ ...td(), textAlign: 'right' });
