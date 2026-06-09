/**
 * Adaptive Recommendations
 * ════════════════════════════════════════════════════════════════
 *
 * Mapas determinísticos para:
 *  - próximo módulo sugerido por contexto + perfil
 *  - trilha de aprendizado adequada ao perfil
 *  - estratégia consultiva curta (uma frase) para o cockpit
 *
 * Princípios:
 *  - Sugestão = atalho, não prescrição. Sempre dismissable.
 *  - Tom institucional, sem verbos de marketing.
 *  - Nada que dependa de IA. Pura função do perfil + módulo atual.
 *  - Quando perfil insuficiente (confidence < 0.35), retorna `null`.
 */
import type { ConsultiveProfile } from './profile';

export interface AdaptiveSuggestion {
  /** ID estável (kebab-case) — usado em telemetria local. */
  id: string;
  /** Frase curta exibida ao consultor (≤ 120 chars). */
  message: string;
  /** Módulo a abrir, se aplicável. */
  targetModule?:
    | 'simulator'
    | 'comparator'
    | 'investment'
    | 'bids'
    | 'analysis'
    | 'proposal'
    | 'community'
    | 'help';
  /** Slug de trilha educacional, se aplicável. */
  trailId?: string;
  /** Tom visual (info | success | warning). */
  tone?: 'info' | 'success' | 'warning';
  /**
   * Racional consultivo curto (≤ 90 chars) — explica POR QUÊ a sugestão
   * apareceu, sem AI theater. Tom humano, baseado em sinais do diagnóstico
   * ou da simulação. Exibido como microcopy abaixo da mensagem principal.
   */
  rationale?: string;
}

const MIN_CONFIDENCE = 0.35;

/** Sugere próximo módulo natural a partir do módulo atual + perfil. */
export function suggestNextModule(
  currentModule: string,
  p: ConsultiveProfile
): AdaptiveSuggestion | null {
  if (p.confidence < MIN_CONFIDENCE) return null;

  // Comparador → quem é investidor ganha mais com Investment
  if (currentModule === 'comparator' && (p.sophistication === 'investor' || p.objective === 'investment')) {
    return {
      id: 'next:comparator->investment',
      message: 'Cliente com perfil patrimonial. Abrir Investimento aprofunda o racional de alavancagem.',
      targetModule: 'investment',
      tone: 'info',
      rationale: p.objective === 'investment'
        ? 'Objetivo informado prioriza multiplicação patrimonial.'
        : 'Perfil declarado indica familiaridade com investimentos.',
    };
  }

  // Investment → perfil analítico se beneficia de OE
  if (currentModule === 'investment' && p.sophistication === 'analytical') {
    return {
      id: 'next:investment->analysis',
      message: 'Perfil analítico detectado. O módulo Análise (CET, comparações) tende a aumentar a confiança.',
      targetModule: 'analysis',
      tone: 'info',
      rationale: 'Cliente demonstra apetite por números e comparação detalhada.',
    };
  }

  // Fluxo apertado → reduzida no Simulador
  if (currentModule === 'simulator' && p.financialComfort === 'tight') {
    return {
      id: 'next:simulator->reduced',
      message: 'Capacidade financeira justa. Considere apresentar a parcela reduzida como ponto de entrada.',
      tone: 'warning',
      rationale: 'Capacidade mensal informada está próxima da parcela cheia.',
    };
  }

  // Urgente → Lance
  if (p.urgency === 'high' && currentModule !== 'bids') {
    return {
      id: 'next:any->bids',
      message: 'Cliente com urgência alta. O estudo de Lance ajuda a desenhar uma janela realista de contemplação.',
      targetModule: 'bids',
      tone: 'info',
      rationale: 'Urgência declarada no diagnóstico exige timeline de contemplação.',
    };
  }

  return null;
}

/** Trilha educacional adequada ao perfil. */
export function suggestTrail(p: ConsultiveProfile): AdaptiveSuggestion | null {
  if (p.confidence < MIN_CONFIDENCE) return null;
  if (p.sophistication === 'investor' || p.objective === 'investment') {
    return {
      id: 'trail:investidor',
      message: 'Trilha "Cliente investidor": INPC, alavancagem e venda de cota.',
      trailId: 'cliente-investidor',
      targetModule: 'help',
      tone: 'info',
      rationale: 'Aderente ao objetivo patrimonial informado.',
    };
  }
  if (p.urgency === 'high') {
    return {
      id: 'trail:imediatista',
      message: 'Trilha "Cliente imediatista": lance, contemplação e expectativa realista.',
      trailId: 'cliente-imediatista',
      targetModule: 'help',
      tone: 'info',
      rationale: 'Compatível com a prioridade de contemplação rápida.',
    };
  }
  if (p.financialComfort === 'tight') {
    return {
      id: 'trail:fluxo-apertado',
      message: 'Trilha "Operações estruturadas": como ajustar fluxo e entrada.',
      trailId: 'operacoes-estruturadas',
      targetModule: 'help',
      tone: 'warning',
      rationale: 'Indicada quando o fluxo mensal exige calibração fina.',
    };
  }
  return null;
}

/** Frase única consultiva — para banners discretos no cockpit. */
export function strategicHint(p: ConsultiveProfile): string | null {
  if (p.confidence < MIN_CONFIDENCE) return null;
  if (p.behavior === 'resistente') {
    return 'Cliente resistente: priorize previsibilidade, evite OE agressiva e use objeções consultivas.';
  }
  if (p.consolidated === 'urgencia') {
    return 'Cliente urgência: timeline de contemplação e lance honesto vencem a conversa.';
  }
  if (p.sophistication === 'investor') {
    return 'Cliente investidor: aprofunde patrimônio líquido, INPC e custo de oportunidade.';
  }
  if (p.financialComfort === 'tight') {
    return 'Capacidade financeira justa: parcela reduzida e prazo maior reduzem fricção.';
  }
  return null;
}
