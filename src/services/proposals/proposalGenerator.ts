/**
 * Commercial proposal generator — assembles data and delegates to templates.
 * This file handles ONLY data preparation and template orchestration.
 * All copy/text lives in proposalTemplates.ts.
 */
import { formatCurrency } from '@/core/finance';
import { BlockContext, selectTone, renderProposal, renderShortProposal, type Tone } from '@/services/proposals/proposalTemplates';

export interface ProposalData {
  clientName: string;
  creditValue: number;
  installment: number;
  termMonths: number;
  totalCost: number;
  consortiumType: string;
  suggestedBidPercent?: number;
  suggestedZone?: string;
  groupNumber?: number;
  netCreditValue?: number;
  embeddedBidValue?: number;
  contemplated?: boolean;
  contemplationMonth?: number;
  postContemplationChoice?: string;
  installmentAfterContemplation?: number;
  reducedTermMonths?: number;
  scenarioProfile?: 'conservador' | 'equilibrado' | 'agressivo';
  clientObjective?: string;
  clientSituation?: string;
  reducedInstallment?: boolean;
  /** Quando reducedInstallment === true e cliente NÃO contemplado, valores das duas fases. */
  reducedInstallmentMonths?: number;
  reducedInstallmentValue?: number;
  redilutedInstallmentValue?: number;
  /** Refinamento opcional do objetivo (enum ou label). Usado para enriquecer copy. */
  subObjetivo?: string;
  /** Cliente utilizou (ou utilizará) a carta para aquisição de bem após a contemplação.
   *  Quando true, o seguro Prestamista só passa a vigorar a partir de `creditUsageMonth`. */
  usedCreditForAsset?: boolean;
  creditUsageMonth?: number;
  /** Reajuste INPC anual (% a.a.) — quando >0, será sinalizado na proposta. */
  annualAdjustmentPercent?: number;
}

/** Convert raw ProposalData into the template-ready BlockContext */
function buildContext(data: ProposalData): BlockContext {
  const hasEmbeddedBid = !!(data.embeddedBidValue && data.embeddedBidValue > 0 && data.netCreditValue);

  return {
    clientName: data.clientName.trim(),
    consortiumType: data.consortiumType,
    creditValue: formatCurrency(data.creditValue),
    netCreditValue: data.netCreditValue ? formatCurrency(data.netCreditValue) : undefined,
    embeddedBidValue: data.embeddedBidValue ? formatCurrency(data.embeddedBidValue) : undefined,
    hasEmbeddedBid,
    termMonths: data.termMonths,
    installment: formatCurrency(data.installment),
    totalCost: formatCurrency(data.totalCost),
    groupNumber: data.groupNumber,
    bidPercent: data.suggestedBidPercent ? `${data.suggestedBidPercent.toFixed(2)}%` : undefined,
    bidZone: data.suggestedZone || 'equilibrada',
    contemplated: !!data.contemplated,
    contemplationMonth: data.contemplationMonth,
    postContemplationChoice: data.postContemplationChoice,
    installmentAfterContemplation: data.installmentAfterContemplation ? formatCurrency(data.installmentAfterContemplation) : undefined,
    reducedTermMonths: data.reducedTermMonths,
    scenarioProfile: data.scenarioProfile || 'conservador',
    date: new Date().toLocaleDateString('pt-BR'),
    clientObjective: data.clientObjective?.trim() || undefined,
    clientSituation: data.clientSituation?.trim() || undefined,
    reducedInstallment: data.reducedInstallment,
    reducedInstallmentMonths: data.reducedInstallmentMonths,
    reducedInstallmentValue: data.reducedInstallmentValue != null ? formatCurrency(data.reducedInstallmentValue) : undefined,
    redilutedInstallmentValue: data.redilutedInstallmentValue != null ? formatCurrency(data.redilutedInstallmentValue) : undefined,
    subObjetivo: data.subObjetivo?.trim() || undefined,
    usedCreditForAsset: data.usedCreditForAsset,
    creditUsageMonth: data.creditUsageMonth,
    annualAdjustmentPercent: data.annualAdjustmentPercent,
  };
}

export function generateWhatsAppProposal(data: ProposalData, overrideTone?: Tone): string {
  const ctx = buildContext(data);
  const tone = overrideTone ?? selectTone(data.clientName, data.creditValue, data.termMonths);
  return renderProposal(ctx, 'whatsapp', tone);
}

export function generateShortWhatsAppProposal(data: ProposalData, overrideTone?: Tone): string {
  const ctx = buildContext(data);
  const tone = overrideTone ?? selectTone(data.clientName, data.creditValue, data.termMonths);
  return renderShortProposal(ctx, 'whatsapp', tone);
}

export function generateStructuredProposal(data: ProposalData, overrideTone?: Tone): string {
  const ctx = buildContext(data);
  const tone = overrideTone ?? selectTone(data.clientName, data.creditValue, data.termMonths);
  return renderProposal(ctx, 'formal', tone);
}
