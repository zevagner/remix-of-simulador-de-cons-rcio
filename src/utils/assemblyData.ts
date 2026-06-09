import { AssemblyRecord, ConsortiumType } from '@/types/consortium';
import { getEmbeddedBidMaxPercent } from '@/config/consortiumRates';
import { logger } from '@/utils/logger';

export const MAX_MONTHS_TO_KEEP = 7;

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  january: 0,
  janeiro: 0,
  fev: 1,
  feb: 1,
  february: 1,
  fevereiro: 1,
  mar: 2,
  march: 2,
  marco: 2,
  março: 2,
  abr: 3,
  apr: 3,
  april: 3,
  abril: 3,
  mai: 4,
  may: 4,
  maio: 4,
  jun: 5,
  june: 5,
  junho: 5,
  jul: 6,
  july: 6,
  julho: 6,
  ago: 7,
  aug: 7,
  august: 7,
  agosto: 7,
  set: 8,
  sep: 8,
  september: 8,
  setembro: 8,
  out: 9,
  oct: 9,
  october: 9,
  outubro: 9,
  nov: 10,
  november: 10,
  novembro: 10,
  dez: 11,
  dec: 11,
  december: 11,
  dezembro: 11,
};

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function padMonth(monthIndex: number): string {
  return String(monthIndex + 1).padStart(2, '0');
}

function toYearMonth(year: number, monthIndex: number): string {
  return `${year}-${padMonth(monthIndex)}`;
}

export function normalizeAssemblyMonth(monthStr: string, fallbackYear = new Date().getFullYear()): string | null {
  const value = monthStr.trim();
  if (!value) return null;

  const normalized = stripAccents(value).toLowerCase();

  const isoMatch = normalized.match(/^(\d{4})[-\/](\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    if (month >= 1 && month <= 12) return `${year}-${String(month).padStart(2, '0')}`;
  }

  const monthYearNumeric = normalized.match(/^(\d{1,2})[-\/](\d{4})$/);
  if (monthYearNumeric) {
    const month = Number(monthYearNumeric[1]);
    const year = Number(monthYearNumeric[2]);
    if (month >= 1 && month <= 12) return `${year}-${String(month).padStart(2, '0')}`;
  }

  const monthYearText = normalized.match(/^([a-z]{3,12})[\s\-\/]+(\d{2,4})$/);
  if (monthYearText) {
    const monthIndex = MONTH_MAP[monthYearText[1]];
    if (monthIndex !== undefined) {
      const rawYear = Number(monthYearText[2]);
      const year = rawYear < 100 ? 2000 + rawYear : rawYear;
      return toYearMonth(year, monthIndex);
    }
  }

  const legacyMmm = value.match(/^([A-Za-z]{3})-(\d{2})$/);
  if (legacyMmm) {
    const monthIndex = MONTH_MAP[stripAccents(legacyMmm[1]).toLowerCase()];
    if (monthIndex !== undefined) {
      return toYearMonth(2000 + Number(legacyMmm[2]), monthIndex);
    }
  }

  const fullMonth = MONTH_MAP[normalized];
  if (fullMonth !== undefined) {
    return toYearMonth(fallbackYear, fullMonth);
  }

  return null;
}

export function parseAssemblyMonth(monthStr: string): Date {
  const normalized = normalizeAssemblyMonth(monthStr);
  if (!normalized) return new Date(0);

  const [yearStr, monthStrNum] = normalized.split('-');
  const year = Number(yearStr);
  const month = Number(monthStrNum);
  if (!year || !month) return new Date(0);

  return new Date(year, month - 1, 1);
}

export function hasUsefulBidData(record: AssemblyRecord): boolean {
  const minBid = record.minBidLastAssembly || record.minBidPercentage || 0;
  const avgBid = record.avgBid3Months || record.avgBidPercentage || 0;
  const maxBid = record.maxBidLastAssembly || record.maxBidPercentage || 0;
  return minBid > 0 || avgBid > 0 || maxBid > 0;
}

export function getUniqueMonths(assemblies: AssemblyRecord[], consortiumType?: ConsortiumType): string[] {
  const filtered = consortiumType
    ? assemblies.filter(a => a.consortiumType === consortiumType)
    : assemblies;

  const months = [...new Set(filtered.map(a => a.assemblyMonth))];

  return months.sort((a, b) => parseAssemblyMonth(b).getTime() - parseAssemblyMonth(a).getTime());
}

export function pruneOldMonths(
  assemblies: AssemblyRecord[],
  consortiumType: ConsortiumType
): AssemblyRecord[] {
  const months = getUniqueMonths(assemblies, consortiumType);

  if (months.length <= MAX_MONTHS_TO_KEEP) {
    return assemblies;
  }

  const monthsToKeep = new Set(months.slice(0, MAX_MONTHS_TO_KEEP));

  return assemblies.filter(a =>
    a.consortiumType !== consortiumType || monthsToKeep.has(a.assemblyMonth)
  );
}

export interface PruningResult {
  assemblies: AssemblyRecord[];
  added: number;
  updated: number;
  prunedMonths: string[];
}

/**
 * Normaliza assemblyMonth de todos os registros para formato YYYY-MM,
 * removendo duplicatas (mantém o mais recente por chave grupo+mês).
 */
export function normalizeAllAssemblies(assemblies: AssemblyRecord[]): AssemblyRecord[] {
  const deduped = new Map<string, AssemblyRecord>();
  for (const record of assemblies) {
    const normalizedMonth = normalizeAssemblyMonth(record.assemblyMonth);
    if (!normalizedMonth) continue;
    const key = `${record.consortiumType}-${record.groupNumber}-${normalizedMonth}`;
    const existing = deduped.get(key);
    // Mantém o registro mais recente (por createdAt) ou o último encontrado
    if (!existing || (record.createdAt && (!existing.createdAt || record.createdAt > existing.createdAt))) {
      deduped.set(key, {
        ...record,
        assemblyMonth: normalizedMonth,
        assemblyDate: parseAssemblyMonth(normalizedMonth),
      });
    }
  }
  return Array.from(deduped.values());
}

export function addAssembliesWithPruning(
  existingAssemblies: AssemblyRecord[],
  newAssemblies: AssemblyRecord[]
): PruningResult {
  const normalize = (records: AssemblyRecord[]) =>
    records
      .map(record => {
        const normalizedMonth = normalizeAssemblyMonth(record.assemblyMonth);
        if (!normalizedMonth) return null;
        return {
          ...record,
          assemblyMonth: normalizedMonth,
          assemblyDate: parseAssemblyMonth(normalizedMonth),
        };
      })
      .filter((record): record is AssemblyRecord => record !== null);

  const normalizedNewAssemblies = normalize(newAssemblies);
  const normalizedExisting = normalize(existingAssemblies);

  const typesInNew = new Set(normalizedNewAssemblies.map(a => a.consortiumType));

  let combined = [...normalizedExisting];
  let added = 0;
  let updated = 0;
  const allPrunedMonths: string[] = [];

  for (const consortiumType of typesInNew) {
    const newOfType = normalizedNewAssemblies.filter(a => a.consortiumType === consortiumType);

    const existingKeys = new Map(
      combined
        .filter(a => a.consortiumType === consortiumType)
        .map(a => [`${a.groupNumber}-${a.assemblyMonth}`, a])
    );

    for (const record of newOfType) {
      const key = `${record.groupNumber}-${record.assemblyMonth}`;
      const existing = existingKeys.get(key);

      if (existing) {
        const index = combined.findIndex(a => a.id === existing.id);
        if (index !== -1) {
          combined[index] = { ...combined[index], ...record, id: existing.id };
          updated++;
        }
      } else {
        combined.push(record);
        added++;
      }
    }

    const monthsBefore = getUniqueMonths(combined, consortiumType);
    combined = pruneOldMonths(combined, consortiumType);
    const monthsAfter = getUniqueMonths(combined, consortiumType);

    const pruned = monthsBefore.filter(m => !monthsAfter.includes(m));
    allPrunedMonths.push(...pruned);
  }

  const sortedAssemblies = [...combined].sort((a, b) => {
    const dateDiff = parseAssemblyMonth(a.assemblyMonth).getTime() - parseAssemblyMonth(b.assemblyMonth).getTime();
    if (dateDiff !== 0) return dateDiff;

    if (a.consortiumType !== b.consortiumType) {
      return a.consortiumType.localeCompare(b.consortiumType);
    }

    return a.groupNumber - b.groupNumber;
  });

  return {
    assemblies: sortedAssemblies,
    added,
    updated,
    prunedMonths: allPrunedMonths,
  };
}

export function getUniqueGroups(
  assemblies: AssemblyRecord[],
  consortiumType: ConsortiumType
): number[] {
  const groups = assemblies
    .filter(a => a.consortiumType === consortiumType)
    .map(a => a.groupNumber);

  return [...new Set(groups)].sort((a, b) => a - b);
}

/**
 * @deprecated Onda: Server-Side Parsing Canonicalization.
 * Use `parsePasteServer` em `@/services/assembliesImport`. O navegador
 * não deve mais interpretar dados operacionais — toda normalização vive
 * no edge `assemblies-import` (mode: 'parse', kind: 'paste').
 * Mantido como fallback técnico durante a transição.
 */
export function parseExcelPaste(
  pastedData: string,
  consortiumType: ConsortiumType
): AssemblyRecord[] {
  const lines = pastedData.trim().split('\n');
  const records: AssemblyRecord[] = [];

  for (const line of lines) {
    const cols = line.split('\t');

    if (cols.length < 13 || !cols[0] || cols[0].includes('Grupo') || cols[0].includes('Informação') || cols[0].includes('Mês')) {
      continue;
    }

    try {
      const monthCol = cols[0].trim();
      const normalizedMonth = normalizeAssemblyMonth(monthCol);
      if (!normalizedMonth) continue;

      const groupCol = cols[1];
      const embeddedCol = cols[2]?.trim() || '0';
      const creditCol = cols[3] || '';
      const participantsCol = cols[4] || '0';
      const totalTermCol = cols[5] || '0';
      const remainingTermCol = cols[6] || '0';
      const firstAssemblyCol = cols[7] || '';
      const nextAssemblyCol = cols[8] || '';
      const installmentDueCol = cols[9] || '';
      const avgBid3Col = cols[10] || '0';
      const minBidCol = cols[11] || '0';
      const maxBidCol = cols[12] || '0';
      const sorteioCol = cols[13] || '0';
      const cancelledCol = cols[14] || '0';
      const lanceFixoCol = cols[15] || '0';
      const lanceLivreCol = cols[16] || '0';
      const totalContempCol = cols[17] || '0';
      const contemSorteioCol = cols[18] || '0';
      const contemExcluCol = cols[19] || '0';
      const contemLanceLivreCol = cols[20] || '0';
      const contemLanceFixoCol = cols[21] || '0';
      const contemUltAssembCol = cols[22] || '0';

      const groupNumber = parseInt(groupCol, 10);
      if (isNaN(groupNumber)) continue;

      const typeMaxEmbedded = getEmbeddedBidMaxPercent(consortiumType);
      let embeddedValue = 0;
      const embeddedLower = embeddedCol.toLowerCase();
      if (embeddedLower === 'sim') {
        embeddedValue = typeMaxEmbedded;
      } else if (embeddedLower === 'não' || embeddedLower === 'nao') {
        embeddedValue = 0;
      } else {
        embeddedValue = Math.min(parseFloat(embeddedCol) || 0, typeMaxEmbedded);
      }
      const hasEmbeddedBid = embeddedValue > 0;
      const embeddedBidMaxPercent = embeddedValue;

      const parsePercent = (val: string): number => {
        if (!val) return 0;
        const cleaned = val.replace('%', '').replace(',', '.').trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };

      const parseNum = (val: string): number => {
        if (!val) return 0;
        const cleaned = val.replace('.', '').replace(',', '.').trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };

      const avgBid3Months = parsePercent(avgBid3Col);
      const minBidLastAssembly = parsePercent(minBidCol);
      const maxBidLastAssembly = parsePercent(maxBidCol);

      const record: AssemblyRecord = {
        id: `${consortiumType}-${groupNumber}-${normalizedMonth}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        consortiumType,
        groupNumber,
        assemblyMonth: normalizedMonth,
        assemblyDate: parseAssemblyMonth(normalizedMonth),
        hasEmbeddedBid,
        embeddedBidMaxPercent,
        creditRange: creditCol.trim(),
        participants: parseNum(participantsCol),
        totalTerm: parseNum(totalTermCol),
        remainingTerm: parseNum(remainingTermCol),
        firstAssemblyDate: firstAssemblyCol.trim(),
        nextAssemblyDate: nextAssemblyCol.trim(),
        installmentDueDate: installmentDueCol.trim(),
        avgBid3Months,
        minBidLastAssembly,
        maxBidLastAssembly,
        contemplationsBySorteio: parseNum(contemSorteioCol),
        contemplationsByLanceLivre: parseNum(contemLanceLivreCol),
        contemplationsByLanceFixo: parseNum(contemLanceFixoCol),
        contemplationsLastAssembly: parseNum(contemUltAssembCol),
        contemplationsCancelled: parseNum(contemExcluCol),
        totalContemplations: parseNum(totalContempCol),
        sorteio: parseNum(sorteioCol),
        cancelled: parseNum(cancelledCol),
        lanceFixo: parseNum(lanceFixoCol),
        lanceLivre: parseNum(lanceLivreCol),
        minBidPercentage: minBidLastAssembly,
        avgBidPercentage: avgBid3Months,
        maxBidPercentage: maxBidLastAssembly,
        contemplationsByLance: parseNum(contemLanceLivreCol) + parseNum(contemLanceFixoCol),
        createdAt: new Date().toISOString(),
      };

      records.push(record);
    } catch (error) {
      logger.error('Erro ao parsear linha:', line, error);
    }
  }

  return records;
}

export function needsDataImport(assemblies: AssemblyRecord[]): boolean {
  const imobiliarioGroups = getUniqueGroups(assemblies, 'imobiliario');
  const autoGroups = getUniqueGroups(assemblies, 'auto');
  const pesadosGroups = getUniqueGroups(assemblies, 'pesados');

  return imobiliarioGroups.length < 50 || autoGroups.length < 70 || pesadosGroups.length < 15;
}
