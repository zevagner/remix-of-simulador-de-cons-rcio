import React from 'react';
import { sanitizeLogoDataUrl } from '@/hooks/usePdfProfile';
import { THEME, PAGE } from '../theme';
import type { PdfPropostaCompletaData } from '../types';

export function CoverPage({ data }: { data: PdfPropostaCompletaData }) {
  const safeLogo = sanitizeLogoDataUrl(data.logoDataUrl);
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  return (
    <div style={{ ...PAGE, padding: '36mm 20mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {safeLogo ? (
          <img src={safeLogo} alt="" style={{ maxHeight: '56pt', maxWidth: '170pt', objectFit: 'contain', display: 'block' }} />
        ) : (
          <div style={{ fontSize: '14pt', fontWeight: 700, color: THEME.primary }}>Caixa Consórcio</div>
        )}
      </div>

      <div>
        <div style={{ fontSize: '10pt', color: THEME.accent, fontWeight: 700, letterSpacing: '2pt', textTransform: 'uppercase', marginBottom: '12pt' }}>
          Proposta Consultiva
        </div>
        <h1 style={{ fontSize: '38pt', fontWeight: 700, color: THEME.ink, margin: 0, lineHeight: 1.1 }}>
          {data.clientName || 'Estudo Personalizado'}
        </h1>
        <p style={{ fontSize: '13pt', color: THEME.muted, marginTop: '14pt', maxWidth: '120mm', lineHeight: 1.5 }}>
          Um estudo construído especificamente para o seu momento e seus objetivos financeiros.
        </p>
        <div style={{ width: '50pt', height: '4pt', background: THEME.accent, marginTop: '20pt', borderRadius: '2pt' }} />
      </div>

      <div>
        {data.managerName && (
          <div style={{ marginBottom: '6pt' }}>
            <div style={{ fontSize: '8pt', color: THEME.soft, textTransform: 'uppercase', letterSpacing: '1pt' }}>Gerente responsável</div>
            <div style={{ fontSize: '13pt', fontWeight: 700, color: THEME.primary, marginTop: '2pt' }}>{data.managerName}</div>
            {data.managerRole && <div style={{ fontSize: '10pt', color: THEME.muted }}>{data.managerRole}</div>}
            {data.agencyName && <div style={{ fontSize: '10pt', color: THEME.muted }}>{data.agencyName}</div>}
            <div style={{ fontSize: '9pt', color: THEME.muted, marginTop: '4pt' }}>
              {data.managerEmail || ''}
            </div>
          </div>
        )}
        <div style={{ fontSize: '8.5pt', color: THEME.soft, marginTop: '8pt', borderTop: `1px solid ${THEME.border}`, paddingTop: '6pt' }}>
          {dateStr} • Documento educativo. Em estrita observância à Lei 11.795/2008 e à Resolução BCB nº 285/2023,
          esclarecemos que no sistema de consórcios não há garantia de contemplação em prazo determinado.
        </div>
      </div>
    </div>
  );
}
