/**
 * Motor atuarial mensal (schedule paralelo) — pós-Onda 2 (Prestamista canônico).
 * ════════════════════════════════════════════════════════════════════════
 * Modelo:
 *   • Seguro = saldo devedor INÍCIO do mês × percentual FIXO oficial CAIXA
 *     (0,0680% cota antiga / 0,0765% cota nova). NÃO varia por idade.
 *   • PJ → seguro = 0. Idade entra APENAS na elegibilidade (idade + prazo ≤ 80a).
 *   • Lance aplicado ANTES da amortização (ordem atuarialmente correta).
 *   • Reajuste anual ponderado (adm reajusta a 50% do índice principal).
 *   • Separação explícita de custos: plano | seguro | lance | efetivo.
 *
 * Fonte canônica do prêmio: `src/core/finance/prestamista/`.
 *
 * Mantém o contrato público (MonthlyScheduleInput / MonthlyScheduleResult /
 * MonthlyRow) — apenas adiciona campos novos para granularidade.
 *
 * Saldo devedor decomposto em 3 componentes amortizadas em paralelo:
 *   - Crédito (fundo comum)
 *   - Taxa administrativa (remanescente)
 *   - Fundo de reserva (remanescente)
 *
 * ════════════════════════════════════════════════════════════════════════
 * NOTA — divergência residual vs `calculateSimulationLegacy`
 * ════════════════════════════════════════════════════════════════════════
 *   1. Recálculo MÊS A MÊS sobre saldo devedor real (este motor) vs
 *      agregação linear no horizonte (legado: creditValue × rate × prazo).
 *   2. Composição em prazos longos (≥ 200 meses) amplifica diferenças.
 * Tolerâncias oficiais: padrão ≤ 2%; sem lance ≤ 1%; prazo ≥ 200m ≤ 5%.
 * ════════════════════════════════════════════════════════════════════════
 */
import { SimulationInput, ContemplationType } from '@/types/consortium';
import { MAX_REDUCED_INSTALLMENT_MONTHS, REDUCED_INSTALLMENT_FACTOR } from '@/config/consortiumRates';
import {
  calculateOperationalPrestamistaForType,
  DEFAULT_PRESTAMISTA_COHORT,
  getPrestamistaRate,
  type PrestamistaCohort,
  type PersonType,
} from '@/core/finance/prestamista';

// (Onda 2B) `getInsuranceRate(_age?)` foi REMOVIDO da superfície pública.
// Use diretamente `getPrestamistaRate()` ou `calculatePrestamistaPremium`
// de `@/core/finance`. O motor mensal abaixo consome a engine canônica
// internamente — call sites externos não devem replicar a fórmula.

export interface MonthlyScheduleInput {
  sim: SimulationInput;
  /** Contempla? Se sim em qual mês (1-based, mês da assembleia). */
  contemplated?: boolean;
  contemplationType?: ContemplationType;
  contemplationMonth?: number;
  /** Pós-contemplação por lance: 'reduce-installment' (default) ou 'reduce-term'. */
  postLanceChoice?: 'reduce-installment' | 'reduce-term';
  /** Reajuste anual do saldo (% a.a.). 0 = nominal (sem reajuste). */
  annualAdjustmentPercent?: number;
  /**
   * Mês a partir do qual o Seguro Prestamista passa a incidir (1-based).
   * Default = 1 (seguro do primeiro mês ao último).
   * Usado quando o cliente só passa a ter cobertura obrigatória após
   * utilizar a carta para aquisição de bem (mês de utilização ≠ mês de
   * contemplação). Não altera o prêmio mensal (fixo CAIXA) — apenas
   * gateia a aplicação por mês. Meses anteriores recebem insurance=0.
   */
  insuranceStartMonth?: number;
}

export interface MonthlyRow {
  month: number;
  /** Saldo devedor no INÍCIO do mês (base do seguro do mês). */
  balanceStart: number;
  /** Componentes do saldo no início do mês. */
  balanceCredit: number;
  balanceAdminFee: number;
  balanceReserveFund: number;
  /** Reajuste aplicado neste mês (R$). 0 quando não é mês de aniversário. */
  adjustmentApplied: number;
  /** Parcela base (sem seguro), descontando contribuições + adm + FR. */
  baseInstallment: number;
  /** Parcela final paga no mês (base + seguro). */
  payment: number;
  /** Seguro do mês (saldo × taxa atuarial). 0 se desabilitado. */
  insurance: number;
  /** Valor amortizado de cada componente neste mês. */
  amortCredit: number;
  amortAdminFee: number;
  amortReserveFund: number;
  /** Lance abatido neste mês (somente no mês da contemplação por lance). */
  bidApplied: number;
  /** Saldo no FIM do mês (após pagamento e lance). */
  balanceEnd: number;
  /** Marca o regime: 'reduced' | 'full' | 'rediluted' | 'post-bid'. */
  regime: 'reduced' | 'full' | 'rediluted' | 'post-bid';
  /**
   * Valor da CARTA DE CRÉDITO (poder de compra) NESTE mês, refletindo
   * reajustes anuais já aplicados. Nominal = creditValue (mês 1) quando
   * `annualAdjustmentPercent` = 0; cresce ao longo do tempo quando > 0
   * (uso típico: INPC no módulo Análise).
   */
  creditLetterValue: number;
}

export interface MonthlyScheduleResult {
  rows: MonthlyRow[];
  /** Soma de todos os pagamentos (parcelas + seguros + lances). */
  totalPaid: number;
  /** Soma somente dos seguros mensais. */
  totalInsurance: number;
  /** Soma dos lances aplicados (deve == freeBid + embeddedBid). */
  totalBids: number;
  /** Total de reajustes aplicados ao longo do plano. */
  totalAdjustments: number;
  /** Custo efetivo do cliente = totalPaid - embeddedBid (lance embutido não é desembolso). */
  effectiveClientCost: number;

  // ─── Separação de custos (refino atuarial) ───
  /** Soma somente das parcelas base (sem seguro, sem lance). */
  totalInstallmentsPaid: number;
  /** Custo do plano = totalInstallmentsPaid (sem seguro). */
  costPlan: number;
  /** Custo do plano + seguro acumulado. */
  costWithInsurance: number;
}

/**
 * Calcula a evolução mês a mês do consórcio com seguro decrescente
 * sobre o saldo devedor total.
 */
export function calculateMonthlySchedule(input: MonthlyScheduleInput): MonthlyScheduleResult {
  const {
    sim,
    contemplated = false,
    contemplationType = 'none',
    contemplationMonth = 0,
    postLanceChoice = 'reduce-installment',
    annualAdjustmentPercent = 0,
    insuranceStartMonth = 1,
  } = input;

  const term = Math.max(0, Math.floor(sim.termMonths || 0));
  const startMonth = Math.max(1, Math.floor(insuranceStartMonth || 1));
  if (term === 0) {
    return {
      rows: [], totalPaid: 0, totalInsurance: 0, totalBids: 0,
      totalAdjustments: 0, effectiveClientCost: 0,
      totalInstallmentsPaid: 0, costPlan: 0, costWithInsurance: 0,
    };
  }

  const credit = Math.max(0, sim.creditValue || 0);
  const adminFeeTotal = (credit * (sim.adminFeePercent || 0)) / 100;
  const reserveFundTotal = (credit * (sim.reserveFundPercent || 0)) / 100;
  // Prestamista OPERACIONAL V1 (Onda OP-V1): premium FIXO mensal =
  // Categoria Inicial × FatorOperacional(modalidade,prazo) × percentual oficial.
  // Engine única: calculateOperationalPrestamistaForType (lookup por tabela
  // institucional). Fora dos cenários confirmados → factor=1.0 + warning.
  const cohort: PrestamistaCohort = sim.prestamistaCohort ?? DEFAULT_PRESTAMISTA_COHORT;
  const personType: PersonType = sim.personType ?? 'PF';
  const proponentAge = Math.max(0, sim.proponentAge || 0);
  const fallbackInsurancePercent = Math.max(0, sim.insurancePercent || 0);
  const insuranceEnabled =
    personType === 'PF' && (proponentAge > 0 || fallbackInsurancePercent > 0);
  const operationalPrestamista = calculateOperationalPrestamistaForType({
    creditValue: credit,
    adminFeeTotal,
    reserveFundTotal,
    termMonths: term,
    consortiumType: sim.consortiumType,
    cohort,
    personType,
    enabled: insuranceEnabled,
  });
  const monthlyPremiumFixed = operationalPrestamista.monthlyPremium;

  // Lance total — livre clamped ao crédito (A1), embutido limitado ao crédito
  const freeBid = Math.min(Math.max(0, sim.freeBidValue || 0), credit);
  const embeddedBid = Math.min(Math.max(0, sim.embeddedBidValue || 0), credit);
  const totalBidsInput = freeBid + embeddedBid;

  // Componentes do saldo (proporção fixa entre crédito/adm/FR)
  let balanceCredit = credit;
  let balanceAdminFee = adminFeeTotal;
  let balanceReserveFund = reserveFundTotal;

  // Parcelas base (sem seguro, calculadas como divisão linear do total nominal).
  // IMPORTANTE: estes valores são RECALCULADOS a cada reajuste anual (INPC)
  // dentro do loop, garantindo que o saldo SEMPRE convirja para zero ao final
  // do prazo (regra padrão do consórcio: saldo remanescente / prazo remanescente).
  const baseTotal = credit + adminFeeTotal + reserveFundTotal;
  let fullBaseInstallment = baseTotal / term;
  const maxReducedMonths = MAX_REDUCED_INSTALLMENT_MONTHS[sim.consortiumType] ?? 0;
  // A2 — guard: parcela reduzida só é aplicada quando há margem de rediluição
  // (prazo > janela de reduzida). Em prazos curtos, ignora silenciosamente e
  // roda como plano cheio para preservar convergência do saldo a zero.
  const reducedActive = !!sim.reducedInstallment && term > maxReducedMonths;
  let reducedBaseInstallment = reducedActive ? fullBaseInstallment * REDUCED_INSTALLMENT_FACTOR : 0;

  // Rediluição: quando há período reduzido, o déficit é distribuído
  // proporcionalmente nos meses restantes (mantém aderência ao agregado legado).
  const remainingMonthsAfterReduced = Math.max(0, term - maxReducedMonths);
  let redilutedBaseInstallment = fullBaseInstallment;
  if (reducedActive && remainingMonthsAfterReduced > 0) {
    const deficit = (fullBaseInstallment - reducedBaseInstallment) * Math.min(maxReducedMonths, term);
    redilutedBaseInstallment = fullBaseInstallment + deficit / remainingMonthsAfterReduced;
  }

  const rows: MonthlyRow[] = [];
  let totalPaid = 0;
  let totalInsurance = 0;
  let totalBids = 0;
  let totalAdjustments = 0;
  let totalInstallmentsPaid = 0;
  let postBidInstallment: number | null = null; // ativada após contemplação por lance c/ reduce-installment
  let earlyTerminate = false;
  // Valor da CARTA DE CRÉDITO ao longo do tempo — reflete reajustes anuais
  // (poder de compra real do crédito; independente do saldo devedor).
  let creditLetterValue = credit;

  for (let month = 1; month <= term && !earlyTerminate; month++) {
    // ─── 1. Reajuste anual (aniversário: meses 13, 25, …) ───
    // adm reajusta pelo índice cheio (norma CAIXA Consórcio):
    // crédito, saldo devedor e todos os componentes reajustam pelo índice cheio.
    let adjustmentApplied = 0;
    if (annualAdjustmentPercent > 0 && month > 1 && (month - 1) % 12 === 0) {
      const annualRate = annualAdjustmentPercent / 100;
      const incCredit = balanceCredit * annualRate;
      const incAdmin = balanceAdminFee * annualRate;
      const incFR = balanceReserveFund * annualRate;
      adjustmentApplied = incCredit + incAdmin + incFR;
      balanceCredit += incCredit;
      balanceAdminFee += incAdmin;
      balanceReserveFund += incFR;
      totalAdjustments += adjustmentApplied;
      // Carta de crédito reajusta pelo índice cheio (poder de compra)
      creditLetterValue *= 1 + annualRate;

      // ─── RECÁLCULO OBRIGATÓRIO DAS PARCELAS APÓS REAJUSTE ───
      // Regra do consórcio: saldo reajustado é redistribuído pelo prazo
      // remanescente, garantindo convergência do saldo a zero no fim do plano.
      // Sem isso, a parcela fica fixa no valor inicial e o saldo "horizontaliza".
      const remainingMonths = term - month + 1; // inclui o mês corrente
      if (remainingMonths > 0) {
        const newBalance = balanceCredit + balanceAdminFee + balanceReserveFund;
        fullBaseInstallment = newBalance / remainingMonths;
        if (reducedActive) {
          reducedBaseInstallment = fullBaseInstallment * REDUCED_INSTALLMENT_FACTOR;
          const monthsStillReduced = Math.max(0, Math.min(maxReducedMonths, term) - (month - 1));
          const monthsAfterReduced = Math.max(0, remainingMonths - monthsStillReduced);
          if (monthsAfterReduced > 0) {
            const deficit = (fullBaseInstallment - reducedBaseInstallment) * monthsStillReduced;
            redilutedBaseInstallment = fullBaseInstallment + deficit / monthsAfterReduced;
          } else {
            redilutedBaseInstallment = fullBaseInstallment;
          }
        }
        // Pós-lance com 'reduce-installment' também segue a regra
        if (postBidInstallment !== null && postLanceChoice === 'reduce-installment') {
          postBidInstallment = newBalance / remainingMonths;
        }
      }
    }

    // ─── 2. Snapshot do saldo no INÍCIO do mês ───
    const balanceStart = balanceCredit + balanceAdminFee + balanceReserveFund;

    // ─── 3. LANCE aplicado ANTES da amortização (ordem atuarial correta) ───
    let bidApplied = 0;
    const isContemplationMonth =
      contemplated &&
      contemplationType === 'lance' &&
      totalBidsInput > 0 &&
      month === Math.max(1, Math.min(contemplationMonth, term));

    if (isContemplationMonth && balanceStart > 0) {
      const effectiveBid = Math.min(totalBidsInput, balanceStart);
      bidApplied = effectiveBid;
      totalBids += effectiveBid;

      const rb1 = balanceCredit / balanceStart;
      const rb2 = balanceAdminFee / balanceStart;
      const rb3 = balanceReserveFund / balanceStart;
      balanceCredit = Math.max(0, balanceCredit - effectiveBid * rb1);
      balanceAdminFee = Math.max(0, balanceAdminFee - effectiveBid * rb2);
      balanceReserveFund = Math.max(0, balanceReserveFund - effectiveBid * rb3);
    }

    // Saldo pós-lance (base de cálculo de proporções e amortização)
    const balanceAfterBid = balanceCredit + balanceAdminFee + balanceReserveFund;

    // ─── 4. Determinar regime e parcela base ───
    // Se o lance foi aplicado este mês, já recalculamos postBidInstallment
    // ANTES de definir a parcela, para que o próprio mês reflita o novo regime.
    if (isContemplationMonth) {
      const remainingMonths = term - month + 1; // inclui o próprio mês
      if (postLanceChoice === 'reduce-installment' && remainingMonths > 0) {
        postBidInstallment = balanceAfterBid / remainingMonths;
      } else {
        postBidInstallment = fullBaseInstallment;
      }
    }

    let regime: MonthlyRow['regime'];
    let baseInstallment: number;

    if (postBidInstallment !== null) {
      regime = 'post-bid';
      baseInstallment = postBidInstallment;
    } else if (reducedActive && month <= maxReducedMonths) {
      regime = 'reduced';
      baseInstallment = reducedBaseInstallment;
    } else if (reducedActive && month > maxReducedMonths) {
      regime = 'rediluted';
      baseInstallment = redilutedBaseInstallment;
    } else {
      regime = 'full';
      baseInstallment = fullBaseInstallment;
    }

    // Não pagar mais que o saldo pós-lance
    if (baseInstallment > balanceAfterBid) baseInstallment = balanceAfterBid;

    // ─── 5. Amortização proporcional dos componentes ───
    const ratioCredit = balanceAfterBid > 0 ? balanceCredit / balanceAfterBid : 0;
    const ratioAdmin = balanceAfterBid > 0 ? balanceAdminFee / balanceAfterBid : 0;
    const ratioFR = balanceAfterBid > 0 ? balanceReserveFund / balanceAfterBid : 0;

    const amortCredit = baseInstallment * ratioCredit;
    const amortAdminFee = baseInstallment * ratioAdmin;
    const amortReserveFund = baseInstallment * ratioFR;

    balanceCredit = Math.max(0, balanceCredit - amortCredit);
    balanceAdminFee = Math.max(0, balanceAdminFee - amortAdminFee);
    balanceReserveFund = Math.max(0, balanceReserveFund - amortReserveFund);

    const balanceEnd = balanceCredit + balanceAdminFee + balanceReserveFund;

    // ─── 6. Seguro Prestamista (operacional Onda OP) ───
    // Regra oficial CAIXA: premium FIXO = Categoria Inicial × taxa.
    // Mesmo valor TODO mês — não acompanha saldo devedor. PJ → 0.
    // Gate por `insuranceStartMonth`: meses anteriores recebem 0 (usado
    // quando o cliente só adquire cobertura obrigatória após utilizar
    // a carta para aquisição de bem em mês ≠ contemplação).
    const insurance = month >= startMonth ? monthlyPremiumFixed : 0;

    const payment = baseInstallment + insurance;

    rows.push({
      month,
      balanceStart,
      balanceCredit: balanceAfterBid * ratioCredit,
      balanceAdminFee: balanceAfterBid * ratioAdmin,
      balanceReserveFund: balanceAfterBid * ratioFR,
      adjustmentApplied,
      baseInstallment,
      payment,
      insurance,
      amortCredit,
      amortAdminFee,
      amortReserveFund,
      bidApplied,
      balanceEnd,
      regime,
      creditLetterValue,
    });

    totalPaid += payment + bidApplied;
    totalInsurance += insurance;
    totalInstallmentsPaid += baseInstallment;

    // Encerra cedo se saldo zerado (cenário reduce-term)
    if (balanceEnd <= 0.01) earlyTerminate = true;
  }

  // ─── Separação explícita de custos ───
  const costPlan = totalInstallmentsPaid;                     // só parcelas
  const costWithInsurance = costPlan + totalInsurance;        // + seguro
  // Custo efetivo: tudo que o cliente desembolsa (parcelas + seguro + lance livre).
  // O lance embutido NÃO é desembolso real (vem do próprio crédito).
  const effectiveClientCost = totalPaid - embeddedBid;

  return {
    rows,
    totalPaid,
    totalInsurance,
    totalBids,
    totalAdjustments,
    effectiveClientCost,
    totalInstallmentsPaid,
    costPlan,
    costWithInsurance,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Validação atuarial idade + prazo
// ─────────────────────────────────────────────────────────────────────────

/** Idade máxima permitida ao final do plano (regra CAIXA: < 80 anos). */
export const MAX_AGE_AT_END_YEARS = 79;
export const MAX_AGE_AT_END_MONTHS_FRAC = 11; // 79a 11m 29d
export const MIN_PROPONENT_AGE = 18;
export const MAX_PROPONENT_AGE = 79;

export interface AgeTermValidation {
  valid: boolean;
  reason?: 'age-min' | 'age-max' | 'age-plus-term';
  message?: string;
  /** Prazo máximo (meses) permitido pela regra idade+prazo. */
  maxAllowedTermMonths: number;
}

/**
 * Valida que idade do proponente + prazo do plano respeitam a regra
 * atuarial: o proponente não pode ultrapassar 79 anos, 11 meses e 29 dias
 * ao final do plano.
 */
export function validateAgeAndTerm(ageYears: number, termMonths: number): AgeTermValidation {
  const age = Math.floor(ageYears || 0);
  const term = Math.max(0, Math.floor(termMonths || 0));

  // Limite teórico: idade*12 + termo ≤ 80*12 - 1 = 959 meses
  // (equivale a < 80 anos no fim do plano; aceita até 79a 11m)
  const ageMonths = age * 12;
  const maxAllowedTermMonths = Math.max(0, (MAX_AGE_AT_END_YEARS + 1) * 12 - ageMonths - 1);

  if (age < MIN_PROPONENT_AGE) {
    return {
      valid: false,
      reason: 'age-min',
      message: `Idade mínima do proponente: ${MIN_PROPONENT_AGE} anos.`,
      maxAllowedTermMonths,
    };
  }

  if (age > MAX_PROPONENT_AGE) {
    return {
      valid: false,
      reason: 'age-max',
      message: `Idade máxima do proponente: ${MAX_PROPONENT_AGE} anos.`,
      maxAllowedTermMonths: 0,
    };
  }

  if (term > maxAllowedTermMonths) {
    const maxYears = Math.floor(maxAllowedTermMonths / 12);
    const maxMonths = maxAllowedTermMonths % 12;
    return {
      valid: false,
      reason: 'age-plus-term',
      message: `Idade + prazo excede o limite atuarial (proponente atingiria ${MAX_AGE_AT_END_YEARS}a ${MAX_AGE_AT_END_MONTHS_FRAC}m antes do fim do plano). Prazo máximo permitido para ${age} anos: ${maxAllowedTermMonths} meses (${maxYears}a ${maxMonths}m).`,
      maxAllowedTermMonths,
    };
  }

  return { valid: true, maxAllowedTermMonths };
}
