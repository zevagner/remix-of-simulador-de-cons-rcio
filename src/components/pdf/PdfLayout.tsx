import React, { useState } from 'react';
import { DISCLAIMERS } from '@/config/copy';
import { sanitizeLogoDataUrl, LOGO_MAX_WIDTH, LOGO_MAX_HEIGHT } from '@/hooks/usePdfProfile';

// Paleta navy (variant === 'navy')
const NAVY = '#003641';
const ORANGE = '#F5821F';
const MUTED = '#66655F';

interface PdfLayoutProps {
  moduleName: string;
  subtitle?: string;
  summaryItems?: Array<{ label: string; value: string }>;
  conclusion?: string;
  managerName?: string;
  agencyName?: string;
  /** Identificação do cliente exibida no cabeçalho */
  clientName?: string;
  /** Dados de contato do gerente exibidos no rodapé */
  managerRole?: string;
  managerPhone?: string;
  managerWhatsapp?: string;
  managerEmail?: string;
  /** Logo opcional (data URL). Aparece no canto esquerdo do header. */
  logoDataUrl?: string;
  /** Variante visual. Default 'classic' preserva o layout atual. */
  variant?: 'classic' | 'navy';
  children: React.ReactNode;
}

export function PdfLayout({
  moduleName, subtitle, summaryItems, conclusion,
  managerName, agencyName, clientName,
  managerRole, managerPhone, managerWhatsapp, managerEmail,
  logoDataUrl,
  variant = 'classic',
  children,
}: PdfLayoutProps) {
  const safeLogo = sanitizeLogoDataUrl(logoDataUrl);
  const [logoBroken, setLogoBroken] = useState(false);
  const showLogo = !!safeLogo && !logoBroken;
  // Container fixo do logo no PDF — em pt (1px ≈ 0.75pt). 200x80px → 150x60pt.
  const LOGO_BOX_W_PT = LOGO_MAX_WIDTH * 0.75;
  const LOGO_BOX_H_PT = LOGO_MAX_HEIGHT * 0.75;
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Linha 2 do header: gerente · agência · data
  const headerSubLine = [
    managerName && `Gerente: ${managerName}`,
    agencyName && `Agência: ${agencyName}`,
    `Gerado em ${dateStr} às ${timeStr}`,
  ].filter(Boolean).join(' • ');

  // Footer: contatos
  const contactLine = [
    managerPhone && `Tel: ${managerPhone}`,
    managerWhatsapp && `WhatsApp: ${managerWhatsapp}`,
    managerEmail && `E-mail: ${managerEmail}`,
  ].filter(Boolean).join(' • ');

  const footerIdLine = [
    managerName,
    managerRole,
    agencyName,
  ].filter(Boolean).join(' — ');

  if (variant === 'navy') {
    const navyFooterIdLine = [managerName, managerRole, agencyName].filter(Boolean).join(' — ');
    return (
      <div style={{ fontFamily: 'Inter, Helvetica, Arial, sans-serif', fontSize: '10pt', color: '#333', padding: 0, width: '100%', background: '#fff', boxSizing: 'border-box', overflow: 'hidden' }}>
        {/* Topbar navy full-width */}
        <div style={{ width: '100%', background: NAVY, padding: '12px 22px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {showLogo && (
              <img src={safeLogo!} alt="" onError={() => setLogoBroken(true)} style={{ height: '28px', width: 'auto', objectFit: 'contain', display: 'block' }} />
            )}
            <span style={{ color: '#FFFFFF', fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em' }}>
              CAIXA Consórcio
            </span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {moduleName}
          </div>
        </div>

        {/* Container interno — conteúdo entre topbar e footer */}
        <div style={{ maxWidth: '178mm', margin: '0 auto', padding: '12pt 0 0', boxSizing: 'border-box' }}>
          {conclusion && (
            <div style={{ fontSize: '9pt', color: '#444', marginBottom: '14pt', fontStyle: 'italic' }}>
              {conclusion}
            </div>
          )}

          {/* Content */}
          <div>{children}</div>
        </div>

        {/* Footer navy full-width */}
        <div style={{ width: '100%', marginTop: '8px', background: NAVY, padding: '9px 28px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ color: '#FFFFFF', fontSize: '11px' }}>{navyFooterIdLine}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {managerEmail && (
                <>
                  <div style={{ color: ORANGE, fontSize: '11px', fontWeight: 600 }}>{managerEmail}</div>
                  <div style={{ color: ORANGE, fontSize: '11px', fontWeight: 600 }}>·</div>
                </>
              )}
              <div style={{ color: ORANGE, fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                2 / 2
              </div>
            </div>
          </div>
          <div style={{ color: '#FFFFFF', opacity: 0.5, fontSize: '10px', fontStyle: 'italic', textAlign: 'center', marginTop: '6px', lineHeight: 1.5 }}>
            {DISCLAIMERS.PDF_LAYOUT_FOOTER}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, Helvetica, Arial, sans-serif', fontSize: '10pt', color: '#333', padding: 0, width: '100%', maxWidth: '178mm', margin: '0 auto', background: '#fff', boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Header — 3 colunas: identidade do documento (esq) · módulo (centro) · cliente (dir) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12pt', paddingBottom: '6pt' }}>
        {/* Coluna esquerda: container fixo do logo OU identidade textual */}
        <div style={{ flex: '0 0 auto', width: `${LOGO_BOX_W_PT}pt`, minWidth: `${LOGO_BOX_W_PT}pt` }}>
          <div
            style={{
              width: `${LOGO_BOX_W_PT}pt`,
              height: `${LOGO_BOX_H_PT}pt`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              overflow: 'hidden',
            }}
          >
            {showLogo ? (
              <img
                src={safeLogo!}
                alt=""
                onError={() => setLogoBroken(true)}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <div>
                <div style={{ fontSize: '12pt', fontWeight: 700, color: '#003641', lineHeight: 1.2 }}>
                  Simulador de Consórcio
                </div>
                <div style={{ fontSize: '7pt', color: '#888', marginTop: '1pt' }}>Caixa Consórcio</div>
              </div>
            )}
          </div>
        </div>
        {/* Coluna central: módulo (não invade laterais) */}
        <div style={{ flex: '1 1 0', minWidth: 0, textAlign: 'center', overflow: 'hidden' }}>
          <div style={{ fontSize: '11pt', fontWeight: 700, color: '#333', lineHeight: 1.2 }}>
            {moduleName}
          </div>
          {subtitle && (
            <div style={{ fontSize: '8pt', color: '#666', marginTop: '1pt' }}>{subtitle}</div>
          )}
        </div>
        {/* Coluna direita: cliente, espelhada à esquerda */}
        <div style={{ flex: '0 0 auto', width: `${LOGO_BOX_W_PT}pt`, textAlign: 'right', overflow: 'hidden' }}>
          <div style={{ fontSize: '7pt', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5pt' }}>Cliente</div>
          <div style={{ fontSize: '10pt', fontWeight: 700, color: '#333', lineHeight: 1.2, marginTop: '1pt', wordBreak: 'break-word' }}>
            {clientName || '—'}
          </div>
        </div>
      </div>

      {/* Header sub-line */}
      {headerSubLine && (
        <div style={{ fontSize: '7.5pt', color: '#666', paddingBottom: '6pt' }}>
          {headerSubLine}
        </div>
      )}

      {/* Orange divider */}
      <div style={{ height: '2pt', background: '#F5821F', marginBottom: '12pt', borderRadius: '1pt' }} />
      <div style={{ marginTop: '12mm' }} />


      {/* Frase-resumo (mantida) — bloco "Resumo" removido para evitar redundância com seções abaixo */}
      {conclusion && (
        <div style={{ fontSize: '9pt', color: '#444', marginBottom: '14pt', fontStyle: 'italic' }}>
          {conclusion}
        </div>
      )}

      {/* Content */}
      <div>{children}</div>

      {/* Footer — identidade do gerente + contatos + disclaimer */}
      <div style={{ borderTop: '2pt solid #F5821F', paddingTop: '8pt', marginTop: '16pt' }}>
        {(footerIdLine || contactLine) && (
          <div style={{ marginBottom: '6pt' }}>
            {footerIdLine && (
              <div style={{ fontSize: '8pt', fontWeight: 700, color: '#003641' }}>{footerIdLine}</div>
            )}
            {contactLine && (
              <div style={{ fontSize: '7.5pt', color: '#555', marginTop: '1pt' }}>{contactLine}</div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8pt' }}>
          <div style={{ fontSize: '7pt', color: '#666', fontStyle: 'italic', maxWidth: '80%', lineHeight: 1.5 }}>
            {DISCLAIMERS.PDF_LAYOUT_FOOTER}
          </div>
          <div style={{ fontSize: '7pt', color: '#999', whiteSpace: 'nowrap', textAlign: 'right' }}>
            <div>{dateStr}</div>
            <div className="pdf-page-number" style={{ marginTop: '2pt' }}>&nbsp;</div>
          </div>
        </div>
        <div style={{ fontSize: '6.5pt', color: '#ccc', textAlign: 'center', marginTop: '6pt' }}>
          Documento gerado pelo Simulador de Consórcio
        </div>
      </div>

    </div>
  );
}

/* Shared inline styles for PDF content */
export const pdfStyles = {
  section: { marginBottom: '14pt' } as React.CSSProperties,
  sectionTitle: { fontSize: '11pt', fontWeight: 700, color: '#003641', marginBottom: '8pt', paddingBottom: '4pt', borderBottom: '1px solid #E0E4E8' } as React.CSSProperties,
  card: { background: '#FAFBFC', border: '1px solid #E0E4E8', borderRadius: '6pt', padding: '10pt 14pt', marginBottom: '10pt' } as React.CSSProperties,
  label: { fontSize: '7pt', color: '#666', marginBottom: '1pt' } as React.CSSProperties,
  value: { fontSize: '10pt', fontWeight: 600, color: '#333' } as React.CSSProperties,
  valuePrimary: { fontSize: '10pt', fontWeight: 700, color: '#003641' } as React.CSSProperties,
  valueSuccess: { fontSize: '10pt', fontWeight: 700, color: '#16a34a' } as React.CSSProperties,
  valueWarning: { fontSize: '10pt', fontWeight: 700, color: '#d97706' } as React.CSSProperties,
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8pt' } as React.CSSProperties,
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8pt' } as React.CSSProperties,
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8pt' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '8pt' } as React.CSSProperties,
  th: { background: '#F4F7F9', padding: '6pt 8pt', textAlign: 'left' as const, fontWeight: 600, borderBottom: '1px solid #DDE1E5', fontSize: '7pt', color: '#555' } as React.CSSProperties,
  thRight: { background: '#F4F7F9', padding: '6pt 8pt', textAlign: 'right' as const, fontWeight: 600, borderBottom: '1px solid #DDE1E5', fontSize: '7pt', color: '#555' } as React.CSSProperties,
  td: { padding: '5pt 8pt', borderBottom: '1px solid #EAECEF', fontSize: '8pt' } as React.CSSProperties,
  tdRight: { padding: '5pt 8pt', borderBottom: '1px solid #EAECEF', fontSize: '8pt', textAlign: 'right' as const } as React.CSSProperties,
  pageBreak: { pageBreakBefore: 'always' as const } as React.CSSProperties,
  disclaimer: { fontSize: '7pt', color: '#888', fontStyle: 'italic', marginTop: '10pt', lineHeight: 1.4 } as React.CSSProperties,
};
