import type ExcelJS from 'exceljs';
import { AssemblyRecord, ConsortiumType } from '@/types/consortium';
import { getEmbeddedBidMaxPercent } from '@/config/consortiumRates';
import { normalizeAssemblyMonth, parseAssemblyMonth } from './assemblyData';
import { logger } from '@/utils/logger';

/**
 * ExcelJS Worksheet expõe `actualRowCount` em runtime mas o type definition
 * oficial não inclui essa propriedade. Tipamos via interface estendida em
 * vez de `as any` para preservar safety nas demais propriedades.
 */
type WorksheetWithActualRowCount = ExcelJS.Worksheet & { actualRowCount?: number };
const getEffectiveRowCount = (worksheet: ExcelJS.Worksheet): number => {
  const ws = worksheet as WorksheetWithActualRowCount;
  return Math.max(worksheet.rowCount, ws.actualRowCount ?? 0);
};

export interface SheetParseResult {
  sheetName: string;
  records: AssemblyRecord[];
  headerRow: number;
  skippedRows: number;
  detectedColumns: string[];
  detectedMonths: string[];
  monthCounts: Record<string, number>;
}

const COLUMN_PATTERNS: [RegExp, string][] = [
  [/m[eê]s/i, 'month'],
  [/grupo/i, 'group'],
  [/lance\s*embut/i, 'embedded'],
  [/faixa.*cr[eé]d/i, 'credit'],
  [/cr[eé]d/i, 'credit'],
  [/particip/i, 'participants'],
  [/prazo\s*total/i, 'totalTerm'],
  [/prazo\s*rem/i, 'remainingTerm'],
  [/1[ªa]\s*assemb/i, 'firstAssembly'],
  [/pr[oó]x.*assemb/i, 'nextAssembly'],
  [/venc.*parc/i, 'installmentDue'],
  [/lance\s*m[eé]d.*3/i, 'avgBid3'],
  [/lance\s*m[ií]n/i, 'minBid'],
  [/lance\s*m[aá]x/i, 'maxBid'],
  [/sorteio/i, 'sorteio'],
  [/cancelad/i, 'cancelled'],
  [/lance\s*fixo/i, 'lanceFixo'],
  [/lance\s*livre/i, 'lanceLivre'],
  [/total.*contempl/i, 'totalContemp'],
  [/contempl.*sorteio/i, 'contempSorteio'],
  [/contempl.*exclu/i, 'contempExclu'],
  [/contempl.*lance\s*livre/i, 'contempLanceLivre'],
  [/contempl.*lance\s*fixo/i, 'contempLanceFixo'],
  [/contempl.*ult/i, 'contempUlt'],
  [/qtde.*sorteio/i, 'contempSorteio'],
  [/qtde.*exclu/i, 'contempExclu'],
  [/qtde.*lance\s*livre/i, 'contempLanceLivre'],
  [/qtde.*lance\s*fixo/i, 'contempLanceFixo'],
  [/qtde.*ult/i, 'contempUlt'],
];

const POSITIONAL_KEYS = [
  'month', 'group', 'embedded', 'credit', 'participants', 'totalTerm',
  'remainingTerm', 'firstAssembly', 'nextAssembly', 'installmentDue',
  'avgBid3', 'minBid', 'maxBid', 'sorteio', 'cancelled', 'lanceFixo',
  'lanceLivre', 'totalContemp', 'contempSorteio', 'contempExclu',
  'contempLanceLivre', 'contempLanceFixo', 'contempUlt',
];

function getCellValue(cell: ExcelJS.CellValue): unknown {
  if (cell === null || cell === undefined) return '';
  if (cell instanceof Date) return cell;
  if (typeof cell === 'object') {
    // ExcelJS formula cells: prefer .result
    if ('result' in (cell as object)) {
      const result = (cell as { result: unknown }).result;
      if (result instanceof Date) return result;
      return result;
    }
    if ('richText' in (cell as object)) {
      return ((cell as { richText: { text: string }[] }).richText).map(r => r.text).join('');
    }
    if ('error' in (cell as object)) return '';
    return String(cell);
  }
  return cell;
}

/** Converte serial numérico do Excel (dias desde 1899-12-30) em YYYY-MM (UTC-safe) */
function excelSerialToYYYYMM(serial: number): string | null {
  if (serial < 42000 || serial > 70000) return null;
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(epoch.getTime() + serial * 86400000);
  if (isNaN(date.getTime()) || date.getUTCFullYear() <= 1970) return null;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Converte Date do Excel para YYYY-MM usando UTC para evitar drift de fuso */
function dateToYYYYMM(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Extrai YYYY-MM da célula bruta (Date nativo ou serial), imune a timezone */
function getCellDateAsYYYYMM(cell: ExcelJS.Cell): string | null {
  const val = cell.value;
  if (val instanceof Date) return dateToYYYYMM(val);
  if (typeof val === 'object' && val !== null) {
    if ('result' in val) {
      const r = (val as { result: unknown }).result;
      if (r instanceof Date) return dateToYYYYMM(r);
      if (typeof r === 'number') return excelSerialToYYYYMM(r);
    }
  }
  if (typeof val === 'number') return excelSerialToYYYYMM(val);
  return null;
}

function parseNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const str = String(val).trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parsePercent(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'string') {
    const str = val.replace('%', '').replace(',', '.').trim();
    const num = parseFloat(str);
    if (isNaN(num)) return 0;
    if (val.includes('%')) return num;
    return num < 1 && num > 0 ? num * 100 : num;
  }
  if (typeof val === 'number') {
    if (val < 0) return 0;
    return val < 1 && val > 0 ? val * 100 : val;
  }
  return 0;
}

function parseExcelDate(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  if (val instanceof Date) {
    return `${val.getUTCMonth() + 1}/${val.getUTCDate()}/${val.getUTCFullYear() % 100}`;
  }
  if (typeof val === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(epoch.getTime() + val * 86400000);
    if (!isNaN(date.getTime())) {
      return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear() % 100}`;
    }
    return '';
  }
  return String(val);
}

function parseEmbeddedBid(val: unknown, consortiumType: ConsortiumType): { hasEmbeddedBid: boolean; embeddedBidMaxPercent: number } {
  const typeMax = getEmbeddedBidMaxPercent(consortiumType);
  if (val === null || val === undefined || val === '') return { hasEmbeddedBid: false, embeddedBidMaxPercent: 0 };
  if (typeof val === 'number') {
    const capped = Math.min(val, typeMax);
    return { hasEmbeddedBid: capped > 0, embeddedBidMaxPercent: capped };
  }
  const str = String(val).toLowerCase().trim();
  if (str === 'sim' || str === 'yes') return { hasEmbeddedBid: true, embeddedBidMaxPercent: typeMax };
  if (str === 'não' || str === 'nao' || str === 'no') return { hasEmbeddedBid: false, embeddedBidMaxPercent: 0 };
  const num = parseNum(val);
  const capped = Math.min(num, typeMax);
  return { hasEmbeddedBid: capped > 0, embeddedBidMaxPercent: capped };
}

function getConsortiumType(groupNumber: number): ConsortiumType | null {
  if (groupNumber >= 10001 && groupNumber <= 19999) return 'imobiliario';
  if (groupNumber >= 30001 && groupNumber <= 39999) return 'auto';
  if (groupNumber >= 40001 && groupNumber <= 49999) return 'pesados';
  return null;
}

function hasExplicitYearInMonthText(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  return /\b\d{4}\b/.test(normalized) || /\b\d{2}\b/.test(normalized);
}

function toMonthStr(val: unknown, fallbackYear: number, previousMonth: string | null = null): string | null {
  if (typeof val === 'string') {
    const normalized = normalizeAssemblyMonth(val, fallbackYear);
    if (!normalized) return null;

    if (!previousMonth || hasExplicitYearInMonthText(val)) {
      return normalized;
    }

    const [candidateYearStr, candidateMonthStr] = normalized.split('-');
    const [prevYearStr, prevMonthStr] = previousMonth.split('-');

    const candidateYear = Number(candidateYearStr);
    const candidateMonth = Number(candidateMonthStr);
    const prevYear = Number(prevYearStr);
    const prevMonth = Number(prevMonthStr);

    if (
      Number.isFinite(candidateYear) &&
      Number.isFinite(candidateMonth) &&
      Number.isFinite(prevYear) &&
      Number.isFinite(prevMonth) &&
      candidateYear === prevYear &&
      candidateMonth < prevMonth &&
      prevMonth - candidateMonth >= 6
    ) {
      return `${candidateYear + 1}-${String(candidateMonth).padStart(2, '0')}`;
    }

    return normalized;
  }

  if (val instanceof Date) {
    return dateToYYYYMM(val);
  }

  // Excel serial de datas recentes; evita colisão com números de grupo
  if (typeof val === 'number' && val >= 42000 && val <= 70000) {
    return excelSerialToYYYYMM(val);
  }

  return null;
}

function detectHeaderRow(worksheet: ExcelJS.Worksheet): { row: number; mapping: Map<string, number> } {
  let bestRow = 0;
  let bestMapping = new Map<string, number>();
  let bestScore = 0;

  const maxScan = Math.min(getEffectiveRowCount(worksheet), 30);
  for (let r = 1; r <= maxScan; r++) {
    const row = worksheet.getRow(r);
    const mapping = new Map<string, number>();
    let score = 0;

    row.eachCell((cell, colNumber) => {
      const text = String(getCellValue(cell.value) || '').trim();
      if (!text) return;

      for (const [pattern, key] of COLUMN_PATTERNS) {
        if (pattern.test(text) && !mapping.has(key)) {
          mapping.set(key, colNumber);
          score++;
          break;
        }
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestRow = r;
      bestMapping = mapping;
    }
  }

  return { row: bestRow, mapping: bestMapping };
}

function detectMonthHeaderFromRow(
  row: ExcelJS.Row,
  fallbackYear: number,
  previousMonth: string | null
): string | null {
  const maxCellsToScan = Math.min(Math.max(row.cellCount, 1), 6);
  for (let c = 1; c <= maxCellsToScan; c++) {
    const cell = row.getCell(c);
    // Try UTC-safe native date first
    const dateYM = getCellDateAsYYYYMM(cell);
    if (dateYM) return dateYM;
    // Fallback to string-based parsing
    const raw = getCellValue(cell.value);
    const normalized = toMonthStr(raw, fallbackYear, previousMonth);
    if (normalized) return normalized;
  }
  return null;
}

function sanitize(val: string): string {
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, 500);
}

function extractYear(monthStr: string): number {
  const year = Number(monthStr.slice(0, 4));
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

/**
 * @deprecated Onda: Server-Side Parsing Canonicalization.
 * Use `parseXlsxServer` em `@/services/assembliesImport`. Toda interpretação
 * de XLSX migra para o edge `assemblies-import` (mode: 'parse', kind: 'xlsx').
 * Mantido como fallback técnico durante a transição da UI.
 */
export function parseSheetToRecords(worksheet: ExcelJS.Worksheet): SheetParseResult {
  const sheetName = worksheet.name;
  const records: AssemblyRecord[] = [];
  let skippedRows = 0;

  const { row: headerRow, mapping } = detectHeaderRow(worksheet);
  const hasHeader = mapping.size >= 2;
  const dataStartRow = hasHeader ? headerRow + 1 : 1;

  const colIdx = (key: string): number => {
    if (hasHeader && mapping.has(key)) return mapping.get(key)!;
    const posIdx = POSITIONAL_KEYS.indexOf(key);
    return posIdx >= 0 ? posIdx + 1 : -1;
  };

  const detectedColumns: string[] = [];
  if (hasHeader) mapping.forEach((_, key) => detectedColumns.push(key));

  const getVal = (row: ExcelJS.Row, key: string): unknown => {
    const col = colIdx(key);
    if (col < 1) return '';
    return getCellValue(row.getCell(col).value);
  };

  const effectiveRowCount = getEffectiveRowCount(worksheet);
  const maxRow = Math.min(effectiveRowCount + 1000, 50000);
  const MAX_TRAILING_EMPTY_ROWS = 400;

  let monthContext: string | null = null;
  let contextYear = new Date().getFullYear();
  let rowsWithoutValidData = 0;
  const monthFirstSeen = new Map<string, { row: number; source: string; rawType: string; rawValue: string }>();

  for (let r = dataStartRow; r <= maxRow; r++) {
    const row = worksheet.getRow(r);

    try {
      const monthFromHeader = detectMonthHeaderFromRow(row, contextYear, monthContext);
      if (monthFromHeader) {
        monthContext = monthFromHeader;
        contextYear = extractYear(monthFromHeader);
      }

      // PRIORIDADE: sempre tentar Coluna A primeiro usando UTC-safe date extraction
      const colACell = row.getCell(1);
      const monthFromColA = getCellDateAsYYYYMM(colACell);

      let monthFromCell: string | null = monthFromColA;
      if (!monthFromCell) {
        // Fallback: string-based parsing from column A
        const colAStr = getCellValue(colACell.value);
        monthFromCell = toMonthStr(colAStr, contextYear, monthContext);
      }
      if (!monthFromCell) {
        // Fallback: mapped 'month' column
        const monthRaw = getVal(row, 'month');
        monthFromCell = toMonthStr(monthRaw, contextYear, monthContext);
      }

      const monthStr = monthFromCell || monthContext;

      if (monthFromCell) {
        if (!monthFirstSeen.has(monthFromCell)) {
          const colAVal = colACell.value;
          const rawType = colAVal instanceof Date ? 'Date' : typeof colAVal;
          monthFirstSeen.set(monthFromCell, {
            row: r,
            source: monthFromColA ? 'ColA(UTC)' : 'mapped',
            rawType,
            rawValue: String(colAVal).slice(0, 60),
          });
        }
        monthContext = monthFromCell;
        contextYear = extractYear(monthFromCell);
      }

      if (!monthStr) {
        skippedRows++;
        rowsWithoutValidData++;
        if (r > effectiveRowCount && rowsWithoutValidData > MAX_TRAILING_EMPTY_ROWS) break;
        continue;
      }

      const groupNum = parseNum(getVal(row, 'group'));
      if (groupNum === 0 || isNaN(groupNum)) {
        skippedRows++;
        rowsWithoutValidData++;
        if (r > effectiveRowCount && rowsWithoutValidData > MAX_TRAILING_EMPTY_ROWS) break;
        continue;
      }

      const consortiumType = getConsortiumType(groupNum);
      if (!consortiumType) {
        skippedRows++;
        rowsWithoutValidData++;
        continue;
      }

      const embedded = parseEmbeddedBid(getVal(row, 'embedded'), consortiumType);

      const avgBid = parsePercent(getVal(row, 'avgBid3'));
      const minBid = parsePercent(getVal(row, 'minBid'));
      const maxBid = parsePercent(getVal(row, 'maxBid'));

      const record: AssemblyRecord = {
        id: `${consortiumType}-${groupNum}-${monthStr}-${sheetName}-${r}-${Date.now()}`,
        consortiumType,
        groupNumber: groupNum,
        assemblyMonth: monthStr,
        assemblyDate: parseAssemblyMonth(monthStr),
        hasEmbeddedBid: embedded.hasEmbeddedBid,
        embeddedBidMaxPercent: embedded.embeddedBidMaxPercent,
        creditRange: sanitize(String(getVal(row, 'credit') || '').trim()),
        participants: parseNum(getVal(row, 'participants')),
        totalTerm: parseNum(getVal(row, 'totalTerm')),
        remainingTerm: parseNum(getVal(row, 'remainingTerm')),
        firstAssemblyDate: parseExcelDate(getVal(row, 'firstAssembly')),
        nextAssemblyDate: parseExcelDate(getVal(row, 'nextAssembly')),
        installmentDueDate: parseExcelDate(getVal(row, 'installmentDue')),
        avgBid3Months: avgBid,
        minBidLastAssembly: minBid,
        maxBidLastAssembly: maxBid,
        sorteio: parseNum(getVal(row, 'sorteio')),
        cancelled: parseNum(getVal(row, 'cancelled')),
        lanceFixo: parseNum(getVal(row, 'lanceFixo')),
        lanceLivre: parseNum(getVal(row, 'lanceLivre')),
        totalContemplations: parseNum(getVal(row, 'totalContemp')),
        contemplationsBySorteio: parseNum(getVal(row, 'contempSorteio')),
        contemplationsCancelled: parseNum(getVal(row, 'contempExclu')),
        contemplationsByLanceLivre: parseNum(getVal(row, 'contempLanceLivre')),
        contemplationsByLanceFixo: parseNum(getVal(row, 'contempLanceFixo')),
        contemplationsLastAssembly: parseNum(getVal(row, 'contempUlt')),
        minBidPercentage: minBid,
        avgBidPercentage: avgBid,
        maxBidPercentage: maxBid,
        contemplationsByLance: parseNum(getVal(row, 'contempLanceLivre')) + parseNum(getVal(row, 'contempLanceFixo')),
        createdAt: new Date().toISOString(),
      };

      records.push(record);
      rowsWithoutValidData = 0;
    } catch {
      skippedRows++;
      rowsWithoutValidData++;
      if (r > effectiveRowCount && rowsWithoutValidData > MAX_TRAILING_EMPTY_ROWS) break;
    }
  }

  // Diagnóstico: meses detectados com origem
  for (const [month, info] of monthFirstSeen) {
    logger.info(
      `[excelParser][diag] ${sheetName}: mês ${month} detectado na linha ${info.row} ` +
      `(fonte: ${info.source}, tipo: ${info.rawType}, valor: "${info.rawValue}")`
    );
  }
  const hasFeb = [...monthFirstSeen.keys()].some(m => m.endsWith('-02'));
  logger.info(`[excelParser][diag] ${sheetName}: fevereiro presente = ${hasFeb ? 'SIM' : 'NÃO'}`);

  records.sort((a, b) => {
    const dateDiff = parseAssemblyMonth(a.assemblyMonth).getTime() - parseAssemblyMonth(b.assemblyMonth).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.groupNumber - b.groupNumber;
  });

  const monthCounts = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.assemblyMonth] = (acc[record.assemblyMonth] || 0) + 1;
    return acc;
  }, {});

  const detectedMonths = Object.keys(monthCounts).sort(
    (a, b) => parseAssemblyMonth(a).getTime() - parseAssemblyMonth(b).getTime()
  );

  return { sheetName, records, headerRow, skippedRows, detectedColumns, detectedMonths, monthCounts };
}
