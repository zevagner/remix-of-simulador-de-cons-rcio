/**
 * Decision Engine — regras puras de recomendação baseadas no perfil do Diagnóstico (P8).
 *
 * Este módulo NÃO altera a lógica existente do simulador/análise/investimento.
 * Ele apenas centraliza, em forma de funções puras e determinísticas, as
 * regras de validação que devem ser respeitadas em qualquer recomendação.
 *
 * Uso:
 *   import { recommend, validateSystem } from '@/utils/decisionEngine';
 *
 * As regras são intencionalmente conservadoras — qualquer violação detectada
 * por `validateSystem()` indica regressão e deve impedir a recomendação.
 */

import type {
  ObjetivoPrincipal,
  Prioridade,
  Urgencia,
} from '@/components/modules/diagnostic/DiagnosticContext';
import { calculateSimulationLegacy } from '@/core/finance';
import { logger } from '@/utils/logger';
import {
  EMBEDDED_BID_MAX_PERCENT,
  REDUCED_INSTALLMENT_FACTOR,
  MAX_REDUCED_INSTALLMENT_MONTHS,
  getEmbeddedBidMaxPercent,
} from '@/config/consortiumRates';
import type { ConsortiumType } from '@/types/consortium';

// ─── Inputs ───────────────────────────────────────────────────────────────

export interface DecisionInput {
  objetivoPrincipal: ObjetivoPrincipal;
  capacidadeMensal: number;
  temCapitalDisponivel: boolean;
  capitalDisponivel: number;
  prioridade: Prioridade;
  urgencia: Urgencia;
  /** Refinamento opcional — usado p/ R4/R5 (produtivo) decidir entre imobiliário e pesados. */
  subObjetivo?: string;
}

export type RecommendedPath =
  | 'consorcio'
  | 'consorcio_com_lance'
  | 'compra_a_vista'
  | 'investimento_financeiro'
  | 'financiamento'
  | 'consorcio_imobiliario'
  | 'consorcio_pesados';

export interface DecisionOutput {
  recommendedPath: RecommendedPath;
  allowCashPurchase: boolean;
  prioritizeConsorcio: boolean;
  reasons: string[];
}

// ─── Regras ───────────────────────────────────────────────────────────────

/**
 * Calcula a recomendação principal a partir do perfil do cliente.
 * Pura e determinística — mesma entrada, mesma saída.
 */
export function recommend(input: DecisionInput): DecisionOutput {
  const reasons: string[] = [];

  // R1: Sem capital declarado → nunca sugerir compra à vista
  const allowCashPurchase =
    input.temCapitalDisponivel && input.capitalDisponivel > 0;
  if (!allowCashPurchase) {
    reasons.push('Sem capital declarado: compra à vista não é elegível.');
  }

  // R2: Urgência imediata → consórcio NÃO deve ser priorizado
  //     (consórcio depende de contemplação; imediato exige liquidez ou financiamento)
  const prioritizeConsorcio = input.urgencia !== 'imediato';
  if (input.urgencia === 'imediato') {
    reasons.push('Urgência imediata: consórcio despriorizado.');
  }

  // R3: Objetivo "investimento" puro → caminho financeiro, não consórcio de bem
  if (input.objetivoPrincipal === 'investimento') {
    reasons.push('Objetivo é investimento financeiro.');
    return {
      recommendedPath: allowCashPurchase
        ? 'investimento_financeiro'
        : 'investimento_financeiro',
      allowCashPurchase,
      prioritizeConsorcio: false,
      reasons,
    };
  }

  // R4: Patrimônio produtivo → modalidade depende do sub-objetivo
  //     Reaproveita paths existentes (imobiliário p/ rural/sucessão, pesados p/ máquinas).
  if (input.objetivoPrincipal === 'patrimonio_produtivo') {
    reasons.push('Objetivo é estruturação de patrimônio produtivo.');
    return {
      recommendedPath:
        (input as DecisionInput & { subObjetivo?: string }).subObjetivo === 'maquinas_implementos'
          ? 'consorcio_pesados'
          : 'consorcio_imobiliario',
      allowCashPurchase,
      prioritizeConsorcio: input.urgencia !== 'imediato',
      reasons,
    };
  }

  // R5: Expansão operacional → modalidade depende do sub-objetivo
  if (input.objetivoPrincipal === 'expandir_operacao') {
    reasons.push('Objetivo é expansão operacional.');
    return {
      recommendedPath:
        (input as DecisionInput & { subObjetivo?: string }).subObjetivo === 'sede_galpao'
          ? 'consorcio_imobiliario'
          : 'consorcio_pesados',
      allowCashPurchase,
      prioritizeConsorcio: input.urgencia !== 'imediato',
      reasons,
    };
  }

  // R4: Decisão principal
  let recommendedPath: RecommendedPath;
  if (input.urgencia === 'imediato' && allowCashPurchase) {
    recommendedPath = 'compra_a_vista';
  } else if (input.urgencia === 'imediato') {
    recommendedPath = 'financiamento';
  } else if (allowCashPurchase) {
    recommendedPath = 'consorcio_com_lance';
  } else {
    recommendedPath = 'consorcio';
  }

  return { recommendedPath, allowCashPurchase, prioritizeConsorcio, reasons };
}

// ─── Investment helper ────────────────────────────────────────────────────

export interface ScenarioLike {
  id: string;
  name: string;
  percentGain: number;
  [k: string]: unknown;
}

/**
 * Retorna o cenário com maior `percentGain`. Empate → primeiro.
 * Lança erro em lista vazia (caller deve tratar).
 */
export function pickBestScenario<T extends ScenarioLike>(scenarios: T[]): T {
  if (!scenarios.length) {
    throw new Error('pickBestScenario: lista vazia');
  }
  return scenarios.reduce((best, cur) =>
    cur.percentGain > best.percentGain ? cur : best,
  );
}

// ─── Validação de sistema ─────────────────────────────────────────────────

export type ValidationSeverity = 'CRITICO' | 'NORMAL';

export interface ValidationCase {
  name: string;
  passed: boolean;
  expected: unknown;
  received: unknown;
  severity?: ValidationSeverity;
}

export interface ValidationReport {
  ok: boolean;
  cases: ValidationCase[];
  failures: ValidationCase[];
}

/** Aproximadamente igual com tolerância (default: 1 centavo / 0.01). */
function approxEqual(a: number, b: number, eps = 0.01): boolean {
  if (!isFinite(a) || !isFinite(b)) return false;
  return Math.abs(a - b) <= eps;
}

/**
 * Roda todos os cenários críticos de regressão. Retorna relatório.
 * - Em DEV, loga falhas no console.
 * - Em PROD, callers devem checar `report.ok` antes de exibir recomendação.
 */
export function validateSystem(): ValidationReport {
  const cases: ValidationCase[] = [];

  const assert = (
    name: string,
    expected: unknown,
    received: unknown,
    severity: ValidationSeverity = 'NORMAL',
  ) => {
    const passed = JSON.stringify(expected) === JSON.stringify(received);
    cases.push({ name, passed, expected, received, severity });
  };

  const assertApprox = (
    name: string,
    expected: number,
    received: number,
    eps = 0.01,
    severity: ValidationSeverity = 'CRITICO',
  ) => {
    const passed = approxEqual(expected, received, eps);
    cases.push({ name, passed, expected, received, severity });
  };

  const assertTrue = (
    name: string,
    received: boolean,
    severity: ValidationSeverity = 'CRITICO',
  ) => {
    cases.push({ name, passed: received === true, expected: true, received, severity });
  };

  // ─── Diagnóstico ───
  const semCapital = recommend({
    objetivoPrincipal: 'imovel_moradia',
    capacidadeMensal: 3000,
    temCapitalDisponivel: false,
    capitalDisponivel: 0,
    prioridade: 'menor_parcela',
    urgencia: 'curto_prazo',
  });
  assert('Diagnóstico: sem capital → não sugerir compra à vista',
    false, semCapital.allowCashPurchase);

  const capitalZero = recommend({
    objetivoPrincipal: 'imovel_moradia',
    capacidadeMensal: 3000,
    temCapitalDisponivel: true,
    capitalDisponivel: 0,
    prioridade: 'menor_parcela',
    urgencia: 'curto_prazo',
  });
  assert('Diagnóstico: capital=0 → não sugerir compra à vista',
    false, capitalZero.allowCashPurchase);

  // ─── Motor de decisão ───
  const imediato = recommend({
    objetivoPrincipal: 'imovel_moradia',
    capacidadeMensal: 3000,
    temCapitalDisponivel: false,
    capitalDisponivel: 0,
    prioridade: 'rapidez',
    urgencia: 'imediato',
  });
  assert('Motor: urgência imediata → não priorizar consórcio',
    false, imediato.prioritizeConsorcio);
  assert('Motor: imediato sem capital → financiamento',
    'financiamento', imediato.recommendedPath);

  const semPressa = recommend({
    objetivoPrincipal: 'imovel_moradia',
    capacidadeMensal: 3000,
    temCapitalDisponivel: false,
    capitalDisponivel: 0,
    prioridade: 'menor_custo',
    urgencia: 'sem_pressa',
  });
  assert('Motor: sem pressa → priorizar consórcio',
    'consorcio', semPressa.recommendedPath);

  // ─── Analysis (objetivo investimento) ───
  const invest = recommend({
    objetivoPrincipal: 'investimento',
    capacidadeMensal: 5000,
    temCapitalDisponivel: true,
    capitalDisponivel: 100000,
    prioridade: 'menor_custo',
    urgencia: 'sem_pressa',
  });
  assert('Analysis: objetivo investimento → caminho financeiro',
    'investimento_financeiro', invest.recommendedPath);

  // ─── Investment ───
  try {
    const best = pickBestScenario([
      { id: 'a', name: 'A', percentGain: 12 },
      { id: 'b', name: 'B', percentGain: 18 },
      { id: 'c', name: 'C', percentGain: 9 },
    ]);
    assert('Investment: retorna cenário de maior percentGain', 'b', best.id);
  } catch (e) {
    cases.push({
      name: 'Investment: pickBestScenario',
      passed: false,
      expected: 'b',
      received: String(e),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // CRÍTICO — Cálculos financeiros (calculateSimulation)
  // ═══════════════════════════════════════════════════════════════
  // Cenário canônico: imobiliário 200k, 200m, taxas baseline (18% adm + 3% fr),
  // sem seguro, sem lance, sem parcela reduzida.
  const baseSim = calculateSimulationLegacy(
    {
      creditValue: 200_000,
      termMonths: 200,
      consortiumType: 'imobiliario',
      adminFeePercent: 18,
      reserveFundPercent: 3,
      insurancePercent: 0,
      reducedInstallment: false,
      embeddedBidValue: 0,
      freeBidValue: 0,
      proponentAge: 30,
    },
    false,
    'reduce-installment',
    0,
  );
  // adminFee = 200000 * 0.18 = 36000; reserveFund = 200000 * 0.03 = 6000
  assertApprox('CRÍTICO Taxa Adm: 18% sobre crédito bruto', 36_000, baseSim.adminFee);
  assertApprox('CRÍTICO Fundo de Reserva: 3% sobre crédito bruto', 6_000, baseSim.reserveFund);
  // totalCost = 200000 + 36000 + 6000 (sem seguro) = 242000
  assertApprox('CRÍTICO Custo Total: crédito + adm + reserva (s/ seguro)', 242_000, baseSim.totalCost);
  // parcela = 242000 / 200 = 1210
  assertApprox('CRÍTICO Parcela cheia: totalCost / termMonths', 1_210, baseSim.fullInstallment);

  // Parcela reduzida = parcela cheia * 0.7
  const reducedSim = calculateSimulationLegacy(
    {
      creditValue: 200_000,
      termMonths: 200,
      consortiumType: 'imobiliario',
      adminFeePercent: 18,
      reserveFundPercent: 3,
      insurancePercent: 0,
      reducedInstallment: true,
      embeddedBidValue: 0,
      freeBidValue: 0,
      proponentAge: 30,
    },
    false,
    'reduce-installment',
    0,
  );
  assertApprox(
    'CRÍTICO Parcela reduzida: factor 0.7 sobre cheia',
    1_210 * REDUCED_INSTALLMENT_FACTOR,
    reducedSim.reducedInstallmentValue,
  );

  // Lance embutido NÃO pode reduzir crédito abaixo de zero — sanitização
  const embeddedClamp = calculateSimulationLegacy(
    {
      creditValue: 100_000,
      termMonths: 100,
      consortiumType: 'imobiliario',
      adminFeePercent: 18,
      reserveFundPercent: 3,
      insurancePercent: 0,
      reducedInstallment: false,
      embeddedBidValue: 999_999, // absurdamente acima do crédito
      freeBidValue: 0,
      proponentAge: 30,
    },
    true,
    'reduce-installment',
    12,
  );
  assertTrue(
    'CRÍTICO Crédito líquido: nunca negativo após lance embutido',
    embeddedClamp.netCreditValue >= 0,
  );

  // Limites oficiais de lance embutido — fonte única
  assert('CRÍTICO Limite lance embutido: imobiliário 50%',
    50, EMBEDDED_BID_MAX_PERCENT.imobiliario as number, 'CRITICO');
  assert('CRÍTICO Limite lance embutido: auto 30%',
    30, EMBEDDED_BID_MAX_PERCENT.auto as number, 'CRITICO');
  assert('CRÍTICO Limite lance embutido: pesados 30%',
    30, EMBEDDED_BID_MAX_PERCENT.pesados as number, 'CRITICO');
  assert('CRÍTICO Helper getEmbeddedBidMaxPercent espelha tabela',
    50, getEmbeddedBidMaxPercent('imobiliario' as ConsortiumType), 'CRITICO');

  // Fator de parcela reduzida — constante imutável
  assert('CRÍTICO Fator parcela reduzida = 0.7',
    0.7, REDUCED_INSTALLMENT_FACTOR, 'CRITICO');

  // Limite de meses reduzidos — não pode exceder prazo total nas defaults
  assertTrue(
    'CRÍTICO Meses reduzidos imob (80) ≤ prazo default (200)',
    MAX_REDUCED_INSTALLMENT_MONTHS.imobiliario <= 200,
  );
  assertTrue(
    'CRÍTICO Meses reduzidos auto (30) ≤ prazo default (80)',
    MAX_REDUCED_INSTALLMENT_MONTHS.auto <= 80,
  );

  // Entradas inválidas: termMonths = 0 → resultado neutro, sem NaN/Infinity
  const invalidTerm = calculateSimulationLegacy(
    {
      creditValue: 100_000,
      termMonths: 0,
      consortiumType: 'auto',
      adminFeePercent: 17,
      reserveFundPercent: 3,
      insurancePercent: 0,
      reducedInstallment: false,
      embeddedBidValue: 0,
      freeBidValue: 0,
      proponentAge: 30,
    },
    false,
    'reduce-installment',
    0,
  );
  assertTrue(
    'CRÍTICO Entrada inválida (term=0): parcela finita e ≥ 0',
    isFinite(invalidTerm.fullInstallment) && invalidTerm.fullInstallment >= 0,
  );

  const failures = cases.filter(c => !c.passed);
  const report: ValidationReport = { ok: failures.length === 0, cases, failures };

  if (!report.ok && import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    logger.error('[validateSystem] Regressões detectadas:', failures);
  }

  return report;
}
