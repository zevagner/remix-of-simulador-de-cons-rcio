/**
 * MessageContext — Fonte única padronizada de dados para TODOS os geradores
 * de mensagem (WhatsApp, Proposta IA, smart messages, sales copy, sales pitch).
 *
 * Princípios:
 * - É uma CAMADA DE ADAPTAÇÃO. Não substitui as assinaturas atuais.
 * - Os geradores continuam aceitando suas APIs originais (retrocompatível).
 * - Quem quiser garantir consistência usa `buildMessageContext(...)` e
 *   depois `to<Generator>Args(ctx)` para alimentar o gerador desejado.
 *
 * Como usar:
 *   const ctx = buildMessageContext({ input, result, client, bidsData });
 *   const proposal = generateWhatsAppProposal(toProposalData(ctx));
 *   const smart    = generateSmartMessage(toSmartMessageContext(ctx, 'hot'));
 *   const sales    = generateSalesArgument(toSalesArgumentContext(ctx, 'proposta'));
 *
 * Como adicionar um novo gerador:
 * 1. Crie `to<NovoGerador>Args(ctx, extras?)` neste arquivo.
 * 2. Mapeie campos do MessageContext para o shape esperado pelo gerador.
 * 3. NÃO altere a API pública do gerador.
 */

import type { ProposalData } from '@/services/proposals/proposalGenerator';
import type { SmartMessageContext, EngagementLevel, ClientContext } from '@/services/smartMessages';
import type { SalesArgumentContext, SalesMode } from '@/services/salesCopyEngine';
import type { SalesPitchArgs } from '@/utils/salesPitchGenerator';

// ─── Schema único (estendido — cobre 100% dos templates atuais) ───

export interface MessageContextCliente {
  nome: string;
  objetivo?: string;
  situacao?: string;
  perfilCenario?: 'conservador' | 'equilibrado' | 'agressivo';
  /** Refinamento opcional do objetivo (label legível, ex: "Reforma", "Renda de aluguel"). */
  subObjetivo?: string;
}

export interface MessageContextCredito {
  consortiumType: string;
  creditValue: number;
  netCreditValue?: number;
  embeddedBidValue?: number;
  hasEmbeddedBid: boolean;
  groupNumber?: number;
  totalCost: number;
}

export interface MessageContextParcela {
  installment: number;
  termMonths: number;
  installmentBeforeContemplation?: number;
  installmentAfterContemplation?: number;
  reducedTermMonths?: number;
}

export interface MessageContextLance {
  bidPercent?: number;
  bidZone?: string;
  conservadoraBid?: number;
  equilibradaBid?: number;
  riskLevel?: 'baixo' | 'medio' | 'alto';
  trend?: 'queda' | 'alta' | 'estavel';
  predominance?: 'sorteio' | 'lance' | 'equilibrado';
  monteCarloProbability?: number | null;
  clientBid?: number;
  embeddedBidMaxPercent?: number;
  creditRange?: string;
  monthsAnalyzed?: number;
}

export interface MessageContextEstrategia {
  contemplated: boolean;
  contemplationType?: 'none' | 'sorteio' | 'lance';
  contemplationMonth?: number;
  postContemplationChoice?: 'reduce-installment' | 'reduce-term' | string;
}

export interface MessageContext {
  cliente: MessageContextCliente;
  credito: MessageContextCredito;
  parcela: MessageContextParcela;
  lance: MessageContextLance;
  estrategia: MessageContextEstrategia;
  /** Estratégia de parcela reduzida ativa (regra de negócio) */
  reducedInstallment: boolean;
  /** Formato de saída preferido (usado pelo enricher de regras) */
  format: 'whatsapp' | 'plain' | 'formal' | 'markdown';
}

// ─── Input do builder ───
// Aceita qualquer subset; campos ausentes recebem defaults seguros.

export interface BuildMessageContextInput {
  cliente?: Partial<MessageContextCliente>;
  credito?: Partial<MessageContextCredito>;
  parcela?: Partial<MessageContextParcela>;
  lance?: Partial<MessageContextLance>;
  estrategia?: Partial<MessageContextEstrategia>;
  reducedInstallment?: boolean;
  format?: MessageContext['format'];
}

// ─── Builder ───

export function buildMessageContext(input: BuildMessageContextInput = {}): MessageContext {
  const credito: MessageContextCredito = {
    consortiumType: input.credito?.consortiumType ?? '',
    creditValue: input.credito?.creditValue ?? 0,
    netCreditValue: input.credito?.netCreditValue,
    embeddedBidValue: input.credito?.embeddedBidValue,
    hasEmbeddedBid: !!(
      input.credito?.hasEmbeddedBid ??
      (input.credito?.embeddedBidValue && input.credito.embeddedBidValue > 0 && input.credito?.netCreditValue)
    ),
    groupNumber: input.credito?.groupNumber,
    totalCost: input.credito?.totalCost ?? 0,
  };

  const parcela: MessageContextParcela = {
    installment: input.parcela?.installment ?? 0,
    termMonths: input.parcela?.termMonths ?? 0,
    installmentBeforeContemplation: input.parcela?.installmentBeforeContemplation,
    installmentAfterContemplation: input.parcela?.installmentAfterContemplation,
    reducedTermMonths: input.parcela?.reducedTermMonths,
  };

  const lance: MessageContextLance = {
    bidPercent: input.lance?.bidPercent,
    bidZone: input.lance?.bidZone,
    conservadoraBid: input.lance?.conservadoraBid,
    equilibradaBid: input.lance?.equilibradaBid,
    riskLevel: input.lance?.riskLevel,
    trend: input.lance?.trend,
    predominance: input.lance?.predominance,
    monteCarloProbability: input.lance?.monteCarloProbability ?? null,
    clientBid: input.lance?.clientBid,
    embeddedBidMaxPercent: input.lance?.embeddedBidMaxPercent,
    creditRange: input.lance?.creditRange,
    monthsAnalyzed: input.lance?.monthsAnalyzed,
  };

  const estrategia: MessageContextEstrategia = {
    contemplated: !!input.estrategia?.contemplated,
    contemplationType: input.estrategia?.contemplationType ?? 'none',
    contemplationMonth: input.estrategia?.contemplationMonth,
    postContemplationChoice: input.estrategia?.postContemplationChoice,
  };

  return {
    cliente: {
      nome: input.cliente?.nome?.trim() ?? '',
      objetivo: input.cliente?.objetivo?.trim() || undefined,
      situacao: input.cliente?.situacao?.trim() || undefined,
      perfilCenario: input.cliente?.perfilCenario ?? 'conservador',
      subObjetivo: input.cliente?.subObjetivo?.trim() || undefined,
    },
    credito,
    parcela,
    lance,
    estrategia,
    reducedInstallment: !!input.reducedInstallment,
    format: input.format ?? 'whatsapp',
  };
}

// ─── Adapters: MessageContext → shape de cada gerador ───

/** Para `proposalGenerator` (WhatsApp curta/longa, formal). */
export function toProposalData(ctx: MessageContext): ProposalData {
  return {
    clientName: ctx.cliente.nome,
    creditValue: ctx.credito.creditValue,
    installment: ctx.parcela.installment,
    termMonths: ctx.parcela.termMonths,
    totalCost: ctx.credito.totalCost,
    consortiumType: ctx.credito.consortiumType,
    suggestedBidPercent: ctx.lance.bidPercent,
    suggestedZone: ctx.lance.bidZone,
    groupNumber: ctx.credito.groupNumber,
    netCreditValue: ctx.credito.netCreditValue,
    embeddedBidValue: ctx.credito.embeddedBidValue,
    contemplated: ctx.estrategia.contemplated,
    contemplationMonth: ctx.estrategia.contemplationMonth,
    postContemplationChoice: ctx.estrategia.postContemplationChoice,
    installmentAfterContemplation: ctx.parcela.installmentAfterContemplation,
    reducedTermMonths: ctx.parcela.reducedTermMonths,
    scenarioProfile: ctx.cliente.perfilCenario,
    clientObjective: ctx.cliente.objetivo,
    clientSituation: ctx.cliente.situacao,
    reducedInstallment: ctx.reducedInstallment,
  };
}

/** Para `smartMessages.generateSmartMessage`. */
export function toSmartMessageContext(
  ctx: MessageContext,
  level: EngagementLevel,
  clientContext?: ClientContext,
): SmartMessageContext {
  return {
    level,
    clientContext,
    clientName: ctx.cliente.nome || undefined,
    consortiumType: ctx.credito.consortiumType || undefined,
    creditValue: ctx.credito.creditValue || undefined,
    reducedInstallment: ctx.reducedInstallment,
  };
}

/** Para `salesCopyEngine.generateSalesArgument`. */
export function toSalesArgumentContext(
  ctx: MessageContext,
  mode: SalesMode,
  extras?: Partial<Pick<SalesArgumentContext, 'tone' | 'variation' | 'compact'>>,
): SalesArgumentContext {
  return {
    mode,
    clientName: ctx.cliente.nome || undefined,
    variation: extras?.variation,
    groupNumber: ctx.credito.groupNumber,
    trend: ctx.lance.trend,
    predominance: ctx.lance.predominance,
    conservadoraBid: ctx.lance.conservadoraBid,
    equilibradaBid: ctx.lance.equilibradaBid,
    riskLevel: ctx.lance.riskLevel,
    months: ctx.lance.monthsAnalyzed,
    hasEmbeddedBid: ctx.credito.hasEmbeddedBid,
    embeddedBidMaxPercent: ctx.lance.embeddedBidMaxPercent,
    creditRange: ctx.lance.creditRange,
    clientBid: ctx.lance.clientBid,
    monteCarloProbability: ctx.lance.monteCarloProbability,
    compact: extras?.compact,
    tone: extras?.tone,
    clientObjective: ctx.cliente.objetivo,
    clientSituation: ctx.cliente.situacao,
    reducedInstallment: ctx.reducedInstallment,
  };
}

/** Para `salesPitchGenerator.generateWhatsAppPitch`. */
export function toSalesPitchArgs(
  ctx: MessageContext,
  variation = 0,
  compact = false,
): SalesPitchArgs {
  return {
    clientName: ctx.cliente.nome,
    groupNumber: String(ctx.credito.groupNumber ?? ''),
    trend: ctx.lance.trend ?? 'estavel',
    predominance: ctx.lance.predominance ?? 'equilibrado',
    conservadoraBid: ctx.lance.conservadoraBid ?? 0,
    equilibradaBid: ctx.lance.equilibradaBid ?? 0,
    riskLevel: ctx.lance.riskLevel ?? 'medio',
    months: ctx.lance.monthsAnalyzed ?? 6,
    hasEmbeddedBid: ctx.credito.hasEmbeddedBid,
    embeddedBidMaxPercent: ctx.lance.embeddedBidMaxPercent ?? 0,
    creditRange: ctx.lance.creditRange ?? '',
    clientBid: ctx.lance.clientBid ?? 0,
    monteCarloProbability: ctx.lance.monteCarloProbability ?? null,
    variation,
    compact,
    reducedInstallment: ctx.reducedInstallment,
  };
}

/** Para `AIProposalCard` (payload do edge function `generate-proposal`). */
export function toAIProposalData(ctx: MessageContext) {
  return {
    clientName: ctx.cliente.nome || undefined,
    consortiumType: ctx.credito.consortiumType,
    creditValue: ctx.credito.creditValue,
    installment: ctx.parcela.installment,
    termMonths: ctx.parcela.termMonths,
    totalCost: ctx.credito.totalCost,
    bidPercent: ctx.lance.bidPercent,
    scenarioProfile: ctx.cliente.perfilCenario,
    contemplated: ctx.estrategia.contemplated,
    contemplationMonth: ctx.estrategia.contemplationMonth,
    reducedInstallment: ctx.reducedInstallment,
    clientObjective: ctx.cliente.objetivo,
    subObjetivo: ctx.cliente.subObjetivo,
  };
}
