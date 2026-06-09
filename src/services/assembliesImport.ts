/**
 * Cliente do edge `assemblies-import` — pipeline server-side institucional.
 *
 * Onda: Assemblies Enterprise Edge Pipeline.
 * Encapsula chamadas preview/commit/rollback e expõe leitura do histórico
 * (`assembly_imports`) sem repetir lógica de auth/headers.
 */
import { supabase } from '@/integrations/supabase/client';
import type { AssemblyRecord, ConsortiumType } from '@/types/consortium';

export interface DriftWarning {
  severity: 'info' | 'warn' | 'severe';
  groupNumber: number;
  assemblyMonth?: string;
  metric: string;
  message: string;
  before?: number;
  after?: number;
}

export interface DiffEntry {
  groupNumber: number;
  assemblyMonth: string;
  field: string;
  before: number;
  after: number;
  delta: number;
}

export interface DiffSummary {
  newRows: number;
  updatedRows: number;
  unchangedRows: number;
  prunedMonths: string[];
  affectedGroups: number[];
  affectedMonths: string[];
  changes: DiffEntry[];
}

export interface PreviewResponse {
  mode: 'preview';
  importToken: string;
  diff: DiffSummary;
  drift: DriftWarning[];
  canCommit: boolean;
}

export interface CommitResponse {
  mode: 'commit';
  importId: string;
  diff: DiffSummary;
  drift: DriftWarning[];
  durationMs: number;
}

export interface RollbackResponse {
  mode: 'rollback';
  importId: string;
  restoredRows: number;
  durationMs: number;
}

/**
 * Parse server-side report (Onda: Server-Side Parsing Canonicalization).
 * O navegador envia apenas payload bruto; toda interpretação é feita no edge.
 */
export interface ParseReport {
  parserVersion: string;
  kind: 'paste' | 'xlsx';
  totalRecords: number;
  totalSkipped: number;
  monthsDetected: string[];
  warnings: string[];
  sheets?: Array<{ name: string; records: number; skipped: number; headerRow: number; detectedMonths: string[] }>;
  durationMs: number;
  contentHash: string;
}

export interface ParseResponse {
  mode: 'parse';
  records: AssemblyRecord[];
  report: ParseReport;
}

export interface AssemblyImportRow {
  id: string;
  user_id: string;
  consortium_type: ConsortiumType;
  months: string[];
  rows_added: number;
  rows_updated: number;
  rows_pruned: number;
  diff_summary: DiffSummary;
  drift_warnings: DriftWarning[];
  status: 'committed' | 'rolled_back';
  rolled_back_at: string | null;
  rolled_back_by: string | null;
  created_at: string;
  parser_version: string | null;
  content_hash: string | null;
  duration_ms: number | null;
  import_token: string | null;
}

/** Converte AssemblyRecord (cliente) → payload edge (sem Date objetos). */
function toEdgeRecord(r: AssemblyRecord) {
  return {
    consortiumType: r.consortiumType,
    groupNumber: r.groupNumber,
    assemblyMonth: r.assemblyMonth,
    hasEmbeddedBid: r.hasEmbeddedBid,
    embeddedBidMaxPercent: r.embeddedBidMaxPercent,
    creditRange: r.creditRange ?? '',
    participants: r.participants,
    totalTerm: r.totalTerm,
    remainingTerm: r.remainingTerm,
    firstAssemblyDate: r.firstAssemblyDate ?? null,
    nextAssemblyDate: r.nextAssemblyDate ?? null,
    installmentDueDate: r.installmentDueDate ?? null,
    avgBid3Months: r.avgBid3Months,
    minBidLastAssembly: r.minBidLastAssembly,
    maxBidLastAssembly: r.maxBidLastAssembly,
    contemplationsBySorteio: r.contemplationsBySorteio,
    contemplationsByLanceLivre: r.contemplationsByLanceLivre,
    contemplationsByLanceFixo: r.contemplationsByLanceFixo,
    contemplationsByLance: r.contemplationsByLance,
    contemplationsLastAssembly: r.contemplationsLastAssembly,
    contemplationsCancelled: r.contemplationsCancelled,
    totalContemplations: r.totalContemplations,
    sorteio: r.sorteio,
    cancelled: r.cancelled,
    lanceFixo: r.lanceFixo,
    lanceLivre: r.lanceLivre,
    minBidPercentage: r.minBidPercentage,
    avgBidPercentage: r.avgBidPercentage,
    maxBidPercentage: r.maxBidPercentage,
  };
}

async function invoke<T>(body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke('assemblies-import', { body });
  if (error) throw error;
  return data as T;
}

export async function previewImport(
  consortiumType: ConsortiumType,
  records: AssemblyRecord[],
): Promise<PreviewResponse> {
  return invoke<PreviewResponse>({
    mode: 'preview',
    consortiumType,
    records: records.map(toEdgeRecord),
  });
}

export async function commitImport(
  consortiumType: ConsortiumType,
  records: AssemblyRecord[],
  importToken?: string,
  acknowledgedDriftWarnings = false,
  parserMeta?: { parserVersion?: string; contentHash?: string },
): Promise<CommitResponse> {
  return invoke<CommitResponse>({
    mode: 'commit',
    consortiumType,
    records: records.map(toEdgeRecord),
    importToken,
    acknowledgedDriftWarnings,
    parserVersion: parserMeta?.parserVersion,
    contentHash: parserMeta?.contentHash,
  });
}

export async function rollbackImport(importId: string): Promise<RollbackResponse> {
  return invoke<RollbackResponse>({ mode: 'rollback', importId });
}

export async function fetchImportHistory(limit = 30): Promise<AssemblyImportRow[]> {
  const { data, error } = await supabase
    .from('assembly_imports')
    .select('id, created_at, status, rows_added, rows_updated, rows_pruned, import_token, consortium_type')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as AssemblyImportRow[];
}

/**
 * parseSourceServer — Onda: Server-Side Parsing Canonicalization.
 * Envia payload bruto (texto colado ou xlsx em base64) e recebe `AssemblyRecord[]`
 * já normalizado pelo edge (`PARSER_VERSION`). Browser não interpreta dados.
 */
export async function parsePasteServer(
  text: string,
  consortiumType?: ConsortiumType,
): Promise<ParseResponse> {
  return invoke<ParseResponse>({
    mode: 'parse',
    kind: 'paste',
    payload: text,
    consortiumType,
  });
}

export async function parseXlsxServer(
  fileBase64: string,
  sheetFilter?: string,
): Promise<ParseResponse> {
  return invoke<ParseResponse>({
    mode: 'parse',
    kind: 'xlsx',
    payload: fileBase64,
    sheetFilter: sheetFilter ?? 'all',
  });
}

/** Converte File em base64 sem usar `atob`/buffers do browser. */
export async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}
