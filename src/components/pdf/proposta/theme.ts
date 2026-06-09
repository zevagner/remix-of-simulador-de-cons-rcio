import type React from 'react';

// ════════ THEME ════════
export const THEME = {
  primary: '#003641',
  accent: '#F5821F',
  ink: '#1A1A1A',
  text: '#333',
  muted: '#666',
  soft: '#999',
  border: '#E5E7EB',
  surface: '#F8FAFC',
  highlight: '#FFF8EC',
  success: '#16A34A',
  successSoft: '#E8F7EE',
};

// ════════ GRID FIXO ════════
// A4: 210x297mm. Margens consistentes em todas as páginas internas:
//   topo 28mm (≈80px), laterais 22mm (≈60px), base 22mm (≈60px).
// PAGE é flex column → o Footer entra no fluxo (marginTop: auto), NUNCA sobrepõe conteúdo.
//
// IMPORTANTE — anti-página-vazia:
// 1) `minHeight: 100vh` mapeia para a ÁREA IMPRIMÍVEL do @page (A4 menos as
//    margens definidas em `@page { margin: 20mm 16mm 22mm }` em pdfGenerator.tsx).
//    Usar `297mm` força overflow (~42mm) → Chromium gera uma PÁGINA EM BRANCO
//    extra após cada página de conteúdo (bug visto nas pp.4/8/22).
// 2) NÃO aplicamos `pageBreakAfter: always` aqui. O quebra-página é injetado pelo
//    Root (`PdfPropostaCompleta`) APENAS entre páginas (via a regra global
//    `[data-pdf-page] { page-break-after: always }`), evitando o break extra
//    após a última página.
export const PAGE: React.CSSProperties = {
  width: '210mm',
  minHeight: '100vh',
  background: '#fff',
  padding: '28mm 22mm 22mm 22mm',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  color: THEME.text,
  fontSize: '10.5pt',
  lineHeight: 1.55,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
};

/**
 * PAGE_COMPACT — variante para blocos curtos (lance, venda, contemplação, visão).
 * Idêntica ao PAGE, MAS sem `minHeight: 100vh`: o container encolhe para a altura
 * do conteúdo, eliminando o vazio entre conteúdo e Footer em páginas leves.
 * Usar SEMPRE em conjunto com `<PageBodyCompact>` + `<FooterCompact>` (primitives.tsx)
 * para que o Footer fique logo abaixo do conteúdo (sem `marginTop: auto`).
 */
export const PAGE_COMPACT: React.CSSProperties = {
  width: '210mm',
  background: '#fff',
  padding: '28mm 22mm 22mm 22mm',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  color: THEME.text,
  fontSize: '10.5pt',
  lineHeight: 1.55,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
};


// ════════ ESPAÇAMENTOS PADRÃO ════════
// Hierarquia consistente para evitar "buracos" e "tudo solto":
//   BLOCK_GAP   — entre blocos top-level dentro de uma página
//   SECTION_GAP — entre subseções relacionadas (mesma família visual)
//   INNER_GAP   — espaçamento interno padrão dentro de um bloco
export const BLOCK_GAP = '24pt';
export const SECTION_GAP = '16pt';
export const INNER_GAP = '10pt';
