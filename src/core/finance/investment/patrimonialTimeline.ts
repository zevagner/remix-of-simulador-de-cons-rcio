/**
 * ════════════════════════════════════════════════════════════════════════════
 * PATRIMONIAL TIMELINE — projeções longitudinais determinísticas
 * (Onda Patrimonial Timeline Evolution)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Princípios:
 *   • Consumer-only: recebe credit + ownCapital + arquétipo, devolve marcos.
 *   • Zero motor financeiro novo: usa premissas explícitas, conservadoras.
 *   • Zero IA / zero edge.
 *   • Tom institucional: tudo é estimativa, nunca promessa.
 *   • Sem falsa precisão: 4 marcos (0/5/10/15a), valores arredondados.
 *
 * Arquétipos suportados (mapeiam 1:1 às 6 estratégias patrimoniais):
 *   autoquitacao | escada-patrimonial | renda-passiva |
 *   construcao-inteligente | multiplicacao-ativos | holding-sucessao
 *
 * Premissas conservadoras (explicitadas no card educacional / disclaimer):
 *   • Valorização imobiliária:       2% a.a.
 *   • Aluguel bruto / valor imóvel:  0,45% a.m. (5,5% a.a.)
 *   • CDI líquido (capital preserv): 9% a.a.
 *   • Reinvestimento (renda):        80% do fluxo líquido
 * ════════════════════════════════════════════════════════════════════════════
 */

export type PatrimonialArchetype =
  | 'autoquitacao'
  | 'escada-patrimonial'
  | 'renda-passiva'
  | 'construcao-inteligente'
  | 'multiplicacao-ativos'
  | 'holding-sucessao';

export interface TimelineMilestone {
  /** Ano do marco (0, 5, 10, 15). */
  year: number;
  /** Rótulo curto institucional (ex.: "Aquisição", "Consolidação"). */
  label: string;
  /** Narrativa consultiva (≤ ~14 palavras). */
  narrative: string;
  /** Patrimônio bruto controlado nesta data (R$). */
  controlledAsset: number;
  /** Capital preservado / liquidez investida (R$). */
  preservedCapital: number;
  /** Renda anual projetada nesta data (R$). */
  annualIncome: number;
  /** Multiplicador acumulado (patrimônio + preservado + renda acumulada) ÷ capital próprio. */
  multiplier: number;
  /** Indicador de aceleração: 'entrada' | 'consolidacao' | 'expansao' | 'estabilizacao'. */
  phase: 'entrada' | 'consolidacao' | 'expansao' | 'estabilizacao';
}

export interface PatrimonialTimelineInput {
  archetype: PatrimonialArchetype;
  /** Crédito (carta) — patrimônio inicial controlado. */
  creditValue: number;
  /** Capital próprio efetivamente aportado pelo cliente até a contemplação. */
  ownCapitalInvested: number;
  /** Capital líquido preservado pós-estratégia (lance embutido / sobra). */
  preservedCapital?: number;
}

const APPRECIATION_YEAR = 0.02;
const RENT_YIELD_MONTH = 0.0045;
const CDI_NET_YEAR = 0.09;
const REINVEST_FACTOR = 0.8;

const PHASES: Record<number, TimelineMilestone['phase']> = {
  0: 'entrada',
  5: 'consolidacao',
  10: 'expansao',
  15: 'estabilizacao',
};

const LABELS: Record<number, string> = {
  0: 'Aquisição',
  5: 'Consolidação',
  10: 'Expansão',
  15: 'Estabilização',
};

const fv = (pv: number, ratePerYear: number, years: number) =>
  pv * Math.pow(1 + ratePerYear, years);

/**
 * Projeta marcos 0/5/10/15a por arquétipo.
 * Determinístico, idempotente, sem efeito colateral.
 */
export function projectPatrimonialTimeline(
  inp: PatrimonialTimelineInput,
): TimelineMilestone[] {
  const { archetype, creditValue, ownCapitalInvested, preservedCapital = 0 } = inp;
  if (!Number.isFinite(creditValue) || creditValue <= 0) return [];
  if (!Number.isFinite(ownCapitalInvested) || ownCapitalInvested <= 0) return [];

  const years = [0, 5, 10, 15] as const;
  return years.map((y) => buildMilestone(y, archetype, creditValue, ownCapitalInvested, preservedCapital));
}

function buildMilestone(
  year: number,
  archetype: PatrimonialArchetype,
  credit: number,
  ownCapital: number,
  preservedSeed: number,
): TimelineMilestone {
  let controlledAsset = 0;
  let preserved = 0;
  let annualIncome = 0;
  let cumulativeIncome = 0;
  let narrative = '';

  switch (archetype) {
    case 'autoquitacao': {
      // 1 imóvel locado; aluguel paga parcela; preservado cresce via reinvestimento marginal.
      controlledAsset = year === 0 ? credit : fv(credit, APPRECIATION_YEAR, year);
      annualIncome = year === 0 ? 0 : controlledAsset * RENT_YIELD_MONTH * 12 * 0.15; // líquido pós parcela
      cumulativeIncome = year === 0 ? 0 : annualIncome * year * 0.6;
      preserved = fv(preservedSeed, CDI_NET_YEAR, year) + cumulativeIncome * REINVEST_FACTOR;
      narrative =
        year === 0 ? 'Carta contemplada vira imóvel locado.' :
        year === 5 ? 'Aluguel já cobre parcela; patrimônio começa a valorizar.' :
        year === 10 ? 'Imóvel quitado, fluxo líquido cresce.' :
        'Patrimônio consolidado e renda recorrente estável.';
      break;
    }
    case 'escada-patrimonial': {
      // 3 cartas escalonadas; assume contemplações em y2, y5, y8.
      const cards = year >= 8 ? 3 : year >= 5 ? 2 : year >= 2 ? 1 : 0;
      controlledAsset = cards * fv(credit, APPRECIATION_YEAR, Math.max(0, year - 2));
      annualIncome = cards * controlledAsset / Math.max(cards, 1) * RENT_YIELD_MONTH * 12 * 0.2;
      cumulativeIncome = annualIncome * Math.max(0, year - 2) * 0.5;
      preserved = fv(preservedSeed, CDI_NET_YEAR, year) + cumulativeIncome * REINVEST_FACTOR;
      narrative =
        year === 0 ? 'Três cartas posicionadas em prazos diferentes.' :
        year === 5 ? '2 cartas contempladas — começa a escalada patrimonial.' :
        year === 10 ? '3 ativos gerando renda; escala patrimonial ativa.' :
        'Portfólio consolidado de múltiplas cartas valorizadas.';
      break;
    }
    case 'renda-passiva': {
      // Foco em fluxo recorrente; reinvestimento agressivo da renda.
      controlledAsset = year === 0 ? credit : fv(credit, APPRECIATION_YEAR, year);
      annualIncome = year === 0 ? 0 : controlledAsset * RENT_YIELD_MONTH * 12 * 0.7;
      cumulativeIncome = year === 0 ? 0 : annualIncome * year * 0.7;
      preserved = fv(preservedSeed, CDI_NET_YEAR, year) + cumulativeIncome * REINVEST_FACTOR;
      narrative =
        year === 0 ? 'Carta adquire imóvel para locação estruturada.' :
        year === 5 ? 'Aluguel líquido vira fluxo recorrente sólido.' :
        year === 10 ? 'Renda + valorização superam custo total inicial.' :
        'Renda passiva consolidada como ativo de longo prazo.';
      break;
    }
    case 'construcao-inteligente': {
      // Obra finaliza em ~2a; valor pronto > custo total.
      const ready = year >= 2;
      const builtPremium = 1.25; // imóvel pronto vale mais que custo
      const baseValue = ready ? credit * builtPremium : credit * 0.6;
      controlledAsset = ready ? fv(baseValue, APPRECIATION_YEAR, year - 2) : baseValue;
      annualIncome = ready ? controlledAsset * RENT_YIELD_MONTH * 12 * 0.4 : 0;
      cumulativeIncome = annualIncome * Math.max(0, year - 2) * 0.4;
      preserved = fv(preservedSeed, CDI_NET_YEAR, year) + cumulativeIncome * REINVEST_FACTOR;
      narrative =
        year === 0 ? 'Terreno + obra cobertos pelo consórcio.' :
        year === 5 ? 'Imóvel pronto vale mais que custo total investido.' :
        year === 10 ? 'Valorização supera custo de financiamento bancário.' :
        'Patrimônio construído consolidado e maturado.';
      break;
    }
    case 'multiplicacao-ativos': {
      // Lance embutido reduz capital próprio; preservado investido em CDI.
      controlledAsset = year === 0 ? credit : fv(credit, APPRECIATION_YEAR, year);
      preserved = fv(Math.max(preservedSeed, ownCapital * 0.3), CDI_NET_YEAR, year);
      annualIncome = preserved * CDI_NET_YEAR;
      cumulativeIncome = year === 0 ? 0 : annualIncome * year * 0.5;
      narrative =
        year === 0 ? 'Lance embutido preserva capital próprio.' :
        year === 5 ? 'Capital preservado cresce em paralelo ao patrimônio.' :
        year === 10 ? 'Multiplicador supera estratégia 100% à vista.' :
        'Patrimônio controlado significativamente maior que capital aportado.';
      break;
    }
    case 'holding-sucessao': {
      // Foco em preservação + organização patrimonial.
      controlledAsset = year === 0 ? credit : fv(credit, APPRECIATION_YEAR * 1.2, year);
      preserved = fv(preservedSeed + ownCapital * 0.2, CDI_NET_YEAR * 0.9, year);
      annualIncome = controlledAsset * RENT_YIELD_MONTH * 12 * 0.3;
      cumulativeIncome = year === 0 ? 0 : annualIncome * year * 0.5;
      narrative =
        year === 0 ? 'Cartas adquiridas via PJ otimizam tributação.' :
        year === 5 ? 'Holding organiza ativos da família.' :
        year === 10 ? 'Estrutura sucessória consolidada e protegida.' :
        'Legado patrimonial preservado para próxima geração.';
      break;
    }
  }

  const total = controlledAsset + preserved + cumulativeIncome;
  const multiplier = ownCapital > 0 ? total / ownCapital : 0;

  return {
    year,
    label: LABELS[year],
    phase: PHASES[year],
    narrative,
    controlledAsset: round(controlledAsset),
    preservedCapital: round(preserved),
    annualIncome: round(annualIncome),
    multiplier: Number(multiplier.toFixed(2)),
  };
}

const round = (v: number) => Math.round(v / 100) * 100;
