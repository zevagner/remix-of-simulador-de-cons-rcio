/**
 * getSubObjetivoTexto — Helper central que converte o enum `SubObjetivo`
 * em uma frase natural padronizada, usada por TODOS os geradores de mensagem
 * (IA, templates de WhatsApp, storytelling, smart messages).
 *
 * Princípios:
 * - Fonte única da verdade textual do subObjetivo.
 * - Aceita o enum (`'reforma'`) ou o label legível (`'Reforma'`).
 * - Retorna string vazia quando não houver subObjetivo válido.
 * - Não altera nenhuma lógica de cálculo — uso exclusivo em copy.
 */

import type { SubObjetivo } from '@/components/modules/diagnostic/DiagnosticContext';

/** Texto natural padronizado por subObjetivo (usar em frases tipo "deseja {texto}"). */
const SUB_OBJETIVO_TEXTO: Record<Exclude<SubObjetivo, ''>, string> = {
  // Imóvel — moradia
  compra: 'adquirir seu imóvel próprio',
  reforma: 'reformar seu imóvel',
  construcao: 'construir seu imóvel',
  // Imóvel — investimento
  aluguel: 'gerar renda com aluguel',
  valorizacao: 'valorizar o imóvel para revenda',
  // Veículo
  primeiro_veiculo: 'adquirir seu primeiro veículo',
  uso_profissional: 'utilizar o veículo para trabalho',
  upgrade: 'trocar por um modelo melhor',
  // Investimento financeiro
  patrimonio: 'formar patrimônio',
  protecao: 'proteger seu capital',
  aposentadoria: 'planejar sua aposentadoria',
  // Patrimônio produtivo
  estruturacao_rural: 'estruturar seu patrimônio rural',
  maquinas_implementos: 'adquirir máquinas e implementos para sua operação',
  sucessao_consolidacao: 'consolidar e proteger o patrimônio familiar',
  // Expandir operação
  frota_pesados: 'expandir sua frota e veículos pesados',
  sede_galpao: 'adquirir sede ou galpão operacional',
  capacidade_produtiva: 'ampliar sua capacidade produtiva',
};

/** Mapeamento reverso: aceita também o label legível (ex: "Reforma" → "reforma"). */
const LABEL_TO_ENUM: Record<string, Exclude<SubObjetivo, ''>> = {
  compra: 'compra',
  reforma: 'reforma',
  construcao: 'construcao',
  construção: 'construcao',
  aluguel: 'aluguel',
  'renda de aluguel': 'aluguel',
  valorizacao: 'valorizacao',
  valorização: 'valorizacao',
  'primeiro veiculo': 'primeiro_veiculo',
  'primeiro veículo': 'primeiro_veiculo',
  primeiro_veiculo: 'primeiro_veiculo',
  'uso profissional': 'uso_profissional',
  uso_profissional: 'uso_profissional',
  upgrade: 'upgrade',
  patrimonio: 'patrimonio',
  patrimônio: 'patrimonio',
  'formar patrimonio': 'patrimonio',
  'formar patrimônio': 'patrimonio',
  protecao: 'protecao',
  proteção: 'protecao',
  'proteção financeira': 'protecao',
  aposentadoria: 'aposentadoria',
};

/**
 * Retorna o texto natural padronizado para o subObjetivo informado.
 * Aceita o valor do enum (`'reforma'`) ou o label legível (`'Reforma'`).
 * Retorna string vazia se não houver mapeamento.
 */
export function getSubObjetivoTexto(subObjetivo?: string | SubObjetivo | null): string {
  if (!subObjetivo) return '';
  const raw = String(subObjetivo).trim();
  if (!raw) return '';

  // 1) Match direto pelo enum
  if (raw in SUB_OBJETIVO_TEXTO) {
    return SUB_OBJETIVO_TEXTO[raw as Exclude<SubObjetivo, ''>];
  }

  // 2) Match por label legível (case-insensitive)
  const key = raw.toLowerCase();
  const enumValue = LABEL_TO_ENUM[key];
  if (enumValue) return SUB_OBJETIVO_TEXTO[enumValue];

  return '';
}
