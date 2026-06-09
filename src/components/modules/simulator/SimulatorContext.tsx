import { createContext, useContext, useState, useMemo, useCallback, useDeferredValue, useEffect, useRef, type ReactNode } from 'react';
import { SimulationInput, ConsortiumType, SuggestedBidFromStudy, SimulationResult, CONSORTIUM_TYPE_LABELS, PostContemplationChoice, ContemplationType } from '@/types/consortium';
import { calculateSimulation, deriveContemplationType } from '@/core/finance';
import { logger } from '@/utils/logger';
// SimulatorContext é o ÚNICO consumidor produtivo legítimo de `calculateSimulation`.
// Marca um flag global para silenciar o warning de uso direto.
globalThis.__calcSimAllowedCaller = true;
import { calculateMonthlySchedule, validateAgeAndTerm, type MonthlyScheduleResult, type AgeTermValidation } from '@/core/finance';
import { reconcileWithSchedule, getEffectiveClientCost } from '@/core/finance';
import { getPrestamistaRate, validatePrestamistaEligibility, type PrestamistaEligibilityResult } from '@/core/finance';
import { MAX_REDUCED_INSTALLMENT_MONTHS, DEFAULT_INSURANCE_PERCENT, DEFAULT_PROPONENT_AGE } from '@/config/consortiumRates';
// Onda Admin Fee Manual Governance: a taxa administrativa é 100% explícita
// e controlada pelo usuário. Não há mais auto-suggest, auto-apply ou
// auto-recompute. Qualquer reintrodução de getSuggestedAdminFee aqui é
// bloqueada pelo ESLint (no-restricted-imports).
import { normalizeInputByConsortiumType } from '@/utils/normalizeInputByConsortiumType';
import { toast } from 'sonner';
import { buildSimSlice, STRATEGY_SIM_SLICE_STORAGE_KEY } from '@/contexts/WealthAssumptionsContext';
import { SIM_SLICE_BRIDGE_EVENT, serializeSimSliceEnvelope } from '@/utils/storage/simSliceBridge';

const STORAGE_KEY = 'simulator-last-session';
const INPUT_BY_TYPE_KEY = 'simulator-input-by-type';

// ═══════ MODALIDADE (PLANO) ═══════
// Tipo de plano comercial. Apenas afeta apresentação/textos; o motor de cálculo
// permanece mensal (mensal × 6 = parcela semestral exibida).
export type PlanModality = 'tradicional' | 'agroflex' | 'empresarialflex';

export const PLAN_MODALITY_LABELS: Record<PlanModality, string> = {
  tradicional: 'Tradicional',
  agroflex: 'AgroFlex',
  empresarialflex: 'EmpresarialFlex',
};

/** Tipos de consórcio onde a modalidade Flex está disponível. */
export const FLEX_AVAILABLE_TYPES: ConsortiumType[] = ['auto', 'pesados'];

export const isFlexModality = (m: PlanModality) => m !== 'tradicional';

// ═══════ CONTEXT TYPE ═══════

export interface SavedSession {
  input: SimulationInput;
  contemplated: boolean;
  postContemplationChoice: PostContemplationChoice;
  contemplationMonth: number;
  freeBidType: 'value' | 'percent';
  embeddedBidType: 'value' | 'percent';
  freeBidPercent: number;
  embeddedBidPercent: number;
  adminFeeDiscount: number;
  insuranceEnabled: boolean;
  planModality: PlanModality;
  annualAdjustmentPercent?: number;
  /** Cliente utilizou a carta para aquisição de bem (cenário não-uso × uso). */
  usedCreditForAsset?: boolean;
  /** Mês de utilização da carta — base do início obrigatório do Prestamista. */
  creditUsageMonth?: number;
  savedAt: string;
}

export interface SimulatorContextType {
  // Core input
  input: SimulationInput;
  updateInput: <K extends keyof SimulationInput>(key: K, value: SimulationInput[K]) => void;

  // Contemplation
  contemplated: boolean;
  setContemplated: (v: boolean) => void;
  postContemplationChoice: PostContemplationChoice;
  setPostContemplationChoice: (v: PostContemplationChoice) => void;
  contemplationMonth: number;
  setContemplationMonth: (v: number) => void;

  // Bid controls
  freeBidType: 'value' | 'percent';
  setFreeBidType: (v: 'value' | 'percent') => void;
  embeddedBidType: 'value' | 'percent';
  setEmbeddedBidType: (v: 'value' | 'percent') => void;
  freeBidPercent: number;
  setFreeBidPercent: (v: number) => void;
  embeddedBidPercent: number;
  setEmbeddedBidPercent: (v: number) => void;

  // Discounts & insurance
  adminFeeDiscount: number;
  setAdminFeeDiscount: (v: number) => void;
  insuranceEnabled: boolean;
  setInsuranceEnabled: (v: boolean) => void;

  // Cliente utilizou a carta para aquisição de bem (cenário não-uso × uso).
  // Quando true + insuranceEnabled=false, o Prestamista é forçado a partir
  // do `creditUsageMonth`. Quando false + insuranceEnabled=false, sem seguro.
  usedCreditForAsset: boolean;
  setUsedCreditForAsset: (v: boolean) => void;
  creditUsageMonth: number;
  setCreditUsageMonth: (v: number) => void;

  // Reajuste anual opcional (INCC/IPCA) — só afeta o schedule mensal
  annualAdjustmentPercent: number;
  setAnnualAdjustmentPercent: (v: number) => void;

  // Plan modality (visual/flow only)
  planModality: PlanModality;
  setPlanModality: (v: PlanModality) => void;
  isFlexPlan: boolean;
  flexAvailable: boolean;
  semestralInstallment: number;
  semestralReducedInstallment: number;
  semestralRedilutedInstallment: number;
  initialEntrySemestres: number;

  // Actions
  onReset: () => void;
  applyBidFromStudy: (bidData: SuggestedBidFromStudy) => void;
  clearSuggestedBid: () => void;
  suggestedBidFromStudy: SuggestedBidFromStudy | null;

  // Session restore
  pendingRestore: SavedSession | null;
  restoreSession: () => void;
  dismissRestore: () => void;

  // Derived values (computed, memoized)
  contemplationType: ContemplationType;
  actualFreeBidValue: number;
  actualEmbeddedBidValue: number;
  effectiveAdminFeePercent: number;
  mipRate: number;
  effectiveInsurancePercent: number;
  effectiveMonthlyInsurance: number;
  result: SimulationResult;
  resultWithoutDiscount: SimulationResult;
  isValidSimulation: boolean;
  maxReducedMonths: number;
  typeLabels: Record<ConsortiumType, string>;

  // Schedule mensal atuarial (seguro decrescente sobre saldo devedor)
  monthlySchedule: MonthlyScheduleResult;
  /**
   * Schedule BASE — estrutura ORIGINAL do plano (SEM contemplação, SEM lance,
   * SEM pós-lance). Use para apresentar a "fotografia" do plano contratado
   * independente da estratégia operacional do consultor.
   */
  baseMonthlySchedule: MonthlyScheduleResult;
  /**
   * Resultado BASE — agregados reconciliados com `baseMonthlySchedule`.
   * Card "Resultados da Simulação" deve consumir SEMPRE este, nunca `result`.
   */
  baseResult: SimulationResult;
  /** Custo efetivo do cliente (parcelas + seguro + lance livre, SEM lance embutido). Vindo do schedule. */
  effectiveClientCost: number;
  ageTermValidation: AgeTermValidation;
  /**
   * Elegibilidade canônica do Seguro Prestamista (Onda 3).
   * Usar para hard-stop: quando `eligible=false`, o seguro deve ser
   * desabilitado e o toggle bloqueado com mensagem consultiva.
   */
  prestamistaEligibility: PrestamistaEligibilityResult;

  // Admin fee é 100% explícito (Onda Admin Fee Manual Governance).
  // Não há mais `suggestedAdminFee` nem `isAdminFeeSuggested` no contexto.
}

// ═══════ CONTEXTS ═══════
// Performance 4: dividimos o contexto em dois para evitar render em cascata.
// - InputContext: estado bruto do formulário (muda a cada tecla via debounce nos inputs)
// - ResultContext: valores derivados pesados (result, monthlySchedule, etc.)
// O contexto combinado (`SimulatorContext`) é mantido para compatibilidade dos
// consumidores legados — mas componentes hot path (cards memoizados, inputs)
// devem preferir `useSimulatorInput()` / `useSimulatorResult()` para re-renderizar
// apenas quando a fatia relevante muda.

const SimulatorContext = createContext<SimulatorContextType | null>(null);

/** Slice de INPUT: estado de formulário, setters, toggles. Muda a cada digitação. */
export type SimulatorInputSlice = Pick<SimulatorContextType,
  | 'input' | 'updateInput'
  | 'contemplated' | 'setContemplated'
  | 'postContemplationChoice' | 'setPostContemplationChoice'
  | 'contemplationMonth' | 'setContemplationMonth'
  | 'freeBidType' | 'setFreeBidType'
  | 'embeddedBidType' | 'setEmbeddedBidType'
  | 'freeBidPercent' | 'setFreeBidPercent'
  | 'embeddedBidPercent' | 'setEmbeddedBidPercent'
  | 'adminFeeDiscount' | 'setAdminFeeDiscount'
  | 'insuranceEnabled' | 'setInsuranceEnabled'
  | 'usedCreditForAsset' | 'setUsedCreditForAsset'
  | 'creditUsageMonth' | 'setCreditUsageMonth'
  | 'annualAdjustmentPercent' | 'setAnnualAdjustmentPercent'
  | 'planModality' | 'setPlanModality'
  | 'flexAvailable' | 'isFlexPlan'
  | 'maxReducedMonths' | 'typeLabels'
  | 'onReset' | 'applyBidFromStudy' | 'clearSuggestedBid' | 'suggestedBidFromStudy'
  | 'pendingRestore' | 'restoreSession' | 'dismissRestore'
>;

/** Slice de RESULT: cálculos derivados. Só muda quando o resultado realmente muda. */
export type SimulatorResultSlice = Pick<SimulatorContextType,
  | 'contemplationType'
  | 'actualFreeBidValue' | 'actualEmbeddedBidValue'
  | 'effectiveAdminFeePercent' | 'mipRate'
  | 'effectiveInsurancePercent' | 'effectiveMonthlyInsurance'
  | 'result' | 'resultWithoutDiscount'
  | 'isValidSimulation'
  | 'monthlySchedule' | 'baseMonthlySchedule' | 'baseResult'
  | 'effectiveClientCost' | 'ageTermValidation' | 'prestamistaEligibility'
  | 'semestralInstallment' | 'semestralReducedInstallment' | 'semestralRedilutedInstallment'
  | 'initialEntrySemestres'
>;

const SimulatorInputContext = createContext<SimulatorInputSlice | null>(null);
const SimulatorResultContext = createContext<SimulatorResultSlice | null>(null);

export function useSimulatorContext() {
  const ctx = useContext(SimulatorContext);
  if (!ctx) throw new Error('useSimulatorContext must be used within SimulatorProvider');
  return ctx;
}

/** Safe variant that returns null when no SimulatorProvider is in the tree. */
export function useSimulatorContextSafe(): SimulatorContextType | null {
  return useContext(SimulatorContext);
}

/** Slice apenas de INPUT — use em componentes de formulário que não precisam de result. */
export function useSimulatorInput(): SimulatorInputSlice {
  const ctx = useContext(SimulatorInputContext);
  if (!ctx) throw new Error('useSimulatorInput must be used within SimulatorProvider');
  return ctx;
}

/** Slice apenas de RESULT — use em cards/visualizações que dependem do cálculo. */
export function useSimulatorResult(): SimulatorResultSlice {
  const ctx = useContext(SimulatorResultContext);
  if (!ctx) throw new Error('useSimulatorResult must be used within SimulatorProvider');
  return ctx;
}

// ═══════ DEFAULTS ═══════

const defaultSimulatorInput: SimulationInput = {
  creditValue: 0,
  termMonths: 0,
  consortiumType: 'imobiliario',
  adminFeePercent: 0,
  reserveFundPercent: 0,
  insurancePercent: DEFAULT_INSURANCE_PERCENT,
  proponentAge: DEFAULT_PROPONENT_AGE,
  reducedInstallment: false,
  freeBidValue: 0,
  embeddedBidValue: 0,
};

// Stable reference for typeLabels
const TYPE_LABELS = CONSORTIUM_TYPE_LABELS;

// ═══════ PROVIDER ═══════

export function SimulatorProvider({ children }: { children: ReactNode }) {
  // ── Core input ──
  const [input, setInput] = useState<SimulationInput>(defaultSimulatorInput);

  // ── Contemplation ──
  const [contemplated, setContemplated] = useState(false);
  const [postContemplationChoice, setPostContemplationChoice] = useState<PostContemplationChoice>('reduce-installment');
  const [contemplationMonth, setContemplationMonth] = useState(1);

  // ── Bid controls ──
  const [freeBidType, setFreeBidType] = useState<'value' | 'percent'>('percent');
  const [embeddedBidType, setEmbeddedBidType] = useState<'value' | 'percent'>('percent');
  const [freeBidPercent, setFreeBidPercent] = useState(0);
  const [embeddedBidPercent, setEmbeddedBidPercent] = useState(0);

  // ── Discounts & insurance ──
  const [adminFeeDiscount, setAdminFeeDiscount] = useState(0);
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);

  // ── Utilização da carta (não-uso × uso) ──
  // Quando o consultor marca que o cliente utilizou a carta para aquisição
  // de bem, o Prestamista passa a ser obrigatório a partir de
  // `creditUsageMonth`. Default = `contemplationMonth` (alinhado ao
  // momento da assembleia). Não persiste no slice quando insuranceEnabled
  // já está ativo (cenário "seguro desde o início" tem precedência).
  const [usedCreditForAsset, setUsedCreditForAsset] = useState(false);
  const [creditUsageMonth, setCreditUsageMonthState] = useState(1);
  const setCreditUsageMonth = useCallback((v: number) => {
    const term = Math.max(1, Math.floor(input.termMonths || 1));
    setCreditUsageMonthState(Math.min(term, Math.max(1, Math.floor(v || 1))));
  }, [input.termMonths]);

  // ── Reajuste anual opcional (INCC/IPCA) — afeta apenas o schedule mensal ──
  const [annualAdjustmentPercent, setAnnualAdjustmentPercent] = useState(0);

  // ── Plan modality (visual/flow only) ──
  const [planModality, setPlanModality] = useState<PlanModality>('tradicional');

  // ── Suggested bid from study ──
  const [suggestedBidFromStudy, setSuggestedBidFromStudy] = useState<SuggestedBidFromStudy | null>(null);

  // (Onda Admin Fee Manual Governance) — `adminFeeManuallyEdited`
  // foi removido: a taxa é sempre explícita, não derivada.

  // ── Session restore ──
  const [pendingRestore, setPendingRestore] = useState<SavedSession | null>(null);
  const initialCheckDone = useRef(false);

  // Check for saved session on mount
  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved: SavedSession = JSON.parse(raw);
      if (saved.input?.creditValue > 0 && saved.input?.termMonths > 0) {
        setPendingRestore(saved);
      }
    } catch { /* ignore corrupt data */ }
  }, []);

  // Auto-save on meaningful changes — DEBOUNCED 500ms
  // Evita JSON.stringify + localStorage.setItem síncrono a cada tecla,
  // que bloqueava o main thread e causava "engasgo" na digitação em mobile.
  useEffect(() => {
    if (input.creditValue <= 0 || input.termMonths <= 0) return;
    const timer = setTimeout(() => {
      try {
        const session: SavedSession = {
          input, contemplated, postContemplationChoice, contemplationMonth,
          freeBidType, embeddedBidType, freeBidPercent, embeddedBidPercent,
          adminFeeDiscount, insuranceEnabled, planModality,
          annualAdjustmentPercent,
          usedCreditForAsset, creditUsageMonth,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch (e) {
        logger.error('Erro ao salvar sessão do simulador', e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [input, contemplated, postContemplationChoice, contemplationMonth, freeBidType, embeddedBidType, freeBidPercent, embeddedBidPercent, adminFeeDiscount, insuranceEnabled, planModality, annualAdjustmentPercent, usedCreditForAsset, creditUsageMonth]);

  const restoreSession = useCallback(() => {
    if (!pendingRestore) return;
    setInput(pendingRestore.input);
    setContemplated(pendingRestore.contemplated);
    setPostContemplationChoice(pendingRestore.postContemplationChoice);
    setContemplationMonth(pendingRestore.contemplationMonth);
    setFreeBidType(pendingRestore.freeBidType);
    setEmbeddedBidType(pendingRestore.embeddedBidType);
    setFreeBidPercent(pendingRestore.freeBidPercent);
    setEmbeddedBidPercent(pendingRestore.embeddedBidPercent);
    setAdminFeeDiscount(pendingRestore.adminFeeDiscount);
    setInsuranceEnabled(pendingRestore.insuranceEnabled);
    setPlanModality(pendingRestore.planModality ?? 'tradicional');
    // Reajuste INPC sempre inicia desligado, mesmo ao restaurar sessão (opt-in explícito do usuário).
    setAnnualAdjustmentPercent(0);
    setUsedCreditForAsset(pendingRestore.usedCreditForAsset ?? false);
    {
      const term = Math.max(1, Math.floor(pendingRestore.input?.termMonths || 1));
      const raw = Math.max(1, Math.floor(pendingRestore.creditUsageMonth ?? 1));
      setCreditUsageMonthState(Math.min(term, raw));
    }
    setPendingRestore(null);
  }, [pendingRestore]);

  const dismissRestore = useCallback(() => {
    setPendingRestore(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Ref para acessar o planModality mais recente dentro de updateInput sem
  // recriar o callback (evita invalidar memoizações dos consumidores).
  const planModalityRef = useRef<PlanModality>('tradicional');
  useEffect(() => { planModalityRef.current = planModality; }, [planModality]);

  // Ref equivalente para os extras usados na normalização ao trocar tipo.
  const extrasRef = useRef({ freeBidPercent: 0, embeddedBidPercent: 0, adminFeeDiscount: 0, insuranceEnabled: false });
  useEffect(() => {
    extrasRef.current = { freeBidPercent, embeddedBidPercent, adminFeeDiscount, insuranceEnabled };
  }, [freeBidPercent, embeddedBidPercent, adminFeeDiscount, insuranceEnabled]);

  // Cache por tipo de consórcio: ao trocar tipo, salva snapshot atual e
  // restaura snapshot anterior (se existir). Garante continuidade de contexto
  // sem que o usuário precise reconfigurar tudo ao alternar entre tipos.
  type TypeSnapshot = {
    input: SimulationInput;
    planModality: PlanModality;
    extras: { freeBidPercent: number; embeddedBidPercent: number; adminFeeDiscount: number; insuranceEnabled: boolean };
  };
  const inputByTypeRef = useRef<Partial<Record<ConsortiumType, TypeSnapshot>>>(
    (() => {
      try {
        const raw = localStorage.getItem(INPUT_BY_TYPE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch {
        return {};
      }
    })()
  );

  const persistInputByType = useCallback(() => {
    try {
      localStorage.setItem(INPUT_BY_TYPE_KEY, JSON.stringify(inputByTypeRef.current));
    } catch {
      // ignore quota / serialization errors
    }
  }, []);

  // ── Update helpers ──
  const updateInput = useCallback(<K extends keyof SimulationInput>(key: K, value: SimulationInput[K]) => {
    // Onda Admin Fee Manual Governance:
    // `adminFeePercent` é estado totalmente explícito do usuário.
    // Não há side-effects (auto-apply / auto-recompute / "manually edited"
    // tracking) — qualquer alteração reflete intenção direta.
    // Troca de tipo de consórcio: salva snapshot atual, restaura cache do
    // novo tipo (se houver) e SEMPRE aplica normalização por segurança.
    if (key === 'consortiumType') {
      setInput((prev) => {
        const newType = value as ConsortiumType;
        const prevType = prev.consortiumType;

        // 1. Salva snapshot do tipo atual antes de sair
        if (prevType !== newType) {
          inputByTypeRef.current[prevType] = {
            input: prev,
            planModality: planModalityRef.current,
            extras: { ...extrasRef.current },
          };
          persistInputByType();
        }

        // 2. Tenta restaurar snapshot do novo tipo
        const cached = inputByTypeRef.current[newType];
        const baseInput = cached?.input ?? prev;
        const baseExtras = cached?.extras ?? {
          freeBidPercent: extrasRef.current.freeBidPercent,
          embeddedBidPercent: extrasRef.current.embeddedBidPercent,
          adminFeeDiscount: extrasRef.current.adminFeeDiscount,
          insuranceEnabled: extrasRef.current.insuranceEnabled,
        };
        const basePlanModality = cached?.planModality ?? planModalityRef.current;

        // 3. Normaliza SEMPRE (mesmo com cache) — garante consistência
        //    OBS: normalizeInputByConsortiumType NÃO altera adminFeePercent.
        const { updatedInput, updatedPlanModality, updatedExtras, changes } = normalizeInputByConsortiumType(
          baseInput,
          newType,
          basePlanModality,
          baseExtras,
        );

        // 4. Aplica setters apenas se houver diferença
        if (updatedPlanModality !== planModalityRef.current) setPlanModality(updatedPlanModality);
        if (updatedExtras.freeBidPercent !== extrasRef.current.freeBidPercent) setFreeBidPercent(updatedExtras.freeBidPercent);
        if (updatedExtras.embeddedBidPercent !== extrasRef.current.embeddedBidPercent) setEmbeddedBidPercent(updatedExtras.embeddedBidPercent);
        if (updatedExtras.adminFeeDiscount !== extrasRef.current.adminFeeDiscount) setAdminFeeDiscount(updatedExtras.adminFeeDiscount);
        if (updatedExtras.insuranceEnabled !== extrasRef.current.insuranceEnabled) setInsuranceEnabled(updatedExtras.insuranceEnabled);

        // 5. Feedback ao usuário
        const label = CONSORTIUM_TYPE_LABELS[newType];
        if (cached) toast.info(`Parâmetros restaurados para ${label}`);
        if (changes.length > 0) toast.info(`Ajustes aplicados: ${changes.join(' • ')}`);

        return updatedInput;
      });
      return;
    }
    setInput((prev) => ({ ...prev, [key]: value }));
  }, [persistInputByType]);

  // ── Admin fee: sem auto-suggest, sem auto-apply, sem auto-recompute ──
  // (Onda Admin Fee Manual Governance — 2026-05-13)

  const onReset = useCallback(() => {
    setInput(defaultSimulatorInput);
    setContemplated(false);
    setPostContemplationChoice('reduce-installment');
    setContemplationMonth(1);
    setFreeBidType('percent');
    setEmbeddedBidType('percent');
    setFreeBidPercent(0);
    setEmbeddedBidPercent(0);
    setAdminFeeDiscount(0);
    setInsuranceEnabled(false);
    setUsedCreditForAsset(false);
    setCreditUsageMonthState(1);
    setSuggestedBidFromStudy(null);
    // adminFeeManuallyEdited removido — taxa é estado explícito puro.
    setPlanModality('tradicional');
    setAnnualAdjustmentPercent(0);
    localStorage.removeItem(STORAGE_KEY);
    inputByTypeRef.current = {};
    try { localStorage.removeItem(INPUT_BY_TYPE_KEY); } catch { /* ignore */ }
  }, [persistInputByType]);

  // Reset modality if user switches to a type that doesn't support Flex
  useEffect(() => {
    if (!FLEX_AVAILABLE_TYPES.includes(input.consortiumType) && planModality !== 'tradicional') {
      setPlanModality('tradicional');
    }
  }, [input.consortiumType, planModality]);

  const applyBidFromStudy = useCallback((bidData: SuggestedBidFromStudy) => {
    setSuggestedBidFromStudy(bidData);
    if (bidData.hasEmbeddedBid && bidData.bidPercent <= bidData.embeddedBidMaxPercent) {
      setEmbeddedBidType('percent');
      setEmbeddedBidPercent(bidData.bidPercent);
    } else {
      setFreeBidType('percent');
      setFreeBidPercent(bidData.bidPercent);
    }
  }, []);

  const clearSuggestedBid = useCallback(() => {
    setSuggestedBidFromStudy(null);
  }, []);

  // ── Deferred inputs (Concurrent React) ──
  // Toda computação pesada (4× schedules de 240m + reconciliação) consome
  // versões *deferidas* dos primitivos. A digitação em creditValue/term/sliders
  // permanece instantânea no campo (estado síncrono), enquanto o React agenda
  // os recálculos em prioridade interrompível — eliminando jank perceptivo
  // em mobile/Citrix sem alterar matemática, engine ou outputs.
  const deferredInput = useDeferredValue(input);
  const deferredFreeBidPercent = useDeferredValue(freeBidPercent);
  const deferredEmbeddedBidPercent = useDeferredValue(embeddedBidPercent);
  const deferredAdminFeeDiscount = useDeferredValue(adminFeeDiscount);
  const deferredAnnualAdjustmentPercent = useDeferredValue(annualAdjustmentPercent);
  const deferredContemplationMonth = useDeferredValue(contemplationMonth);

  // ── Derived values ──
  const actualFreeBidValue = useMemo(
    () => freeBidType === 'percent' ? (deferredInput.creditValue * deferredFreeBidPercent) / 100 : deferredInput.freeBidValue,
    [freeBidType, deferredInput.creditValue, deferredFreeBidPercent, deferredInput.freeBidValue]
  );

  const actualEmbeddedBidValue = useMemo(
    () => embeddedBidType === 'percent' ? (deferredInput.creditValue * deferredEmbeddedBidPercent) / 100 : deferredInput.embeddedBidValue,
    [embeddedBidType, deferredInput.creditValue, deferredEmbeddedBidPercent, deferredInput.embeddedBidValue]
  );

  const effectiveAdminFeePercent = useMemo(
    () => Math.max(0, deferredInput.adminFeePercent - (deferredInput.adminFeePercent * deferredAdminFeeDiscount / 100)),
    [deferredInput.adminFeePercent, deferredAdminFeeDiscount]
  );

  // Prestamista é taxa FIXA institucional (canônica), diferenciada por
  // modalidade: imobiliário 0,04330% (taxa vigente da modalidade imobiliária),
  // veículos leves/pesados 0,07650% (taxa vigente da modalidade veículos).
  // Idade entra somente na elegibilidade (idade + prazo ≤ 80a).
  const prestamistaModality: 'real_estate' | 'vehicle_light' | 'vehicle_heavy' =
    deferredInput.consortiumType === 'imobiliario' ? 'real_estate'
    : deferredInput.consortiumType === 'pesados' ? 'vehicle_heavy'
    : 'vehicle_light';
  const mipRate = useMemo(
    () => getPrestamistaRate(undefined, prestamistaModality) * 100,
    [prestamistaModality]
  );

  // Cenário "utilização da carta": quando o cliente NÃO contratou o seguro
  // desde o início mas posteriormente utilizou a carta para aquisição de
  // bem, o Prestamista passa a ser obrigatório a partir do mês de
  // utilização. Para o motor isso equivale a um seguro "efetivo" ativo,
  // com `insuranceStartMonth = creditUsageMonth`.
  const usedCreditActive = !insuranceEnabled && usedCreditForAsset && contemplated;
  const effectiveInsuranceEnabled = insuranceEnabled || usedCreditActive;
  const insuranceStartMonth = insuranceEnabled
    ? 1
    : (usedCreditActive ? Math.min(deferredInput.termMonths, Math.max(1, creditUsageMonth)) : 1);
  const effectiveInsurancePercent = effectiveInsuranceEnabled ? mipRate : 0;
  // `effectiveMonthlyInsurance` (valor exibido) é DERIVADO da engine canônica
  // (`baseMonthlySchedule.totalInsurance / termMonths`) mais abaixo, após o
  // schedule ser calculado. Proibido cálculo paralelo aqui.

  // ─────────────────────────────────────────────────────────────────────
  // BASE — estrutura ORIGINAL do plano (sem contemplação, sem lance, sem
  // pós-lance). Mantém seguro, desconto adm e parcela reduzida (são traços
  // do plano contratado, não estratégia operacional). Card "Resultados da
  // Simulação" consome SEMPRE estes campos para ficar imune a toggles de
  // contemplação/lance.
  // ─────────────────────────────────────────────────────────────────────
  // BASE = estrutura ORIGINAL do plano. NÃO sofre leak do cenário
  // pós-contemplação `usedCreditForAsset` (esse afeta apenas o schedule
  // estratégico via `effectiveInsuranceEnabled`/`insuranceStartMonth`).
  // Aqui o seguro é gated exclusivamente pelo toggle RAW `insuranceEnabled`,
  // garantindo que tanto `insurancePercent` quanto `proponentAge` ficam
  // sincronizados — caso contrário o motor mantém o seguro aplicado mesmo
  // com o toggle desligado (bug histórico: card "Resultados da Simulação"
  // não respondia ao toggle quando `usedCreditForAsset + contemplated`
  // estavam ativos).
  const baseInsurancePercent = insuranceEnabled ? mipRate : 0;
  const baseMonthlySchedule = useMemo(() => {
    const simulationInput: SimulationInput = {
      ...deferredInput,
      adminFeePercent: effectiveAdminFeePercent,
      insurancePercent: baseInsurancePercent,
      proponentAge: insuranceEnabled ? deferredInput.proponentAge : 0,
      freeBidValue: 0,
      embeddedBidValue: 0,
    };
    return calculateMonthlySchedule({
      sim: simulationInput,
      contemplated: false,
      contemplationType: 'none',
      contemplationMonth: 0,
      postLanceChoice: 'reduce-installment',
      annualAdjustmentPercent: deferredAnnualAdjustmentPercent,
    });
  }, [
    deferredInput, effectiveAdminFeePercent, baseInsurancePercent, insuranceEnabled,
    deferredAnnualAdjustmentPercent,
  ]);

  // Valor mensal de seguro EXIBIDO — fonte única = engine canônica.
  // Média mensal real do schedule (totalInsurance / termMonths), garantindo
  // paridade byte-a-byte com PDF / motor mensal / Prestamista oficial.
  // Imobiliário usa rate 0,04330% sobre SDi = Carta + TA + FR.
  // Veículos usam 0,07650% sobre SDi com fator operacional por prazo.
  const effectiveMonthlyInsurance = useMemo(() => {
    if (!effectiveInsuranceEnabled) return 0;
    const term = deferredInput.termMonths || 1;
    return (baseMonthlySchedule.totalInsurance || 0) / term;
  }, [effectiveInsuranceEnabled, baseMonthlySchedule.totalInsurance, deferredInput.termMonths]);

  const baseResult = useMemo(() => {
    const simulationInput: SimulationInput = {
      ...deferredInput,
      adminFeePercent: effectiveAdminFeePercent,
      insurancePercent: baseInsurancePercent,
      proponentAge: insuranceEnabled ? deferredInput.proponentAge : 0,
      freeBidValue: 0,
      embeddedBidValue: 0,
    };
    const legacy = calculateSimulation(simulationInput, false, 'reduce-installment', 0);
    return reconcileWithSchedule(legacy, baseMonthlySchedule, deferredInput.termMonths, {
      creditValue: deferredInput.creditValue,
    });
  }, [deferredInput, effectiveAdminFeePercent, baseInsurancePercent, insuranceEnabled, baseMonthlySchedule]);

  // ── Schedule mensal (fonte da verdade financeira) ──
  // Calculado ANTES dos resultados agregados para que possam ser reconciliados.
  const monthlySchedule = useMemo(() => {
    // Redundancy Elimination: nominal scenario
    // Se não contemplado e sem lances, o schedule é idêntico ao BASE.
    const isNominal = !contemplated && actualFreeBidValue === 0 && actualEmbeddedBidValue === 0;
    if (isNominal && insuranceStartMonth === 1) {
      return baseMonthlySchedule;
    }

    const simulationInput: SimulationInput = {
      ...deferredInput,
      adminFeePercent: effectiveAdminFeePercent,
      insurancePercent: effectiveInsurancePercent,
      // Quando seguro está desligado, zerar proponentAge força o motor mensal
      // a usar a fallbackInsuranceRate (= insurancePercent/100 = 0).
      // Ver src/core/finance/internal/monthlySchedule.ts (useAgeBasedRate).
      proponentAge: effectiveInsuranceEnabled ? deferredInput.proponentAge : 0,
      freeBidValue: actualFreeBidValue,
      embeddedBidValue: actualEmbeddedBidValue,
    };
    const ct = deriveContemplationType(contemplated, actualFreeBidValue, actualEmbeddedBidValue);
    return calculateMonthlySchedule({
      sim: simulationInput,
      contemplated,
      contemplationType: ct,
      contemplationMonth: deferredContemplationMonth,
      postLanceChoice: postContemplationChoice === 'reduce-term' ? 'reduce-term' : 'reduce-installment',
      annualAdjustmentPercent: deferredAnnualAdjustmentPercent,
      insuranceStartMonth,
    });
  }, [
    deferredInput, effectiveAdminFeePercent, effectiveInsurancePercent, effectiveInsuranceEnabled,
    actualFreeBidValue, actualEmbeddedBidValue,
    contemplated, postContemplationChoice, deferredContemplationMonth, deferredAnnualAdjustmentPercent,
    insuranceStartMonth, baseMonthlySchedule
  ]);

  // Schedule sem o desconto na taxa de adm — base para resultWithoutDiscount.
  // Quando não há desconto, é matematicamente igual a `monthlySchedule` → reusa referência.
  const monthlyScheduleWithoutDiscount = useMemo(() => {
    if (deferredAdminFeeDiscount === 0) return monthlySchedule;
    
    const simulationInput: SimulationInput = {
      ...deferredInput,
      insurancePercent: effectiveInsurancePercent,
      proponentAge: effectiveInsuranceEnabled ? deferredInput.proponentAge : 0,
      freeBidValue: actualFreeBidValue,
      embeddedBidValue: actualEmbeddedBidValue,
    };
    const ct = deriveContemplationType(contemplated, actualFreeBidValue, actualEmbeddedBidValue);
    return calculateMonthlySchedule({
      sim: simulationInput,
      contemplated,
      contemplationType: ct,
      contemplationMonth: deferredContemplationMonth,
      postLanceChoice: postContemplationChoice === 'reduce-term' ? 'reduce-term' : 'reduce-installment',
      annualAdjustmentPercent: deferredAnnualAdjustmentPercent,
      insuranceStartMonth,
    });
  }, [
    deferredAdminFeeDiscount, monthlySchedule,
    deferredInput, effectiveInsurancePercent, effectiveInsuranceEnabled,
    actualFreeBidValue, actualEmbeddedBidValue,
    contemplated, postContemplationChoice, deferredContemplationMonth, deferredAnnualAdjustmentPercent,
    insuranceStartMonth,
  ]);

  // Cenários sorteio que o schedule não cobre 1:1 (ex.: keep-reduced-credit-adjusted)
  // → preserva installmentAfterContemplation do legado nessas situações.
  const isSorteioComplexScenario = contemplated &&
    deriveContemplationType(contemplated, actualFreeBidValue, actualEmbeddedBidValue) === 'sorteio' &&
    (postContemplationChoice === 'keep-reduced-credit-adjusted' ||
      postContemplationChoice === 'restore-installment-keep-credit');

  const result = useMemo(() => {
    // Redundancy Elimination: nominal scenario
    const isNominal = !contemplated && actualFreeBidValue === 0 && actualEmbeddedBidValue === 0;
    if (isNominal && postContemplationChoice === 'reduce-installment') {
      return baseResult;
    }

    const simulationInput: SimulationInput = {
      ...deferredInput,
      adminFeePercent: effectiveAdminFeePercent,
      insurancePercent: effectiveInsurancePercent,
      freeBidValue: actualFreeBidValue,
      embeddedBidValue: actualEmbeddedBidValue,
    };
    const legacy = calculateSimulation(simulationInput, contemplated, postContemplationChoice, deferredContemplationMonth);
    return reconcileWithSchedule(legacy, monthlySchedule, deferredInput.termMonths, {
      preserveContemplationInstallment: isSorteioComplexScenario,
      creditValue: deferredInput.creditValue,
    });
  }, [deferredInput, effectiveAdminFeePercent, effectiveInsurancePercent, actualFreeBidValue, actualEmbeddedBidValue, contemplated, postContemplationChoice, deferredContemplationMonth, monthlySchedule, isSorteioComplexScenario, baseResult]);

  // Quando não há desconto na taxa de adm, `resultWithoutDiscount` é matematicamente
  // idêntico a `result` — reusamos a referência e evitamos uma chamada adicional
  // de calculateSimulation + reconcileWithSchedule no hot path do simulador.
  const resultWithoutDiscount = useMemo(() => {
    if (deferredAdminFeeDiscount === 0) return result;
    const simulationInput: SimulationInput = {
      ...deferredInput,
      insurancePercent: effectiveInsurancePercent,
      freeBidValue: actualFreeBidValue,
      embeddedBidValue: actualEmbeddedBidValue,
    };
    const legacy = calculateSimulation(simulationInput, contemplated, postContemplationChoice, deferredContemplationMonth);
    return reconcileWithSchedule(legacy, monthlyScheduleWithoutDiscount, deferredInput.termMonths, {
      preserveContemplationInstallment: isSorteioComplexScenario,
      creditValue: deferredInput.creditValue,
    });
  }, [deferredAdminFeeDiscount, result, deferredInput, effectiveInsurancePercent, actualFreeBidValue, actualEmbeddedBidValue, contemplated, postContemplationChoice, deferredContemplationMonth, monthlyScheduleWithoutDiscount, isSorteioComplexScenario]);

  const maxReducedMonths = MAX_REDUCED_INSTALLMENT_MONTHS[input.consortiumType];
  const isValidSimulation = input.creditValue > 0 && input.termMonths > 0;



  // ── Validação atuarial idade + prazo ──
  // NÃO deferida: validação semântica precisa refletir input imediato p/ feedback.
  const ageTermValidation = useMemo(
    () => validateAgeAndTerm(input.proponentAge, input.termMonths),
    [input.proponentAge, input.termMonths]
  );

  // ── Elegibilidade canônica do Prestamista (fonte única) ──
  // NÃO deferida: hard-stop precisa reagir imediatamente para bloquear seguro.
  const prestamistaEligibility = useMemo<PrestamistaEligibilityResult>(
    () => validatePrestamistaEligibility({
      proponentAge: input.proponentAge || 0,
      termMonths: input.termMonths || 0,
      personType: 'PF',
    }),
    [input.proponentAge, input.termMonths]
  );

  // Auto-disable do seguro quando inelegível (transition guard).
  useEffect(() => {
    if (insuranceEnabled && !prestamistaEligibility.eligible) {
      setInsuranceEnabled(false);
    }
  }, [insuranceEnabled, prestamistaEligibility.eligible]);

  // Custo efetivo do cliente derivado do motor mensal (lance embutido NÃO é desembolso).
  const effectiveClientCost = useMemo(
    () => getEffectiveClientCost(monthlySchedule),
    [monthlySchedule]
  );

  // ─────────────────────────────────────────────────────────────────────
  // Persistência do SimSlice canônico (Single-Source-of-Truth Strategies).
  //
  // Wave 4 — Sim-slice Bridge Hardening (V2.4 LOCKED, arquitetura intacta):
  //   • Debounce de 160ms APENAS no write/dispatch (UI local não é afetada).
  //   • Bailout por fingerprint: snapshots idênticos não geram write/event.
  //   • Envelope versionado (schemaVersion/timestamp/origin/payload).
  //   • Flush síncrono no unmount (não perde último estado válido).
  //   • Estados inválidos: removeItem coalescido + bailout próprio.
  //
  // PDF off-screen / boot continuam síncronos via readSimSliceFromStorage();
  // o debounce só atrasa a propagação intra-tab para Wealth — Wealth recebe
  // o último snapshot estável em até ~160ms após o usuário parar de digitar.
  // ─────────────────────────────────────────────────────────────────────
  const bridgeFingerprintRef = useRef<string | null>(null);
  const bridgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bridgePendingRef = useRef<
    | { kind: 'write'; serialized: string; fingerprint: string }
    | { kind: 'clear' }
    | null
  >(null);

  const flushBridge = useCallback(() => {
    if (typeof window === 'undefined') return;
    const pending = bridgePendingRef.current;
    bridgePendingRef.current = null;
    if (bridgeTimerRef.current) {
      clearTimeout(bridgeTimerRef.current);
      bridgeTimerRef.current = null;
    }
    if (!pending) return;
    try {
      if (pending.kind === 'clear') {
        if (bridgeFingerprintRef.current === null) return; // já limpo
        window.localStorage.removeItem(STRATEGY_SIM_SLICE_STORAGE_KEY);
        bridgeFingerprintRef.current = null;
      } else {
        if (bridgeFingerprintRef.current === pending.fingerprint) return; // bailout
        window.localStorage.setItem(STRATEGY_SIM_SLICE_STORAGE_KEY, pending.serialized);
        bridgeFingerprintRef.current = pending.fingerprint;
      }
      window.dispatchEvent(new CustomEvent(SIM_SLICE_BRIDGE_EVENT));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (!isValidSimulation) {
        // Bailout: nada a fazer se já estava limpo e sem pending de write.
        if (bridgeFingerprintRef.current === null && bridgePendingRef.current?.kind !== 'write') {
          return;
        }
        bridgePendingRef.current = { kind: 'clear' };
      } else {
        const slice = buildSimSlice({
          creditValue: input.creditValue,
          consortiumType: input.consortiumType,
          termMonths: input.termMonths,
          adminFeePercent: input.adminFeePercent,
          adminFeeDiscountPercent: adminFeeDiscount,
          reserveFundPercent: input.reserveFundPercent,
          insuranceEnabled,
          insurancePercent: input.insurancePercent,
          annualAdjustmentPercent,
          embeddedBidPercent,
          freeBidPercent,
          contemplationMonth,
          effectiveAdminFeePercent,
          effectiveInsurancePercent,
          costPlan: baseMonthlySchedule.costPlan,
          totalInsurance: baseMonthlySchedule.totalInsurance,
          totalCost: baseResult.totalCost,
          fullInstallment: baseResult.fullInstallment,
          effectiveClientCost,
        });
        const { serialized, fingerprint } = serializeSimSliceEnvelope(slice);
        // Bailout de pendência: se o último fingerprint persistido bate
        // e não há clear pendente, nada a propagar.
        if (
          bridgeFingerprintRef.current === fingerprint &&
          bridgePendingRef.current?.kind !== 'clear'
        ) {
          return;
        }
        bridgePendingRef.current = { kind: 'write', serialized, fingerprint };
      }
      // Coalesce: cancela timer anterior e reagenda.
      if (bridgeTimerRef.current) clearTimeout(bridgeTimerRef.current);
      bridgeTimerRef.current = setTimeout(flushBridge, 160);
    } catch { /* ignore */ }
  }, [
    flushBridge,
    isValidSimulation,
    input.creditValue, input.consortiumType, input.termMonths,
    input.adminFeePercent, input.reserveFundPercent, input.insurancePercent,
    adminFeeDiscount, insuranceEnabled, annualAdjustmentPercent,
    embeddedBidPercent, freeBidPercent, contemplationMonth,
    effectiveAdminFeePercent, effectiveInsurancePercent,
    baseMonthlySchedule.costPlan, baseMonthlySchedule.totalInsurance, baseResult.totalCost, baseResult.fullInstallment,
    effectiveClientCost,
  ]);

  // Flush síncrono no unmount — garante que o último snapshot estável
  // seja persistido mesmo se o Provider desmontar antes do debounce.
  useEffect(() => () => { flushBridge(); }, [flushBridge]);




  // ── Memoized context value ──
  const contemplationType = useMemo(
    () => deriveContemplationType(contemplated, actualFreeBidValue, actualEmbeddedBidValue),
    [contemplated, actualFreeBidValue, actualEmbeddedBidValue]
  );

  // ── Sync postContemplationChoice when contemplationType changes ──
  useEffect(() => {
    if (contemplationType === 'sorteio') {
      // Only reset if current choice is invalid for sorteio
      if (postContemplationChoice !== 'keep-reduced-credit-adjusted' && postContemplationChoice !== 'restore-installment-keep-credit') {
        setPostContemplationChoice('keep-reduced-credit-adjusted');
      }
    } else if (contemplationType === 'lance') {
      // Only reset if current choice is invalid for lance
      if (postContemplationChoice !== 'reduce-installment' && postContemplationChoice !== 'reduce-term') {
        setPostContemplationChoice('reduce-installment');
      }
    }
  }, [contemplationType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Flex modality derivations (presentation only) ──
  const isFlexPlan = isFlexModality(planModality);
  const flexAvailable = FLEX_AVAILABLE_TYPES.includes(input.consortiumType);
  const semestralInstallment = result.fullInstallment * 6;
  const semestralReducedInstallment = result.reducedInstallmentValue * 6;
  const semestralRedilutedInstallment = result.redilutedInstallmentValue * 6;
  const initialEntrySemestres = isFlexPlan ? 1 : 0;

  // ── Input slice (muda a cada digitação) ──
  const inputValue = useMemo<SimulatorInputSlice>(() => ({
    input, updateInput,
    contemplated, setContemplated,
    postContemplationChoice, setPostContemplationChoice,
    contemplationMonth, setContemplationMonth,
    freeBidType, setFreeBidType,
    embeddedBidType, setEmbeddedBidType,
    freeBidPercent, setFreeBidPercent,
    embeddedBidPercent, setEmbeddedBidPercent,
    adminFeeDiscount, setAdminFeeDiscount,
    insuranceEnabled, setInsuranceEnabled,
    usedCreditForAsset, setUsedCreditForAsset,
    creditUsageMonth, setCreditUsageMonth,
    annualAdjustmentPercent, setAnnualAdjustmentPercent,
    planModality, setPlanModality,
    isFlexPlan, flexAvailable,
    maxReducedMonths, typeLabels: TYPE_LABELS,
    onReset, applyBidFromStudy, clearSuggestedBid, suggestedBidFromStudy,
    pendingRestore, restoreSession, dismissRestore,
  }), [
    input, updateInput,
    contemplated, postContemplationChoice, contemplationMonth,
    freeBidType, embeddedBidType, freeBidPercent, embeddedBidPercent,
    adminFeeDiscount, insuranceEnabled, usedCreditForAsset, creditUsageMonth,
    setCreditUsageMonth, annualAdjustmentPercent,
    planModality, isFlexPlan, flexAvailable,
    maxReducedMonths,
    onReset, applyBidFromStudy, clearSuggestedBid, suggestedBidFromStudy,
    pendingRestore, restoreSession, dismissRestore,
  ]);

  // ── Result slice (só muda quando o cálculo muda) ──
  const resultValue = useMemo<SimulatorResultSlice>(() => ({
    contemplationType,
    actualFreeBidValue, actualEmbeddedBidValue,
    effectiveAdminFeePercent, mipRate,
    effectiveInsurancePercent, effectiveMonthlyInsurance,
    result, resultWithoutDiscount,
    isValidSimulation,
    monthlySchedule, baseMonthlySchedule, baseResult,
    effectiveClientCost, ageTermValidation, prestamistaEligibility,
    semestralInstallment, semestralReducedInstallment, semestralRedilutedInstallment,
    initialEntrySemestres,
  }), [
    contemplationType,
    actualFreeBidValue, actualEmbeddedBidValue,
    effectiveAdminFeePercent, mipRate, effectiveInsurancePercent, effectiveMonthlyInsurance,
    result, resultWithoutDiscount, isValidSimulation,
    monthlySchedule, baseMonthlySchedule, baseResult,
    effectiveClientCost, ageTermValidation, prestamistaEligibility,
    semestralInstallment, semestralReducedInstallment, semestralRedilutedInstallment,
    initialEntrySemestres,
  ]);

  // ── Combined value (compatibilidade legada) ──
  const value = useMemo<SimulatorContextType>(() => ({
    ...inputValue,
    ...resultValue,
  }), [inputValue, resultValue]);

  return (
    <SimulatorContext.Provider value={value}>
      <SimulatorInputContext.Provider value={inputValue}>
        <SimulatorResultContext.Provider value={resultValue}>
          {children}
        </SimulatorResultContext.Provider>
      </SimulatorInputContext.Provider>
    </SimulatorContext.Provider>
  );
}
