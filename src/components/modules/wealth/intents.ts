/**
 * ════════════════════════════════════════════════════════════════════════════
 * WEALTH INTENTS — Unified Patrimonial Experience Wave
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A página Estratégias Patrimoniais NÃO agrupa por origem do módulo
 * (Investimentos vs Patrimonial). Agrupa por INTENÇÃO PATRIMONIAL.
 *
 * Cada intento carrega:
 *   • hero editorial (eyebrow + título + micro-narrativa)
 *   • paleta de acento sutil (tint institucional, não cor de marca)
 *   • ids das estratégias (mix transparente dos 2 catálogos V2)
 *
 * Princípio absoluto: ZERO cálculo, ZERO nova fonte de dados.
 * Apenas curadoria editorial sobre o blueprint catalog existente.
 * ════════════════════════════════════════════════════════════════════════════
 */
import {
  TrendingUp, Banknote, Rocket, Layers, Shield, ScrollText,
  type LucideIcon,
} from 'lucide-react';

export type IntentId =
  | 'crescimento'
  | 'liquidez'
  | 'aceleracao'
  | 'estruturacao'
  | 'protecao'
  | 'sucessao';

export interface WealthIntent {
  id: IntentId;
  eyebrow: string;
  title: string;
  narrative: string;
  icon: LucideIcon;
  /** Token de cor semântica (HSL via index.css), usado em tints sutis. */
  accent: 'primary' | 'success' | 'warning' | 'muted';
  /** IDs do blueprint catalog (investment + patrimonial misturados). */
  strategyIds: string[];
}

/**
 * Mapa editorial — uma estratégia pode aparecer em apenas um intento
 * (evita ruído). Ordem dos IDs dentro do array define ordem de leitura.
 */
export const WEALTH_INTENTS: WealthIntent[] = [
  {
    id: 'crescimento',
    eyebrow: 'Capítulo I',
    title: 'Crescimento Patrimonial',
    narrative:
      'Estratégias para transformar capital em patrimônio real — imóvel próprio que valoriza, construção inteligente e ativos que crescem em paralelo ao aporte.',
    icon: TrendingUp,
    accent: 'primary',
    strategyIds: ['traditional', 'construcao-inteligente'],
  },
  {
    id: 'liquidez',
    eyebrow: 'Capítulo II',
    title: 'Liquidez e Fluxo',
    narrative:
      'Estratégias orientadas a fluxo de caixa — renda recorrente do aluguel, ativos que se autossustentam e referência líquida em renda fixa para custo de oportunidade.',
    icon: Banknote,
    accent: 'success',
    strategyIds: ['rental', 'autoquitacao', 'renda-passiva', 'investment'],
  },
  {
    id: 'aceleracao',
    eyebrow: 'Capítulo III',
    title: 'Aceleração',
    narrative:
      'Estratégias que aceleram o ciclo — capital aplicado a CDI após contemplação, saída estratégica via revenda e contemplações escalonadas para liquidez recorrente.',
    icon: Rocket,
    accent: 'warning',
    strategyIds: ['quick-contemplation', 'sale', 'venda-carta-lucro'],
  },
  {
    id: 'estruturacao',
    eyebrow: 'Capítulo IV',
    title: 'Estruturação',
    narrative:
      'Alavancagem real — controlar mais patrimônio com menos capital próprio, com capital preservado reaplicado em renda fixa.',
    icon: Layers,
    accent: 'primary',
    strategyIds: ['multiplicacao-ativos'],
  },
  {
    id: 'sucessao',
    eyebrow: 'Capítulo V',
    title: 'Proteção & Sucessão',
    narrative:
      'Patrimônio estruturado e protegido para a próxima geração — eficiência tributária, holding patrimonial e planejamento sucessório.',
    icon: ScrollText,
    accent: 'muted',
    strategyIds: ['holding-sucessao'],
  },
];

/** Lookup reverso blueprint → intent. */
export const INTENT_BY_STRATEGY_ID: Record<string, IntentId> = WEALTH_INTENTS.reduce<
  Record<string, IntentId>
>((acc, intent) => {
  intent.strategyIds.forEach((id) => { acc[id] = intent.id; });
  return acc;
}, {});

/**
 * Tints de acento — usados em hero/borda. Mantém paridade com o design
 * system (semantic tokens) e respeita dark mode automaticamente.
 */
export const INTENT_ACCENT_CLS: Record<WealthIntent['accent'], {
  bg: string; border: string; text: string; dot: string;
}> = {
  primary: { bg: 'bg-primary/[0.06]', border: 'border-primary/25', text: 'text-primary', dot: 'bg-primary' },
  success: { bg: 'bg-success/[0.07]', border: 'border-success/25', text: 'text-success', dot: 'bg-success' },
  warning: { bg: 'bg-warning/[0.07]', border: 'border-warning/30', text: 'text-warning', dot: 'bg-warning' },
  muted: { bg: 'bg-muted/40', border: 'border-border/60', text: 'text-foreground/70', dot: 'bg-foreground/40' },
};

/** Anchors para nav editorial lateral / mobile chips. */
export const INTENT_ANCHOR = (id: IntentId) => `wealth-intent-${id}`;
