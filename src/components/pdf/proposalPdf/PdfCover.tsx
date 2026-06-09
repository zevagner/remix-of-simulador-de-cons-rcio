import React from 'react';
import { sanitizeLogoDataUrl } from '@/hooks/usePdfProfile';

/**
 * PdfCover — capa padrão reutilizável para todos os PDFs da plataforma.
 *
 * Generaliza o visual do `CoverPage` da Proposta Completa
 * (src/components/pdf/proposta/pages/CoverPage.tsx) sem alterar o original.
 * Layout/tipografia/paleta idênticos; apenas parametriza moduleName e
 * dispensa o disclaimer extenso da proposta — mantém uma linha discreta.
 *
 * Importante:
 *  - O wrapper raiz usa `data-pdf-page` para o counter de página global
 *    (`@page @bottom-center` em pdfGenerator.tsx) e para o
 *    `page-break-after: always`, garantindo que o conteúdo seguinte
 *    inicie em uma nova página.
 *  - Sem cálculo, sem dados — apenas renderização.
 */

// Paleta consistente com THEME (src/components/pdf/proposta/theme.ts).
const THEME = {
  primary: '#003641',
  accent: '#F5821F',
  ink: '#1A1A1A',
  muted: '#666',
  soft: '#999',
  border: '#E5E7EB',
};

const PAGE: React.CSSProperties = {
  width: '210mm',
  // `100vh` mapeia para a ÁREA IMPRIMÍVEL do @page (210x297mm menos
  // `@page margin`). Usar `297mm` aqui força overflow para uma 2ª página
  // física que vira página em branco com apenas o watermark.
  minHeight: '100vh',
  background: '#fff',
  padding: '36mm 20mm',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  color: '#333',
  fontSize: '10.5pt',
  lineHeight: 1.55,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  boxSizing: 'border-box',
};

export interface PdfCoverProps {
  moduleName: string;
  clientName?: string;
  consultorName?: string;
  /** Data em pt-BR. Default: hoje. */
  date?: string;
  /** Valor da carta/crédito já formatado (ex: "R$ 400.000,00"). */
  creditValue?: string;
  /** Subtítulo opcional exibido abaixo do moduleName (descrição curta). */
  subtitle?: string;
  /** Linha cinza menor exibida abaixo do creditValue e acima do traço laranja (ex: "Grupo 10046 — Imobiliário"). */
  tagline?: string;
  /** Logo data URL (mesma origem que PdfLayout/CoverPage). */
  logoDataUrl?: string;
  /** Disclaimer discreto opcional. Default: aviso institucional curto. */
  disclaimer?: string;
}

export function PdfCover({
  moduleName,
  clientName,
  consultorName,
  date,
  creditValue,
  subtitle,
  tagline,
  logoDataUrl,
  disclaimer = 'Documento educativo. Em estrita observância à Lei 11.795/2008 e à Resolução BCB nº 285/2023, não há garantia de contemplação em prazo determinado.',
}: PdfCoverProps) {
  const safeLogo = sanitizeLogoDataUrl(logoDataUrl);
  const dateStr =
    date ||
    new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div data-pdf-page style={PAGE}>
      {/* Topo — marca */}
      <div>
        {safeLogo ? (
          <img
            src={safeLogo}
            alt=""
            style={{ maxHeight: '56pt', maxWidth: '170pt', objectFit: 'contain', display: 'block' }}
          />
        ) : null}
      </div>


      {/* Centro — moduleName + creditValue */}
      <div>
        <div
          style={{
            // Label padronizado entre TODOS os PDFs (Simulador / Comparador /
            // Lances / Operações). Mantém a hierarquia visual da CoverPage
            // da Proposta Completa (eyebrow uppercase espaçado, primário).
            fontSize: '10px',
            color: THEME.primary,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '12pt',
          }}
        >
          Estudo Personalizado
        </div>
        <h1
          style={{
            fontSize: '38pt',
            fontWeight: 700,
            color: THEME.ink,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {moduleName}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: '13pt',
              color: THEME.muted,
              fontWeight: 500,
              marginTop: '14pt',
              marginBottom: 0,
              maxWidth: '120mm',
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}
        {creditValue && (
          <p
            style={{
              fontSize: '15pt',
              color: THEME.primary,
              fontWeight: 600,
              marginTop: subtitle ? '8pt' : '14pt',
              marginBottom: 0,
            }}
          >
            Carta de crédito: {creditValue}
          </p>
        )}
        {tagline && (
          <p
            style={{
              fontSize: '11pt',
              color: THEME.muted,
              fontWeight: 500,
              marginTop: '6pt',
              marginBottom: 0,
            }}
          >
            {tagline}
          </p>
        )}
        <div
          style={{
            width: '50pt',
            height: '4pt',
            background: THEME.accent,
            marginTop: '20pt',
            borderRadius: '2pt',
          }}
        />
      </div>

      {/* Inferior — cliente + consultor + data + disclaimer */}
      <div>
        {clientName && (
          <div style={{ marginBottom: '6pt' }}>
            <div
              style={{
                fontSize: '8pt',
                color: THEME.soft,
                textTransform: 'uppercase',
                letterSpacing: '1pt',
              }}
            >
              Preparado para
            </div>
            <div style={{ fontSize: '13pt', fontWeight: 700, color: THEME.ink, marginTop: '2pt' }}>
              {clientName}
            </div>
          </div>
        )}
        {consultorName && (
          <div style={{ marginBottom: '6pt' }}>
            <div
              style={{
                fontSize: '8pt',
                color: THEME.soft,
                textTransform: 'uppercase',
                letterSpacing: '1pt',
              }}
            >
              Gerente responsável
            </div>
            <div style={{ fontSize: '13pt', fontWeight: 700, color: THEME.primary, marginTop: '2pt' }}>
              {consultorName}
            </div>
          </div>
        )}
        <div
          style={{
            fontSize: '8.5pt',
            color: THEME.soft,
            marginTop: '8pt',
            borderTop: `1px solid ${THEME.border}`,
            paddingTop: '6pt',
          }}
        >
          {dateStr} • {disclaimer}
        </div>
      </div>
    </div>
  );
}
