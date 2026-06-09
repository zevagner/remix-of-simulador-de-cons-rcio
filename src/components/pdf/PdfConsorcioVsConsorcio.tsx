/**
 * PdfConsorcioVsConsorcio — template DEDICADO ao Comparador "vs Outro Consórcio".
 *
 * Estrutura visual alinhada ao padrão "Singular Premium CAIXA"
 * (mesma topbar/footer do PdfCompraAVista):
 *  - Capa: "Consórcio × Consórcio".
 *  - Página de conteúdo:
 *      • Topbar navy full-width (logo + "CAIXA Consórcio" + nome do módulo)
 *      • Parâmetros lado a lado (card claro / card navy)
 *      • Callout consultivo
 *      • Gráficos lado a lado
 *      • Card de Resultado
 *      • Footer navy grudado na base (marginTop: auto) com paginação à direita
 */
import React from 'react';
import { PdfBarChart } from './primitives';
import { PdfCover } from '@/components/pdf/proposalPdf/PdfCover';
import { formatCurrency } from '@/utils/format';
import type { SimulationResult } from '@/types/consortium';

export interface PdfConsorcioVsConsorcioData {
  creditValue: number;
  termMonths: number;
  // Consórcio 1
  consortiumResult: SimulationResult;
  adminFee: number;
  reserveFund: number;
  consortium1Total: number;
  // Consórcio 2
  consortium2Result: SimulationResult;
  adminFee2: number;
  reserveFund2: number;
  consortium2Total: number;
  // Texto pronto vindo do módulo
  consortiumWinnerLabel: string;
  // Header / contato
  managerName?: string;
  agencyName?: string;
  clientName?: string;
  managerRole?: string;
  managerPhone?: string;
  managerWhatsapp?: string;
  managerEmail?: string;
  logoDataUrl?: string;
}

// ── Paleta institucional ────────────────────────────────────────────
const NAVY = '#003641';
const ORANGE = '#F5821F';
const ORANGE_LIGHT = '#FFF3E8';
const BG = '#F7F7F5';
const MUTED = '#66655F';
const LINE = '#E0DED8';

const AVOID: React.CSSProperties = {
  breakInside: 'avoid',
  pageBreakInside: 'avoid',
};

const AVOID_BREAK = AVOID;

const COMPACT_SECTION: React.CSSProperties = { marginBottom: '8pt' };

// ── Kicker pill (substitui títulos de seção azuis) ──────────────────
function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-block',
        border: `0.5px solid ${ORANGE}`,
        borderRadius: '99px',
        padding: '3px 12px',
        fontSize: '10px',
        color: ORANGE,
        background: ORANGE_LIGHT,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontWeight: 600,
        marginBottom: '6pt',
      }}
    >
      {children}
    </div>
  );
}

function ParamCard({
  variant,
  title,
  rows,
}: {
  variant: 'light' | 'dark';
  title: string;
  rows: Array<[string, string]>;
}) {
  const isDark = variant === 'dark';
  const bg = isDark ? NAVY : BG;
  const titleColor = isDark ? '#FFFFFF' : NAVY;
  const labelColor = isDark ? 'rgba(255,255,255,0.65)' : MUTED;
  const valueColor = isDark ? '#FFFFFF' : NAVY;
  const divider = isDark ? 'rgba(255,255,255,0.12)' : LINE;

  return (
    <div
      style={{
        ...AVOID,
        flex: 1,
        background: bg,
        border: isDark ? 'none' : `0.5px solid ${LINE}`,
        borderRadius: '8px',
        padding: '10pt 12pt',
      }}
    >
      <div
        style={{
          fontSize: '10pt',
          fontWeight: 700,
          color: titleColor,
          textTransform: 'uppercase',
          letterSpacing: '0.5pt',
          marginBottom: '6pt',
        }}
      >
        {title}
      </div>
      {rows.map(([k, v], i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '9.5pt',
            padding: '3pt 0',
            borderBottom: i < rows.length - 1 ? `1px solid ${divider}` : 'none',
          }}
        >
          <span style={{ color: labelColor }}>{k}</span>
          <span style={{ color: valueColor, fontWeight: 700 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

export function PdfConsorcioVsConsorcio({ data }: { data: PdfConsorcioVsConsorcioData }) {
  const {
    creditValue, termMonths,
    consortiumResult, adminFee, reserveFund, consortium1Total,
    consortium2Result, adminFee2, reserveFund2, consortium2Total,
    consortiumWinnerLabel,
    managerName, agencyName, clientName,
    managerRole, managerEmail,
    logoDataUrl,
  } = data;

  const consultor = [managerName, managerRole].filter(Boolean).join(' — ');

  const c1Rows: Array<[string, string]> = [
    ['Valor da Carta', formatCurrency(creditValue)],
    ['Prazo', `${termMonths} meses`],
    ['Taxa Adm.', `${adminFee.toFixed(2)}%`],
    ['Fundo Reserva', `${reserveFund.toFixed(2)}%`],
    ['Parcela Mensal', formatCurrency(consortiumResult.installmentAfterContemplation)],
    ['Custo Total do Plano', formatCurrency(consortium1Total)],
  ];
  const c2Rows: Array<[string, string]> = [
    ['Valor da Carta', formatCurrency(creditValue)],
    ['Prazo', `${termMonths} meses`],
    ['Taxa Adm.', `${adminFee2.toFixed(2)}%`],
    ['Fundo Reserva', `${reserveFund2.toFixed(2)}%`],
    ['Parcela Mensal', formatCurrency(consortium2Result.installmentAfterContemplation)],
    ['Custo Total do Plano', formatCurrency(consortium2Total)],
  ];

  return (
    <div style={{ width: '210mm', margin: '0 auto', background: '#fff' }}>
      {/* Suprime o watermark global apenas neste PDF — ele é re-renderizado
          como linha discreta no footer navy. */}
      <style>{`.pdf-watermark, [data-pdf-watermark] { display: none !important; }`}</style>

      <PdfCover
        moduleName="Consórcio × Consórcio"
        subtitle="Comparativo entre duas propostas de consórcio imobiliário"
        clientName={clientName}
        consultorName={managerName || undefined}
        logoDataUrl={logoDataUrl}
      />

      {/* ═══════ PÁGINA DE CONTEÚDO ═══════ */}
      <div
        data-pdf-page
        style={{
          paddingTop: '8mm',
          paddingRight: '22mm',
          paddingBottom: '0mm',
          paddingLeft: '22mm',
          fontSize: '9pt',
          lineHeight: 1.35,
          overflow: 'hidden',
          minHeight: '290mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          boxSizing: 'border-box',
        }}
      >
        <div>
          {/* Barra topo full-width */}
          <div
            style={{
              background: NAVY,
              padding: '10px 28px',
              margin: '0 -22mm',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              ...AVOID_BREAK,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {logoDataUrl && (
                <img
                  src={logoDataUrl}
                  alt=""
                  style={{ height: '20px', width: 'auto', objectFit: 'contain', display: 'block' }}
                />
              )}
              <span style={{ color: '#fff', fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em' }}>
                CAIXA Consórcio
              </span>
            </div>
            <div
              style={{
                color: '#fff',
                opacity: 0.5,
                fontSize: '10px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Consórcio × Consórcio
            </div>
          </div>

          {/* Conteúdo */}
          <div style={{ marginTop: '12pt' }}>
            <div style={COMPACT_SECTION}>
              <SectionKicker>Parâmetros lado a lado</SectionKicker>
              <div style={{ ...AVOID, display: 'flex', gap: '10pt' }}>
                <ParamCard variant="light" title="Consórcio 1" rows={c1Rows} />
                <ParamCard variant="dark" title="Consórcio 2" rows={c2Rows} />
              </div>
            </div>

            <div style={COMPACT_SECTION}>
              <SectionKicker>O que avaliar nesta comparação</SectionKicker>
              <div
                style={{
                  ...AVOID,
                  background: ORANGE_LIGHT,
                  borderLeft: `3px solid ${ORANGE}`,
                  borderRadius: '0 6px 6px 0',
                  padding: '10pt 12pt',
                  fontSize: '11px',
                  lineHeight: 1.55,
                  color: MUTED,
                }}
              >
                Dois consórcios com o mesmo valor de carta podem ter custos totais muito
                diferentes. Os principais fatores são a <strong>Taxa de Administração</strong> e o{' '}
                <strong>Fundo de Reserva</strong> — quanto menores, menor o custo efetivo do plano.
                Avalie também a parcela mensal e o prazo: um plano mais curto pode ter parcela
                maior, mas custo total menor.
              </div>
            </div>

            <div style={COMPACT_SECTION}>
              <SectionKicker>Comparativo visual</SectionKicker>
              <div style={{ ...AVOID, display: 'flex', gap: '10pt' }}>
                <div style={{ ...AVOID, flex: 1 }}>
                  <PdfBarChart
                    title="Custo Total do Plano"
                    width={280}
                    height={220}
                    items={[
                      { label: 'Consórcio 1', value: consortium1Total, color: NAVY },
                      { label: 'Consórcio 2', value: consortium2Total, color: ORANGE },
                    ]}
                  />
                </div>
                <div style={{ ...AVOID, flex: 1 }}>
                  <PdfBarChart
                    title="Parcela Mensal"
                    width={280}
                    height={220}
                    items={[
                      { label: 'Consórcio 1', value: consortiumResult.installmentAfterContemplation, color: NAVY },
                      { label: 'Consórcio 2', value: consortium2Result.installmentAfterContemplation, color: ORANGE },
                    ]}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                ...AVOID,
                marginTop: '8pt',
                padding: '10pt 14pt',
                background: NAVY,
                borderRadius: '8px',
                color: '#FFFFFF',
              }}
            >
              <SectionKicker>Resultado</SectionKicker>
              <div style={{ fontSize: '18px', fontWeight: 700, color: ORANGE, lineHeight: 1.25 }}>
                {consortiumWinnerLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Footer grudado na base */}
        <div style={{ marginTop: 'auto' }}>
          <div
            style={{
              background: NAVY,
              padding: '9px 28px',
              margin: '0 -22mm',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              marginTop: 'auto',
              ...AVOID_BREAK,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ color: '#fff', opacity: 0.85, fontSize: '11px', lineHeight: 1.4 }}>
                {[consultor, agencyName].filter(Boolean).join(' — ')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {managerEmail && (
                  <>
                    <div style={{ color: ORANGE, fontSize: '11px', fontWeight: 600 }}>
                      {managerEmail}
                    </div>
                    <div style={{ color: ORANGE, fontSize: '11px', fontWeight: 600 }}>·</div>
                  </>
                )}
                <div style={{ color: ORANGE, fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  2 / 2
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.85)',
                textAlign: 'center',
                marginTop: '6px',
                fontStyle: 'italic',
                lineHeight: 1.4,
              }}
            >
              Simulação ilustrativa. Rentabilidade passada não garante rentabilidade futura. Estudo
              educativo em observância à Lei 11.795/2008.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
