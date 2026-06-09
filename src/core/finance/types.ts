/**
 * Tipos canônicos da fachada `core/finance`.
 *
 * Em Onda 0, re-exporta os tipos existentes. Em ondas futuras, este arquivo
 * pode introduzir tipos `FinanceInput` / `FinanceOutput` canônicos sem
 * quebrar o contrato atual.
 */

export type {
  SimulationInput,
  SimulationResult,
  ContemplationType,
  PostContemplationChoice,
  ConsortiumType,
} from '@/types/consortium';

export type {
  MonthlyScheduleInput,
  MonthlyScheduleResult,
  MonthlyRow,
} from './internal/monthlySchedule';
