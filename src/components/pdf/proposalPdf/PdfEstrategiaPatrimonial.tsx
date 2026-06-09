import React from 'react';
import { PdfCover } from './PdfCover';
import { THEME, PAGE } from '@/components/pdf/proposta/theme';
import type { LibraryStrategy } from '@/components/modules/wealth/strategyLibraryData';
import {
  STRATEGY_EXECUTIVE_KPIS,
  EXECUTIVE_KPI_DEFAULT_SOURCE,
  type ExecutiveKpiPick,
} from '@/components/modules/wealth/strategyExecutiveKpis';
import type { StrategyCalcContext } from '@/contexts/WealthAssumptionsContext';

/**
 * PdfEstrategiaPatrimonial — template dedicado do módulo Estratégias Patrimoniais.
 *
 * REGRA: renderização pura. NÃO recalcula KPIs — consome
 * `strategy.calculations[].result(credit, ctx)` (mesma fonte usada pela UI)
 * e o mapa canônico `STRATEGY_EXECUTIVE_KPIS`. Engines financeiras inalteradas.
 *
 * THEME/PAGE importados do canônico (`proposta/theme`) — paleta unificada.
 * Header/Footer locais mantidos: layout difere do `primitives` (sem logo +
 * tagline próprios do módulo Wealth).
 *
 * `LibraryStrategy.icon` (LucideIcon) é ignorado no PDF — render é estático.
 */

export type PdfEstrategiaMode = 'single' | 'compare';

export interface PdfEstrategiaPatrimonialData {
  mode: PdfEstrategiaMode;
  /** 1 estratégia em 'single'; até 3 em 'compare' (Production Lock V2.4). */
  strategies: LibraryStrategy[];
  /** Crédito-base (do Simulador) usado pelas `calculations[].result(credit, ctx)`. */
  creditValue: number;
  calcContext: StrategyCalcContext;
  /** Vencedora recomendada do Compare (opcional). */
  winnerStrategyId?: string;

  clientName?: string;
  consultorName?: string;
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
const fmtPct = (n: number) => (Number.isFinite(n) ? `${(n * 100).toFixed(1).replace('.', ',')}%` : '—');

/** Resolve KPIs canônicos de uma estratégia (sem inventar fallback novo). */
function resolveKpis(
  strategy: LibraryStrategy,
  credit: number,
  ctx: StrategyCalcContext,
): Array<{ label: string; value: string; hero: boolean; source: 'engine' | 'editorial' }> {
  const picks: ExecutiveKpiPick[] | undefined = STRATEGY_EXECUTIVE_KPIS[strategy.id];
  if (!picks || picks.length === 0) {
    // Fallback: primeiras 3 calculations da própria estratégia.
    return (strategy.calculations ?? []).slice(0, 3).map((c, i) => ({
      label: c.label,
      value: c.result(credit, ctx),
      hero: i === 0,
      source: 'engine',
    }));
  }
  return picks.map((p) => {
    const calc = strategy.calculations[p.calculationIndex];
    return {
      label: p.label,
      value: calc ? calc.result(credit, ctx) : '—',
      hero: !!p.hero,
      source: p.source ?? EXECUTIVE_KPI_DEFAULT_SOURCE[p.kind],
    };
  });
}

function Header({ clientName }: { clientName?: string }) {
  return (
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
      <div
        style={{
          fontSize: '8pt',
          color: THEME.accent,
          fontWeight: 700,
          letterSpacing: '1pt',
          textTransform: 'uppercase',
        }}
      >
        Estratégias Patrimoniais
      </div>
      {clientName && (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '7.5pt', color: THEME.soft, textTransform: 'uppercase', letterSpacing: '0.5pt' }}>
            Cliente
          </div>
          <div style={{ fontSize: '11pt', fontWeight: 700, color: THEME.ink }}>{clientName}</div>
        </div>
      )}
    </div>
  );
}

function Footer({ data }: { data: PdfEstrategiaPatrimonialData }) {
  const line1 = [data.consultorName, data.managerRole, data.agencyName].filter(Boolean).join(' — ');
  const contact = [
    data.managerPhone && `Tel: ${data.managerPhone}`,
    data.managerWhatsapp && `WhatsApp: ${data.managerWhatsapp}`,
    data.managerEmail,
  ]
    .filter(Boolean)
    .join(' • ');
  return (
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
        {line1 && <div style={{ fontWeight: 700, color: THEME.primary, fontSize: '8pt' }}>{line1}</div>}
        {contact && <div style={{ marginTop: '1pt' }}>{contact}</div>}
      </div>
      <div style={{ fontSize: '7pt', color: THEME.soft, fontStyle: 'italic', maxWidth: '85mm', textAlign: 'right' }}>
        Documento educativo. Em estrita observância à Lei 11.795/2008 e à Resolução BCB nº 285/2023, não há garantia
        de contemplação em prazo determinado.
      </div>
    </div>
  );
}

function KpiCard({
  k,
  compact = false,
}: {
  k: { label: string; value: string; hero: boolean; source: 'engine' | 'editorial' };
  compact?: boolean;
}) {
  const isHero = k.hero;
  return (
    <div
      style={{
        background: isHero ? THEME.highlight : '#fff',
        border: `1px solid ${isHero ? THEME.accent : THEME.border}`,
        borderRadius: '6pt',
        padding: compact ? '8pt 10pt' : '10pt 12pt',
        breakInside: 'avoid' as const,
      }}
    >
      <div
        style={{
          fontSize: '7.5pt',
          color: THEME.muted,
          letterSpacing: '0.4pt',
          textTransform: 'uppercase',
          marginBottom: '3pt',
        }}
      >
        {k.label}
        {k.source === 'editorial' && (
          <span style={{ marginLeft: '4pt', fontStyle: 'italic', color: THEME.soft }}>~</span>
        )}
      </div>
      <div
        style={{
          fontSize: compact ? '11pt' : '13pt',
          fontWeight: 700,
          color: isHero ? THEME.accent : THEME.primary,
          lineHeight: 1.2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {k.value}
      </div>
    </div>
  );
}

function SinglePage({ data }: { data: PdfEstrategiaPatrimonialData }) {
  const strategy = data.strategies[0];
  const kpis = resolveKpis(strategy, data.creditValue, data.calcContext);

  return (
    <div data-pdf-page style={PAGE}>
      <Header clientName={data.clientName} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18pt', flex: '1 1 auto' }}>
        {/* Tese */}
        <div>
          <div
            style={{
              fontSize: '8.5pt',
              color: THEME.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.8pt',
              fontWeight: 600,
            }}
          >
            {strategy.chapter}
          </div>
          <h2
            style={{
              fontSize: '22pt',
              fontWeight: 700,
              color: THEME.ink,
              margin: '4pt 0 8pt',
              lineHeight: 1.15,
            }}
          >
            {strategy.title}
          </h2>
          <div style={{ width: '50pt', height: '3pt', background: THEME.accent, borderRadius: '2pt' }} />
          <p style={{ fontSize: '10.5pt', color: THEME.text, marginTop: '10pt', lineHeight: 1.6 }}>
            {strategy.tagline}
          </p>
        </div>

        {/* KPIs */}
        {kpis.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(kpis.length, 3)}, 1fr)`,
              gap: '10pt',
            }}
          >
            {kpis.map((k, i) => (
              <KpiCard key={i} k={k} />
            ))}
          </div>
        )}

        {/* Quando usar / Quando não usar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12pt' }}>
          <InfoBlock title="Quando usar" tone="success" items={strategy.advantages.slice(0, 4)} />
          <InfoBlock title="Quando não usar" tone="muted" items={strategy.whenNotToUse.slice(0, 4)} />
        </div>

        {/* Premissas */}
        <div
          style={{
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
            borderRadius: '6pt',
            padding: '12pt 14pt',
            breakInside: 'avoid' as const,
          }}
        >
          <div
            style={{
              fontSize: '8pt',
              color: THEME.accent,
              fontWeight: 700,
              letterSpacing: '1pt',
              textTransform: 'uppercase',
              marginBottom: '8pt',
            }}
          >
            Premissas da simulação
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10pt 14pt' }}>
            <Premise label="CDI a.a." value={fmtPct(data.calcContext.cdiGrossAnnual)} />
            <Premise label="CDI líquido a.a." value={fmtPct(data.calcContext.cdiAnnualLiq)} />
            <Premise label="Valorização a.a." value={fmtPct(data.calcContext.propertyAppreciation)} />
            <Premise label="Yield aluguel a.m." value={fmtPct(data.calcContext.rentalYield)} />
            <Premise label="Contemplação" value={`Mês ${data.calcContext.contemplationMonth}`} />
            <Premise label="Horizonte" value={`${data.calcContext.analysisMonths} meses`} />
            <Premise
              label="Tipo de venda"
              value={data.calcContext.tipoVendaCarta === 'carta-contemplada' ? 'Carta contemplada' : 'Cota não contemplada'}
            />
            <Premise
              label={data.calcContext.tipoVendaCarta === 'carta-contemplada' ? '% recebido' : 'Deságio'}
              value={fmtPct(
                data.calcContext.tipoVendaCarta === 'carta-contemplada'
                  ? data.calcContext.agioOnSale
                  : data.calcContext.discountOnSale,
              )}
            />
          </div>
        </div>
      </div>

      <Footer data={data} />
    </div>
  );
}

function InfoBlock({
  title,
  tone,
  items,
}: {
  title: string;
  tone: 'success' | 'muted';
  items: string[];
}) {
  const color = tone === 'success' ? THEME.success : THEME.muted;
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${THEME.border}`,
        borderLeft: `3pt solid ${color}`,
        borderRadius: '6pt',
        padding: '10pt 12pt',
        breakInside: 'avoid' as const,
      }}
    >
      <div
        style={{
          fontSize: '8pt',
          color,
          fontWeight: 700,
          letterSpacing: '1pt',
          textTransform: 'uppercase',
          marginBottom: '6pt',
        }}
      >
        {title}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: '9.5pt',
              color: THEME.text,
              lineHeight: 1.5,
              marginBottom: '4pt',
              paddingLeft: '10pt',
              position: 'relative',
            }}
          >
            <span style={{ position: 'absolute', left: 0, color }}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Premise({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '7.5pt', color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.4pt' }}>
        {label}
      </div>
      <div
        style={{
          fontSize: '10pt',
          fontWeight: 600,
          color: THEME.ink,
          marginTop: '2pt',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ComparePage({ data }: { data: PdfEstrategiaPatrimonialData }) {
  const strategies = data.strategies.slice(0, 3); // Production Lock V2.4: COMPARE_MAX=3

  return (
    <div data-pdf-page style={PAGE}>
      <Header clientName={data.clientName} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14pt', flex: '1 1 auto' }}>
        <div>
          <h2 style={{ fontSize: '20pt', fontWeight: 700, color: THEME.primary, margin: 0, lineHeight: 1.2 }}>
            Comparativo de até 3 teses
          </h2>
          <div style={{ width: '50pt', height: '3pt', background: THEME.accent, marginTop: '6pt', borderRadius: '2pt' }} />
          <p style={{ fontSize: '10pt', color: THEME.text, marginTop: '10pt', lineHeight: 1.55 }}>
            Análise paralela de {strategies.length} estratégias sobre a mesma carta de crédito de{' '}
            <strong style={{ color: THEME.ink }}>{fmtBRL(data.creditValue)}</strong>, com as premissas atuais da mesa
            consultiva.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${strategies.length}, 1fr)`, gap: '10pt' }}>
          {strategies.map((s) => {
            const isWinner = !!data.winnerStrategyId && s.id === data.winnerStrategyId;
            const kpis = resolveKpis(s, data.creditValue, data.calcContext).slice(0, 3);
            return (
              <div
                key={s.id}
                style={{
                  background: isWinner ? THEME.highlight : '#fff',
                  border: `1px solid ${isWinner ? THEME.accent : THEME.border}`,
                  borderRadius: '8pt',
                  padding: '12pt 12pt',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8pt',
                  breakInside: 'avoid' as const,
                }}
              >
                {isWinner && (
                  <div
                    style={{
                      fontSize: '7.5pt',
                      color: THEME.accent,
                      fontWeight: 700,
                      letterSpacing: '1pt',
                      textTransform: 'uppercase',
                    }}
                  >
                    Vencedora recomendada
                  </div>
                )}
                <div style={{ fontSize: '8pt', color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.6pt' }}>
                  {s.chapter}
                </div>
                <div style={{ fontSize: '12pt', fontWeight: 700, color: THEME.ink, lineHeight: 1.25 }}>{s.title}</div>
                <p style={{ fontSize: '8.5pt', color: THEME.muted, margin: 0, lineHeight: 1.5 }}>{s.tagline}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6pt', marginTop: '4pt' }}>
                  {kpis.map((k, i) => (
                    <KpiCard key={i} k={k} compact />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p
          style={{
            fontSize: '8.5pt',
            color: THEME.muted,
            fontStyle: 'italic',
            margin: 0,
            lineHeight: 1.5,
            background: THEME.surface,
            border: `1px dashed ${THEME.border}`,
            borderRadius: '6pt',
            padding: '8pt 10pt',
          }}
        >
          Comparativo educativo. KPIs calculados pela engine canônica da simulação; itens marcados com{' '}
          <strong>~</strong> são estimativas editoriais de mercado. Não há garantia de contemplação em prazo
          determinado (Lei 11.795/2008).
        </p>
      </div>

      <Footer data={data} />
    </div>
  );
}

export function PdfEstrategiaPatrimonial({ data }: { data: PdfEstrategiaPatrimonialData }) {
  const moduleName = data.mode === 'compare' ? 'Comparativo de Estratégias' : 'Estratégia Patrimonial';
  return (
    <div style={{ width: '210mm', margin: '0 auto', background: '#fff' }}>
      <PdfCover
        moduleName={moduleName}
        clientName={data.clientName}
        consultorName={data.consultorName || data.managerName}
        creditValue={fmtBRL(data.creditValue)}
        logoDataUrl={data.logoDataUrl}
      />
      {data.mode === 'compare' ? <ComparePage data={data} /> : <SinglePage data={data} />}
    </div>
  );
}
