/**
 * Adaptive Consultive Intelligence — Profile Engine
 * ════════════════════════════════════════════════════════════════
 *
 * Deriva um `ConsultiveProfile` enxuto a partir de sinais já
 * existentes na plataforma (DiagnosticContext, SimulatorContext,
 * ClientJourney). NÃO cria novos cadastros, NÃO persiste perfil
 * em servidor, NÃO faz tracking de comportamento individual.
 *
 * Princípios (ver docs/adaptive/adaptive-policy.md):
 *   1. Determinístico, sem IA — toda derivação é uma função pura.
 *   2. Conservador — quando o sinal é fraco, devolve `unknown`.
 *   3. Apenas ajuda o consultor a calibrar tom/ênfase. Nunca
 *      decide preço, taxa, regra de negócio.
 *   4. Privacidade: não envia perfil para edges/analytics.
 */
import type { DiagnosticData, ClientProfile, ClientBehavior } from '@/components/modules/diagnostic/DiagnosticContext';

// ─── Modelo público ────────────────────────────────────────────
export type Urgency = 'high' | 'medium' | 'low' | 'unknown';
export type FinancialComfort = 'tight' | 'stable' | 'strong' | 'unknown';
export type Sophistication = 'basic' | 'analytical' | 'investor' | 'unknown';
export type Objective = 'asset' | 'cashflow' | 'investment' | 'replacement' | 'unknown';
export type RiskTolerance = 'low' | 'medium' | 'high' | 'unknown';

export interface ConsultiveProfile {
  urgency: Urgency;
  financialComfort: FinancialComfort;
  sophistication: Sophistication;
  objective: Objective;
  riskTolerance: RiskTolerance;
  /** Perfil consolidado vindo do DiagnosticContext (já derivado dos 5 pilares). */
  consolidated: ClientProfile | 'unknown';
  /** Comportamento (confiante/neutro/resistente). */
  behavior: ClientBehavior | 'unknown';
  /** Confiança geral nos sinais (0..1). <0.35 = perfil insuficiente. */
  confidence: number;
}

const DEFAULT_PROFILE: ConsultiveProfile = {
  urgency: 'unknown',
  financialComfort: 'unknown',
  sophistication: 'unknown',
  objective: 'unknown',
  riskTolerance: 'unknown',
  consolidated: 'unknown',
  behavior: 'unknown',
  confidence: 0,
};

// ─── Sinais brutos esperados ───────────────────────────────────
export interface AdaptiveSignals {
  diagnostic?: DiagnosticData | null;
  consolidated?: ClientProfile | null;
  behavior?: ClientBehavior | null;
  /** Valor de crédito simulado (R$). */
  creditValue?: number | null;
  /** Parcela cheia (R$). */
  fullInstallment?: number | null;
  /** Capacidade mensal declarada (R$). */
  monthlyCapacity?: number | null;
}

// ─── Derivações atômicas (puras) ──────────────────────────────
function deriveUrgency(d?: DiagnosticData | null): Urgency {
  if (!d) return 'unknown';
  if (d.urgencia === 'imediato' || d.urgencyLevel === 'alta') return 'high';
  if (d.urgencia === 'curto_prazo' || d.urgencyLevel === 'media') return 'medium';
  if (d.urgencia === 'sem_pressa' || d.urgencyLevel === 'baixa') return 'low';
  return 'unknown';
}

function deriveFinancialComfort(s: AdaptiveSignals): FinancialComfort {
  const cap = s.monthlyCapacity ?? s.diagnostic?.capacidadeMensal ?? s.diagnostic?.monthlyCapacity ?? 0;
  const inst = s.fullInstallment ?? 0;
  if (cap <= 0 || inst <= 0) return 'unknown';
  const ratio = inst / cap; // % da capacidade comprometida
  if (ratio >= 0.85) return 'tight';
  if (ratio >= 0.55) return 'stable';
  return 'strong';
}

function deriveObjective(d?: DiagnosticData | null): Objective {
  if (!d) return 'unknown';
  switch (d.objetivoPrincipal) {
    case 'imovel_investimento':
    case 'investimento':
      return 'investment';
    case 'troca_imovel':
    case 'troca_veiculo':
      return 'replacement';
    case 'imovel_moradia':
    case 'veiculo':
      return 'asset';
    // ─── Produtivo (reaproveita semântica existente) ───
    case 'patrimonio_produtivo':
      // sucessão/consolidação ⇒ preserve via 'asset' (estruturação patrimonial);
      // máquinas ⇒ 'investment' (alavanca produtiva)
      return d.subObjetivo === 'maquinas_implementos' ? 'investment' : 'asset';
    case 'expandir_operacao':
      return 'investment'; // crescimento/ROI operacional
    default:
      break;
  }
  switch (d.clientObjective) {
    case 'investir':
    case 'patrimonio':
      return 'investment';
    case 'trocar-imovel':
      return 'replacement';
    case 'comprar-imovel':
    case 'sair-aluguel':
      return 'asset';
    case 'negocio-pj':
      return 'cashflow';
    default:
      return 'unknown';
  }
}

function deriveSophistication(d?: DiagnosticData | null, objective?: Objective): Sophistication {
  if (!d) return 'unknown';
  // Confiança alta + objetivo de investimento → investor
  if (d.confiancaConsorcio === 'alta' && (objective === 'investment' || d.temCapitalDisponivel)) return 'investor';
  if (d.confiancaConsorcio === 'alta' || d.prioridade === 'menor_custo') return 'analytical';
  if (d.confiancaConsorcio === 'baixa') return 'basic';
  return 'unknown';
}

function deriveRiskTolerance(d?: DiagnosticData | null, sophistication?: Sophistication): RiskTolerance {
  if (!d) return 'unknown';
  if (sophistication === 'investor') return 'high';
  if (d.confiancaConsorcio === 'baixa' || d.prioridade === 'menor_parcela') return 'low';
  if (d.prioridade === 'manter_liquidez') return 'medium';
  if (sophistication === 'analytical') return 'medium';
  return 'unknown';
}

function computeConfidence(p: Omit<ConsultiveProfile, 'confidence'>): number {
  const fields: Array<keyof typeof p> = ['urgency', 'financialComfort', 'sophistication', 'objective', 'riskTolerance'];
  const known = fields.filter((k) => p[k] !== 'unknown').length;
  return Math.round((known / fields.length) * 100) / 100;
}

// ─── API pública ──────────────────────────────────────────────
export function deriveConsultiveProfile(signals: AdaptiveSignals): ConsultiveProfile {
  if (!signals.diagnostic && !signals.consolidated && !signals.fullInstallment) return DEFAULT_PROFILE;

  const urgency = deriveUrgency(signals.diagnostic);
  const financialComfort = deriveFinancialComfort(signals);
  const objective = deriveObjective(signals.diagnostic);
  const sophistication = deriveSophistication(signals.diagnostic, objective);
  const riskTolerance = deriveRiskTolerance(signals.diagnostic, sophistication);

  const partial: Omit<ConsultiveProfile, 'confidence'> = {
    urgency,
    financialComfort,
    sophistication,
    objective,
    riskTolerance,
    consolidated: signals.consolidated ?? 'unknown',
    behavior: signals.behavior ?? 'unknown',
  };
  return { ...partial, confidence: computeConfidence(partial) };
}

/** Etiqueta de "audiência" de insight — usada para filtrar conteúdo no HelpHint. */
export type InsightAudience =
  | 'urgent'
  | 'patient'
  | 'tight-budget'
  | 'strong-budget'
  | 'basic'
  | 'analytical'
  | 'investor'
  | 'asset'
  | 'investment'
  | 'replacement'
  | 'low-risk'
  | 'high-risk';

/** Lista das audiências para as quais o perfil atual é relevante. */
export function profileAudiences(p: ConsultiveProfile): InsightAudience[] {
  const out: InsightAudience[] = [];
  if (p.urgency === 'high') out.push('urgent');
  if (p.urgency === 'low') out.push('patient');
  if (p.financialComfort === 'tight') out.push('tight-budget');
  if (p.financialComfort === 'strong') out.push('strong-budget');
  if (p.sophistication === 'basic') out.push('basic');
  if (p.sophistication === 'analytical') out.push('analytical');
  if (p.sophistication === 'investor') out.push('investor');
  if (p.objective === 'asset') out.push('asset');
  if (p.objective === 'investment') out.push('investment');
  if (p.objective === 'replacement') out.push('replacement');
  if (p.riskTolerance === 'low') out.push('low-risk');
  if (p.riskTolerance === 'high') out.push('high-risk');
  return out;
}
