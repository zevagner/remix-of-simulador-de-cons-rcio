import React from 'react';
import { PdfCover } from './PdfCover';
import { THEME, PAGE_COMPACT } from '@/components/pdf/proposta/theme';

/**
 * PdfCompraAVista — template dedicado ao PDF "Comparativo vs Compra à Vista".
 *
 * Espelha fielmente a estrutura do `CashComparisonTab` (módulo Investimento):
 *  · Camada 1 — Compra à Vista
 *  · Camada 2 — Estratégia Patrimonial (carta, lances, capital, premissas)
 *  · Camada 3 — Resultado Patrimonial
 *  · Resumo narrativo executivo (3 parágrafos consultivos)
 *  · Comparação final (À Vista × Consórcio + Diferença Patrimonial)
 *
 * REGRA: renderização pura — nenhum cálculo financeiro aqui.
 */

export interface PdfCompraAVistaCash {
  creditLetterValue: number;
  embeddedBidValue: number;
  freeBidValue: number;
  totalBidValue: number;
  capitalToInvest: number;
  monthlyInstallment: number;
  monthlyYield: number;
  monthlyResult: number;
  cashFinalPatrimony: number;
  consortiumFinalPatrimony: number;
  accumulatedInvestmentGross: number;
  accumulatedInvestmentNet: number;
  irAliquota: number;
  irValue: number;
  patrimonyDifference: number;
  patrimonyDifferencePercent: number;
}

export interface PdfCompraAVistaData {
  cashComparison: PdfCompraAVistaCash;
  cashPropertyValue: number;
  cashEmbeddedBidPercent: number;
  cashFreeBidPercent: number;
  cashTermMonths: number;
  cashInvestmentRate: number;
  cashCdiRate: number;
  clientName?: string;
  managerName?: string;
  managerRole?: string;
  agencyName?: string;
  managerPhone?: string;
  managerWhatsapp?: string;
  managerEmail?: string;
  logoDataUrl?: string;
}

const fmtBRL = (n: number) =>
  Number.isFinite(n)
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : '—';
const fmtPct = (n: number, d = 1) =>
  Number.isFinite(n) ? `${n.toFixed(d).replace('.', ',')}%` : '—';

// Paleta visual local (não altera lógica/dados — apenas estilos)
const NAVY = '#003641';
const ORANGE = '#F5821F';
const ORANGE_LIGHT = '#FFF3E8';
const BG = '#F7F7F5';
const MUTED = '#66655F';
const LINE = '#E0DED8';

const AVOID_BREAK: React.CSSProperties = {
  breakInside: 'avoid',
  pageBreakInside: 'avoid',
};

function Kicker({ children, onDark }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <div
      style={{
        display: 'inline-block',
        alignSelf: 'flex-start',
        fontSize: '7.5pt',
        color: onDark ? '#fff' : ORANGE,
        background: onDark ? ORANGE : ORANGE_LIGHT,
        border: onDark ? `0.5px solid ${ORANGE}` : `0.5px solid ${ORANGE}`,
        borderRadius: '99px',
        padding: '3px 12px',
        fontWeight: 700,
        letterSpacing: '1pt',
        textTransform: 'uppercase',
        marginBottom: '4pt',
      }}
    >
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  valueColor,
  bold,
  onDark,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
  onDark?: boolean;
}) {
  const labelColor = onDark ? 'rgba(255,255,255,0.65)' : '#66655F';
  const valueDefault = onDark ? '#ffffff' : NAVY;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: '6pt',
        fontSize: '8pt',
        minWidth: 0,
      }}
    >
      <span style={{ color: labelColor, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontWeight: bold ? 700 : 600,
          color: valueColor ?? valueDefault,
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
          minWidth: 0,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function LayerCard({
  kicker,
  title,
  children,
  highlight,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  // Injeta onDark={highlight} em todos os <Row /> filhos sem alterar call-sites.
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === Row) {
      return React.cloneElement(child as React.ReactElement<{ onDark?: boolean }>, {
        onDark: !!highlight,
      });
    }
    return child;
  });

  return (
    <div
      style={{
        flex: 1,
        background: highlight ? NAVY : BG,
        border: `0.5px solid ${highlight ? NAVY : LINE}`,
        borderRadius: '8px',
        padding: '8pt',
        display: 'flex',
        flexDirection: 'column',
        gap: '5pt',
        overflow: 'hidden',
        ...AVOID_BREAK,
      }}
    >
      <Kicker onDark={highlight}>{kicker}</Kicker>
      <div style={{ fontSize: '10pt', fontWeight: 700, color: highlight ? '#fff' : NAVY, lineHeight: 1.15 }}>{title}</div>
      <div
        style={{
          borderTop: `1px solid ${highlight ? 'rgba(255,255,255,0.15)' : LINE}`,
          paddingTop: '5pt',
          display: 'flex',
          flexDirection: 'column',
          gap: '4pt',
        }}
      >
        {enhancedChildren}
      </div>
    </div>
  );
}

export function PdfCompraAVista({ data }: { data: PdfCompraAVistaData }) {
  const c = data.cashComparison;
  const consultor = [data.managerName, data.managerRole].filter(Boolean).join(' — ');

  const monthlyResultPositive = c.monthlyResult >= 0;

  // Watermark sintetizado localmente — usa o MESMO formato do pdfGenerator
  // global e o suprime via <style> escopado a este documento, para que apareça
  // apenas como terceira linha discreta do footer navy (sem espaço flutuante).
  const watermarkLine = '';

  return (
    <div style={{ width: '210mm', margin: '0 auto', background: '#fff' }}>
      {/* Suprime o watermark global apenas neste PDF — ele é re-renderizado
          como terceira linha do footer navy (ver abaixo). */}
      <style>{`.pdf-watermark, [data-pdf-watermark] { display: none !important; }`}</style>
      <PdfCover
        moduleName="Consórcio × Compra à Vista"
        clientName={data.clientName}
        consultorName={consultor || undefined}
        creditValue={fmtBRL(data.cashPropertyValue)}
        logoDataUrl={data.logoDataUrl}
      />

      {/* ═══════ PÁGINA DE CONTEÚDO ═══════ */}
      <div
        data-pdf-page
        style={{
          ...PAGE_COMPACT,
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
            {data.logoDataUrl && (
              <img
                src={data.logoDataUrl}
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
            Análise Patrimonial
          </div>
        </div>

        {/* Cabeçalho */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '6pt',
            marginTop: '6px',
            marginBottom: '8px',
            borderBottom: `1px solid ${LINE}`,
            ...AVOID_BREAK,
          }}
        >
          <div>
            <Kicker>Análise patrimonial</Kicker>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: NAVY,
                margin: '3pt 0 2pt',
                lineHeight: 1.15,
                letterSpacing: '-0.4px',
              }}
            >
              Consórcio × Compra à Vista
            </h2>
            <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.35, maxWidth: '160mm' }}>
              Carta de crédito 2× o valor do imóvel — capital próprio investido em paralelo,
              gerando renda que ajuda a custear a parcela.
            </div>

          </div>
          {data.clientName && (
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '7.5pt',
                  color: MUTED,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5pt',
                }}
              >
                Cliente
              </div>
              <div style={{ fontSize: '11pt', fontWeight: 700, color: NAVY }}>{data.clientName}</div>
            </div>
          )}
        </div>

        {/* ═══════ TRÊS CAMADAS LADO A LADO ═══════ */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', minHeight: '140px', marginBottom: '10pt', ...AVOID_BREAK }}>
          {/* CAMADA 1 — COMPRA À VISTA */}
          <LayerCard kicker="Camada 1" title="Compra à Vista">
            <Row label="Valor do imóvel" value={fmtBRL(data.cashPropertyValue)} />
            <Row
              label="Patrimônio final"
              value={fmtBRL(c.cashFinalPatrimony)}
              valueColor={THEME.primary}
              bold
            />
            <div style={{ fontSize: '8pt', color: THEME.muted, lineHeight: 1.45, marginTop: '2pt' }}>
              Todo o capital fica imobilizado no imóvel — sem liquidez, sem rendimento paralelo.
            </div>
          </LayerCard>

          {/* CAMADA 2 — ESTRATÉGIA PATRIMONIAL */}
          <LayerCard kicker="Camada 2" title="Estratégia Patrimonial" highlight>
            <Row label="Carta de crédito (2×)" value={fmtBRL(c.creditLetterValue)} valueColor={THEME.primary} />
            <Row
              label={`Lance embutido (${data.cashEmbeddedBidPercent}%)`}
              value={fmtBRL(c.embeddedBidValue)}
            />
            <Row
              label={`Lance livre (${data.cashFreeBidPercent}%)`}
              value={fmtBRL(c.freeBidValue)}
            />
            <Row label="Total de lances" value={fmtBRL(c.totalBidValue)} />
            <Row
              label="Capital investido"
              value={fmtBRL(c.capitalToInvest)}
              valueColor={THEME.success}
              bold
            />
            <Row label="Parcela mensal" value={fmtBRL(c.monthlyInstallment)} />
            <Row
              label="Rendimento mensal"
              value={`+${fmtBRL(c.monthlyYield)}`}
              valueColor={THEME.success}
            />
            <div
              style={{
                fontSize: '7pt',
                color: THEME.muted,
                lineHeight: 1.45,
                marginTop: '2pt',
                borderTop: `1px dashed ${THEME.border}`,
                paddingTop: '4pt',
              }}
            >
              <strong style={{ color: THEME.ink }}>Premissas:</strong> {data.cashTermMonths} meses ·
              CDI {data.cashCdiRate.toFixed(2).replace('.', ',')}% a.a. · {data.cashInvestmentRate.toFixed(0)}% do CDI
            </div>
          </LayerCard>

          {/* CAMADA 3 — RESULTADO PATRIMONIAL */}
          <LayerCard kicker="Camada 3" title="Resultado Patrimonial">
            <Row
              label="Resultado mensal"
              value={`${monthlyResultPositive ? '+' : ''}${fmtBRL(c.monthlyResult)}`}
              valueColor={monthlyResultPositive ? THEME.success : '#dc2626'}
              bold
            />
            <div style={{ borderTop: `1px dashed ${THEME.border}`, paddingTop: '6pt' }} />
            <Row label="Imóvel" value={fmtBRL(data.cashPropertyValue)} />
            <Row label="Investimento bruto" value={fmtBRL(c.accumulatedInvestmentGross)} />
            <Row
              label={`IR estimado (${(c.irAliquota * 100).toFixed(1).replace('.', ',')}%)`}
              value={`-${fmtBRL(c.irValue)}`}
              valueColor="#dc2626"
            />
            <Row
              label="Investimento líquido"
              value={fmtBRL(c.accumulatedInvestmentNet)}
              valueColor={THEME.success}
            />
            <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: '6pt' }} />
            <Row
              label="Patrimônio total"
              value={fmtBRL(c.consortiumFinalPatrimony)}
              valueColor={THEME.primary}
              bold
            />
            <div
              style={{
                marginTop: '2pt',
                background: ORANGE_LIGHT,
                border: `1px solid ${ORANGE}`,
                borderRadius: '6pt',
                padding: '4pt 6pt',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '7pt',
                  color: MUTED,
                  letterSpacing: '0.4pt',
                  textTransform: 'uppercase',
                }}
              >
                Vantagem patrimonial
              </div>
              <div
                style={{
                  fontSize: '12pt',
                  fontWeight: 700,
                  color: ORANGE,
                  lineHeight: 1.1,
                  marginTop: '2pt',
                }}
              >
                +{fmtBRL(c.patrimonyDifference)}
              </div>
              <div style={{ fontSize: '8pt', color: NAVY, fontWeight: 600 }}>
                +{fmtPct(c.patrimonyDifferencePercent, 2)} sobre à vista
              </div>
            </div>
          </LayerCard>
        </div>

        {/* ═══════ RESUMO NARRATIVO EXECUTIVO ═══════ */}
        <div
          style={{
            background: ORANGE_LIGHT,
            borderLeft: `3px solid ${ORANGE}`,
            borderRadius: '0 6px 6px 0',
            padding: '14pt 14pt',
            marginBottom: '10pt',
            overflow: 'hidden',
            
            ...AVOID_BREAK,
          }}
        >
          <Kicker>Resumo executivo</Kicker>
          <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.45, margin: '0 0 4px' }}>
            Nesta simulação, o <strong style={{ color: NAVY }}>consórcio</strong> viabiliza a
            aquisição de um imóvel de <strong>{fmtBRL(data.cashPropertyValue)}</strong>, aliado a uma
            estratégia de investimento dos recursos que não foram imobilizados na compra à vista.
          </p>
          <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.45, margin: '0 0 4px' }}>
            O capital investido gera uma renda mensal estimada de{' '}
            <strong style={{ color: NAVY }}>+{fmtBRL(c.monthlyYield)}</strong>, enquanto a
            parcela do consórcio é de <strong>{fmtBRL(c.monthlyInstallment)}</strong> — resultando em
            um {monthlyResultPositive ? 'excedente' : 'déficit'} mensal aproximado de{' '}
            <strong style={{ color: monthlyResultPositive ? NAVY : '#dc2626' }}>
              {fmtBRL(Math.abs(c.monthlyResult))}
            </strong>
            .
          </p>
          <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.45, margin: 0 }}>
            Ao final de <strong>{data.cashTermMonths} meses</strong>, o patrimônio total estimado
            considera o imóvel adquirido somado aos valores financeiros líquidos acumulados —
            preservando liquidez e poder de decisão ao longo de todo o período.
          </p>

        </div>

        {/* ═══════ COMPARAÇÃO FINAL ═══════ */}
        <div style={{ marginTop: '8px', ...AVOID_BREAK }}>
          <Kicker>Comparação final</Kicker>
          <div style={{ display: 'flex', gap: '8pt', marginTop: '8pt', ...AVOID_BREAK }}>
            <div
              style={{
                flex: 1,
                background: BG,
                border: `0.5px solid ${LINE}`,
                borderRadius: '8px',
                padding: '14px 10px',

                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '7.5pt',
                  color: MUTED,
                  letterSpacing: '0.5pt',
                  textTransform: 'uppercase',
                  marginBottom: '4pt',
                }}
              >
                Patrimônio à Vista
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: NAVY, lineHeight: 1.1 }}>
                {fmtBRL(c.cashFinalPatrimony)}
              </div>
              <div style={{ fontSize: '8pt', color: MUTED, marginTop: '2pt' }}>
                Apenas o imóvel
              </div>
            </div>

            <div
              style={{
                flex: 1,
                background: NAVY,
                color: '#fff',
                borderRadius: '8px',
                padding: '14px 10px',

                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '7.5pt',
                  color: ORANGE,
                  letterSpacing: '0.5pt',
                  textTransform: 'uppercase',
                  marginBottom: '4pt',
                  fontWeight: 700,
                }}
              >
                Patrimônio Consórcio
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
                {fmtBRL(c.consortiumFinalPatrimony)}
              </div>
              <div style={{ fontSize: '8pt', color: 'rgba(255,255,255,0.7)', marginTop: '2pt' }}>
                Imóvel + Investimento líquido
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '12pt',
              background: ORANGE,
              color: '#fff',
              borderRadius: '8px',
              padding: '14px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8pt',
              ...AVOID_BREAK,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '7.5pt',
                  color: 'rgba(255,255,255,0.85)',
                  letterSpacing: '0.5pt',
                  textTransform: 'uppercase',
                  marginBottom: '2pt',
                }}
              >
                Diferença Patrimonial
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
                +{fmtBRL(c.patrimonyDifference)}
              </div>
              <div style={{ fontSize: '9pt', color: 'rgba(255,255,255,0.85)', marginTop: '2pt' }}>
                {fmtPct(c.patrimonyDifferencePercent, 2)} a mais com consórcio
              </div>
            </div>
            <div
              style={{
                background: '#fff',
                color: ORANGE,
                padding: '8pt 14pt',
                borderRadius: '999px',
                fontSize: '14pt',
                fontWeight: 700,
              }}
            >
              +{fmtPct(c.patrimonyDifferencePercent, 1)}
            </div>
          </div>
        </div>

        </div>

        {/* Footer */}
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
                {[consultor, data.agencyName].filter(Boolean).join(' — ')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {data.managerEmail && (
                  <div style={{ color: ORANGE, fontSize: '11px', fontWeight: 600 }}>
                    {data.managerEmail}
                  </div>
                )}
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', whiteSpace: 'nowrap' }}>
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
