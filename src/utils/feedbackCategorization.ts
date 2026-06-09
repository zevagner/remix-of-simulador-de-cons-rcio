/**
 * Categorização determinística de feedbacks por matching de palavras-chave.
 * Sem IA, sem edge function — apenas client-side.
 */

export interface FeedbackCategory {
  key: string;
  label: string;
  emoji: string;
  /** Tailwind classes for pill background/text */
  className: string;
  keywords: string[];
}

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  {
    key: 'calculo',
    label: 'Cálculo',
    emoji: '🧮',
    className: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    keywords: ['cálculo', 'calculo', 'parcela', 'valor', 'taxa', 'resultado', 'número', 'numero', 'matemática', 'matematica', 'errado', 'incorreto'],
  },
  {
    key: 'interface',
    label: 'Interface',
    emoji: '🎨',
    className: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
    keywords: ['tela', 'botão', 'botao', 'layout', 'visual', 'aparece', 'mostra', 'exibe', 'cor', 'design'],
  },
  {
    key: 'bug',
    label: 'Bug',
    emoji: '🐛',
    className: 'bg-destructive/15 text-destructive',
    keywords: ['erro', 'bug', 'falha', 'quebrou', 'não funciona', 'nao funciona', 'travou', 'sumiu', 'desapareceu'],
  },
  {
    key: 'feature',
    label: 'Sugestão de feature',
    emoji: '💡',
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    keywords: ['poderia', 'seria bom', 'sugiro', 'adicionar', 'incluir', 'falta', 'gostaria'],
  },
  {
    key: 'performance',
    label: 'Performance',
    emoji: '⚡',
    className: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
    keywords: ['lento', 'demora', 'carregando', 'travando', 'pesado', 'lentidão', 'lentidao'],
  },
  {
    key: 'mobile',
    label: 'Mobile',
    emoji: '📱',
    className: 'bg-pink-500/15 text-pink-700 dark:text-pink-300',
    keywords: ['celular', 'mobile', 'app', 'telefone', 'smartphone'],
  },
  {
    key: 'integracao',
    label: 'Integração',
    emoji: '🔗',
    className: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
    keywords: ['integração', 'integracao', 'sistema', 'caixa', 'exportar', 'importar', 'api'],
  },
];

export const GENERAL_CATEGORY: FeedbackCategory = {
  key: 'geral',
  label: 'Geral',
  emoji: '📝',
  className: 'bg-muted text-muted-foreground',
  keywords: [],
};

/** Categoriza um feedback retornando 1+ categorias (Geral se nenhuma bater). */
export function categorizeFeedback(message: string): FeedbackCategory[] {
  if (!message) return [GENERAL_CATEGORY];
  const lower = message.toLowerCase();
  const matched = FEEDBACK_CATEGORIES.filter((cat) =>
    cat.keywords.some((kw) => lower.includes(kw))
  );
  return matched.length > 0 ? matched : [GENERAL_CATEGORY];
}

export const ALL_CATEGORIES_FOR_FILTER = [...FEEDBACK_CATEGORIES, GENERAL_CATEGORY];
