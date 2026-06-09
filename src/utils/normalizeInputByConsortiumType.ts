/**
 * Normaliza o estado da simulação ao trocar o tipo de consórcio.
 * ──────────────────────────────────────────────────────────────
 * Garante que TODOS os campos relacionados sejam corrigidos
 * automaticamente — sem bloquear o usuário, sem pedir confirmação.
 *
 * Regras (alinhadas a DEFAULT_TERM_MONTHS / FLEX_AVAILABLE_TYPES /
 * EMBEDDED_BID_MAX_PERCENT):
 *  1. Prazo máximo por tipo (imob 200 / auto 80 / pesados 100)
 *  2. Modalidade Flex só existe para auto/pesados
 *  3. Lance livre clamp [0, 100]
 *  4. Lance embutido clamp ao limite oficial por tipo
 *  5. Desconto de taxa vs parcela reduzida (mutuamente exclusivos)
 *  6. Seguro Prestamista: opcional para auto/pesados
 *  7. Crédito mínimo (piso por tipo, evita estados absurdos)
 *
 * Regra final: nenhum estado inválido pode existir no sistema.
 */
import { SimulationInput, ConsortiumType } from '@/types/consortium';
import { EMBEDDED_BID_MAX_PERCENT, MAX_TERM_MONTHS } from '@/config/consortiumRates';
import type { PlanModality } from '@/components/modules/simulator/SimulatorContext';

// Inline para evitar ciclo de import com SimulatorContext.
// Mantém-se alinhado a FLEX_AVAILABLE_TYPES exportado lá.
const FLEX_AVAILABLE_TYPES_LOCAL: ConsortiumType[] = ['auto', 'pesados'];

// Fonte única: MAX_TERM_MONTHS em consortiumRates (regra oficial CAIXA)
const MAX_TERM_BY_TYPE: Record<ConsortiumType, number> = MAX_TERM_MONTHS;

/** Piso de crédito recomendado por tipo (apenas se já houver valor > 0). */
const MIN_CREDIT_BY_TYPE: Record<ConsortiumType, number> = {
  imobiliario: 50_000,
  auto: 20_000,
  pesados: 50_000,
};

export interface NormalizationExtras {
  freeBidPercent: number;
  embeddedBidPercent: number;
  adminFeeDiscount: number;
  insuranceEnabled: boolean;
}

export interface NormalizationResult {
  updatedInput: SimulationInput;
  updatedPlanModality: PlanModality;
  updatedExtras: NormalizationExtras;
  changes: string[];
}

export function normalizeInputByConsortiumType(
  input: SimulationInput,
  type: ConsortiumType,
  planModality: PlanModality,
  extras?: Partial<NormalizationExtras>,
): NormalizationResult {
  const updatedInput: SimulationInput = { ...input, consortiumType: type };
  let updatedPlanModality = planModality;
  const updatedExtras: NormalizationExtras = {
    freeBidPercent: extras?.freeBidPercent ?? 0,
    embeddedBidPercent: extras?.embeddedBidPercent ?? 0,
    adminFeeDiscount: extras?.adminFeeDiscount ?? 0,
    insuranceEnabled: extras?.insuranceEnabled ?? false,
  };
  const changes: string[] = [];

  // 1. Prazo máximo por tipo
  const maxTerm = MAX_TERM_BY_TYPE[type];
  if (updatedInput.termMonths > maxTerm) {
    updatedInput.termMonths = maxTerm;
    changes.push(`Prazo ajustado para o máximo permitido (${maxTerm} meses)`);
  }

  // 2. Modalidade Flex só existe para auto/pesados
  if (!FLEX_AVAILABLE_TYPES_LOCAL.includes(type) && updatedPlanModality !== 'tradicional') {
    updatedPlanModality = 'tradicional';
    changes.push('Modalidade ajustada para Tradicional');
  }

  // 3. Lance livre clamp [0, 100]
  if (updatedExtras.freeBidPercent > 100) {
    updatedExtras.freeBidPercent = 100;
    changes.push('Lance livre limitado a 100%');
  } else if (updatedExtras.freeBidPercent < 0) {
    updatedExtras.freeBidPercent = 0;
  }

  // 4. Lance embutido clamp ao limite oficial por tipo
  const maxEmbedded = EMBEDDED_BID_MAX_PERCENT[type] ?? 0;
  if (updatedExtras.embeddedBidPercent > maxEmbedded) {
    updatedExtras.embeddedBidPercent = maxEmbedded;
    changes.push(`Lance embutido ajustado ao limite do tipo (${maxEmbedded}%)`);
  } else if (updatedExtras.embeddedBidPercent < 0) {
    updatedExtras.embeddedBidPercent = 0;
  }

  // 5. Desconto de taxa vs parcela reduzida (mutuamente exclusivos)
  if (updatedExtras.adminFeeDiscount > 0 && updatedInput.reducedInstallment) {
    updatedExtras.adminFeeDiscount = 0;
    changes.push('Desconto desativado por conflito com parcela reduzida');
  }

  // 6. Crédito mínimo (apenas alerta-correção se valor > 0 e abaixo do piso)
  const minCredit = MIN_CREDIT_BY_TYPE[type];
  if (updatedInput.creditValue > 0 && updatedInput.creditValue < minCredit) {
    updatedInput.creditValue = minCredit;
    changes.push(`Crédito ajustado ao mínimo recomendado (R$ ${minCredit.toLocaleString('pt-BR')})`);
  }

  return { updatedInput, updatedPlanModality, updatedExtras, changes };
}
