import React from 'react';
import { sanitizeLogoDataUrl } from '@/hooks/usePdfProfile';
import { THEME, BLOCK_GAP, INNER_GAP } from './theme';
import type { PdfPropostaCompletaData } from './types';

/** Legenda explicativa abaixo de um gráfico — sempre presente para conduzir a leitura. */
export function ChartCaption({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '9.5pt', color: '#475569', fontStyle: 'italic', margin: '4pt 0 0', lineHeight: 1.5 }}>
      {children}
    </p>
  );
}

// ════════ PIECES ════════
/**
 * Header — Topbar navy padronizada com os demais PDFs do projeto.
 * Background #003641 full-width (margin negativa para furar o padding lateral
 * da PAGE de 22mm). Logo CAIXA à esquerda + "CAIXA Consórcio" 13px/500 branco;
 * eyebrow (módulo da página) à direita em branco maiúsculas 11px.
 * O nome do cliente foi REMOVIDO daqui (deve aparecer no conteúdo, se necessário).
 */
export function Header({ data, eyebrow }: { data: PdfPropostaCompletaData; eyebrow?: string }) {
  const safeLogo = sanitizeLogoDataUrl(data.logoDataUrl);
  const rightLabel = (eyebrow ?? 'Proposta Consultiva').toUpperCase();
  return (
    <div style={{
      background: '#003641',
      margin: '0 -22mm 14pt',
      padding: '8px 22mm',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12pt',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10pt', minWidth: 0 }}>
        {safeLogo && (
          <img
            src={safeLogo}
            alt=""
            style={{ maxHeight: '28pt', maxWidth: '90pt', objectFit: 'contain', display: 'block' }}
          />
        )}
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
          CAIXA Consórcio
        </div>
      </div>
      <div style={{
        fontSize: '11px',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '0.6pt',
        fontWeight: 500,
        textAlign: 'right',
        whiteSpace: 'nowrap',
      }}>
        {rightLabel}
      </div>
    </div>
  );
}

/**
 * CSS injetado uma única vez (idempotente) no documento de impressão.
 *
 * X (atual): `.pdf-page-current::before` usa `counter(page)` (counter-reset/increment
 *   já definidos em `pdfGenerator.tsx`). Funciona perfeitamente no Chromium headless.
 *
 * Y (total): NÃO usamos `counter(pages)` (não resolve no Browserless/Chromium nesse
 *   pipeline — renderiza 0) e NÃO usamos script inline (não roda confiavelmente no
 *   pipeline de print do Browserless). O total é passado como prop explícita
 *   `totalPages` pelo orquestrador `PdfPropostaCompleta` → cada page → Footer.
 *
 * Quebra de página entre `[data-pdf-page]` é injetada exclusivamente pela regra global
 * `break-before: page` em `pdfGenerator.tsx`.
 */
const PRINT_RUNTIME_CSS = `
  .pdf-page-current::before {
    content: counter(page);
    font-variant-numeric: tabular-nums;
  }
`;

function FooterInner({
  data,
  pushDown,
  pageNumber,
  totalPages,
}: {
  data: PdfPropostaCompletaData;
  pushDown: boolean;
  pageNumber?: number;
  totalPages?: number;
}) {
  const consultorLine = [data.managerName, data.managerRole, data.agencyName].filter(Boolean).join(' — ');
  const email = data.managerEmail;
  const hasTotal = typeof totalPages === 'number' && totalPages > 0;
  const hasExplicitCurrent = typeof pageNumber === 'number';
  return (
    <>
      {/* Idempotente: múltiplas instâncias do mesmo CSS são inofensivas. */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_RUNTIME_CSS }} />
      <div style={{
        // pushDown=true: marginTop:auto empurra para o fim da PAGE flex (padrão).
        // pushDown=false: Footer fica logo após o conteúdo (variante compact).
        marginTop: pushDown ? 'auto' : '18pt',
        background: '#003641',
        // Margem negativa LATERAL espelha o padding lateral da PAGE (22mm) → full-width horizontal.
        // SEM marginBottom negativo — causa overflow vertical no Chromium e gera folha extra em branco.
        marginLeft: '-22mm',
        marginRight: '-22mm',
        paddingLeft: '22mm',
        paddingRight: '22mm',
        paddingTop: '10pt',
        paddingBottom: '14pt',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '12pt',
        fontSize: '7.5pt',
        color: '#fff',
        flexShrink: 0,
      }}>
        {/* Esquerda: consultor / cargo / agência */}
        <div style={{ minWidth: 0, flex: '0 1 auto' }}>
          {consultorLine && (
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '8pt', lineHeight: 1.35 }}>
              {consultorLine}
            </div>
          )}
        </div>

        {/* Centro: disclaimer itálico */}
        <div style={{
          fontSize: '7pt',
          color: '#fff',
          fontStyle: 'italic',
          textAlign: 'center',
          flex: '1 1 auto',
          maxWidth: '90mm',
          lineHeight: 1.4,
        }}>
          Estudo educativo. Sem garantia de prazo de contemplação (Lei 11.795/2008).
        </div>

        {/* Direita: email laranja + paginação X / Y.
            X = pageNumber explícito OU counter(page) via CSS (nativo Chromium).
            Y = totalPages explícito (prop obrigatória vinda do orquestrador). */}
        <div style={{
          textAlign: 'right',
          fontSize: '8pt',
          flex: '0 1 auto',
          whiteSpace: 'nowrap',
        }}>
          {email && (
            <span style={{ color: '#F5821F', fontWeight: 500 }}>{email}</span>
          )}
          {email && hasTotal && <span style={{ color: '#fff', margin: '0 6pt' }}>·</span>}
          {hasTotal && (
            <span style={{ color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
              {hasExplicitCurrent ? <>{pageNumber}</> : <span className="pdf-page-current" />}
              {' / '}{totalPages}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export function Footer({
  data,
  pageNumber,
  totalPages,
}: {
  data: PdfPropostaCompletaData;
  pageNumber?: number;
  totalPages?: number;
}) {
  return <FooterInner data={data} pushDown pageNumber={pageNumber} totalPages={totalPages} />;
}

/**
 * FooterCompact — variante para uso com `PAGE_COMPACT` + `PageBodyCompact`.
 * Sem `marginTop: auto` → fica logo após o conteúdo, sem vazio vertical.
 */
export function FooterCompact({
  data,
  pageNumber,
  totalPages,
}: {
  data: PdfPropostaCompletaData;
  pageNumber?: number;
  totalPages?: number;
}) {
  return <FooterInner data={data} pushDown={false} pageNumber={pageNumber} totalPages={totalPages} />;
}

/**
 * Body padronizado: agrupa o conteúdo principal numa coluna flex, com gap fixo de 24pt
 * entre blocos top-level. Usar dentro de PAGE — o Footer entra logo depois com marginTop:auto.
 */
export function PageBody({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: BLOCK_GAP,
      flex: '1 1 auto',
      minHeight: 0,
    }}>
      {children}
    </div>
  );
}

/**
 * PageBodyCompact — variante para `PAGE_COMPACT`. Sem `flex: 1` → o body
 * encolhe para a altura do conteúdo e o Footer (use `FooterCompact`) entra
 * logo abaixo. Elimina o "vazio" entre conteúdo curto e rodapé.
 */
export function PageBodyCompact({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: BLOCK_GAP,
    }}>
      {children}
    </div>
  );
}

export function SectionTitle({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div>
      {kicker && (
        <div style={{ fontSize: '8pt', color: THEME.accent, fontWeight: 700, letterSpacing: '1pt', textTransform: 'uppercase', marginBottom: '4pt' }}>
          {kicker}
        </div>
      )}
      <h2 style={{ fontSize: '18pt', fontWeight: 700, color: THEME.primary, margin: 0, lineHeight: 1.2 }}>{title}</h2>
      <div style={{ width: '36pt', height: '3pt', background: THEME.accent, marginTop: '6pt', borderRadius: '2pt' }} />
    </div>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.65, margin: 0 }}>
      {children}
    </p>
  );
}

export function MetricCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'primary' | 'success' | 'accent' }) {
  const color = tone === 'primary' ? THEME.primary : tone === 'success' ? THEME.success : tone === 'accent' ? THEME.accent : THEME.ink;
  return (
    <div style={{
      background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: '6pt',
      padding: '10pt 12pt',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: '46pt',
      breakInside: 'avoid' as const,
    }}>
      <div style={{ fontSize: '8pt', color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.4pt', marginBottom: '4pt' }}>{label}</div>
      <div style={{ fontSize: '14pt', fontWeight: 700, color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

export function MetricGrid({ cols = 3, children }: { cols?: 2 | 3 | 4; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: INNER_GAP, alignItems: 'stretch' }}>
      {children}
    </div>
  );
}

export function BigNumber({ label, value, tone = 'primary' }: { label: string; value: string; tone?: 'primary' | 'accent' | 'success' }) {
  const color = tone === 'accent' ? THEME.accent : tone === 'success' ? THEME.success : THEME.primary;
  const bg = tone === 'success' ? THEME.successSoft : THEME.highlight;
  return (
    <div style={{ background: bg, border: `1px solid ${THEME.border}`, borderRadius: '8pt', padding: '14pt 16pt' }}>
      <div style={{ fontSize: '8pt', color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.5pt', marginBottom: '4pt' }}>{label}</div>
      <div style={{ fontSize: '24pt', fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}

// ════════ EXTRA PRIMITIVES (denso) ════════

/** Tabela compacta para PDF — linhas zebradas, alinhamento por coluna. */
export function PdfTable({
  headers,
  rows,
  align,
  caption,
}: {
  headers: string[];
  rows: Array<Array<string | number>>;
  align?: Array<'left' | 'right' | 'center'>;
  caption?: string;
}) {
  return (
    <div style={{ breakInside: 'avoid' as const }}>
      {caption && (
        <div style={{ fontSize: '9pt', color: THEME.muted, fontStyle: 'italic', marginBottom: '4pt' }}>{caption}</div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', color: THEME.text }}>
        <thead>
          <tr style={{ background: THEME.primary, color: '#fff' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '5pt 6pt', textAlign: align?.[i] ?? 'left',
                fontSize: '8pt', fontWeight: 700, letterSpacing: '0.3pt',
                textTransform: 'uppercase', borderRight: i < headers.length - 1 ? '1pt solid #fff2' : 'none',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : THEME.surface }}>
              {r.map((c, ci) => {
                const isNumeric = typeof c === 'number' || (typeof c === 'string' && /^[\s\-+]?[\d.,%R$\s]+$/.test(c) && /\d/.test(c));
                const colAlign = align?.[ci] ?? (isNumeric ? 'right' : 'left');
                return (
                  <td key={ci} style={{
                    padding: '4pt 6pt',
                    textAlign: colAlign,
                    borderBottom: `0.5pt solid ${THEME.border}`,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}>{c}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Line chart SVG inline — para evolução do saldo devedor / patrimônio. */
export function PdfLineChart({
  series,
  width = 620,
  height = 220,
  yFormat = (v: number) => `R$ ${Math.round(v / 1000)}k`,
  xLabel,
  yLabel,
  title,
}: {
  series: Array<{ name: string; color: string; points: Array<{ x: number; y: number }> }>;
  width?: number; height?: number;
  yFormat?: (v: number) => string;
  xLabel?: string; yLabel?: string;
  title?: string;
}) {
  const padding = { top: 24, right: 14, bottom: 36, left: 64 };
  const cw = width - padding.left - padding.right;
  const ch = height - padding.top - padding.bottom;
  const allPts = series.flatMap((s) => s.points);
  if (allPts.length === 0) return null;
  const xs = allPts.map((p) => p.x);
  const ys = allPts.map((p) => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = 0;
  const yMax = Math.max(...ys, 1) * 1.08;
  const xScale = (x: number) => padding.left + ((x - xMin) / Math.max(xMax - xMin, 1)) * cw;
  const yScale = (y: number) => padding.top + ch - ((y - yMin) / Math.max(yMax - yMin, 1)) * ch;
  const grid = 4;
  const yTicks = Array.from({ length: grid + 1 }, (_, i) => yMin + ((yMax - yMin) / grid) * i);
  const xTicks = 6;
  const xStep = (xMax - xMin) / xTicks;

  return (
    <div style={{ background: '#fff', padding: '8pt', border: `1px solid ${THEME.border}`, borderRadius: '4pt', breakInside: 'avoid' as const }}>
      {title && <div style={{ fontSize: '9pt', fontWeight: 700, textAlign: 'center', color: THEME.ink, marginBottom: '4pt' }}>{title}</div>}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        {yTicks.map((v, i) => (
          <g key={`y-${i}`}>
            <line x1={padding.left} x2={width - padding.right} y1={yScale(v)} y2={yScale(v)} stroke="#E5E7EB" strokeDasharray="3 3" />
            <text x={padding.left - 6} y={yScale(v) + 3} fontSize="8" fill={THEME.muted} textAnchor="end">{yFormat(v)}</text>
          </g>
        ))}
        {Array.from({ length: xTicks + 1 }, (_, i) => xMin + xStep * i).map((xv, i) => (
          <text key={`x-${i}`} x={xScale(xv)} y={height - padding.bottom + 14} fontSize="8" fill={THEME.muted} textAnchor="middle">
            {Math.round(xv)}
          </text>
        ))}
        {series.map((s, si) => {
          const d = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`).join(' ');
          return <path key={si} d={d} fill="none" stroke={s.color} strokeWidth={1.6} />;
        })}
        <line x1={padding.left} x2={width - padding.right} y1={padding.top + ch} y2={padding.top + ch} stroke={THEME.muted} />
        <line x1={padding.left} x2={padding.left} y1={padding.top} y2={padding.top + ch} stroke={THEME.muted} />
        {xLabel && <text x={padding.left + cw / 2} y={height - 4} fontSize="8" fill={THEME.muted} textAnchor="middle">{xLabel}</text>}
        {yLabel && <text x={12} y={padding.top + ch / 2} fontSize="8" fill={THEME.muted} transform={`rotate(-90 12 ${padding.top + ch / 2})`} textAnchor="middle">{yLabel}</text>}
      </svg>
      {series.length > 1 && (
        <div style={{ display: 'flex', gap: '12pt', justifyContent: 'center', marginTop: '4pt', fontSize: '8pt', color: THEME.text }}>
          {series.map((s) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '4pt' }}>
              <span style={{ display: 'inline-block', width: '10pt', height: '2pt', background: s.color }} />
              {s.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Fallback visual para blocos selecionados sem dados completos.
 * REGRA: melhor mostrar com fallback do que esconder a página inteira.
 */
const MISSING_DATA_TEXT = 'Dados insuficientes para cálculo preciso, mas a estratégia continua válida — refine no Simulador para enriquecer este bloco.';
export function MissingDataNote({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{
      background: THEME.surface,
      border: `1px dashed ${THEME.border}`,
      borderRadius: '6pt',
      padding: '14pt 16pt',
      marginTop: '12pt',
    }}>
      <div style={{ fontSize: '8pt', color: THEME.muted, fontWeight: 700, letterSpacing: '0.8pt', textTransform: 'uppercase', marginBottom: '6pt' }}>
        Aviso
      </div>
      <p style={{ fontSize: '10pt', color: THEME.text, lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>
        {children ?? MISSING_DATA_TEXT}
      </p>
    </div>
  );
}

/**
 * Bloco de mensagem pessoal do gerente (abertura/fechamento).
 * Estilo: itálico, fonte menor que títulos, box suave com borda lateral accent.
 */
export function ManagerNoteBlock({ kicker, text }: { kicker: string; text: string }) {
  return (
    <div style={{
      background: THEME.surface,
      border: `1px solid ${THEME.border}`,
      borderLeft: `3pt solid ${THEME.accent}`,
      borderRadius: '6pt',
      padding: '10pt 14pt',
    }}>
      <div style={{
        fontSize: '8pt', color: THEME.accent, fontWeight: 700,
        letterSpacing: '1pt', textTransform: 'uppercase', marginBottom: '4pt',
      }}>
        {kicker}
      </div>
      <p style={{
        fontSize: '10.5pt', color: THEME.text, lineHeight: 1.55,
        margin: 0, fontStyle: 'italic', whiteSpace: 'pre-line',
      }}>
        {text}
      </p>
    </div>
  );
}

export function DiagnosticDimension({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: THEME.surface,
      border: `1px solid ${THEME.border}`,
      borderLeft: `4pt solid ${THEME.primary}`,
      borderRadius: '8pt',
      padding: '14pt 16pt',
      breakInside: 'avoid' as const,
    }}>
      <div style={{ fontSize: '8pt', color: THEME.accent, fontWeight: 700, letterSpacing: '1pt', textTransform: 'uppercase', marginBottom: '4pt' }}>
        {kicker}
      </div>
      <div style={{ fontSize: '13pt', fontWeight: 700, color: THEME.ink, marginBottom: '10pt', lineHeight: 1.3 }}>
        {title}
      </div>
      {children}
    </div>
  );
}
