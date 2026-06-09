/**
 * Tipos canônicos para objeções.
 * Extraídos de `objectionsLibrary.ts` para quebrar a dependência circular
 * com `./data.ts`. `objectionsLibrary.ts` re-exporta para manter a API.
 */

export type ClientProfile =
  | 'pf_aluguel'
  | 'pf_fgts'
  | 'pf_pos_financiamento'
  | 'pj_frota'
  | 'investidor'
  | 'sucessao'
  | 'liquidez'
  | 'agronegocio';

export type ObjectionCategory =
  | 'preco'
  | 'tempo'
  | 'financiamento'
  | 'confianca'
  | 'urgencia'
  | 'experiencia'
  | 'risco'
  | 'entendimento'
  | 'perfil'
  | 'financeiro'
  | 'lance'
  | 'contemplacao';

export interface Objection {
  id: string;
  category: ObjectionCategory;
  clientPhrase: string;
  response: string;
  tags?: string[];
  clientProfile?: ClientProfile;
}
