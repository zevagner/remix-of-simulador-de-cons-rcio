/**
 * Sales pitch generator for WhatsApp/email messages.
 * Delegates to the unified salesCopyEngine for consistency.
 * Maintains backward-compatible API.
 */
import { generateSalesArgument, stripFormatting, type SalesArgumentResult } from '@/services/salesCopyEngine';

export interface SalesPitchArgs {
  clientName: string;
  groupNumber: string;
  trend: 'queda' | 'alta' | 'estavel';
  predominance: 'sorteio' | 'lance' | 'equilibrado';
  conservadoraBid: number;
  equilibradaBid: number;
  riskLevel: 'baixo' | 'medio' | 'alto';
  months: number;
  hasEmbeddedBid: boolean;
  embeddedBidMaxPercent: number;
  creditRange: string;
  clientBid: number;
  monteCarloProbability: number | null;
  variation: number;
  compact?: boolean;
  reducedInstallment?: boolean;
}

export interface SalesPitchResult {
  pitch: string;
  highlights: string[];
}

export function generateWhatsAppPitch(args: SalesPitchArgs): SalesPitchResult {
  const result: SalesArgumentResult = generateSalesArgument({
    mode: 'estudo_lances',
    clientName: args.clientName,
    groupNumber: args.groupNumber,
    trend: args.trend,
    predominance: args.predominance,
    conservadoraBid: args.conservadoraBid,
    equilibradaBid: args.equilibradaBid,
    riskLevel: args.riskLevel,
    months: args.months,
    hasEmbeddedBid: args.hasEmbeddedBid,
    embeddedBidMaxPercent: args.embeddedBidMaxPercent,
    creditRange: args.creditRange,
    clientBid: args.clientBid,
    monteCarloProbability: args.monteCarloProbability,
    variation: args.variation,
    compact: args.compact,
    reducedInstallment: args.reducedInstallment,
  });

  return { pitch: result.text, highlights: result.highlights };
}

/**
 * Strip WhatsApp bold markers (*text*) for plain text copy.
 */
export function stripWhatsAppFormatting(text: string): string {
  return stripFormatting(text);
}
