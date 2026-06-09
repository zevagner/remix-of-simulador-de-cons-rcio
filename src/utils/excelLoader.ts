import type ExcelJS from 'exceljs';
import { AssemblyRecord } from '@/types/consortium';
import { parseAssemblyMonth, hasUsefulBidData } from './assemblyData';
import { parseSheetToRecords } from './excelFileParser';
import { logger } from '@/utils/logger';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_SHEETS = 20;

function sortAssembliesByDate(records: AssemblyRecord[]): AssemblyRecord[] {
  return [...records].sort((a, b) => {
    const dateDiff = parseAssemblyMonth(a.assemblyMonth).getTime() - parseAssemblyMonth(b.assemblyMonth).getTime();
    if (dateDiff !== 0) return dateDiff;
    if (a.consortiumType !== b.consortiumType) return a.consortiumType.localeCompare(b.consortiumType);
    return a.groupNumber - b.groupNumber;
  });
}

export async function loadExcelData(): Promise<AssemblyRecord[]> {
  try {
    const response = await fetch('/data/Grupos_Consorcio.xlsx?v=' + Date.now());
    if (!response.ok) {
      logger.error('Arquivo Excel não encontrado, status:', response.status);
      return [];
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
      logger.error(`Arquivo Excel excede o limite de ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`);
      return [];
    }

    const ExcelJSModule = await import('exceljs');
    const ExcelJSLib = ExcelJSModule.default || ExcelJSModule;
    const workbook = new (ExcelJSLib as typeof ExcelJS).Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const allRecords: AssemblyRecord[] = [];
    let sheetCount = 0;

    workbook.eachSheet((worksheet) => {
      sheetCount++;
      if (sheetCount > MAX_SHEETS) return;

      const result = parseSheetToRecords(worksheet);
      allRecords.push(...result.records);

      logger.info(
        `[excelLoader] ${worksheet.name}: ${result.records.length} registros, ` +
        `${result.skippedRows} ignorados, meses: ${result.detectedMonths.join(', ') || 'nenhum'}`
      );
    });

    const importedMonths = [...new Set(allRecords.map(r => r.assemblyMonth))]
      .sort((a, b) => parseAssemblyMonth(a).getTime() - parseAssemblyMonth(b).getTime());

    const validForBidAnalysis = allRecords.filter(hasUsefulBidData);
    const validMonths = [...new Set(validForBidAnalysis.map(r => r.assemblyMonth))]
      .sort((a, b) => parseAssemblyMonth(a).getTime() - parseAssemblyMonth(b).getTime());

    const discardedMonths = importedMonths.filter(month => !validMonths.includes(month));
    const hasImportedFebruary = importedMonths.some(month => month.endsWith('-02'));
    const hasValidFebruary = validMonths.some(month => month.endsWith('-02'));

    logger.info(`[excelLoader][diag] Meses importados: ${importedMonths.join(', ') || 'nenhum'}`);
    logger.info(`[excelLoader][diag] Meses válidos (lance): ${validMonths.join(', ') || 'nenhum'}`);
    if (discardedMonths.length > 0) {
      logger.warn(
        `[excelLoader][diag] Meses descartados da análise (sem dados de lance): ${discardedMonths.join(', ')}`
      );
    }
    logger.info(
      `[excelLoader][diag] Fevereiro importado: ${hasImportedFebruary ? 'sim' : 'não'} | ` +
      `Fevereiro válido: ${hasValidFebruary ? 'sim' : 'não'}`
    );

    return sortAssembliesByDate(allRecords);
  } catch (error) {
    logger.error('ERRO ao carregar Excel:', error);
    return [];
  }
}

export async function initializeFromExcel(
  _existingAssemblies: AssemblyRecord[]
): Promise<{
  assemblies: AssemblyRecord[];
  stats: {
    total: number;
    added: number;
    updated: number;
    imob: number;
    auto: number;
    pesados: number;
    months: string[];
  }
}> {
  const excelData = await loadExcelData();

  if (excelData.length === 0) {
    logger.error('Nenhum dado carregado do Excel!');
    return {
      assemblies: [],
      stats: { total: 0, added: 0, updated: 0, imob: 0, auto: 0, pesados: 0, months: [] }
    };
  }

  const imobGroups = new Set<number>();
  const autoGroups = new Set<number>();
  const pesadosGroups = new Set<number>();
  const months = new Set<string>();

  excelData.forEach(r => {
    months.add(r.assemblyMonth);
    if (r.consortiumType === 'imobiliario') imobGroups.add(r.groupNumber);
    else if (r.consortiumType === 'auto') autoGroups.add(r.groupNumber);
    else if (r.consortiumType === 'pesados') pesadosGroups.add(r.groupNumber);
  });

  return {
    assemblies: excelData,
    stats: {
      total: excelData.length,
      added: excelData.length,
      updated: 0,
      imob: imobGroups.size,
      auto: autoGroups.size,
      pesados: pesadosGroups.size,
      months: Array.from(months).sort((a, b) => parseAssemblyMonth(a).getTime() - parseAssemblyMonth(b).getTime()),
    }
  };
}
