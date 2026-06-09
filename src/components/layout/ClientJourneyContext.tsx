/**
 * ClientJourneyContext — camada agregadora (read-mostly) que une todos os módulos
 * em um único fluxo do cliente.
 *
 * REGRAS:
 *  - NÃO duplica dados: lê dos contextos existentes (Diagnóstico, Simulador, Bids).
 *  - NÃO substitui contextos atuais. Módulos seguem funcionando isoladamente.
 *  - Persiste por usuário em localStorage (slots editoriais: recomendação,
 *    estratégia de lance, comparações, status da proposta).
 *  - Expõe `progress` (passo X de 7) e `nextStep` para indicação visual.
 */
import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useDiagnosticContextSafe } from '@/components/modules/diagnostic/DiagnosticContext';
import { useSimulatorContext } from '@/components/modules/simulator/SimulatorContext';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { recommend, type DecisionOutput } from '@/utils/decisionEngine';
import type { ConsortiumType } from '@/types/consortium';

// ═══════ TYPES ═══════

export type JourneyStepId =
  | 'diagnostic' | 'simulator' | 'analysis' | 'objections'
  | 'proposal' | 'proposals' | 'post-sale';

export interface JourneyStep {
  id: JourneyStepId;
  label: string;
  /** Considerado completo com base nos contextos / slots persistidos. */
  done: boolean;
}

/** Slots editoriais — persistidos por usuário, atualizados incrementalmente. */
export interface JourneyPersistedSlots {
  /** Estratégia de lance escolhida no Estudo de Lances. */
  bidStrategy?: {
    consortiumType: ConsortiumType;
    groupNumber: number;
    bidPercent: number;
    zone: 'conservadora' | 'equilibrada' | 'agressiva';
    appliedAt: string;
  };
  /** Comparações já realizadas (rastreio leve). */
  comparisons?: Array<{
    type: 'consortium-vs-financing' | 'consortium-vs-cash' | 'investment';
    label: string;
    at: string;
  }>;
  /** Status da proposta gerada. */
  proposalStatus?: {
    proposalId?: string;
    status: 'rascunho' | 'gerada' | 'enviada' | 'aceita' | 'recusada';
    at: string;
  };
  /** Última recomendação relevante registrada (origem livre). */
  lastRecommendationId?: string;
  updatedAt?: string;
}

export interface ClientJourneyContextValue {
  /** Diagnóstico (snapshot — pode ser null se ainda não iniciado). */
  diagnostic: ReturnType<typeof useDiagnosticContextSafe>;
  /** Simulação atual (sempre presente; isValidSimulation indica se é utilizável). */
  simulation: {
    isValid: boolean;
    creditValue: number;
    termMonths: number;
    consortiumType: ConsortiumType;
    installmentAfterContemplation: number;
    /** @deprecated use `effectiveClientCost` para narrativas/IA. Mantido por compat. */
    totalCost: number;
    /** Custo efetivo do cliente (motor mensal, desconta lance embutido). Fonte de verdade para IA/proposta. */
    effectiveClientCost: number;
  };
  /** Recomendação derivada do decisionEngine + diagnóstico (memoizada). */
  recommendation: DecisionOutput | null;
  /** Slots persistidos por usuário (lance, comparações, proposta…). */
  slots: JourneyPersistedSlots;
  /** Atualização incremental — faz merge raso. */
  updateSlots: (patch: Partial<JourneyPersistedSlots>) => void;
  /** Limpa todos os slots persistidos do usuário atual. */
  clearSlots: () => void;
  /** Passos do fluxo, em ordem, com flag `done`. */
  steps: JourneyStep[];
  /** Posição atual estimada (1-based) com base no que já foi feito. */
  currentStepIndex: number;
  /** Próximo passo recomendado (ou null se tudo concluído). */
  nextStep: JourneyStep | null;
  /** Total de passos (7). */
  totalSteps: number;
}

// ═══════ STORAGE ═══════

const SLOTS_KEY_PREFIX = 'client-journey-slots:';
const SLOTS_KEY_ANON = 'client-journey-slots:anon';

const slotsKey = (userId: string | null) =>
  userId ? `${SLOTS_KEY_PREFIX}${userId}` : SLOTS_KEY_ANON;

function loadSlots(userId: string | null): JourneyPersistedSlots {
  try {
    const raw = localStorage.getItem(slotsKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSlots(userId: string | null, slots: JourneyPersistedSlots) {
  try {
    localStorage.setItem(slotsKey(userId), JSON.stringify(slots));
  } catch { /* quota / privacy mode — silencioso */ }
}

// ═══════ CONTEXT ═══════

const ClientJourneyContext = createContext<ClientJourneyContextValue | null>(null);

export function useClientJourney(): ClientJourneyContextValue {
  const ctx = useContext(ClientJourneyContext);
  if (!ctx) throw new Error('useClientJourney must be used within ClientJourneyProvider');
  return ctx;
}

/** Hook seguro: retorna null fora do provider (p/ módulos isolados). */
export function useClientJourneySafe(): ClientJourneyContextValue | null {
  return useContext(ClientJourneyContext);
}

// ═══════ PROVIDER ═══════

const STEP_LABELS: Record<JourneyStepId, string> = {
  diagnostic: 'Diagnóstico',
  simulator: 'Simulador',
  analysis: 'Análise',
  objections: 'Abordagem',
  proposal: 'Proposta',
  proposals: 'Carteira',
  'post-sale': 'Pós-venda',
};

const STEP_ORDER: JourneyStepId[] = [
  'diagnostic', 'simulator', 'analysis', 'objections', 'proposal', 'proposals', 'post-sale',
];

export function ClientJourneyProvider({ children }: { children: ReactNode }) {
  const userId = useCurrentUserId();
  const diagnostic = useDiagnosticContextSafe();
  const sim = useSimulatorContext();

  const [slots, setSlots] = useState<JourneyPersistedSlots>(() => loadSlots(userId));

  // Reload quando usuário muda (login/logout)
  useEffect(() => {
    setSlots(loadSlots(userId));
  }, [userId]);

  // Persistência reativa
  useEffect(() => {
    saveSlots(userId, slots);
  }, [userId, slots]);

  const updateSlots = useCallback((patch: Partial<JourneyPersistedSlots>) => {
    setSlots(prev => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));
  }, []);

  const clearSlots = useCallback(() => setSlots({}), []);

  // Recomendação derivada (memoizada) — só recalcula se algum dos
  // 6 campos primitivos efetivamente consumidos pelo decisionEngine mudar.
  // Antes a dep era `diagnostic?.data`, que é um objeto novo a cada update
  // do DiagnosticContext (mesmo sem mudança de valor) → recommend rodava
  // sem necessidade. Agora as deps são os escalares já desestruturados.
  const dx = diagnostic?.data;
  const objetivoPrincipal = dx?.objetivoPrincipal;
  const clientObjective = dx?.clientObjective;
  const capacidadeMensal = dx?.capacidadeMensal ?? dx?.monthlyCapacity ?? 0;
  const temCapitalDisponivel = dx?.temCapitalDisponivel;
  const capitalDisponivel = dx?.capitalDisponivel;
  const prioridade = dx?.prioridade;
  const urgencia = dx?.urgencia;

  const recommendation = useMemo<DecisionOutput | null>(() => {
    if (!diagnostic) return null;
    if (!objetivoPrincipal && !clientObjective) return null;
    try {
      return recommend({
        objetivoPrincipal,
        capacidadeMensal,
        temCapitalDisponivel,
        capitalDisponivel,
        prioridade,
        urgencia,
      });
    } catch { return null; }
  }, [
    diagnostic,
    objetivoPrincipal,
    clientObjective,
    capacidadeMensal,
    temCapitalDisponivel,
    capitalDisponivel,
    prioridade,
    urgencia,
  ]);

  const simulation = useMemo(() => ({
    isValid: sim.isValidSimulation,
    creditValue: sim.input.creditValue,
    termMonths: sim.input.termMonths,
    consortiumType: sim.input.consortiumType,
    installmentAfterContemplation: sim.result.installmentAfterContemplation,
    // `totalCost` (legado) inclui lance embutido — NÃO é desembolso real.
    // `effectiveClientCost` vem do motor mensal e desconta o lance embutido.
    // Mantemos `totalCost` para compatibilidade (slots persistidos), mas a IA
    // e a proposta devem consumir `effectiveClientCost`.
    totalCost: sim.result.totalCost,
    effectiveClientCost: sim.effectiveClientCost,
  }), [sim.isValidSimulation, sim.input, sim.result, sim.effectiveClientCost]);

  // Steps + progresso
  const steps = useMemo<JourneyStep[]>(() => {
    const diagnosticDone = !!(diagnostic?.hasStarted);
    const simulatorDone = sim.isValidSimulation;
    const analysisDone = !!(slots.bidStrategy || (slots.comparisons && slots.comparisons.length > 0));
    const objectionsDone = false; // sem trace no MVP
    const proposalDone = !!slots.proposalStatus && slots.proposalStatus.status !== 'rascunho';
    const proposalsDone = !!slots.proposalStatus && ['enviada', 'aceita', 'recusada'].includes(slots.proposalStatus.status);
    const postSaleDone = !!slots.proposalStatus && slots.proposalStatus.status === 'aceita';
    const map: Record<JourneyStepId, boolean> = {
      diagnostic: diagnosticDone,
      simulator: simulatorDone,
      analysis: analysisDone,
      objections: objectionsDone,
      proposal: proposalDone,
      proposals: proposalsDone,
      'post-sale': postSaleDone,
    };
    return STEP_ORDER.map(id => ({ id, label: STEP_LABELS[id], done: map[id] }));
  }, [diagnostic?.hasStarted, sim.isValidSimulation, slots]);

  const currentStepIndex = useMemo(() => {
    const firstUndone = steps.findIndex(s => !s.done);
    return firstUndone === -1 ? steps.length : firstUndone + 1;
  }, [steps]);

  const nextStep = useMemo(() => steps.find(s => !s.done) ?? null, [steps]);

  const value = useMemo<ClientJourneyContextValue>(() => ({
    diagnostic,
    simulation,
    recommendation,
    slots,
    updateSlots,
    clearSlots,
    steps,
    currentStepIndex,
    nextStep,
    totalSteps: STEP_ORDER.length,
  }), [diagnostic, simulation, recommendation, slots, updateSlots, clearSlots, steps, currentStepIndex, nextStep]);

  return (
    <ClientJourneyContext.Provider value={value}>
      {children}
    </ClientJourneyContext.Provider>
  );
}
