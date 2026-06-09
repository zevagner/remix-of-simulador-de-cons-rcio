/**
 * Validação dos valores do BLOCO DE IMPACTO INICIAL do PDF Premium.
 *
 * Regra de negócio:
 *  - "Você paga"   → custo efetivo do plano (effectiveClientCost)
 *  - "Para acessa" → carta de crédito (creditValue)
 *
 * Ambos DEVEM existir, ser números finitos, > 0, e dentro de um teto defensivo.
 * Esta validação roda em DUAS camadas:
 *   1) `validateImpactValues` (este arquivo) — usado no wizard antes de gerar o PDF.
 *   2) `sanitizeImpactValue` (PdfPropostaCompleta) — última linha de defesa no render.
 */

import { z } from 'zod';

/** Teto defensivo (R$ 100 milhões) — protege contra dados corrompidos / overflow. */
export const IMPACT_VALUE_MAX = 100_000_000;

/** Schema base para qualquer valor monetário do bloco de impacto. */
const monetarySchema = z
  .number()
  .finite('Valor não-finito')
  .positive('Valor deve ser maior que zero')
  .max(IMPACT_VALUE_MAX, `Valor acima do limite (R$ ${IMPACT_VALUE_MAX.toLocaleString('pt-BR')})`);

/** Schema completo do bloco de impacto. */
export const impactValuesSchema = z.object({
  /** "Você paga" — custo efetivo do plano. */
  paga: monetarySchema,
  /** "Para acessar" — carta de crédito. */
  acessa: monetarySchema,
});

export type ImpactValues = z.infer<typeof impactValuesSchema>;

export interface ImpactValidationInput {
  effectiveClientCost?: number;
  totalCost?: number;
  creditValue?: number;
}

export type ImpactValidationResult =
  | { ok: true; values: ImpactValues; usedFallback: boolean }
  | { ok: false; error: string };

/**
 * Valida e (quando possível) deriva valores válidos para o bloco de impacto.
 * Aplica fallback determinístico: se `effectiveClientCost` for inválido,
 * tenta `totalCost` antes de falhar.
 */
export function validateImpactValues(input: ImpactValidationInput): ImpactValidationResult {
  const credit = Number(input.creditValue);
  if (!Number.isFinite(credit) || credit <= 0) {
    return { ok: false, error: 'Carta de crédito inválida ou ausente.' };
  }
  if (credit > IMPACT_VALUE_MAX) {
    return { ok: false, error: 'Carta de crédito acima do limite suportado.' };
  }

  const eff = Number(input.effectiveClientCost);
  const total = Number(input.totalCost);

  let paga: number | null = null;
  let usedFallback = false;

  if (Number.isFinite(eff) && eff > 0 && eff <= IMPACT_VALUE_MAX) {
    paga = eff;
  } else if (Number.isFinite(total) && total > 0 && total <= IMPACT_VALUE_MAX) {
    paga = total;
    usedFallback = true;
  }

  if (paga === null) {
    return { ok: false, error: 'Custo do plano inválido — execute uma simulação válida antes de gerar o PDF.' };
  }

  // Validação final via schema (defesa em profundidade).
  const parsed = impactValuesSchema.safeParse({ paga, acessa: credit });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Valores inválidos.' };
  }

  return { ok: true, values: parsed.data, usedFallback };
}
