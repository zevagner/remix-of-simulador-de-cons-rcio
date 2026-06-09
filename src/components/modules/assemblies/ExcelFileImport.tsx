/**
 * ExcelFileImport — Onda: Assemblies Full Edge UX Cutover.
 *
 * Substitui o parser client-side (exceljs + parseSheetToRecords) pelo pipeline
 * canônico server-side (`parseXlsxServer`). O navegador apenas:
 *   - valida tamanho/extensão do arquivo
 *   - converte para base64 (`fileToBase64`)
 *   - envia para o edge `assemblies-import` (mode='parse')
 *   - exibe o report determinístico devolvido pelo servidor
 *
 * Não interpreta, normaliza ou transforma dados de assembleia.
 *
 * State machine: idle → encoding → parsing → ready | error
 */
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AssemblyRecord } from '@/types/consortium';
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose, DialogDescription,
} from '@/components/ui/dialog';
import { fileToBase64, parseXlsxServer, type ParseReport } from '@/services/assembliesImport';
import { emitMetric } from '@/lib/runtimeMetrics';
import { logger } from '@/utils/logger';

interface ExcelFileImportProps {
  onImport: (records: AssemblyRecord[], parserMeta?: { parserVersion?: string; contentHash?: string }) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type Stage = 'idle' | 'encoding' | 'parsing' | 'ready' | 'error';

const MAX_BYTES = 10 * 1024 * 1024;

export function ExcelFileImport({ onImport, isOpen, onOpenChange }: ExcelFileImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [sheetFilter, setSheetFilter] = useState<string>('all');
  const [records, setRecords] = useState<AssemblyRecord[]>([]);
  const [report, setReport] = useState<ParseReport | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setBase64(null);
    setSheetFilter('all');
    setRecords([]);
    setReport(null);
    setStage('idle');
    setErrorMsg(null);
  }, []);

  const runServerParse = useCallback(async (b64: string, filter: string) => {
    setStage('parsing');
    setErrorMsg(null);
    const t0 = performance.now();
    try {
      const res = await parseXlsxServer(b64, filter);
      const dur = Math.round(performance.now() - t0);
      setRecords(res.records);
      setReport(res.report);
      setStage('ready');
      emitMetric({
        type: 'interaction',
        name: 'assemblies.parse_xlsx_server',
        value: dur,
        module: 'admin-assemblies',
        meta: {
          rows: res.records.length,
          skipped: res.report.totalSkipped,
          parserVersion: res.report.parserVersion,
        },
      });
      if (res.records.length === 0) {
        toast.warning('Nenhum registro válido detectado pelo servidor');
      }
    } catch (err) {
      logger.error('[edge-cutover] xlsx server parse error', err);
      setStage('error');
      setErrorMsg((err as Error).message ?? 'Falha no parsing server-side');
      emitMetric({
        type: 'warning',
        name: 'assemblies.parse_xlsx_server_failed',
        value: Math.round(performance.now() - t0),
        module: 'admin-assemblies',
      });
      toast.error('Falha no parser institucional');
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_BYTES) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }
    if (!selected.name.match(/\.xlsx?$/i)) {
      toast.error('Selecione um arquivo .xlsx ou .xls');
      return;
    }
    // Defense-in-depth: XLSX é um ZIP — magic byte PK\x03\x04 deve bater.
    const { guardFile } = await import('@/lib/uploadGuard');
    const guard = await guardFile(selected, 'xlsx');
    if (!guard.ok) {
      toast.error(guard.reason || 'Arquivo não é um XLSX válido.');
      return;
    }
    setFile(selected);
    setStage('encoding');
    setErrorMsg(null);
    try {
      const b64 = await fileToBase64(selected);
      setBase64(b64);
      await runServerParse(b64, sheetFilter);
    } catch (err) {
      logger.error('[edge-cutover] file encoding error', err);
      setStage('error');
      setErrorMsg('Falha ao codificar arquivo');
      toast.error('Falha ao preparar arquivo');
    }
  }, [runServerParse, sheetFilter]);

  const handleSheetFilterChange = useCallback(async (v: string) => {
    setSheetFilter(v);
    if (base64) await runServerParse(base64, v);
  }, [base64, runServerParse]);

  const recordsByType = useMemo(() => ({
    imobiliario: records.filter(r => r.consortiumType === 'imobiliario').length,
    auto: records.filter(r => r.consortiumType === 'auto').length,
    pesados: records.filter(r => r.consortiumType === 'pesados').length,
  }), [records]);

  const handleImport = useCallback(() => {
    if (records.length === 0) {
      toast.error('Nenhum registro válido para importar');
      return;
    }
    onImport(
      records,
      report ? { parserVersion: report.parserVersion, contentHash: report.contentHash } : undefined,
    );
    reset();
    onOpenChange(false);
  }, [records, report, onImport, reset, onOpenChange]);

  const busy = stage === 'encoding' || stage === 'parsing';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (busy) return; if (!open) reset(); onOpenChange(open); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Importar Excel · Parser institucional
          </DialogTitle>
          <DialogDescription>
            O arquivo é enviado ao pipeline canônico server-side. O navegador não
            interpreta nem normaliza assembleias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Arquivo Excel (.xlsx)</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center gap-3 p-card-md border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={busy}
                />
                {stage === 'encoding' ? (
                  <><Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Codificando arquivo…</span></>
                ) : stage === 'parsing' ? (
                  <><Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Parser institucional processando no servidor…</span></>
                ) : file ? (
                  <><FileSpreadsheet className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    </div></>
                ) : (
                  <><Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Clique para selecionar um arquivo .xlsx</span></>
                )}
              </label>
            </div>
          </div>

          {report && report.sheets && report.sheets.length > 1 && (
            <div>
              <Label>Aba da planilha</Label>
              <Select value={sheetFilter} onValueChange={handleSheetFilterChange} disabled={busy}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as abas ({report.sheets.length})</SelectItem>
                  {report.sheets.map(s => (
                    <SelectItem key={s.name} value={s.name}>
                      {s.name} ({s.records} registros)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {stage === 'error' && errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Falha no parsing server-side</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {stage === 'ready' && report && (
            <div className="space-y-3">
              {records.length > 0 ? (
                <Alert className="border-success/30 bg-success/10">
                  <Check className="h-4 w-4 text-success" />
                  <AlertDescription>
                    <span className="font-medium">{report.totalRecords} registros válidos</span>
                    {report.totalSkipped > 0 && (
                      <span className="text-muted-foreground"> · {report.totalSkipped} ignorados</span>
                    )}
                    {report.monthsDetected.length > 0 && (
                      <span className="block mt-1 text-xs">
                        Meses: <span className="font-mono">{report.monthsDetected.join(', ')}</span>
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Nenhum registro válido detectado pelo servidor.</AlertDescription>
                </Alert>
              )}

              {records.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {recordsByType.imobiliario > 0 && <Badge variant="secondary">Imobiliário: {recordsByType.imobiliario}</Badge>}
                  {recordsByType.auto > 0 && <Badge variant="secondary">Veículos: {recordsByType.auto}</Badge>}
                  {recordsByType.pesados > 0 && <Badge variant="secondary">Pesados: {recordsByType.pesados}</Badge>}
                </div>
              )}

              {report.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Avisos do parser ({report.warnings.length})</AlertTitle>
                  <AlertDescription className="text-xs space-y-0.5 max-h-32 overflow-y-auto">
                    {report.warnings.slice(0, 12).map((w, i) => <div key={i}>· {w}</div>)}
                    {report.warnings.length > 12 && (
                      <div className="text-muted-foreground">… e mais {report.warnings.length - 12}.</div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground border rounded-md p-2 space-y-0.5">
                <div>Parser: <span className="font-mono">{report.parserVersion}</span></div>
                <div>Hash: <span className="font-mono">{report.contentHash.slice(0, 16)}…</span></div>
                <div>Duração server-side: <span className="font-mono">{report.durationMs} ms</span></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={busy}>Cancelar</Button></DialogClose>
          <Button onClick={handleImport} disabled={records.length === 0 || busy} className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Previsualizar {records.length || ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
