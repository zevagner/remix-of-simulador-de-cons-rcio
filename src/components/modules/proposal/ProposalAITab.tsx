import { memo } from 'react';
import { AIProposalCard } from '@/components/modules/summary/AIProposalCard';

interface ProposalAITabProps {
  clientName: string;
  typeLabel: string;
  creditValue: number;
  installment: number;
  termMonths: number;
  totalCost: number;
  totalBidPercent: number;
  scenarioProfile: 'conservador' | 'equilibrado' | 'agressivo';
  contemplated: boolean;
  contemplationMonth?: number;
  reducedInstallment?: boolean;
  reducedInstallmentMonths?: number;
  reducedInstallmentValue?: number;
  redilutedInstallmentValue?: number;
  /** Refinamento opcional do objetivo (label legível). */
  subObjetivo?: string;
  usedCreditForAsset?: boolean;
  creditUsageMonth?: number;
}

export const ProposalAITab = memo(function ProposalAITab(props: ProposalAITabProps) {
  return (
    <div className="space-y-6">
      <AIProposalCard
        proposalData={{
          clientName: props.clientName.trim() || undefined,
          consortiumType: props.typeLabel,
          creditValue: props.creditValue,
          installment: props.installment,
          termMonths: props.termMonths,
          totalCost: props.totalCost,
          bidPercent: props.totalBidPercent > 0 ? props.totalBidPercent : undefined,
          scenarioProfile: props.scenarioProfile,
          contemplated: props.contemplated,
          contemplationMonth: props.contemplationMonth,
          reducedInstallment: props.reducedInstallment,
          reducedInstallmentMonths: props.reducedInstallmentMonths,
          reducedInstallmentValue: props.reducedInstallmentValue,
          redilutedInstallmentValue: props.redilutedInstallmentValue,
          subObjetivo: props.subObjetivo,
          usedCreditForAsset: props.usedCreditForAsset,
          creditUsageMonth: props.creditUsageMonth,
        }}
      />
    </div>
  );
});
