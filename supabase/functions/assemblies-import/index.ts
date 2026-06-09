/**
 * assemblies-import — Edge function institucional do pipeline de assembleias.
 *
 * Onda: Assemblies Enterprise Edge Pipeline.
 *
 * Modos:
 *  - preview:  diff + drift warnings, sem mutação. Retorna importToken.
 *  - commit:   snapshot + upsert + pruning, registra em assembly_imports.
 *  - rollback: restaura snapshot de um assembly_imports.id, marca rolled_back.
 *
 * Camada canônica: groups + assembly_results. NUNCA escreve em `assemblies` (frozen).
 *
 * Segurança:
 *  - Exige Authorization Bearer. Valida via getClaims.
 *  - Exige role admin (RLS faz a defesa em profundidade; aqui falha cedo).
 *  - Valida payload com Zod (records limitados a 5000/lote).
 *  - Anti-corruption: discard de números absurdos, percentuais > 100, etc.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';
import * as XLSX from 'npm:xlsx@0.18.5';
import { authenticateAdmin } from '../_shared/auth.ts';

const PARSER_VERSION = 'svr-parser-1.0.0';
const MAX_PASTE_BYTES = 5 * 1024 * 1024;     // 5 MB
const MAX_XLSX_BYTES = 12 * 1024 * 1024;     // 12 MB

// ─── Constantes ──────────────────────────────────────────────────────────
const MAX_MONTHS_TO_KEEP = 7;
const MAX_RECORDS_PER_REQUEST = 5000;

// ─── Tipos ───────────────────────────────────────────────────────────────
const RecordSchema = z.object({
  consortiumType: z.enum(['imobiliario', 'auto', 'pesados']),
  groupNumber: z.number().int().positive(),
  assemblyMonth: z.string().regex(/^\d{4}-\d{2}$/, 'assemblyMonth deve ser YYYY-MM'),
  hasEmbeddedBid: z.boolean().default(false),
  embeddedBidMaxPercent: z.number().min(0).max(100).default(0),
  creditRange: z.string().default(''),
  participants: z.number().min(0).max(100000).default(0),
  totalTerm: z.number().min(0).max(500).default(0),
  remainingTerm: z.number().min(0).max(500).default(0),
  firstAssemblyDate: z.string().nullable().optional(),
  nextAssemblyDate: z.string().nullable().optional(),
  installmentDueDate: z.string().nullable().optional(),
  avgBid3Months: z.number().min(0).max(100).default(0),
  minBidLastAssembly: z.number().min(0).max(100).default(0),
  maxBidLastAssembly: z.number().min(0).max(100).default(0),
  contemplationsBySorteio: z.number().min(0).default(0),
  contemplationsByLanceLivre: z.number().min(0).default(0),
  contemplationsByLanceFixo: z.number().min(0).default(0),
  contemplationsByLance: z.number().min(0).default(0),
  contemplationsLastAssembly: z.number().min(0).default(0),
  contemplationsCancelled: z.number().min(0).default(0),
  totalContemplations: z.number().min(0).default(0),
  sorteio: z.number().min(0).default(0),
  cancelled: z.number().min(0).default(0),
  lanceFixo: z.number().min(0).default(0),
  lanceLivre: z.number().min(0).default(0),
  minBidPercentage: z.number().min(0).max(100).default(0),
  avgBidPercentage: z.number().min(0).max(100).default(0),
  maxBidPercentage: z.number().min(0).max(100).default(0),
});

type AssemblyRec = z.infer<typeof RecordSchema>;

const PreviewSchema = z.object({
  mode: z.literal('preview'),
  consortiumType: z.enum(['imobiliario', 'auto', 'pesados']),
  records: z.array(RecordSchema).min(1).max(MAX_RECORDS_PER_REQUEST),
});

const CommitSchema = z.object({
  mode: z.literal('commit'),
  consortiumType: z.enum(['imobiliario', 'auto', 'pesados']),
  records: z.array(RecordSchema).min(1).max(MAX_RECORDS_PER_REQUEST),
  importToken: z.string().uuid().optional(),
  acknowledgedDriftWarnings: z.boolean().optional().default(false),
  // Onda Institutional History: rastreabilidade do parser usado.
  parserVersion: z.string().min(1).max(64).optional(),
  contentHash: z.string().min(1).max(128).optional(),
});

const RollbackSchema = z.object({
  mode: z.literal('rollback'),
  importId: z.string().uuid(),
});

const ParseSchema = z.object({
  mode: z.literal('parse'),
  kind: z.enum(['paste', 'xlsx']),
  // For paste: raw tab-separated text. For xlsx: base64 file body.
  payload: z.string().min(1),
  consortiumType: z.enum(['imobiliario', 'auto', 'pesados']).optional(),
  sheetFilter: z.string().optional(),
});

const BodySchema = z.discriminatedUnion('mode', [
  ParseSchema, PreviewSchema, CommitSchema, RollbackSchema,
]);

// ─── Helpers ─────────────────────────────────────────────────────────────
function parseAssemblyMonth(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, 1).getTime();
}

function uniqMonths(records: AssemblyRec[]): string[] {
  return [...new Set(records.map(r => r.assemblyMonth))].sort(
    (a, b) => parseAssemblyMonth(a) - parseAssemblyMonth(b),
  );
}

function recordKey(r: { groupNumber: number; assemblyMonth: string }): string {
  return `${r.groupNumber}:${r.assemblyMonth}`;
}

interface ExistingRow {
  id: string;
  group_id: string;
  group_number: number;
  assembly_month: string;
  avg_bid_3_months: number;
  min_bid_last_assembly: number;
  max_bid_last_assembly: number;
  participants: number;
  raw: Record<string, unknown>;
}

async function fetchExistingForType(
  admin: ReturnType<typeof createClient>,
  userId: string,
  consortiumType: string,
): Promise<ExistingRow[]> {
  const { data: groups, error: gErr } = await admin
    .from('groups')
    .select('id, group_number, participants')
    .eq('user_id', userId)
    .eq('consortium_type', consortiumType);
  if (gErr) throw gErr;
  if (!groups || groups.length === 0) return [];

  const groupIds = groups.map((g: { id: string }) => g.id);
  const groupMeta = new Map<string, { number: number; participants: number }>();
  for (const g of groups as { id: string; group_number: number; participants: number }[]) {
    groupMeta.set(g.id, { number: g.group_number, participants: g.participants });
  }

  const out: ExistingRow[] = [];
  // Paginate
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await admin
      .from('assembly_results')
      .select('*')
      .in('group_id', groupIds)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const row of data as Record<string, unknown>[]) {
      const meta = groupMeta.get(row.group_id as string);
      if (!meta) continue;
      out.push({
        id: row.id as string,
        group_id: row.group_id as string,
        group_number: meta.number,
        assembly_month: row.assembly_month as string,
        avg_bid_3_months: Number(row.avg_bid_3_months ?? 0),
        min_bid_last_assembly: Number(row.min_bid_last_assembly ?? 0),
        max_bid_last_assembly: Number(row.max_bid_last_assembly ?? 0),
        participants: meta.participants,
        raw: row,
      });
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

// ─── Diff ────────────────────────────────────────────────────────────────
interface DiffEntry {
  groupNumber: number;
  assemblyMonth: string;
  field: string;
  before: number;
  after: number;
  delta: number;
}

interface DiffSummary {
  newRows: number;
  updatedRows: number;
  unchangedRows: number;
  prunedMonths: string[];
  affectedGroups: number[];
  affectedMonths: string[];
  changes: DiffEntry[]; // limitado a 200 itens
}

function computeDiff(
  consortiumType: string,
  incoming: AssemblyRec[],
  existing: ExistingRow[],
): DiffSummary {
  const existingMap = new Map<string, ExistingRow>();
  for (const e of existing) existingMap.set(recordKey(e), e);

  let newRows = 0;
  let updatedRows = 0;
  let unchangedRows = 0;
  const changes: DiffEntry[] = [];
  const groupSet = new Set<number>();
  const monthSet = new Set<string>();

  for (const rec of incoming) {
    groupSet.add(rec.groupNumber);
    monthSet.add(rec.assemblyMonth);
    const e = existingMap.get(recordKey(rec));
    if (!e) {
      newRows++;
      continue;
    }
    const fields: Array<[string, number, number]> = [
      ['avg_bid_3_months', e.avg_bid_3_months, rec.avgBid3Months],
      ['min_bid_last_assembly', e.min_bid_last_assembly, rec.minBidLastAssembly],
      ['max_bid_last_assembly', e.max_bid_last_assembly, rec.maxBidLastAssembly],
      ['participants', e.participants, rec.participants],
    ];
    let touched = false;
    for (const [field, before, after] of fields) {
      if (Math.abs(after - before) > 0.001) {
        touched = true;
        if (changes.length < 200) {
          changes.push({
            groupNumber: rec.groupNumber,
            assemblyMonth: rec.assemblyMonth,
            field,
            before,
            after,
            delta: after - before,
          });
        }
      }
    }
    if (touched) updatedRows++;
    else unchangedRows++;
  }

  // Pruning (manter MAX_MONTHS_TO_KEEP mais recentes do tipo após o merge)
  const allMonths = new Set<string>(monthSet);
  for (const e of existing) allMonths.add(e.assembly_month);
  const sortedMonths = [...allMonths].sort(
    (a, b) => parseAssemblyMonth(b) - parseAssemblyMonth(a),
  );
  const prunedMonths = sortedMonths.slice(MAX_MONTHS_TO_KEEP);

  return {
    newRows,
    updatedRows,
    unchangedRows,
    prunedMonths,
    affectedGroups: [...groupSet].sort((a, b) => a - b),
    affectedMonths: [...monthSet].sort(),
    changes,
  };
}

// ─── Anti-drift ──────────────────────────────────────────────────────────
interface DriftWarning {
  severity: 'info' | 'warn' | 'severe';
  groupNumber: number;
  assemblyMonth?: string;
  metric: string;
  message: string;
  before?: number;
  after?: number;
}

function detectDrift(incoming: AssemblyRec[], existing: ExistingRow[]): DriftWarning[] {
  const warnings: DriftWarning[] = [];
  const byGroup = new Map<number, ExistingRow[]>();
  for (const e of existing) {
    const arr = byGroup.get(e.group_number) ?? [];
    arr.push(e);
    byGroup.set(e.group_number, arr);
  }

  for (const rec of incoming) {
    const hist = byGroup.get(rec.groupNumber) ?? [];
    if (hist.length < 2) continue;

    const avgs = hist.map(h => h.avg_bid_3_months).filter(v => v > 0);
    if (avgs.length >= 2) {
      const mean = avgs.reduce((s, v) => s + v, 0) / avgs.length;
      const variance =
        avgs.reduce((s, v) => s + (v - mean) ** 2, 0) / avgs.length;
      const std = Math.sqrt(variance);
      const z = std > 0 ? Math.abs(rec.avgBid3Months - mean) / std : 0;

      if (z > 3 && Math.abs(rec.avgBid3Months - mean) > 5) {
        warnings.push({
          severity: 'severe',
          groupNumber: rec.groupNumber,
          assemblyMonth: rec.assemblyMonth,
          metric: 'avg_bid_3_months',
          message: `Variação severa (z=${z.toFixed(1)}) — média ${rec.avgBid3Months.toFixed(1)}% vs histórico ${mean.toFixed(1)}%`,
          before: mean,
          after: rec.avgBid3Months,
        });
      } else if (z > 2 && Math.abs(rec.avgBid3Months - mean) > 3) {
        warnings.push({
          severity: 'warn',
          groupNumber: rec.groupNumber,
          assemblyMonth: rec.assemblyMonth,
          metric: 'avg_bid_3_months',
          message: `Variação atípica (z=${z.toFixed(1)}) — média ${rec.avgBid3Months.toFixed(1)}% vs histórico ${mean.toFixed(1)}%`,
          before: mean,
          after: rec.avgBid3Months,
        });
      }
    }

    // Participantes coerência
    const lastParticipants = hist[hist.length - 1]?.participants ?? 0;
    if (lastParticipants > 0 && rec.participants > 0) {
      const delta = Math.abs(rec.participants - lastParticipants) / lastParticipants;
      if (delta > 0.5) {
        warnings.push({
          severity: 'warn',
          groupNumber: rec.groupNumber,
          assemblyMonth: rec.assemblyMonth,
          metric: 'participants',
          message: `Participantes variaram ${(delta * 100).toFixed(0)}% (${lastParticipants} → ${rec.participants})`,
          before: lastParticipants,
          after: rec.participants,
        });
      }
    }

    // Sanidade: max < min
    if (rec.maxBidLastAssembly > 0 && rec.minBidLastAssembly > rec.maxBidLastAssembly) {
      warnings.push({
        severity: 'severe',
        groupNumber: rec.groupNumber,
        assemblyMonth: rec.assemblyMonth,
        metric: 'min_max_bid',
        message: `Min (${rec.minBidLastAssembly}) > Max (${rec.maxBidLastAssembly})`,
      });
    }
  }

  return warnings.slice(0, 100);
}

// ─── Persistência ────────────────────────────────────────────────────────
async function upsertGroupsAndResults(
  admin: ReturnType<typeof createClient>,
  userId: string,
  consortiumType: string,
  records: AssemblyRec[],
) {
  // 1. groups upsert (1 por grupo, usar registro mais recente)
  const groupMap = new Map<number, AssemblyRec>();
  for (const r of records) {
    const cur = groupMap.get(r.groupNumber);
    if (!cur || parseAssemblyMonth(r.assemblyMonth) > parseAssemblyMonth(cur.assemblyMonth)) {
      groupMap.set(r.groupNumber, r);
    }
  }

  const groupRows = [...groupMap.values()].map(r => ({
    user_id: userId,
    consortium_type: consortiumType,
    group_number: r.groupNumber,
    total_term: r.totalTerm,
    remaining_term: r.remainingTerm,
    participants: r.participants,
    has_embedded_bid: r.hasEmbeddedBid,
    embedded_bid_max_percent: r.embeddedBidMaxPercent,
    first_assembly_date: r.firstAssemblyDate ?? null,
    next_assembly_date: r.nextAssemblyDate ?? null,
    installment_due_date: r.installmentDueDate ?? null,
  }));

  const chunkSize = 200;
  for (let i = 0; i < groupRows.length; i += chunkSize) {
    const { error } = await admin
      .from('groups')
      .upsert(groupRows.slice(i, i + chunkSize), {
        onConflict: 'user_id,consortium_type,group_number',
      });
    if (error) throw error;
  }

  // 2. fetch group_id mapping
  const { data: groupsData, error: gErr } = await admin
    .from('groups')
    .select('id, group_number')
    .eq('user_id', userId)
    .eq('consortium_type', consortiumType);
  if (gErr) throw gErr;

  const idMap = new Map<number, string>();
  for (const g of (groupsData ?? []) as { id: string; group_number: number }[]) {
    idMap.set(g.group_number, g.id);
  }

  // 3. assembly_results upsert
  const resultRows = records.map(r => {
    const gid = idMap.get(r.groupNumber);
    if (!gid) throw new Error(`group_id missing for ${r.groupNumber}`);
    return {
      group_id: gid,
      assembly_month: r.assemblyMonth,
      assembly_date: new Date(parseAssemblyMonth(r.assemblyMonth)).toISOString(),
      credit_range: r.creditRange,
      avg_bid_3_months: r.avgBid3Months,
      min_bid_last_assembly: r.minBidLastAssembly,
      max_bid_last_assembly: r.maxBidLastAssembly,
      contemplations_by_sorteio: r.contemplationsBySorteio,
      contemplations_by_lance_livre: r.contemplationsByLanceLivre,
      contemplations_by_lance_fixo: r.contemplationsByLanceFixo,
      contemplations_by_lance: r.contemplationsByLance,
      contemplations_last_assembly: r.contemplationsLastAssembly,
      contemplations_cancelled: r.contemplationsCancelled,
      total_contemplations: r.totalContemplations,
      sorteio: r.sorteio,
      cancelled: r.cancelled,
      lance_fixo: r.lanceFixo,
      lance_livre: r.lanceLivre,
      min_bid_percentage: r.minBidPercentage,
      avg_bid_percentage: r.avgBidPercentage,
      max_bid_percentage: r.maxBidPercentage,
    };
  });

  for (let i = 0; i < resultRows.length; i += chunkSize) {
    const { error } = await admin
      .from('assembly_results')
      .upsert(resultRows.slice(i, i + chunkSize), { onConflict: 'group_id,assembly_month' });
    if (error) throw error;
  }
}

async function pruneOldMonths(
  admin: ReturnType<typeof createClient>,
  userId: string,
  consortiumType: string,
  monthsToDrop: string[],
) {
  if (monthsToDrop.length === 0) return;
  const { data: groups } = await admin
    .from('groups').select('id')
    .eq('user_id', userId).eq('consortium_type', consortiumType);
  const groupIds = (groups ?? []).map((g: { id: string }) => g.id);
  if (groupIds.length === 0) return;
  await admin.from('assembly_results').delete()
    .in('group_id', groupIds).in('assembly_month', monthsToDrop);
}

// ─── Server-side canonical parser ────────────────────────────────────────
//
// Onda: Server-Side Parsing Canonicalization. Browser deixa de interpretar
// dados operacionais — envia apenas payload bruto (texto colado ou xlsx
// base64). Toda normalização (mês, percentual, número, faixas, lance
// embutido) acontece aqui, com versionamento (`PARSER_VERSION`) e relatório
// (`ParseReport`) para auditoria/observabilidade.

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0, janeiro: 0,
  fev: 1, feb: 1, february: 1, fevereiro: 1,
  mar: 2, march: 2, marco: 2, 'março': 2,
  abr: 3, apr: 3, april: 3, abril: 3,
  mai: 4, may: 4, maio: 4,
  jun: 5, june: 5, junho: 5,
  jul: 6, july: 6, julho: 6,
  ago: 7, aug: 7, august: 7, agosto: 7,
  set: 8, sep: 8, september: 8, setembro: 8,
  out: 9, oct: 9, october: 9, outubro: 9,
  nov: 10, november: 10, novembro: 10,
  dez: 11, dec: 11, december: 11, dezembro: 11,
};

const EMBEDDED_BID_MAX: Record<string, number> = {
  imobiliario: 50,
  auto: 30,
  pesados: 30,
};

interface ParseReport {
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

function stripAccents(v: string): string {
  return v.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function srvNormalizeMonth(raw: string, fallbackYear?: number): string | null {
  const value = (raw ?? '').trim();
  if (!value) return null;
  const normalized = stripAccents(value).toLowerCase();

  const iso = normalized.match(/^(\d{4})[-/](\d{1,2})$/);
  if (iso) {
    const y = Number(iso[1]); const m = Number(iso[2]);
    if (m >= 1 && m <= 12) return `${y}-${String(m).padStart(2, '0')}`;
  }
  const my = normalized.match(/^(\d{1,2})[-/](\d{4})$/);
  if (my) {
    const m = Number(my[1]); const y = Number(my[2]);
    if (m >= 1 && m <= 12) return `${y}-${String(m).padStart(2, '0')}`;
  }
  const txt = normalized.match(/^([a-z]{3,12})[\s\-/]+(\d{2,4})$/);
  if (txt) {
    const mi = MONTH_MAP[txt[1]];
    if (mi !== undefined) {
      const ry = Number(txt[2]);
      const y = ry < 100 ? 2000 + ry : ry;
      return `${y}-${String(mi + 1).padStart(2, '0')}`;
    }
  }
  const mi = MONTH_MAP[normalized];
  if (mi !== undefined && fallbackYear) {
    return `${fallbackYear}-${String(mi + 1).padStart(2, '0')}`;
  }
  return null;
}

function srvParseNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const str = String(val).trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
}

function srvParsePercent(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    if (val < 0) return 0;
    return val < 1 && val > 0 ? val * 100 : val;
  }
  const s = String(val);
  const cleaned = s.replace('%', '').replace(',', '.').trim();
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return 0;
  if (s.includes('%')) return n;
  return n < 1 && n > 0 ? n * 100 : n;
}

function srvConsortiumByGroup(g: number): 'imobiliario' | 'auto' | 'pesados' | null {
  if (g >= 10001 && g <= 19999) return 'imobiliario';
  if (g >= 30001 && g <= 39999) return 'auto';
  if (g >= 40001 && g <= 49999) return 'pesados';
  return null;
}

function srvEmbeddedBid(val: unknown, type: string): { hasEmbeddedBid: boolean; embeddedBidMaxPercent: number } {
  const max = EMBEDDED_BID_MAX[type] ?? 0;
  if (val === null || val === undefined || val === '') return { hasEmbeddedBid: false, embeddedBidMaxPercent: 0 };
  if (typeof val === 'number') {
    const c = Math.min(val, max);
    return { hasEmbeddedBid: c > 0, embeddedBidMaxPercent: c };
  }
  const s = String(val).toLowerCase().trim();
  if (s === 'sim' || s === 'yes') return { hasEmbeddedBid: true, embeddedBidMaxPercent: max };
  if (s === 'não' || s === 'nao' || s === 'no') return { hasEmbeddedBid: false, embeddedBidMaxPercent: 0 };
  const n = srvParseNum(val);
  const c = Math.min(n, max);
  return { hasEmbeddedBid: c > 0, embeddedBidMaxPercent: c };
}

function srvSanitize(s: string): string {
  // Remove control characters; cap length.
  return (s ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, 500);
}

async function srvHash(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function buildRecord(
  type: 'imobiliario' | 'auto' | 'pesados',
  groupNumber: number,
  monthStr: string,
  cols: Array<unknown>,
): AssemblyRec {
  // Columns aligned with Brazilian paste/xlsx layout (0-indexed):
  // 0:month 1:group 2:embedded 3:credit 4:participants 5:totalTerm 6:remainingTerm
  // 7:firstAssembly 8:nextAssembly 9:installmentDue 10:avgBid3 11:minBid 12:maxBid
  // 13:sorteio 14:cancelled 15:lanceFixo 16:lanceLivre 17:totalContemp
  // 18:contempSorteio 19:contempExclu 20:contempLanceLivre 21:contempLanceFixo 22:contempUlt
  const eb = srvEmbeddedBid(cols[2], type);
  const avg = srvParsePercent(cols[10]);
  const min = srvParsePercent(cols[11]);
  const max = srvParsePercent(cols[12]);
  return {
    consortiumType: type,
    groupNumber,
    assemblyMonth: monthStr,
    hasEmbeddedBid: eb.hasEmbeddedBid,
    embeddedBidMaxPercent: eb.embeddedBidMaxPercent,
    creditRange: srvSanitize(String(cols[3] ?? '').trim()),
    participants: srvParseNum(cols[4]),
    totalTerm: srvParseNum(cols[5]),
    remainingTerm: srvParseNum(cols[6]),
    firstAssemblyDate: cols[7] ? String(cols[7]).trim() : null,
    nextAssemblyDate: cols[8] ? String(cols[8]).trim() : null,
    installmentDueDate: cols[9] ? String(cols[9]).trim() : null,
    avgBid3Months: avg,
    minBidLastAssembly: min,
    maxBidLastAssembly: max,
    sorteio: srvParseNum(cols[13]),
    cancelled: srvParseNum(cols[14]),
    lanceFixo: srvParseNum(cols[15]),
    lanceLivre: srvParseNum(cols[16]),
    totalContemplations: srvParseNum(cols[17]),
    contemplationsBySorteio: srvParseNum(cols[18]),
    contemplationsCancelled: srvParseNum(cols[19]),
    contemplationsByLanceLivre: srvParseNum(cols[20]),
    contemplationsByLanceFixo: srvParseNum(cols[21]),
    contemplationsLastAssembly: srvParseNum(cols[22]),
    contemplationsByLance: srvParseNum(cols[20]) + srvParseNum(cols[21]),
    minBidPercentage: min,
    avgBidPercentage: avg,
    maxBidPercentage: max,
  };
}

function parsePasteServer(text: string, fallbackType?: 'imobiliario' | 'auto' | 'pesados'): { records: AssemblyRec[]; warnings: string[]; skipped: number } {
  const lines = text.replace(/\r/g, '').split('\n');
  const records: AssemblyRec[] = [];
  const warnings: string[] = [];
  let skipped = 0;

  for (const line of lines) {
    if (!line.trim()) { skipped++; continue; }
    const cols = line.split('\t');
    if (cols.length < 13 || /grupo|informa[cç][aã]o|m[eê]s/i.test(cols[0] ?? '')) {
      skipped++; continue;
    }
    const monthStr = srvNormalizeMonth(String(cols[0] ?? '').trim());
    if (!monthStr) { skipped++; continue; }
    const groupNumber = parseInt(String(cols[1] ?? ''), 10);
    if (!Number.isFinite(groupNumber)) { skipped++; continue; }

    const inferred = srvConsortiumByGroup(groupNumber);
    const type = inferred ?? fallbackType ?? null;
    if (!type) {
      skipped++;
      warnings.push(`Linha grupo ${groupNumber}: tipo não inferido e nenhum default fornecido`);
      continue;
    }

    records.push(buildRecord(type, groupNumber, monthStr, cols));
  }

  return { records, warnings, skipped };
}

function hasExplicitYear(value: string): boolean {
  return /\b\d{4}\b/.test(value) || /\b\d{2}\b/.test(value);
}

function parseXlsxServer(base64: string, sheetFilter?: string): { records: AssemblyRec[]; warnings: string[]; sheets: ParseReport['sheets']; skipped: number } {
  const buf = Uint8Array.from(atob(base64), c => c.charCodeAt(0)); // ci-auth-allow: decode de payload base64 (xlsx) — não envolve JWT.
  const wb = XLSX.read(buf, { type: 'array', cellDates: true, cellNF: false });
  const records: AssemblyRec[] = [];
  const warnings: string[] = [];
  const sheets: NonNullable<ParseReport['sheets']> = [];
  let totalSkipped = 0;

  for (const sheetName of wb.SheetNames) {
    if (sheetFilter && sheetFilter !== 'all' && sheetFilter !== sheetName) continue;
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    // raw matrix; preserves Date objects (cellDates) and empty cells.
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' }) as unknown[][];

    let headerRow = 0;
    // Detect header: scan first 30 rows looking for canonical cells "Mês" + "Grupo".
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const row = rows[i] ?? [];
      const joined = row.map(v => stripAccents(String(v ?? '')).toLowerCase()).join('|');
      if (joined.includes('grupo') && (joined.includes('mes') || joined.includes('mês') || joined.includes('m\u00eas'))) {
        headerRow = i + 1;
        break;
      }
    }
    const dataStart = headerRow > 0 ? headerRow : 0;

    let monthContext: string | null = null;
    let contextYear = new Date().getFullYear();
    let sheetRecs = 0;
    let sheetSkip = 0;
    const monthsSet = new Set<string>();

    for (let r = dataStart; r < rows.length; r++) {
      const row = rows[r] ?? [];

      // Try cell A as date
      const a = row[0];
      let monthStr: string | null = null;
      if (a instanceof Date) {
        monthStr = `${a.getUTCFullYear()}-${String(a.getUTCMonth() + 1).padStart(2, '0')}`;
      } else if (typeof a === 'number' && a >= 42000 && a <= 70000) {
        const epoch = new Date(Date.UTC(1899, 11, 30));
        const d = new Date(epoch.getTime() + a * 86400000);
        if (!isNaN(d.getTime())) {
          monthStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        }
      } else if (typeof a === 'string' && a.trim()) {
        const cand = srvNormalizeMonth(a, contextYear);
        if (cand && (!monthContext || hasExplicitYear(a))) monthStr = cand;
        else monthStr = cand;
      }
      if (monthStr) {
        monthContext = monthStr;
        contextYear = Number(monthStr.slice(0, 4)) || contextYear;
      }
      const finalMonth = monthStr ?? monthContext;
      if (!finalMonth) { sheetSkip++; continue; }

      const groupNumber = srvParseNum(row[1]);
      if (!groupNumber) { sheetSkip++; continue; }
      const type = srvConsortiumByGroup(groupNumber);
      if (!type) { sheetSkip++; continue; }

      try {
        records.push(buildRecord(type, groupNumber, finalMonth, row));
        monthsSet.add(finalMonth);
        sheetRecs++;
      } catch (err) {
        sheetSkip++;
        warnings.push(`Sheet "${sheetName}" linha ${r + 1}: ${(err as Error).message}`);
      }
    }

    totalSkipped += sheetSkip;
    sheets.push({
      name: sheetName,
      records: sheetRecs,
      skipped: sheetSkip,
      headerRow,
      detectedMonths: [...monthsSet].sort(),
    });
  }

  return { records, warnings, sheets, skipped: totalSkipped };
}

// ─── Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Onda 2: padroniza autenticação via helper canônico (assinatura + exp + has_role).
    const authResult = await authenticateAdmin(req);
    if (!authResult.ok) {
      return json({ error: authResult.error }, authResult.status);
    }
    const userId = authResult.userId;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    const admin = createClient(supabaseUrl, serviceKey);

    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return json({ error: 'Invalid payload', details: parsed.error.flatten() }, 400);
    }

    if (parsed.data.mode === 'parse') {
      const { kind, payload, consortiumType, sheetFilter } = parsed.data;
      const t0 = performance.now();

      // Size guards (defense in depth — Supabase already enforces request size).
      if (kind === 'paste' && payload.length > MAX_PASTE_BYTES) {
        return json({ error: `Paste excede limite (${MAX_PASTE_BYTES} bytes)` }, 413);
      }
      if (kind === 'xlsx') {
        // base64 expands ~4/3 in chars; raw bytes ≈ length * 0.75.
        const approxBytes = Math.floor(payload.length * 0.75);
        if (approxBytes > MAX_XLSX_BYTES) {
          return json({ error: `Arquivo excede limite (${MAX_XLSX_BYTES} bytes)` }, 413);
        }
      }

      let parseOut: ReturnType<typeof parsePasteServer> | ReturnType<typeof parseXlsxServer>;
      try {
        parseOut = kind === 'paste'
          ? parsePasteServer(payload, consortiumType)
          : parseXlsxServer(payload, sheetFilter);
      } catch (err) {
        return json({
          error: 'Falha de parsing server-side',
          details: (err as Error).message,
          parserVersion: PARSER_VERSION,
        }, 422);
      }

      const monthsDetected = [...new Set(parseOut.records.map(r => r.assemblyMonth))]
        .sort((a, b) => parseAssemblyMonth(a) - parseAssemblyMonth(b));

      const contentHash = await srvHash(
        kind === 'paste'
          ? `paste:${PARSER_VERSION}:${payload.length}:${payload.slice(0, 4096)}`
          : `xlsx:${PARSER_VERSION}:${payload.length}:${payload.slice(0, 1024)}`,
      );

      const durationMs = Math.round(performance.now() - t0);
      const report: ParseReport = {
        parserVersion: PARSER_VERSION,
        kind,
        totalRecords: parseOut.records.length,
        totalSkipped: parseOut.skipped,
        monthsDetected,
        warnings: parseOut.warnings.slice(0, 100),
        sheets: 'sheets' in parseOut ? parseOut.sheets : undefined,
        durationMs,
        contentHash,
      };

      // Audit (admin-only path; defense via has_role above).
      await admin.from('audit_logs').insert({
        user_id: userId,
        action: 'edge_parse_assemblies',
        entity: 'assemblies_ingestion',
        metadata: {
          kind, parserVersion: PARSER_VERSION, totalRecords: report.totalRecords,
          totalSkipped: report.totalSkipped, monthsDetected, durationMs,
          contentHash, warningsCount: parseOut.warnings.length,
        },
      });

      return json({ mode: 'parse', records: parseOut.records, report });
    }

    if (parsed.data.mode === 'preview') {
      const { consortiumType, records } = parsed.data;
      const existing = await fetchExistingForType(admin, userId, consortiumType);
      const diff = computeDiff(consortiumType, records, existing);
      const drift = detectDrift(records, existing);
      const importToken = crypto.randomUUID();
      return json({
        mode: 'preview',
        importToken,
        diff,
        drift,
        canCommit: drift.filter(d => d.severity === 'severe').length === 0,
      });
    }

    if (parsed.data.mode === 'commit') {
      const { consortiumType, records, acknowledgedDriftWarnings, importToken, parserVersion, contentHash } = parsed.data;
      const t0 = performance.now();

      const existing = await fetchExistingForType(admin, userId, consortiumType);
      const diff = computeDiff(consortiumType, records, existing);
      const drift = detectDrift(records, existing);

      const severeCount = drift.filter(d => d.severity === 'severe').length;
      if (severeCount > 0 && !acknowledgedDriftWarnings) {
        return json({
          error: 'Drift severo detectado — exige confirmação reforçada',
          drift,
          severeCount,
        }, 409);
      }

      // Snapshot dos meses afetados (antes da escrita)
      const affectedMonths = new Set<string>(records.map(r => r.assemblyMonth));
      for (const m of diff.prunedMonths) affectedMonths.add(m);
      const snapshot = existing
        .filter(e => affectedMonths.has(e.assembly_month))
        .map(e => e.raw);

      await upsertGroupsAndResults(admin, userId, consortiumType, records);
      await pruneOldMonths(admin, userId, consortiumType, diff.prunedMonths);

      const durationMs = Math.round(performance.now() - t0);

      const { data: importRow, error: impErr } = await admin
        .from('assembly_imports')
        .insert({
          user_id: userId,
          consortium_type: consortiumType,
          months: diff.affectedMonths,
          rows_added: diff.newRows,
          rows_updated: diff.updatedRows,
          rows_pruned: diff.prunedMonths.length,
          diff_summary: {
            newRows: diff.newRows,
            updatedRows: diff.updatedRows,
            unchangedRows: diff.unchangedRows,
            affectedGroups: diff.affectedGroups,
            affectedMonths: diff.affectedMonths,
            prunedMonths: diff.prunedMonths,
            changes: diff.changes,
          },
          drift_warnings: drift,
          snapshot,
          import_token: importToken ?? null,
          status: 'committed',
          parser_version: parserVersion ?? null,
          content_hash: contentHash ?? null,
          duration_ms: durationMs,
        })
        .select('id')
        .single();
      if (impErr) throw impErr;

      // Audit log
      await admin.from('audit_logs').insert({
        user_id: userId,
        action: 'edge_import_assemblies_commit',
        entity: 'assemblies_ingestion',
        entity_id: importRow.id,
        metadata: {
          consortiumType,
          rowsAdded: diff.newRows,
          rowsUpdated: diff.updatedRows,
          rowsPruned: diff.prunedMonths.length,
          driftWarnings: drift.length,
          severeCount,
          durationMs,
          parserVersion: parserVersion ?? null,
          contentHash: contentHash ?? null,
        },
      });

      return json({
        mode: 'commit',
        importId: importRow.id,
        diff,
        drift,
        durationMs,
      });
    }

    if (parsed.data.mode === 'rollback') {
      const { importId } = parsed.data;
      const { data: imp, error: getErr } = await admin
        .from('assembly_imports')
        .select('*')
        .eq('id', importId)
        .single();
      if (getErr || !imp) return json({ error: 'Import não encontrado' }, 404);
      if (imp.status === 'rolled_back') {
        return json({ error: 'Import já revertido' }, 409);
      }

      const t0 = performance.now();
      const consortiumType = imp.consortium_type as string;
      const months = (imp.months ?? []) as string[];
      const snapshot = (imp.snapshot ?? []) as Record<string, unknown>[];

      // Strategy: deletar assembly_results dos meses afetados, reinserir snapshot
      const { data: groups } = await admin
        .from('groups').select('id')
        .eq('user_id', userId).eq('consortium_type', consortiumType);
      const groupIds = (groups ?? []).map((g: { id: string }) => g.id);

      if (groupIds.length > 0 && months.length > 0) {
        await admin.from('assembly_results').delete()
          .in('group_id', groupIds).in('assembly_month', months);
      }

      if (snapshot.length > 0) {
        // Remove campos read-only
        const restoreRows = snapshot.map(row => {
          const { id: _id, created_at: _ca, ...rest } = row as Record<string, unknown>;
          return rest;
        });
        const chunkSize = 200;
        for (let i = 0; i < restoreRows.length; i += chunkSize) {
          const { error } = await admin
            .from('assembly_results')
            .upsert(restoreRows.slice(i, i + chunkSize), {
              onConflict: 'group_id,assembly_month',
            });
          if (error) throw error;
        }
      }

      await admin.from('assembly_imports').update({
        status: 'rolled_back',
        rolled_back_at: new Date().toISOString(),
        rolled_back_by: userId,
      }).eq('id', importId);

      const durationMs = Math.round(performance.now() - t0);
      await admin.from('audit_logs').insert({
        user_id: userId,
        action: 'edge_rollback_assemblies_import',
        entity: 'assemblies_ingestion',
        entity_id: importId,
        metadata: { consortiumType, months, restoredRows: snapshot.length, durationMs },
      });

      return json({
        mode: 'rollback',
        importId,
        restoredRows: snapshot.length,
        durationMs,
      });
    }

    return json({ error: 'Unknown mode' }, 400);
  } catch (err) {
    console.error('[assemblies-import] error', err);
    return json({ error: (err as Error).message ?? 'Internal error' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
