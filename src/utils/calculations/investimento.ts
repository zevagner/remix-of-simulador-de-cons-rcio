/**
 * Cálculos de Investimento
 *
 * Fonte única de IR (tabela regressiva da Receita Federal) usado por
 * todos os módulos do projeto. Demais cálculos de investimento
 * (cenários, multiplicação de cotas, ROI, etc.) vivem nos próprios
 * componentes/hooks que os consomem — ver useInvestmentCalculations.
 */

/**
 * Calcula IR sobre rendimento aplicando a tabela regressiva da Receita Federal.
 *
 * **Fonte única de IR no projeto.** Qualquer cálculo de IR deve usar esta função.
 *
 * Tabela (em meses):
 *   - até 6 meses  → 22,5%
 *   - até 12 meses → 20,0%
 *   - até 24 meses → 17,5%
 *   - acima de 24  → 15,0%
 *
 * @param yieldValue Rendimento bruto (somente o lucro, não o principal). Valores ≤ 0 zeram o IR.
 * @param months Prazo da aplicação **em meses**. Unidade única para evitar ambiguidade.
 * @returns
 *  - `irRate`: alíquota em **percentual** (ex.: 22.5)
 *  - `irAliquota`: alíquota em **decimal** (ex.: 0.225) — útil para multiplicação direta
 *  - `irValue`: valor do IR em R$
 *  - `netYield`: rendimento líquido (yieldValue − irValue)
 */
export function calculateIR(
  yieldValue: number,
  months: number,
): { irRate: number; irAliquota: number; irValue: number; netYield: number } {
  if (yieldValue <= 0) {
    return { irRate: 0, irAliquota: 0, irValue: 0, netYield: 0 };
  }

  let irRate: number;
  if (months <= 6) irRate = 22.5;
  else if (months <= 12) irRate = 20;
  else if (months <= 24) irRate = 17.5;
  else irRate = 15;

  const irAliquota = irRate / 100;
  const irValue = yieldValue * irAliquota;
  return { irRate, irAliquota, irValue, netYield: yieldValue - irValue };
}
