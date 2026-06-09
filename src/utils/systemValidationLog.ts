import type { ValidationCase, ValidationReport } from "@/utils/decisionEngine";

const STORAGE_KEY = "system_validation_logs";
const MAX_LOGS = 20;

export interface SystemValidationLog {
  timestamp: string; // ISO
  totalFailures: number;
  failures: ValidationCase[];
  context?: string;
}

function safeRead(): SystemValidationLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(logs: SystemValidationLog[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    /* quota / disabled storage — ignore */
  }
}

/** Lê histórico (mais recente primeiro). */
export function getValidationLogs(): SystemValidationLog[] {
  return safeRead();
}

/** Limpa todo o histórico. */
export function clearValidationLogs() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Registra um log apenas se report.ok === false.
 * Mantém no máximo MAX_LOGS registros (mais recentes primeiro).
 * Deduplica entradas idênticas consecutivas (mesmo conjunto de falhas) para
 * evitar poluir o histórico em re-renders.
 */
export function recordValidationFailure(
  report: ValidationReport,
  context?: string,
): SystemValidationLog | null {
  if (report.ok || report.failures.length === 0) return null;

  const logs = safeRead();
  const signature = report.failures.map((f) => f.name).join("|");
  const lastSignature = logs[0]?.failures.map((f) => f.name).join("|");
  if (signature === lastSignature && logs[0]?.context === context) {
    return logs[0]; // mesma falha já registrada por último
  }

  const entry: SystemValidationLog = {
    timestamp: new Date().toISOString(),
    totalFailures: report.failures.length,
    failures: report.failures,
    context,
  };

  const next = [entry, ...logs].slice(0, MAX_LOGS);
  safeWrite(next);
  return entry;
}
