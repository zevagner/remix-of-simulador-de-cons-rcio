/**
 * Anonimizador de casos para a Comunidade.
 *
 * Transforma um registro de proposta ou pós-venda em um resumo público
 * SEM dados pessoais (nome, telefone, e-mail, CPF). Renda, quando
 * existir, é mapeada em FAIXAS.
 *
 * É determinístico — sem chamadas de IA. A IA, se quiser, refina o
 * texto a partir do `summary` gerado aqui.
 */
import type { Tables } from '@/integrations/supabase/types';

type Proposal = Tables<'proposals'>;
type PostSaleClient = Tables<'post_sale_clients'>;

export type AnonymizedSourceKind = 'proposal' | 'post_sale' | 'manual';

export interface AnonymizedCase {
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  consortium_type: string | null;
  stage: string | null;
  source_kind: AnonymizedSourceKind;
  source_id: string | null;
}

const fmtBRL = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n)
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : '—';

const consortiumLabel: Record<string, string> = {
  imobiliario: 'Imobiliário',
  auto: 'Veículos',
  pesados: 'Pesados',
};

const stageLabelByStatus: Record<string, string> = {
  prospeccao: 'Prospecção',
  aguardando_retorno: 'Aguardando retorno',
  em_avaliacao: 'Em avaliação',
  proposta_ajustada: 'Proposta ajustada',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

/** Mapeia renda em faixas para nunca expor o valor exato. */
export function incomeBand(income: number | null | undefined): string | null {
  if (typeof income !== 'number' || !Number.isFinite(income) || income <= 0) return null;
  if (income < 3_000) return 'até R$ 3 mil';
  if (income < 5_000) return 'R$ 3–5 mil';
  if (income < 10_000) return 'R$ 5–10 mil';
  if (income < 20_000) return 'R$ 10–20 mil';
  if (income < 40_000) return 'R$ 20–40 mil';
  return 'acima de R$ 40 mil';
}

/** Mapeia carta em faixas (usado no título). */
function creditBand(value: number): string {
  if (value < 50_000) return 'até R$ 50 mil';
  if (value < 100_000) return 'R$ 50–100 mil';
  if (value < 200_000) return 'R$ 100–200 mil';
  if (value < 400_000) return 'R$ 200–400 mil';
  if (value < 800_000) return 'R$ 400–800 mil';
  return 'acima de R$ 800 mil';
}

/** Remove qualquer string que pareça PII de um campo livre (notes, título, resumo). */
export function stripPII(text: string | null | undefined): string {
  if (!text) return '';
  let t = text;
  // Email
  t = t.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]');
  // Telefone (BR)
  t = t.replace(/(\(?\d{2}\)?\s?)?(9?\d{4})[-.\s]?\d{4}/g, '[telefone]');
  // CPF / CNPJ
  t = t.replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, '[cpf]');
  t = t.replace(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g, '[cnpj]');
  return t.trim();
}

export function anonymizeProposal(p: Proposal): AnonymizedCase {
  const tipo = consortiumLabel[p.consortium_type] ?? p.consortium_type ?? 'consórcio';
  const stage = stageLabelByStatus[p.status] ?? p.status;
  const lance = p.bid_percent ? `${Number(p.bid_percent).toFixed(0)}%` : 'sem lance';
  const zona = p.bid_zone ?? null;
  const notes = stripPII(p.notes);

  const lines = [
    `Tipo: ${tipo}`,
    `Carta: ${fmtBRL(Number(p.credit_value))}`,
    `Prazo: ${p.term_months} meses`,
    `Parcela atual: ${fmtBRL(Number(p.installment))}`,
    `Custo total estimado: ${fmtBRL(Number(p.total_cost))}`,
    `Estágio: ${stage}`,
    `Estratégia de lance: ${lance}${zona ? ` (${zona})` : ''}`,
  ];
  if (p.plan_type && p.plan_type !== 'tradicional') {
    lines.push(`Modalidade: ${p.plan_type}`);
  }
  if (notes) {
    lines.push('', 'Contexto adicional (anonimizado):', notes.slice(0, 600));
  }

  return {
    title: `${tipo} • carta ${creditBand(Number(p.credit_value))} • ${stage}`,
    summary: lines.join('\n'),
    payload: {
      consortium_type: p.consortium_type,
      credit_band: creditBand(Number(p.credit_value)),
      term_months: p.term_months,
      bid_percent: p.bid_percent,
      bid_zone: p.bid_zone,
      stage: p.status,
      plan_type: p.plan_type,
    },
    consortium_type: p.consortium_type,
    // stage agora identifica a ORIGEM do caso (não o status comercial).
    // O status da proposta segue disponível no payload.stage.
    stage: 'proposta',
    source_kind: 'proposal',
    source_id: p.id,
  };
}

export function anonymizePostSale(c: PostSaleClient): AnonymizedCase {
  const tipo = consortiumLabel[c.consortium_type] ?? c.consortium_type;
  const notes = stripPII(c.notes);
  const lines = [
    `Tipo: ${tipo}`,
    `Carta: ${fmtBRL(Number(c.credit_value))}`,
    `Prazo: ${c.term_months} meses`,
    `Modalidade: ${c.plan_modality ?? 'tradicional'}`,
    `Status pós-venda: ${c.status}`,
    c.contemplation_date ? `Contemplado em: ${c.contemplation_date}` : 'Ainda não contemplado',
  ];
  if (notes) {
    lines.push('', 'Contexto adicional (anonimizado):', notes.slice(0, 600));
  }

  return {
    title: `Pós-venda • ${tipo} • carta ${creditBand(Number(c.credit_value))}`,
    summary: lines.join('\n'),
    payload: {
      consortium_type: c.consortium_type,
      credit_band: creditBand(Number(c.credit_value)),
      term_months: c.term_months,
      plan_modality: c.plan_modality,
      stage: c.status,
    },
    consortium_type: c.consortium_type,
    stage: 'pos_venda',
    source_kind: 'post_sale',
    source_id: c.id,
  };
}

/**
 * Anonimiza o resultado de uma SIMULAÇÃO (sem proposta gravada ainda).
 * Usado pelo botão "Pedir ajuda nesse caso" disparado direto da tela do simulador.
 */
export interface SimulationSnapshot {
  consortiumType: string;
  creditValue: number;
  termMonths: number;
  installment: number;
  totalCost: number;
  bidPercent?: number | null;
  bidZone?: string | null;
  planType?: string | null;
  reducedInstallment?: boolean;
  insuranceEnabled?: boolean;
  question?: string | null;
}

export function anonymizeSimulation(s: SimulationSnapshot): AnonymizedCase {
  const tipo = consortiumLabel[s.consortiumType] ?? s.consortiumType ?? 'consórcio';
  const lance = s.bidPercent ? `${Number(s.bidPercent).toFixed(0)}%` : 'sem lance';
  const zona = s.bidZone ?? null;
  const question = stripPII(s.question);

  const lines = [
    `Tipo: ${tipo}`,
    `Carta: ${fmtBRL(s.creditValue)}`,
    `Prazo: ${s.termMonths} meses`,
    `Parcela estimada: ${fmtBRL(s.installment)}`,
    `Custo total estimado: ${fmtBRL(s.totalCost)}`,
    `Estratégia de lance: ${lance}${zona ? ` (${zona})` : ''}`,
  ];
  if (s.planType && s.planType !== 'tradicional') {
    lines.push(`Modalidade: ${s.planType}`);
  }
  if (s.reducedInstallment) lines.push('Parcela reduzida nos primeiros meses: sim');
  if (s.insuranceEnabled === false) lines.push('Seguro prestamista: desativado');
  lines.push('', 'Origem: simulação (sem proposta gravada).');
  if (question) {
    lines.push('', 'Dúvida do consultor:', question.slice(0, 600));
  }

  return {
    title: `${tipo} • carta ${creditBand(s.creditValue)} • simulação`,
    summary: lines.join('\n'),
    payload: {
      consortium_type: s.consortiumType,
      credit_band: creditBand(s.creditValue),
      term_months: s.termMonths,
      bid_percent: s.bidPercent ?? null,
      bid_zone: s.bidZone ?? null,
      plan_type: s.planType ?? 'tradicional',
      stage: 'simulacao',
    },
    consortium_type: s.consortiumType,
    stage: 'simulacao',
    source_kind: 'manual',
    source_id: null,
  };
}
