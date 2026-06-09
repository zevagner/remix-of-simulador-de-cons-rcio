/**
 * helpContent.meta — split tipo + metadados visuais.
 *
 * Wave: Bundle Lazy Split & Runtime Sustainability Pass.
 *
 * Por quê este arquivo existe:
 *   `helpContent.ts` pesa ~117 KB (todo o catálogo institucional de artigos).
 *   Componentes consultivos discretos (HelpHint, ContextualInsightStrip)
 *   só precisam do tipo `ConsultiveBlockKind` e do dicionário visual
 *   `consultiveBlockMeta` (~1 KB). Mantê-los aqui evita arrastar o catálogo
 *   inteiro pelo grafo de imports só por causa do ícone/label de cada bloco.
 *
 * Regra: este arquivo NÃO importa de `helpContent.ts` — direção única.
 * `helpContent.ts` reexporta daqui para preservar compat dos imports
 * legados (apenas type/const adicionais — sem cycle).
 */

export type ConsultiveBlockKind =
  | 'when-to-use'
  | 'when-not-to-use'
  | 'ideal-profile'
  | 'common-mistake'
  | 'explain-client'
  | 'example'
  | 'strategy'
  | 'objection'
  | 'deep-dive'
  | 'discovery'
  | 'narrative';

export const consultiveBlockMeta: Record<
  ConsultiveBlockKind,
  { label: string; emoji: string; tone: 'success' | 'danger' | 'info' | 'warning' | 'primary' | 'neutral' }
> = {
  'when-to-use':     { label: 'Quando usar',          emoji: '✅', tone: 'success' },
  'when-not-to-use': { label: 'Quando NÃO usar',      emoji: '🚫', tone: 'danger'  },
  'ideal-profile':   { label: 'Perfil ideal',         emoji: '👤', tone: 'primary' },
  'common-mistake':  { label: 'Erro comum',           emoji: '⚠️', tone: 'warning' },
  'explain-client':  { label: 'Como explicar',        emoji: '💬', tone: 'info'    },
  'example':         { label: 'Exemplo real',         emoji: '📌', tone: 'neutral' },
  'strategy':        { label: 'Estratégia comercial', emoji: '🎯', tone: 'primary' },
  'objection':       { label: 'Objeção típica',       emoji: '🛡️', tone: 'warning' },
  'deep-dive':       { label: 'Aprofundamento',       emoji: '📐', tone: 'neutral' },
  'discovery':       { label: 'Pergunta de descoberta',emoji: '❓', tone: 'info'    },
  'narrative':       { label: 'Narrativa consultiva',  emoji: '🗣️', tone: 'primary' },
};
