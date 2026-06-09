/**
 * Custo Efetivo Total (CET) — Onda B2.
 *
 * Calcula a TIR mensal do fluxo de caixa do financiamento (entrada de
 * `principal` no mês 0; saídas iguais às parcelas totais nos meses 1..N)
 * e converte para taxa anual efetiva.
 *
 * Algoritmo: Newton-Raphson sobre VPL(rate) = 0, com fallback para
 * bissecção quando a derivada degenera. Tolerância 1e-9, máx 200 iterações.
 *
 * IMPORTANTE: o CET É derivado das parcelas oficiais — não recalcula
 * juros, amortização ou seguros. Consome `payment` da tabela canônica.
 */

export interface CetInput {
  /** Valor recebido pelo cliente (principal financiado). */
  principal: number;
  /** Parcelas totais (juros + amortização + MIP + DFI + adm) já agregadas. */
  payments: number[];
}

export interface CetResult {
  /** Taxa interna de retorno mensal (decimal, ex.: 0.012 = 1,2% a.m.). */
  monthlyRate: number;
  /** Taxa anual efetiva equivalente (decimal). */
  annualRate: number;
  /** Custo total efetivamente desembolsado − principal. */
  totalCostOverPrincipal: number;
  /** True se o algoritmo convergiu dentro da tolerância. */
  converged: boolean;
}

function npv(rate: number, principal: number, payments: number[]): number {
  let v = -principal;
  for (let i = 0; i < payments.length; i++) {
    v += payments[i] / Math.pow(1 + rate, i + 1);
  }
  return v;
}

function dnpv(rate: number, payments: number[]): number {
  let d = 0;
  for (let i = 0; i < payments.length; i++) {
    d += -(i + 1) * payments[i] / Math.pow(1 + rate, i + 2);
  }
  return d;
}

export function calculateCET(input: CetInput): CetResult {
  const { principal, payments } = input;
  const totalPaid = payments.reduce((a, b) => a + b, 0);
  const totalCostOverPrincipal = totalPaid - principal;

  if (principal <= 0 || payments.length === 0 || totalPaid <= principal) {
    return { monthlyRate: 0, annualRate: 0, totalCostOverPrincipal, converged: true };
  }

  // Newton-Raphson
  let rate = 0.01;
  let converged = false;
  for (let it = 0; it < 200; it++) {
    const f = npv(rate, principal, payments);
    if (Math.abs(f) < 1e-9) { converged = true; break; }
    const df = dnpv(rate, payments);
    if (Math.abs(df) < 1e-12) break;
    const next = rate - f / df;
    if (!isFinite(next) || next <= -0.999) break;
    if (Math.abs(next - rate) < 1e-12) { rate = next; converged = true; break; }
    rate = next;
  }

  // Fallback: bissecção em [0, 1] (até 100% a.m.) se NR não convergiu.
  if (!converged || npv(rate, principal, payments) > 1) {
    let lo = 0;
    let hi = 1;
    let mid = rate;
    for (let it = 0; it < 200; it++) {
      mid = (lo + hi) / 2;
      const f = npv(mid, principal, payments);
      if (Math.abs(f) < 1e-9 || (hi - lo) < 1e-12) { converged = true; break; }
      if (f > 0) lo = mid; else hi = mid;
    }
    rate = mid;
  }

  const annualRate = Math.pow(1 + rate, 12) - 1;
  return { monthlyRate: rate, annualRate, totalCostOverPrincipal, converged };
}
