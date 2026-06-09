/**
 * Fonte única de disclaimers regulatórios do sistema.
 *
 * ⚠️ NÃO MODIFICAR TEXTOS sem revisão de compliance.
 * Cada variante existe para um contexto específico (PDF, WhatsApp, rodapé print, página compartilhada).
 *
 * Convenção:
 * - PDF_*  → usado em react-pdf templates
 * - PRINT_* → usado em rodapés de impressão off-screen
 * - WHATSAPP_* → texto plano para mensagens
 * - INLINE_* → componentes UI inline
 * - SHARED_* → página pública compartilhada
 */

export const DISCLAIMERS = {
  /** PDF Simulador — rodapé de seção */
  PDF_SIMULADOR:
    '* Valores simulados com base nas premissas informadas. Não constitui promessa de contemplação ou rentabilidade.',

  /** PDF Investimento — rodapé de seção */
  PDF_INVESTIMENTO:
    '* Os valores são estimativas baseadas nas premissas configuradas. Não constituem promessa de rentabilidade. A contemplação depende de sorteio ou lance.',

  /** PDF Operações Estruturadas */
  PDF_OPERACOES_ESTRUTURADAS:
    '* Valores simulados considerando contemplação no 1º mês com redução de parcela.',

  /** PDF Estudo de Lances — inclui número de meses analisados */
  PDF_ESTUDO_LANCES: (months: number) =>
    `⚠️ Análise baseada no histórico dos últimos ${months} meses de assembleias. Não constitui garantia de contemplação. As condições seguem o regulamento do grupo e normas da administradora.`,

  /** Rodapé global do PdfLayout (todos PDFs react-pdf) */
  PDF_LAYOUT_FOOTER:
    'Este documento é uma simulação ilustrativa com valores nominais. Os resultados dependem das premissas adotadas e não garantem contemplação ou rentabilidade. As condições contratuais vigentes no regulamento do grupo prevalecem.',

  /** Rodapé das impressões via PrintFooter / ReportButton off-screen */
  PRINT_FOOTER:
    'Simulação ilustrativa com valores nominais. Os resultados dependem das premissas adotadas e não garantem contemplação ou rentabilidade. As condições contratuais vigentes no regulamento do grupo prevalecem.',

  /** ReportButton off-screen footer (versão curta) */
  PRINT_REPORT_BUTTON:
    'Este documento é uma simulação e não garante a contemplação ou reserva de cota. Valores sujeitos a reajuste conforme contrato.',

  /** Inline na ProposalModule (alerta visual com ícone) */
  INLINE_PROPOSAL:
    'Simulação ilustrativa. Os valores podem variar conforme condições do grupo e regulamento vigente. Não constitui proposta comercial vinculante.',

  /** Página compartilhada (SharedProposalPage) */
  SHARED_PROPOSAL:
    '* Valores estimados sujeitos a condições da administradora.\nSimulação válida na data de geração. Consulte condições atualizadas.',

  /** Geradores de proposta de investimento (texto WhatsApp itálico) */
  WHATSAPP_INVESTMENT:
    '_* Valores estimados para fins de simulação. Não constituem garantia de rentabilidade._',

  /** Templates WhatsApp formais — rodapé padrão (2 linhas) */
  WHATSAPP_FORMAL_FULL:
    '* Valores estimados, sujeitos a condições vigentes.\n* Consórcio regulamentado pelo Banco Central do Brasil.',

  /** Templates WhatsApp formais — rodapé reduzido */
  WHATSAPP_FORMAL_SHORT:
    '* Valores estimados, sujeitos a condições vigentes.\n* Regulamentado pelo Banco Central do Brasil.',
} as const;
