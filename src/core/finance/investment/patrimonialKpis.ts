/**
 * ════════════════════════════════════════════════════════════════════════════
 * PATRIMONIAL KPIs — Engenharia Patrimonial (Onda Patrimonial 1)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Primitivas determinísticas de KPIs executivos para o submódulo
 * "Engenharia Patrimonial" (dentro de Análise).
 *
 * Princípio:
 *   • Consumer-only do investment engine canônico (`@/core/finance`).
 *   • Zero recálculo de schedule/parcela — recebe valores já apurados.
 *   • Zero IA / zero edge function.
 *   • Tom institucional: nunca prometer retorno garantido.
 *
 * Funções:
 *   • calculateTIR         — Newton-Raphson + bissecção (padrão CET).
 *   • calculateROI         — (FV - PV) / PV.
 *   • calculatePayback     — mês em que fluxo acumulado cruza zero.
 *   • calculatePatrimonialMultiplier — patrimônio controlado / capital próprio.
 *   • calculatePreservedCapital      — caixa líquido remanescente.
 * ════════════════════════════════════════════════════════════════════════════
 */

/**
 * Taxa Interna de Retorno (mensal) de um fluxo de caixa.
 *   Σ CF_t / (1 + i)^t = 0
 *
 * @param cashFlows fluxo mensal (CF[0] geralmente negativo = aporte inicial)
 * @returns TIR mensal em decimal, ou null se não convergir
 */
export function calculateTIR(cashFlows: number[]): number | null {
  if (!cashFlows.length || cashFlows.length < 2) return null;
  const hasPositive = cashFlows.some((cf) => cf > 0);
  const hasNegative = cashFlows.some((cf) => cf < 0);
  if (!hasPositive || !hasNegative) return null;

  const npv = (rate: number): number => {
    let v = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      v += cashFlows[t] / Math.pow(1 + rate, t);
    }
    return v;
  };
  const dnpv = (rate: number): number => {
    let v = 0;
    for (let t = 1; t < cashFlows.length; t++) {
      v -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }
    return v;
  };

  // Newton-Raphson
  let rate = 0.01;
  for (let i = 0; i < 60; i++) {
    const f = npv(rate);
    if (Math.abs(f) < 1e-7) return rate;
    const df = dnpv(rate);
    if (Math.abs(df) < 1e-12) break;
    const next = rate - f / df;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-9) return next;
    rate = next;
  }

  // Bissecção como fallback
  let lo = -0.99;
  let hi = 1.0;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const f = npv(mid);
    if (Math.abs(f) < 1e-7) return mid;
    if (npv(lo) * f < 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** ROI simples: (valor final − investido) / investido. Retorna null se inválido. */
export function calculateROI(finalValue: number, totalInvested: number): number | null {
  if (totalInvested <= 0) return null;
  return (finalValue - totalInvested) / totalInvested;
}

/**
 * Payback: primeiro mês em que o fluxo acumulado cruza zero.
 * Retorna null se não houver retorno positivo ou nunca cruzar.
 */
export function calculatePayback(cashFlows: number[]): number | null {
  let acc = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    acc += cashFlows[t];
    if (acc >= 0 && t > 0) return t;
  }
  return null;
}

/**
 * Multiplicador patrimonial: patrimônio controlado ÷ capital próprio aportado.
 * Mede alavancagem efetiva do consórcio (ex.: aportar 100k para controlar 500k = 5x).
 */
export function calculatePatrimonialMultiplier(
  controlledAsset: number,
  ownCapitalInvested: number,
): number | null {
  if (ownCapitalInvested <= 0) return null;
  return controlledAsset / ownCapitalInvested;
}

/**
 * Capital preservado: caixa que permanece líquido após a estratégia.
 * Útil em comparações vs. compra à vista.
 */
export function calculatePreservedCapital(
  cashOnHand: number,
  amountUsedAsBid: number,
): number {
  return Math.max(0, cashOnHand - amountUsedAsBid);
}
