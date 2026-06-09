/**
 * Biblioteca estruturada de objeções comerciais — 120+ respostas consultivas.
 * Organizada por categorias e perfis de cliente, com linguagem natural e sem jargão técnico.
 */

export type { ClientProfile, ObjectionCategory, Objection } from './objections/types';
import type { ClientProfile, ObjectionCategory } from './objections/types';

export interface ClientProfileInfo {
  id: ClientProfile;
  label: string;
  emoji: string;
  description: string;
}

export const CLIENT_PROFILES: ClientProfileInfo[] = [
  { id: 'pf_aluguel', label: 'PF Pagando Aluguel', emoji: '🏠', description: 'Pessoa física que paga aluguel e pode converter em patrimônio' },
  { id: 'pf_fgts', label: 'PF com FGTS Parado', emoji: '💎', description: 'Pessoa física com FGTS acumulado sem uso estratégico' },
  { id: 'pf_pos_financiamento', label: 'PF Saindo de Financiamento', emoji: '🔄', description: 'Pessoa física que terminou ou está terminando um financiamento' },
  { id: 'pj_frota', label: 'PJ Frota / Equipamentos', emoji: '🚛', description: 'Empresa que precisa renovar frota ou adquirir equipamentos' },
  { id: 'investidor', label: 'Investidor / Renda Passiva', emoji: '📈', description: 'Perfil investidor focado em alavancagem e renda passiva com imóveis' },
  { id: 'sucessao', label: 'Sucessão Patrimonial', emoji: '🏛️', description: 'Cliente com foco em proteção patrimonial e planejamento sucessório' },
  { id: 'liquidez', label: 'Cliente com Liquidez Parada', emoji: '💰', description: 'Cliente com capital ocioso em poupança ou sem destino definido' },
  { id: 'agronegocio', label: 'Produtor Rural / Agro', emoji: '🌾', description: 'Produtor rural que precisa de maquinário ou equipamentos pesados' },
];

// Objection + ObjectionCategory agora vivem em ./objections/types (re-export acima).

export interface CategoryInfo {
  id: ObjectionCategory;
  label: string;
  emoji: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'preco', label: 'Preço / Parcela', emoji: '💰', description: 'Parcela, custo total, taxas' },
  { id: 'tempo', label: 'Prazo', emoji: '⏳', description: 'Prazo, demora, tempo de espera' },
  { id: 'contemplacao', label: 'Contemplação', emoji: '🎯', description: 'Garantia, probabilidade, sorteio' },
  { id: 'financiamento', label: 'Financiamento', emoji: '🏦', description: 'Comparação com financiamento' },
  { id: 'confianca', label: 'Confiança', emoji: '🛡️', description: 'Segurança, credibilidade, desconfiança' },
  { id: 'lance', label: 'Lance', emoji: '💸', description: 'Lance embutido, lance livre, estratégia' },
  { id: 'urgencia', label: 'Urgência', emoji: '⚡', description: 'Preciso agora, não posso esperar' },
  { id: 'experiencia', label: 'Experiência', emoji: '📢', description: 'Relatos, experiências anteriores' },
  { id: 'risco', label: 'Risco', emoji: '⚠️', description: 'Medo de perder dinheiro' },
  { id: 'entendimento', label: 'Entendimento', emoji: '🤔', description: 'Não entende como funciona' },
  { id: 'perfil', label: 'Perfil', emoji: '👤', description: 'Não é pra mim, não se encaixa' },
  { id: 'financeiro', label: 'Situação Financeira', emoji: '📊', description: 'Orçamento, momento financeiro' },
];

// OBJECTIONS data moved to ./objections/data.ts to keep this file lean.
export { OBJECTIONS } from './objections/data';
import { OBJECTIONS } from './objections/data';

/** Utility: get category info by id */
export function getCategoryInfo(id: ObjectionCategory): CategoryInfo {
  return CATEGORIES.find(c => c.id === id)!;
}

/** Utility: count objections per category */
export function countByCategory(): Record<ObjectionCategory, number> {
  const counts = {} as Record<ObjectionCategory, number>;
  for (const cat of CATEGORIES) counts[cat.id] = 0;
  for (const obj of OBJECTIONS) counts[obj.category]++;
  return counts;
}
