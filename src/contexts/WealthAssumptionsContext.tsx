/**
 * ════════════════════════════════════════════════════════════════════════════
 * WealthAssumptionsContext — premissas patrimoniais + slice da simulação
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Onda Single-Source-of-Truth Strategies:
 *   • `StrategyCalcContext` agora carrega um slice `sim` com o payload integral
 *     do Simulador (input + result reconciliado). Estratégias consomem este
 *     slice — não recalculam.
 *   • Premissas patrimoniais (CDI, yield, ágio, horizonte) permanecem
 *     editáveis pelo consultor e seguem a fonte canônica de `consortiumRates`.
 *   • O simSlice é populado pelo `StrategyLibrarySection` em runtime e
 *     persistido pelo `SimulatorContext` em `localStorage` para que PDFs
 *     off-screen (sem Provider montado) consigam ler a mesma operação.
 *
 * REGRAS DURAS
 *   • Sem defaults financeiros silenciosos. Sem fallback de operação.
 *   • Sem reconstrução de taxa/seguro/prazo fora do Simulador.
 *   • Se o consultor não simulou: `sim = null` e a UI gateia (não renderiza
 *     números). Sem inventar operação.
 * ════════════════════════════════════════════════════════════════════════════
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_CDI_RATE,
  DEFAULT_TERM_MONTHS,
} from '@/config/consortiumRates';
import { annualToMonthlyRate } from '@/core/finance';
import { readSimSlicePayload } from '@/utils/storage/simSliceBridge';
import { useDebouncedLocalStorage, useDebouncedLocalStorageString } from '@/utils/storage/throttledWriter';

export type TipoVendaCarta = 'carta-contemplada' | 'cota-nao-contemplada';

export interface WealthAssumptions {
  /** CDI nominal a.a. (%) — fonte canônica `DEFAULT_CDI_RATE`. */
  cdiRate: number;
  /** % do CDI praticado pela aplicação (110% = CDB líquido típico). */
  cdiPercent: number;
  /** Valorização anual estimada do ativo (% a.a.). Editorial — mercado. */
  propertyAppreciation: number;
  /** Yield locatício mensal (% a.m.). Editorial — cap rate de mercado. */
  rentalYield: number;
  /** Mês de contemplação assumido (1..analysisMonths). */
  contemplationMonth: number;
  /** Horizonte da análise patrimonial (meses). Default = imobiliário 200m. */
  analysisMonths: number;
  /** % recebido na venda da carta contemplada (ágio incluído). */
  agioOnSale: number;
  /** Deságio na venda de cota não contemplada (%). */
  discountOnSale: number;
  /** Modo de saída da carta. */
  tipoVendaCarta: TipoVendaCarta;
}

/** Defaults canônicos — alinhados ao Simulador (CDI 14,90% × 100%, 200m, contemplação 24). */
export const WEALTH_ASSUMPTIONS_DEFAULTS: WealthAssumptions = {
  cdiRate: DEFAULT_CDI_RATE,
  cdiPercent: 100,
  propertyAppreciation: 5,
  rentalYield: 0.5,
  contemplationMonth: 24,
  analysisMonths: DEFAULT_TERM_MONTHS.imobiliario, // 200
  agioOnSale: 25,
  discountOnSale: 10,
  tipoVendaCarta: 'carta-contemplada',
};

/** Presets consultivos — transparentes, auditáveis, semanticamente coerentes. */
export const WEALTH_PRESETS: Record<'conservador' | 'realista' | 'otimista', Partial<WealthAssumptions>> = {
  conservador: { cdiPercent: 100, propertyAppreciation: 3, rentalYield: 0.4, agioOnSale: 10 },
  realista:    { cdiPercent: 110, propertyAppreciation: 5, rentalYield: 0.5, agioOnSale: 25 },
  otimista:    { cdiPercent: 120, propertyAppreciation: 7, rentalYield: 0.7, agioOnSale: 40 },
};

export type WealthPresetKey = keyof typeof WEALTH_PRESETS;

/**
 * Slice canônico da simulação — SNAPSHOT IMUTÁVEL.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * TAXONOMIA OFICIAL (não mexer sem governança):
 * ────────────────────────────────────────────────────────────────────────────
 *   costPlan                  Soma do plano SEM seguro
 *                             ≡ baseMonthlySchedule.costPlan
 *                             ≡ crédito × (1 + adm efetiva + FR)
 *
 *   totalInsurance            Soma total do seguro prestamista (MIP)
 *                             ≡ Σ MIP mensal sobre saldo devedor
 *
 *   totalCost                 Soma total COM seguro
 *                             ≡ costPlan + totalInsurance
 *
 *   effectiveClientCost       Desembolso líquido do cliente
 *                             ≡ totalCost − (lance embutido + reduções)
 *                             Lance embutido NÃO é desembolso.
 *
 *   fullInstallment           Parcela cheia contratual canônica
 *                             ≡ (crédito + adm + FR + seguro) ÷ N
 *
 *   effectiveAdminFeePercent  Taxa adm efetiva após desconto comercial
 *                             ≡ adminFeePercent − adminFeeDiscountPercent
 *
 * REGRA CONSTITUCIONAL DO WEALTH:
 *   Nenhum módulo Wealth/Strategies pode derivar custo da operação
 *   diretamente do valor da carta (credit × taxa). Custos devem vir
 *   EXCLUSIVAMENTE de `ctx.sim.*` (este slice). Lint guard bloqueia
 *   `ADM_TOTAL`, `REF_*`, `PARCELA_FATOR` em `src/components/modules/wealth/**`.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Cópia READ-ONLY de `useSimulatorInput()` + `useSimulatorResult()`.
 * Persistido em `localStorage` pela `SimulatorContext` em
 * `STRATEGY_SIM_SLICE_STORAGE_KEY`. Removido quando a simulação volta a ser inválida.
 */
export interface SimSlice {
  readonly creditValue: number;
  readonly consortiumType: string;
  readonly termMonths: number;
  readonly adminFeePercent: number;
  readonly adminFeeDiscountPercent: number;
  readonly reserveFundPercent: number;
  readonly insuranceEnabled: boolean;
  readonly insurancePercent: number;
  readonly annualAdjustmentPercent: number;
  readonly embeddedBidPercent: number;
  readonly freeBidPercent: number;
  readonly contemplationMonth: number;
  readonly effectiveAdminFeePercent: number;
  readonly effectiveInsurancePercent: number;
  readonly costPlan: number;
  readonly totalInsurance: number;
  readonly totalCost: number;
  readonly fullInstallment: number;
  readonly effectiveClientCost: number;
}

export const STRATEGY_SIM_SLICE_STORAGE_KEY = 'strategy:sim-slice:v1';

/**
 * Factory CANÔNICA do SimSlice. Único ponto onde o objeto é construído.
 * Retorna snapshot congelado (`Object.freeze`) — imutável, serializável,
 * sem mutation lateral em consumers (Wealth/PDF/memo/persistência).
 */
export function buildSimSlice(args: SimSlice): SimSlice {
  return Object.freeze({ ...args });
}

/** Modalidade do SimSlice (deriva do consortiumType do simulador). */
export type SimSliceModality = 'imobiliario' | 'auto' | 'pesados';

export function simSliceModality(slice: SimSlice | null | undefined): SimSliceModality | null {
  if (!slice) return null;
  const t = String(slice.consortiumType ?? '').toLowerCase();
  if (t.includes('imob')) return 'imobiliario';
  if (t.includes('pesad')) return 'pesados';
  if (t.includes('auto') || t.includes('vei')) return 'auto';
  return null;
}

/**
 * Contexto derivado entregue às `calculations[].result(credit, ctx)`.
 * Inclui premissas patrimoniais editáveis + o slice canônico da simulação.
 * Quando `sim` é null/undefined, as estratégias renderizam "—" (gate
 * deve impedir esse caso em produção).
 */
export interface StrategyCalcContext {
  /** CDI nominal a.a. (proporção). */
  cdiAnnual: number;
  /** CDI bruto × % CDI (proporção). */
  cdiGrossAnnual: number;
  /** CDI líquido (após IR 15% longo prazo, proporção). */
  cdiAnnualLiq: number;
  /** CDI líquido equivalente mensal (proporção). */
  cdiMonthlyLiq: number;
  contemplationMonth: number;
  analysisMonths: number;
  /** Meses restantes de aplicação após contemplação. */
  monthsAfterContemplation: number;
  /** Valorização do ativo (proporção a.a.). */
  propertyAppreciation: number;
  /** Yield locatício mensal (proporção a.m.). */
  rentalYield: number;
  /** Ágio recebido na venda da carta contemplada (proporção). */
  agioOnSale: number;
  /** Deságio na venda de cota não contemplada (proporção). */
  discountOnSale: number;
  tipoVendaCarta: TipoVendaCarta;
  /**
   * Fonte ÚNICA da operação financeira. Quando null, a estratégia não tem
   * base matemática válida (gate de UI deve impedir esse caso em produção).
   */
  sim: SimSlice | null;
  /** Compat: parcela cheia canônica do Simulador (espelha sim?.fullInstallment). */
  fullInstallment?: number;
}

export function toCalcContext(a: WealthAssumptions, simSlice: SimSlice | null = null): StrategyCalcContext {
  const cdiAnnual = a.cdiRate / 100;
  const cdiGrossAnnual = cdiAnnual * (a.cdiPercent / 100);
  const cdiAnnualLiq = cdiGrossAnnual * (1 - 0.15); // IR 15% longo prazo
  const cdiMonthlyLiq = annualToMonthlyRate(cdiAnnualLiq);
  // ──────────────────────────────────────────────────────────────────────
  // SINGLE SOURCE OF TRUTH (Wealth Field Truth Pass):
  //   contemplationMonth e analysisMonths derivam EXCLUSIVAMENTE do
  //   Simulador (via simSlice). Os campos `a.contemplationMonth` /
  //   `a.analysisMonths` da WealthAssumptions são fallback exclusivo
  //   para PDFs off-screen quando o consultor ainda não simulou.
  //   Não há mais campo editável paralelo no AssumptionsCard.
  // ──────────────────────────────────────────────────────────────────────
  const contemplationMonth = simSlice?.contemplationMonth ?? a.contemplationMonth;
  const analysisMonths = simSlice?.termMonths ?? a.analysisMonths;
  const monthsAfterContemplation = Math.max(0, analysisMonths - contemplationMonth);
  return {
    cdiAnnual,
    cdiGrossAnnual,
    cdiAnnualLiq,
    cdiMonthlyLiq,
    contemplationMonth,
    analysisMonths,
    monthsAfterContemplation,
    propertyAppreciation: a.propertyAppreciation / 100,
    rentalYield: a.rentalYield / 100,
    agioOnSale: a.agioOnSale / 100,
    discountOnSale: a.discountOnSale / 100,
    tipoVendaCarta: a.tipoVendaCarta,
    sim: simSlice,
    fullInstallment: simSlice?.fullInstallment,
  };
}

interface Ctx {
  assumptions: WealthAssumptions;
  calcContext: StrategyCalcContext;
  setAssumption: <K extends keyof WealthAssumptions>(key: K, value: WealthAssumptions[K]) => void;
  applyPreset: (preset: WealthPresetKey) => void;
  reset: () => void;
  /** True quando o consultor alterou algo vs. defaults canônicos. */
  isDirty: boolean;
  /** Último preset aplicado (telemetria/UX). */
  activePreset: WealthPresetKey | null;
}

const WealthAssumptionsContext = createContext<Ctx | null>(null);

const STORAGE_KEY = 'wealth:assumptions:v1';
const PRESET_KEY = 'wealth:assumptions:preset:v1';

/**
 * Leitura standalone do simSlice (fora de React). Usada por PDF off-screen.
 * Retorna null se não houver simulação válida persistida.
 *
 * Wave 4 (Sim-slice Bridge Hardening):
 *   • Aceita envelope versionado { schemaVersion, timestamp, origin, payload }
 *     e o formato legado (payload raw) — back-compat total.
 *   • Assertions defensivas sobre shape/finitude dos campos numéricos.
 *   • Falha silenciosa → null. NUNCA lança (PDF off-screen tolerante).
 */
export function readSimSliceFromStorage(): SimSlice | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STRATEGY_SIM_SLICE_STORAGE_KEY);
    return readSimSlicePayload(raw);
  } catch {
    return null;
  }
}

/**
 * Leitura standalone do calcContext completo (premissas + sim slice).
 * Usada por módulos que precisam do contexto fora do Provider (PDF off-screen).
 */
export function readWealthCalcContextFromStorage(): StrategyCalcContext {
  return toCalcContext(loadStored().assumptions, readSimSliceFromStorage());
}

function loadStored(): { assumptions: WealthAssumptions; preset: WealthPresetKey | null } {
  if (typeof window === 'undefined') {
    return { assumptions: WEALTH_ASSUMPTIONS_DEFAULTS, preset: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const presetRaw = window.localStorage.getItem(PRESET_KEY) as WealthPresetKey | null;
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WealthAssumptions> & {
        contemplationMonth?: unknown;
        analysisMonths?: unknown;
      };
      // ────────────────────────────────────────────────────────────────────
      // Wave 1 Sanitize (defesa em profundidade, além de wave1Sanitize.ts):
      //   Os campos `contemplationMonth` e `analysisMonths` foram unificados
      //   com o Simulador (single source of truth). Snapshots antigos ainda
      //   podem trazer esses campos — ignoramos no merge para evitar que
      //   stale state contamine `WealthAssumptions`.
      // ────────────────────────────────────────────────────────────────────
      delete parsed.contemplationMonth;
      delete parsed.analysisMonths;
      return {
        assumptions: { ...WEALTH_ASSUMPTIONS_DEFAULTS, ...parsed },
        preset: presetRaw && presetRaw in WEALTH_PRESETS ? presetRaw : null,
      };
    }
  } catch { /* ignore */ }
  return { assumptions: WEALTH_ASSUMPTIONS_DEFAULTS, preset: null };
}

export function WealthAssumptionsProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(loadStored, []);
  const [assumptions, setAssumptions] = useState<WealthAssumptions>(initial.assumptions);
  const [activePreset, setActivePreset] = useState<WealthPresetKey | null>(initial.preset);

  // Wave 5 — Storage Write Throttling:
  //   Sliders/PercentInputs do Wealth disparam setAssumption a cada keystroke.
  //   Antes: 1 JSON.stringify + 1 localStorage.setItem por tecla.
  //   Agora: debounce 220ms + bailout por fingerprint + flush no unmount.
  //   UI local (state React) permanece instantânea — só a persistência espera.
  const persistAssumptions = useDebouncedLocalStorage<WealthAssumptions>(STORAGE_KEY);
  const persistPreset = useDebouncedLocalStorageString(PRESET_KEY);

  useEffect(() => { persistAssumptions(assumptions); }, [assumptions, persistAssumptions]);
  useEffect(() => { persistPreset(activePreset ?? null); }, [activePreset, persistPreset]);


  const setAssumption = useCallback(<K extends keyof WealthAssumptions>(key: K, value: WealthAssumptions[K]) => {
    setAssumptions((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null);
  }, []);

  const applyPreset = useCallback((preset: WealthPresetKey) => {
    setAssumptions((prev) => ({ ...prev, ...WEALTH_PRESETS[preset] }));
    setActivePreset(preset);
  }, []);

  const reset = useCallback(() => {
    setAssumptions(WEALTH_ASSUMPTIONS_DEFAULTS);
    setActivePreset(null);
  }, []);

  // calcContext base — injeta o simSlice canônico persistido pelo Simulador
  // (localStorage `strategy:sim-slice:v1`). Sem fallback: quando não há sim
  // válido, `sim` permanece null e o guard `!ctx?.sim` curto-circuita as
  // estratégias para "—". Reage a mudanças via evento 'storage' e a um
  // CustomEvent local 'wealth:sim-slice:changed' disparado pelo Simulador
  // no mesmo tab (storage events não disparam no tab que escreveu).
  const [persistedSim, setPersistedSim] = useState<SimSlice | null>(
    () => readSimSliceFromStorage(),
  );
  useEffect(() => {
    const refresh = () => {
      const next = readSimSliceFromStorage();
      setPersistedSim(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === STRATEGY_SIM_SLICE_STORAGE_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('wealth:sim-slice:changed', refresh as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('wealth:sim-slice:changed', refresh as EventListener);
    };
  }, []);

  const calcContext = useMemo(
    () => toCalcContext(assumptions, persistedSim),
    [assumptions, persistedSim],
  );

  const isDirty = useMemo(
    () => (Object.keys(WEALTH_ASSUMPTIONS_DEFAULTS) as (keyof WealthAssumptions)[])
      .some((k) => assumptions[k] !== WEALTH_ASSUMPTIONS_DEFAULTS[k]),
    [assumptions],
  );

  const value = useMemo<Ctx>(() => ({
    assumptions, calcContext, setAssumption, applyPreset, reset, isDirty, activePreset,
  }), [assumptions, calcContext, setAssumption, applyPreset, reset, isDirty, activePreset]);

  return (
    <WealthAssumptionsContext.Provider value={value}>
      {children}
    </WealthAssumptionsContext.Provider>
  );
}

export function useWealthAssumptions(): Ctx {
  const ctx = useContext(WealthAssumptionsContext);
  if (!ctx) throw new Error('useWealthAssumptions must be used within WealthAssumptionsProvider');
  return ctx;
}

/** Variante segura — retorna null fora do provider (usada por componentes
 *  que podem viver tanto dentro quanto fora do Wealth tree). */
export function useWealthAssumptionsSafe(): Ctx | null {
  return useContext(WealthAssumptionsContext);
}
