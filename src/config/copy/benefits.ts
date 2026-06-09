/**
 * Frases curtas de benefícios reutilizadas em badges, tooltips e CTAs.
 * Apenas textos curtos sem placeholders dinâmicos.
 *
 * ⚠️ Para narrativas longas com lógica condicional (storytelling, templates WhatsApp,
 * sales arguments), continuar usando os motores dedicados:
 *   - src/services/salesCopyEngine.ts
 *   - src/services/proposals/proposalTemplates.ts
 *   - src/services/createStorytelling.ts
 *   - src/services/smartMessages.ts
 */

export const BENEFITS = {
  /** Consórcio sem juros (vantagem core) */
  NO_INTEREST: 'Sem juros — apenas taxa de administração',

  /** Parcela reduzida na fase pré-contemplação */
  REDUCED_INSTALLMENT: 'Parcela reduzida até a contemplação',

  /** Valorização da carta (lance embutido) */
  EMBEDDED_BID: 'Lance embutido — ofertar sem desembolso adicional',

  /** Contemplação por sorteio (sem lance) */
  SORTEIO_CHANCE: 'Chance real de contemplação por sorteio',

  /** Crédito atualizado pelo INCC/IPCA */
  CREDIT_UPDATE: 'Crédito atualizado conforme índice do regulamento',

  /** Flexibilidade de uso */
  CREDIT_FLEXIBILITY: 'Crédito utilizável para compra, construção ou reforma',
} as const;
