import { ConsortiumType } from '@/types/consortium';
import type { PersonType } from '@/core/finance';

export interface CreditCard {
  id: string;
  consortiumType: ConsortiumType;
  /** Onda 3: PJ não contrata Seguro Prestamista (engine canônica zera). */
  personType?: PersonType;
  creditValue: number;
  termMonths: number;
  adminFeePercent: number;
  reserveFundPercent: number;
  proponentAge: number;
  insuranceEnabled: boolean;
  embeddedBidPercent: number;
  freeBidType: 'value' | 'percent';
  freeBidValue: number;
  freeBidPercent: number;
  quantity: number;
}

export interface CardResult {
  id: string;
  consortiumType: ConsortiumType;
  creditValue: number;
  totalCreditValue: number;
  quantity: number;
  initialInstallment: number;
  totalInitialInstallment: number;
  installmentAfterContemplation: number;
  totalInstallmentAfterContemplation: number;
  totalPaid: number;
  totalCost: number;
  freeBidValue: number;
  embeddedBidValue: number;
  totalBid: number;
  availableCredit: number;
  adminFeeTotal: number;
  reserveFundTotal: number;
  insuranceTotal: number;
  /** True quando a soma de lances excede o crédito (availableCredit < 0). */
  isOverBid?: boolean;
}

export interface ConsolidatedResult {
  totalCreditValue: number;
  totalInitialInstallment: number;
  totalInstallmentAfterContemplation: number;
  totalPaid: number;
  totalCost: number;
  freeBidValue: number;
  embeddedBidValue: number;
  totalBid: number;
  availableCredit: number;
  totalQuantity: number;
  adminFeeTotal: number;
  reserveFundTotal: number;
  insuranceTotal: number;
}
