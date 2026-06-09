import React from 'react';
import { PdfCover } from '@/components/pdf/proposalPdf/PdfCover';
import { THEME, PAGE_COMPACT } from '@/components/pdf/proposta/theme';
import type { LibraryStrategy } from '@/components/modules/wealth/strategyLibraryData';
import type { SimulationInput, SimulationResult } from '@/types/consortium';
import type { WealthAssumptions, StrategyCalcContext } from '@/contexts/WealthAssumptionsContext';
import { CONSORTIUM_TYPE_LABELS } from '@/types/consortium';

/**
 * PdfEstrategiasPatrimoniais — PDF consolidado com múltiplas estratégias
 * selecionadas pelo consultor na biblioteca patrimonial.
 *
 * Estrutura:
 *   1. Capa (PdfCover)
 *   2. Dados do Consórcio + Premissas da Simulação (2 colunas)
 *   3. Sumário numerado
 *   4..N. Uma seção por estratégia (pode ocupar várias páginas físicas).
 *
 * REGRA: render puro. Todos os números vêm de
 *   • `useSimulatorInput()` / `useSimulatorResult()` (consórcio)
 *   • `useWealthAssumptions().calcContext` (premissas)
 *   • `strategy.calculations[].result(credit, calcContext)` (já calculado)
 * Zero recálculo aqui.
 */

export interface PdfEstrategiasPatrimoniaisData {
  strategies: LibraryStrategy[];
  simulatorInput: SimulationInput | null;
  simulatorResult: SimulationResult | null;
  assumptions: WealthAssumptions;
  calcContext: StrategyCalcContext;

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

const fmtBRL = (n: number | null | undefined) =>
  Number.isFinite(n as number)
    ? (n as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : '—';
const fmtPctRaw = (n: number | null | undefined) =>
  Number.isFinite(n as number) ? `${(n as number).toFixed(2).replace('.', ',')}%` : '—';
const fmtPctProp = (n: number | null | undefined) =>
  Number.isFinite(n as number) ? `${((n as number) * 100).toFixed(2).replace('.', ',')}%` : '—';

// ──────────────────────────────────────────────────────────────────────
// Header / Footer locais
// ──────────────────────────────────────────────────────────────────────
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
          <div
            style={{ fontSize: '7.5pt', color: THEME.soft, textTransform: 'uppercase', letterSpacing: '0.5pt' }}
          >
            Cliente
          </div>
          <div style={{ fontSize: '11pt', fontWeight: 700, color: THEME.ink }}>{clientName}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Footer navy padrão (alinhado a PdfEstudoLances / PdfOperacoesEstruturadas):
 *  • Fundo navy full-width via `margin: '0 -22mm'`
 *  • Esquerda: consultor — cargo — agência (branco)
 *  • Centro:   disclaimer institucional itálico (branco)
 *  • Direita:  email + paginação X/Y (laranja)
 *  • SEM telefone, SEM WhatsApp, SEM "Gerado em", SEM watermark de rodapé.
 * Dados vêm SEMPRE de `data` (pdfCtx) — nada hardcoded.
 */
function Footer({
  data,
  pageNumber,
  totalPages,
}: {
  data: PdfEstrategiasPatrimoniaisData;
  pageNumber: number;
  totalPages: number;
}) {
  const consultor = [data.consultorName ?? data.managerName, data.managerRole]
    .filter(Boolean)
    .join(' — ');
  const consultorAgency = [consultor, data.agencyName].filter(Boolean).join(' — ');
  const pageLabel = `${pageNumber} / ${totalPages}`;

  return (
    <div>
      <div
        style={{
          background: THEME.primary,
          padding: '9px 28px',
          margin: '0 -22mm',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          breakInside: 'avoid' as const,
          pageBreakInside: 'avoid' as const,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#fff', opacity: 0.85, fontSize: '11px', lineHeight: 1.4 }}>
            {consultorAgency}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {data.managerEmail && (
              <>
                <div style={{ color: THEME.accent, fontSize: '11px', fontWeight: 600 }}>
                  {data.managerEmail}
                </div>
                <div style={{ color: THEME.accent, fontSize: '11px', fontWeight: 600 }}>·</div>
              </>
            )}
            <div
              style={{
                color: THEME.accent,
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {pageLabel}
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
          Documento educativo. Em estrita observância à Lei 11.795/2008 e à Resolução BCB nº 285/2023,
          não há garantia de contemplação em prazo determinado.
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Blocos auxiliares
// ──────────────────────────────────────────────────────────────────────
const AVOID = {
  breakInside: 'avoid' as const,
  pageBreakInside: 'avoid' as const,
};

// Container de uma estratégia = "página lógica" SEM altura mínima.
// Mantém largura A4, margens internas, Header e Footer próprios, e quebra
// de página antes (exceto a primeira estratégia, controlada por prop).
// Sem `minHeight` para não gerar páginas em branco quando o conteúdo é curto.
// Padding interno mínimo: @page já injeta 20mm/22mm de margem física.
// Conteúdo de cada estratégia precisa caber em ~255mm de área imprimível.
const STRATEGY_PAGE: React.CSSProperties = {
  width: '210mm',
  background: '#fff',
  padding: '6mm 14mm 6mm 14mm',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  color: THEME.text,
  fontSize: '9pt',
  lineHeight: 1.4,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '3pt',
};


function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '8pt',
        color: THEME.accent,
        fontWeight: 700,
        letterSpacing: '1pt',
        textTransform: 'uppercase',
        marginBottom: '3pt',
      }}
    >
      {children}
    </div>
  );
}

function KeyValueRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: '8pt',
        padding: '4pt 0',
        borderBottom: `1px dashed ${THEME.border}`,
      }}
    >
      <span style={{ fontSize: '9pt', color: THEME.muted }}>{label}</span>
      <span
        style={{
          fontSize: '10pt',
          fontWeight: 600,
          color: THEME.ink,
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function InfoList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: 'success' | 'muted' | 'warning' | 'destructive';
  items: string[];
}) {
  const color =
    tone === 'success' ? THEME.success
    : tone === 'warning' ? THEME.accent
    : tone === 'destructive' ? '#B91C1C'
    : THEME.muted;
  const hasItems = items && items.length > 0;
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${THEME.border}`,
        borderLeft: `3pt solid ${color}`,
        borderRadius: '6pt',
        padding: '5pt 6pt',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        ...AVOID,
      }}
    >
      <div
        style={{
          display: 'block',
          fontSize: '8pt',
          color: THEME.ink,
          fontWeight: 800,
          letterSpacing: '0.6pt',
          textTransform: 'uppercase',
          marginBottom: '3pt',
          paddingBottom: '2pt',
          borderBottom: `1px solid ${color}`,
        }}
      >
        {title}
      </div>

      {hasItems ? (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {items.map((item, i) => (
            <li
              key={i}
              style={{
                fontSize: '8pt',
                color: THEME.text,
                lineHeight: 1.35,
                marginBottom: '2pt',
                paddingLeft: '5pt',
                position: 'relative',
              }}
            >
              <span style={{ position: 'absolute', left: 0, color }}>•</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ fontSize: '8pt', color: THEME.soft, fontStyle: 'italic' }}>—</div>
      )}
    </div>
  );
}

// Célula de tabela 2x2 — título sempre visível, bullets contidos na <td>.
// Usar <table> em vez de flex elimina o vazamento de bullets quando o
// renderizador de PDF lida com conteúdo longo (caso "Venda da Carta").
function QuadrantCell({ title, color, items }: { title: string; color: string; items: string[] }) {
  const list = items && items.length > 0 ? items : ['—'];
  return (
    <td
      style={{
        width: '50%',
        verticalAlign: 'top',
        padding: '0 2.5pt',
        overflow: 'hidden',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      }}
    >
      <div
        style={{
          background: '#fff',
          border: `1px solid ${THEME.border}`,
          borderLeft: `3pt solid ${color}`,
          borderRadius: '6pt',
          padding: '5pt 6pt',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}
      >
        <div
          style={{
            display: 'block',
            fontSize: '8pt',
            color: THEME.ink,
            fontWeight: 800,
            letterSpacing: '0.6pt',
            textTransform: 'uppercase',
            marginBottom: '3pt',
            paddingBottom: '2pt',
            borderBottom: `1px solid ${color}`,
          }}
        >
          {title}
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {list.map((item, i) => (
            <li
              key={i}
              style={{
                fontSize: '8pt',
                color: item === '—' ? THEME.soft : THEME.text,
                fontStyle: item === '—' ? 'italic' : 'normal',
                lineHeight: 1.35,
                marginBottom: '2pt',
                paddingLeft: '8pt',
                textIndent: '-6pt',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
              }}
            >
              <span style={{ color, fontWeight: 700 }}>• </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </td>
  );
}



// ──────────────────────────────────────────────────────────────────────
// Page 2 — Dados do Consórcio + Premissas
// ──────────────────────────────────────────────────────────────────────
function ContextPage({ data, totalPages }: { data: PdfEstrategiasPatrimoniaisData; totalPages: number }) {
  const { simulatorInput: si, simulatorResult: sr, assumptions: a, calcContext: ctx } = data;
  const consortiumLabel =
    si?.consortiumType ? CONSORTIUM_TYPE_LABELS[si.consortiumType] ?? si.consortiumType : '—';

  return (
    <div data-pdf-page style={PAGE_COMPACT}>
      <Header clientName={data.clientName} />

      <div style={{ marginBottom: '14pt' }}>
        <h2 style={{ fontSize: '18pt', fontWeight: 700, color: THEME.ink, margin: 0, lineHeight: 1.2 }}>
          Dados do consórcio &amp; premissas
        </h2>
        <div
          style={{ width: '50pt', height: '3pt', background: THEME.accent, marginTop: '6pt', borderRadius: '2pt' }}
        />
        <p style={{ fontSize: '9.5pt', color: THEME.muted, marginTop: '8pt', lineHeight: 1.55 }}>
          Parâmetros operacionais e premissas patrimoniais que alimentam todos os cálculos das estratégias
          a seguir. Mantidos vivos pela mesa consultiva.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14pt' }}>
        {/* Bloco 1 — Dados do consórcio */}
        <div
          style={{
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
            borderRadius: '6pt',
            padding: '12pt 14pt',
            ...AVOID,
          }}
        >
          <SectionTitle>Dados do consórcio</SectionTitle>
          <KeyValueRow label="Modalidade" value={consortiumLabel} />
          <KeyValueRow label="Carta de crédito" value={fmtBRL(si?.creditValue)} />
          <KeyValueRow label="Prazo" value={si ? `${si.termMonths} meses` : '—'} />
          <KeyValueRow label="Taxa de administração" value={si ? fmtPctRaw(si.adminFeePercent) : '—'} />
          <KeyValueRow label="Fundo de reserva" value={si ? fmtPctRaw(si.reserveFundPercent) : '—'} />
          <KeyValueRow
            label="Seguro prestamista (mensal)"
            value={sr && Number.isFinite(sr.monthlyInsurance) ? fmtBRL(sr.monthlyInsurance) : '—'}
          />
          <KeyValueRow
            label="Parcela estimada"
            value={
              sr && Number.isFinite(sr.fullInstallment)
                ? fmtBRL(sr.fullInstallment)
                : sr && Number.isFinite(sr.installmentBeforeContemplation)
                  ? fmtBRL(sr.installmentBeforeContemplation)
                  : '—'
            }
          />
          <KeyValueRow label="Mês de contemplação" value={`Mês ${ctx.contemplationMonth}`} />
          <KeyValueRow label="Custo total" value={fmtBRL(sr?.totalCost)} />
        </div>

        {/* Bloco 2 — Premissas da simulação */}
        <div
          style={{
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
            borderRadius: '6pt',
            padding: '12pt 14pt',
            ...AVOID,
          }}
        >
          <SectionTitle>Premissas da simulação</SectionTitle>
          <KeyValueRow label="CDI (% a.a.)" value={fmtPctRaw(a.cdiRate)} />
          <KeyValueRow label="% do CDI praticado" value={fmtPctRaw(a.cdiPercent)} />
          <KeyValueRow label="CDI líquido (a.a.)" value={fmtPctProp(ctx.cdiAnnualLiq)} />
          <KeyValueRow label="Valorização imóvel (a.a.)" value={fmtPctRaw(a.propertyAppreciation)} />
          <KeyValueRow label="Yield aluguel (a.m.)" value={fmtPctRaw(a.rentalYield)} />
          <KeyValueRow label="Mês de contemplação" value={`Mês ${a.contemplationMonth}`} />
          <KeyValueRow label="Prazo da análise" value={`${a.analysisMonths} meses`} />
          <KeyValueRow
            label="Tipo de venda"
            value={a.tipoVendaCarta === 'carta-contemplada' ? 'Carta contemplada' : 'Cota não contemplada'}
          />
          <KeyValueRow
            label={a.tipoVendaCarta === 'carta-contemplada' ? '% recebido na venda' : 'Deságio na venda'}
            value={fmtPctRaw(
              a.tipoVendaCarta === 'carta-contemplada' ? a.agioOnSale : a.discountOnSale,
            )}
          />
        </div>
      </div>

      <Footer data={data} pageNumber={2} totalPages={totalPages} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Page 3 — Sumário
// ──────────────────────────────────────────────────────────────────────
function SummaryPage({ data, totalPages }: { data: PdfEstrategiasPatrimoniaisData; totalPages: number }) {
  // Páginas lógicas: 1=Capa, 2=Contexto, 3=Sumário, 4=fluxo contínuo de estratégias.
  const STRATEGIES_START_PAGE = 4;
  return (
    <div data-pdf-page style={PAGE_COMPACT}>
      <Header clientName={data.clientName} />

      <div style={{ marginBottom: '14pt' }}>
        <h2 style={{ fontSize: '18pt', fontWeight: 700, color: THEME.ink, margin: 0, lineHeight: 1.2 }}>
          Sumário
        </h2>
        <div
          style={{ width: '50pt', height: '3pt', background: THEME.accent, marginTop: '6pt', borderRadius: '2pt' }}
        />
        <p style={{ fontSize: '9.5pt', color: THEME.muted, marginTop: '8pt', lineHeight: 1.55 }}>
          {data.strategies.length}{' '}
          {data.strategies.length === 1 ? 'estratégia selecionada' : 'estratégias selecionadas'} para este estudo.
        </p>
      </div>

      <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {data.strategies.map((s, i) => (
          <li
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '10pt',
              padding: '8pt 0',
              borderBottom: `1px solid ${THEME.border}`,
            }}
          >
            <span
              style={{
                fontSize: '10pt',
                fontWeight: 700,
                color: THEME.accent,
                minWidth: '22pt',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ flex: 1 }}>
              <div style={{ fontSize: '11pt', fontWeight: 600, color: THEME.ink, lineHeight: 1.3 }}>
                {s.title}
              </div>
              <div
                style={{
                  fontSize: '8pt',
                  color: THEME.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5pt',
                  marginTop: '2pt',
                }}
              >
                {s.chapter}
              </div>
            </span>
            <span
              style={{
                fontSize: '9.5pt',
                fontWeight: 600,
                color: THEME.primary,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              p. {STRATEGIES_START_PAGE + i}
            </span>
          </li>
        ))}
      </ol>

      <Footer data={data} pageNumber={3} totalPages={totalPages} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Estratégia dentro do fluxo contínuo
// ──────────────────────────────────────────────────────────────────────
function StrategySection({
  data,
  strategy,
  index,
  pageNumber,
  totalPages,
  forceBreak,
}: {
  data: PdfEstrategiasPatrimoniaisData;
  strategy: LibraryStrategy;
  index: number;
  pageNumber: number;
  totalPages: number;
  forceBreak: boolean;
}) {
  const credit =
    data.simulatorInput?.creditValue && data.simulatorInput.creditValue > 0
      ? data.simulatorInput.creditValue
      : 300_000;

  return (
    <section
      {...(forceBreak ? { 'data-pdf-page': true } : {})}
      style={STRATEGY_PAGE}
    >
        <Header clientName={data.clientName} />
        {/* Header da seção */}
        <div style={AVOID}>
          <div
            style={{
              fontSize: '8pt',
              color: THEME.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.8pt',
              fontWeight: 600,
            }}
          >
            Estratégia {String(index + 1).padStart(2, '0')} · {strategy.chapter}
          </div>
          <h2
            style={{
              fontSize: '15pt',
              fontWeight: 700,
              color: THEME.ink,
              margin: '1pt 0 2pt',
              lineHeight: 1.15,
            }}
          >
            {strategy.title}
          </h2>
          <div style={{ width: '40pt', height: '2pt', background: THEME.accent, borderRadius: '2pt' }} />
          <p style={{ fontSize: '8pt', color: THEME.text, marginTop: '2pt', lineHeight: 1.3 }}>
            {strategy.tagline}
          </p>
        </div>

        {/* Como funciona & Racional */}
        <div
          style={{
            background: '#fff',
            border: `1px solid ${THEME.border}`,
            borderRadius: '6pt',
            padding: '5pt 6pt',
            ...AVOID,
          }}
        >
          <SectionTitle>Como funciona &amp; racional</SectionTitle>
          <NarrativeRow label="Como funciona" text={strategy.howItWorks} />
          <NarrativeRow label="Lógica patrimonial" text={strategy.patrimonialLogic} />
          <NarrativeRow label="Impacto na liquidez" text={strategy.liquidityImpact} />
          <NarrativeRow label="Quando aplicar" text={strategy.timing} last />
        </div>

        {/* Apoio à decisão — tabela 2x2 (cada quadrante contido em <td>) */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0',
            tableLayout: 'fixed',
            ...AVOID,
          }}
        >
          <tbody>
            <tr>
              <QuadrantCell title="VANTAGENS ESTRUTURAIS" color={THEME.success} items={strategy.advantages ?? []} />
              <QuadrantCell title="RISCOS" color={THEME.accent} items={strategy.risks ?? []} />
            </tr>
          </tbody>
        </table>

        {/* Cálculos ilustrativos */}
        {strategy.calculations && strategy.calculations.length > 0 && (
          <div
            style={{
              background: THEME.surface,
              border: `1px solid ${THEME.border}`,
              borderRadius: '6pt',
              padding: '5pt 6pt',
              ...AVOID,
            }}
          >
            <SectionTitle>Cálculos ilustrativos</SectionTitle>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '8pt',
                tableLayout: 'fixed',
              }}
            >
              <thead>
                <tr>
                  <Th width="60%">Indicador</Th>
                  <Th width="40%" align="right">Resultado</Th>
                </tr>
              </thead>
              <tbody>
                {strategy.calculations.map((c, i) => {
                  const sr = data.simulatorResult;
                  const calcContext = sr && Number.isFinite(sr.fullInstallment)
                    ? { ...data.calcContext, fullInstallment: sr.fullInstallment }
                    : data.calcContext;

                  // Override 1: "Custo total no consórcio" usa custo real do SimulatorContext
                  const isCustoTotal = /^custo total no cons[oó]rcio$/i.test(c.label.trim());
                  const realTotal = sr?.totalCost;
                  const useCusto = isCustoTotal && Number.isFinite(realTotal as number) && (realTotal as number) > 0;

                  const resultText = useCusto
                    ? fmtBRL(realTotal)
                    : (() => {
                        try { return c.result(credit, calcContext); } catch { return '—'; }
                      })();
                  return (
                    <tr key={i}>
                      <Td>{c.label}</Td>
                      <Td align="right" strong>{resultText}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}


        {/* Cenários de aplicação — sem AVOID no wrapper, quebra natural */}
        {strategy.scenarios && strategy.scenarios.length > 0 && (
          <div style={{ marginBottom: '4pt' }}>
            <SectionTitle>Cenários de aplicação</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4pt' }}>
              {strategy.scenarios.map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: '#fff',
                    border: `1px solid ${THEME.border}`,
                    borderLeft: `3pt solid ${THEME.primary}`,
                    borderRadius: '6pt',
                    padding: '4pt 6pt',
                    ...AVOID,
                  }}
                >
                  <div style={{ fontSize: '8pt', fontWeight: 700, color: THEME.primary }}>
                    {s.context}
                  </div>
                  <div style={{ fontSize: '8pt', color: THEME.text, marginTop: '1.5pt', lineHeight: 1.35 }}>
                    {s.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparativos vs alternativas — não quebrar tabela entre páginas */}
        {strategy.comparisons && strategy.comparisons.length > 0 && (
          <div
            style={{
              background: '#fff',
              border: `1px solid ${THEME.border}`,
              borderRadius: '6pt',
              padding: '6pt 7pt',
              marginBottom: '4pt',
              breakInside: 'avoid',
              pageBreakInside: 'avoid',
            }}
          >
            <SectionTitle>Comparativos vs alternativas</SectionTitle>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '8pt',
                tableLayout: 'fixed',
              }}
            >
              <thead>
                <tr>
                  <Th width="28%">Métrica</Th>
                  <Th width="24%">Consórcio</Th>
                  <Th width="24%">Alternativa</Th>
                  <Th width="24%" align="right">Diferença</Th>
                </tr>
              </thead>
              <tbody>
                {strategy.comparisons.map((c, i) => (
                  <tr key={i}>
                    <Td>{c.label}</Td>
                    <Td>{c.consortium}</Td>
                    <Td>{c.alternative}</Td>
                    <Td align="right" strong>{c.delta}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Footer data={data} pageNumber={pageNumber} totalPages={totalPages} />
      </section>
  );
}

function NarrativeRow({ label, text, last }: { label: string; text: string; last?: boolean }) {
  if (!text) return null;
  return (
    <div
      style={{
        paddingBottom: last ? 0 : '4pt',
        marginBottom: last ? 0 : '4pt',
        borderBottom: last ? 'none' : `1px dashed ${THEME.border}`,
      }}
    >
      <div
        style={{
          fontSize: '7.5pt',
          color: THEME.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.6pt',
          fontWeight: 700,
          marginBottom: '1.5pt',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '8pt', color: THEME.text, lineHeight: 1.35 }}>{text}</div>
    </div>
  );
}

function Th({
  children,
  width,
  align = 'left',
}: {
  children: React.ReactNode;
  width?: string;
  align?: 'left' | 'right';
}) {
  return (
    <th
      style={{
        width,
        textAlign: align,
        fontSize: '7.5pt',
        textTransform: 'uppercase',
        letterSpacing: '0.5pt',
        color: THEME.muted,
        fontWeight: 700,
        padding: '3pt 4pt',
        borderBottom: `1px solid ${THEME.border}`,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
  strong,
  muted,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <td
      style={{
        textAlign: align,
        fontSize: '8pt',
        color: muted ? THEME.muted : THEME.text,
        fontWeight: strong ? 700 : 400,
        padding: '3pt 4pt',
        borderBottom: `1px solid ${THEME.border}`,
        fontVariantNumeric: 'tabular-nums',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      }}
    >
      {children}
    </td>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Componente raiz
// ──────────────────────────────────────────────────────────────────────
export function PdfEstrategiasPatrimoniais({ data }: { data: PdfEstrategiasPatrimoniaisData }) {
  // Páginas lógicas: 1=Capa, 2=Contexto, 3=Sumário, 4..N=uma página por estratégia.
  const STRATEGIES_START_PAGE = 4;
  const totalPages = STRATEGIES_START_PAGE - 1 + Math.max(1, data.strategies.length);
  return (
    <div style={{ width: '210mm', margin: '0 auto', background: '#fff' }}>
      <PdfCover
        moduleName="Estratégias Patrimoniais"
        subtitle="Estudo consultivo personalizado"
        clientName={data.clientName}
        consultorName={data.consultorName || data.managerName}
        creditValue={data.simulatorInput?.creditValue ? fmtBRL(data.simulatorInput.creditValue) : undefined}
        logoDataUrl={data.logoDataUrl}
      />
      <ContextPage data={data} totalPages={totalPages} />
      <SummaryPage data={data} totalPages={totalPages} />
      {data.strategies.map((s, i) => (
        <StrategySection
          key={s.id}
          data={data}
          strategy={s}
          index={i}
          pageNumber={STRATEGIES_START_PAGE + i}
          totalPages={totalPages}
          forceBreak={true}
        />
      ))}
    </div>
  );
}
