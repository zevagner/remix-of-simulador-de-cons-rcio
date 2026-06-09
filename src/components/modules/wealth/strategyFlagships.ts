/**
 * ════════════════════════════════════════════════════════════════════════════
 * STRATEGY FLAGSHIPS & EXECUTIVE ORDERING — Editorial Hierarchy Layer
 * ════════════════════════════════════════════════════════════════════════════
 *
 * PROBLEMA RESOLVIDO
 *   Teses extremamente fortes (alavancagem, multiplicação de cotas, uso da
 *   carta como funding) perderam protagonismo ao serem diluídas em capítulos
 *   editoriais. Faltava hierarquia estratégica + ordenação executiva.
 *
 * PRINCÍPIO
 *   • Camada editorial discreta de "Teses patrimoniais em destaque"
 *     (máx. 4) — protagonismo silencioso, sem badge agressiva.
 *   • Ordenação executiva opcional dentro de cada capítulo — reordena,
 *     nunca esconde. Linguagem consultiva ("ordenação baseada nas
 *     estimativas desta simulação"), nunca "top ganhos".
 *
 * ZERO MATH NOVA
 *   Ordenação derivada de `strategy.calculations[i].result(credit)` via
 *   parser numérico determinístico (pt-BR R$ e %). Engine financeira
 *   permanece intocada. Estratégias sem KPI canônico mapeado ficam ao
 *   final (visíveis), nunca ocultadas.
 *
 * CRITÉRIOS DE FLAGSHIP (editoriais — não apenas "lucro bruto")
 *   • profundidade patrimonial      — tese estrutural, multi-camada
 *   • sofisticação consultiva       — diferenciação vs. produtos genéricos
 *   • impacto patrimonial           — multiplicador, alavancagem, ROI
 *   • força narrativa demonstrável  — explicável para o cliente em 30s
 * ════════════════════════════════════════════════════════════════════════════
 */

import { STRATEGY_EXECUTIVE_KPIS, type ExecutiveKpiKind } from './strategyExecutiveKpis';
import type { LibraryStrategy } from './strategyLibraryData';

/* ──────────────────────────────────────────────────────────────────────
 * FLAGSHIP STRATEGIES — máx. 4
 *
 * Selecionadas pelos 4 critérios acima. Lista curada manualmente, não
 * derivada de "lucro bruto". Mudanças exigem revisão editorial.
 * ────────────────────────────────────────────────────────────────────── */
export interface FlagshipStrategyMeta {
  id: string;
  /** Tese-síntese em uma linha — não é o tagline original. */
  thesis: string;
  /** Por que está em destaque (texto curto exibido no hover/footer). */
  rationale: string;
  /** Gatilho mental — frase curta, sofisticada, que dispara visão executiva. */
  mentalTrigger?: string;
}

export const FLAGSHIP_STRATEGIES: FlagshipStrategyMeta[] = [
  {
    id: 'usar-carta-investir',
    thesis: 'Carta contemplada aplicada a CDI captura o ganho do float.',
    rationale: 'Uso da carta como funding patrimonial — maior retorno absoluto típico entre os cenários do simulador.',
    mentalTrigger: 'O dinheiro do banco trabalhando para o seu cliente.',
  },
  {
    id: 'venda-carta-lucro',
    thesis: 'Vender a carta contemplada para realizar lucro líquido em ciclo curto.',
    rationale: 'Captura de liquidez antecipada via mercado secundário com ROI mensurável.',
    mentalTrigger: 'Lucro líquido sem nunca tocar no bem.',
  },
  {
    id: 'multiplicacao-cotas',
    thesis: 'Multiplicação patrimonial por cotas reaplicadas.',
    rationale: 'Controlar patrimônio crescente com capital reaplicado em camadas.',
    mentalTrigger: 'Cada contemplação financia a próxima — patrimônio em cascata.',
  },
  {
    id: 'alavancagem-imobiliaria',
    thesis: 'Renda do ativo cobre a parcela e gera margem.',
    rationale: 'Alavancagem com autoquitação parcial — capital próprio preservado.',
    mentalTrigger: 'O inquilino paga o consórcio. O patrimônio fica com o cliente.',
  },
];

export const FLAGSHIP_IDS = new Set(FLAGSHIP_STRATEGIES.map((f) => f.id));

export function isFlagshipStrategy(id: string): boolean {
  return FLAGSHIP_IDS.has(id);
}

export function getFlagshipMeta(id: string): FlagshipStrategyMeta | undefined {
  return FLAGSHIP_STRATEGIES.find((f) => f.id === id);
}

/* ──────────────────────────────────────────────────────────────────────
 * MENTAL TRIGGERS — cobertura ampla além das flagships
 *
 * Frase curta (≤90 chars), sofisticada, não-promocional, que dispara
 * visão executiva imediata. Exibida no hero do StrategyDetailDialog
 * acima da tagline (formato: eyebrow editorial). Curada manualmente.
 * Estratégias sem entrada aqui caem em fallback silencioso.
 * ────────────────────────────────────────────────────────────────────── */
const STRATEGY_MENTAL_TRIGGERS: Record<string, string> = {
  'compra-hibrida': 'Metade carta, metade caixa — aquisição sem comprometer reserva.',
  'compra-planejada': 'Disciplina mensal vira poder de compra à vista.',
  'aquisicao-acelerada': 'Lance estratégico antecipa o ativo em meses, não anos.',
  'leverage-patrimonial': 'Carta dobrada: dois ativos pelo custo emocional de um.',
  'usar-carta-investir': 'O dinheiro do banco trabalhando para o seu cliente.',
  'alavancagem-imobiliaria': 'O inquilino paga o consórcio. O patrimônio fica com o cliente.',
  'multiplicacao-cotas': 'Cada contemplação financia a próxima — patrimônio em cascata.',
  'venda-carta-lucro': 'Lucro líquido sem nunca tocar no bem.',
  'reinvestimento-estruturado': 'Cada ciclo encerrado vira capital para o próximo.',
  'autoquitacao-estruturada': 'O ativo se paga sozinho. O cliente colhe o saldo.',
  'patrimonio-escalavel': 'Pequenas cotas hoje, patrimônio relevante amanhã.',
  'reforma-ampliacao': 'Valorização real do imóvel sem hipotecar o futuro.',
  'retrofit-patrimonial': 'Atualizar o ativo é multiplicar seu valor de mercado.',
  'energia-solar': 'A conta de luz vira parcela. A parcela vira patrimônio.',
  'upgrade-veiculo': 'Trocar o carro sem queimar capital de giro.',
  'renovacao-frota': 'Renovação programada protege margem operacional.',
  'expansao-produtiva': 'Capacidade nova hoje, receita expandida amanhã.',
  'equipamentos-pesados': 'CAPEX estruturado preserva o caixa do negócio.',
  'agronegocio': 'O ativo produz a safra que paga as próximas safras.',
  'patrimonio-rural': 'Terra produtiva é o ativo que não se desvaloriza.',
  'renda-passiva': 'Construir o ativo que paga o estilo de vida.',
  'patrimonio-gerador-caixa': 'Patrimônio que distribui caixa todo mês.',
  'holding-patrimonial': 'Blindar o legado antes que ele precise ser defendido.',
  'planejamento-sucessorio': 'Transferir patrimônio com clareza, sem litígio futuro.',
};

export function getMentalTrigger(id: string): string | undefined {
  return getFlagshipMeta(id)?.mentalTrigger ?? STRATEGY_MENTAL_TRIGGERS[id];
}


/* ──────────────────────────────────────────────────────────────────────
 * EXECUTIVE ORDERING — modos consultivos opcionais
 * ────────────────────────────────────────────────────────────────────── */
export type ExecutiveOrderKey =
  | 'editorial'        // ordem editorial padrão (default)
  | 'context'          // mais aderente ao cenário (combinedScore)
  | 'finalPatrimony'   // maior patrimônio estimado
  | 'profit'           // maior lucro estimado
  | 'roi'              // maior ROI
  | 'installment'      // menor parcela
  | 'preserved';       // maior liquidez preservada

export interface ExecutiveOrderOption {
  id: ExecutiveOrderKey;
  label: string;
  /** Sentido natural da métrica — desc = "maior primeiro". */
  direction: 'asc' | 'desc';
  /** KPI canônico associado (quando aplicável). */
  kind?: ExecutiveKpiKind;
  /** Microcopy consultiva exibida abaixo do selector. */
  helper?: string;
}

export const EXECUTIVE_ORDER_OPTIONS: ExecutiveOrderOption[] = [
  { id: 'editorial',      label: 'Ordem editorial',         direction: 'desc',
    helper: 'Sequência consultiva curada pela mesa patrimonial.' },
  { id: 'context',        label: 'Mais aderente ao cenário', direction: 'desc',
    helper: 'Ordenação baseada no diagnóstico e simulação ativos.' },
  { id: 'finalPatrimony', label: 'Maior patrimônio estimado', direction: 'desc',
    kind: 'finalPatrimony',
    helper: 'Ordenação baseada nas estimativas desta simulação.' },
  { id: 'profit',         label: 'Maior lucro estimado',     direction: 'desc',
    kind: 'profit',
    helper: 'Ordenação baseada nas estimativas desta simulação.' },
  { id: 'roi',            label: 'Maior ROI',                direction: 'desc',
    kind: 'roi',
    helper: 'Ordenação baseada nas estimativas desta simulação.' },
  { id: 'installment',    label: 'Menor parcela',            direction: 'asc',
    kind: 'installment',
    helper: 'Ordenação baseada nas parcelas estimadas desta simulação.' },
  { id: 'preserved',      label: 'Maior liquidez preservada', direction: 'desc',
    kind: 'preserved',
    helper: 'Ordenação baseada no capital líquido remanescente estimado.' },
];

/* ──────────────────────────────────────────────────────────────────────
 * Parser determinístico — extrai número de strings de KPI (pt-BR).
 *
 * Exemplos suportados:
 *   "R$ 300.000"        → 300000
 *   "R$ 1.234.567,89"   → 1234567.89
 *   "16,4% a.a."        → 16.4
 *   "200 meses"         → 200
 *   "≈ R$ 4.500/mês"    → 4500
 *
 * Retorna null quando não houver número parseável — estratégia vai ao fim
 * da ordenação sem perder visibilidade.
 * ────────────────────────────────────────────────────────────────────── */
export function parseKpiNumeric(raw: string | undefined): number | null {
  if (!raw) return null;
  // Captura o primeiro grupo numérico no padrão BR: dígitos com . como
  // separador de milhar e , como decimal. Aceita sinal negativo.
  const m = raw.match(/-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:,\d+)?/);
  if (!m) return null;
  const cleaned = m[0].replace(/\./g, '').replace(',', '.');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Resolve o valor numérico de um KPI canônico para uma estratégia,
 * apontando para `calculations[index]` via `STRATEGY_EXECUTIVE_KPIS`.
 *
 * Retorna null quando a estratégia não declara aquele kind ou o parser
 * não consegue extrair número da string-resultado.
 */
export function getKpiNumericValue(
  strategy: LibraryStrategy,
  kind: ExecutiveKpiKind,
  credit: number,
  ctx?: import('./strategyLibraryData').StrategyCalcContext,
): number | null {
  const picks = STRATEGY_EXECUTIVE_KPIS[strategy.id];
  if (!picks) return null;
  const pick = picks.find((p) => p.kind === kind);
  if (!pick) return null;
  const calc = strategy.calculations[pick.calculationIndex];
  if (!calc) return null;
  try {
    return parseKpiNumeric(calc.result(credit, ctx));
  } catch {
    return null;
  }
}
