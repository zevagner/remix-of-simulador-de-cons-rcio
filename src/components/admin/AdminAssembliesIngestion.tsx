/**
 * AdminAssembliesIngestion — Centro Operacional Administrativo de Assembleias.
 *
 * Onda: Assemblies Admin Ingestion Migration.
 * Move toda a operação administrativa (upload Excel, colar dados, recarregar,
 * limpar por tipo, limpar tudo, retenção de 18 meses) para o Admin.
 * A UX consultiva (módulo Assembleias / Estudo de Lances) deixa de expor CRUD.
 *
 * Princípios:
 *  - Reusa serviços canônicos (`@/services/assemblies`) — sem nova fonte de verdade.
 *  - Auditoria: cada operação grava `audit_logs` (entity = `assemblies_ingestion`).
 *  - Observabilidade: emite `runtimeMetrics` com duração da ingestão.
 *  - RLS já garante que apenas admins escrevem; este painel só renderiza para `isAdmin`.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AdminPageHeader } from './AdminPageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Database, FileUp, Upload, RefreshCw, Trash2, Loader2, ShieldCheck,
  Calendar, History, AlertTriangle, FileSpreadsheet, Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAssemblies, ASSEMBLIES_QUERY_KEY } from '@/hooks/useAssemblies';
import {
  upsertAssemblies, deleteAllAssemblies, deleteAssembliesByType, deleteAssembliesByMonths,
} from '@/services/assemblies';
import { initializeFromExcel } from '@/utils/excelLoader';
import {
  getUniqueGroups, addAssembliesWithPruning,
  getUniqueMonths, MAX_MONTHS_TO_KEEP,
} from '@/utils/assemblyData';
import { ConsortiumType, CONSORTIUM_TYPE_LABELS, AssemblyRecord } from '@/types/consortium';
import { ExcelFileImport } from '@/components/modules/assemblies/ExcelFileImport';
import { parsePasteServer } from '@/services/assembliesImport';
import { logAction, fetchAuditLogs, type AuditLogRecord } from '@/services/auditLog';
import { emitMetric } from '@/lib/runtimeMetrics';
import { logger } from '@/utils/logger';
import { lazy, Suspense } from 'react';
import { DestructiveConfirmDialog } from '@/components/ui/destructive-confirm-dialog';
const AdminAssembliesImportHistory = lazy(() => import('./AdminAssembliesImportHistory'));
const EdgeImportPreviewDialog = lazy(() => import('./EdgeImportPreviewDialog'));

type ClearConfirm =
  | { kind: 'type'; type: ConsortiumType }
  | { kind: 'all' };

const TYPES: ConsortiumType[] = ['imobiliario', 'auto', 'pesados'];

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtDateTime(iso: string): string {
  try { return new Date(iso).toLocaleString('pt-BR'); } catch { return iso; }
}

export default function AdminAssembliesIngestion() {
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const { assemblies, isLoading: isQueryLoading } = useAssemblies();

  const [isMutating, setIsMutating] = useState(false);
  const [isFileOpen, setIsFileOpen] = useState(false);
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [pasteType, setPasteType] = useState<ConsortiumType>('imobiliario');
  const [pasteData, setPasteData] = useState('');
  const [isParsingPaste, setIsParsingPaste] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [lastIngestionMs, setLastIngestionMs] = useState<number | null>(null);

  // Edge cutover: payload pendente para preview→commit institucional.
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [edgePending, setEdgePending] = useState<{ records: AssemblyRecord[]; source: 'file' | 'paste'; parserMeta?: { parserVersion?: string; contentHash?: string } } | null>(null);
  const [historyReloadKey, setHistoryReloadKey] = useState(0);
  const [clearConfirm, setClearConfirm] = useState<ClearConfirm | null>(null);

  const isLoading = isQueryLoading || isMutating;

  const stats = useMemo(() => {
    return TYPES.map(type => {
      const ofType = assemblies.filter(a => a.consortiumType === type);
      const months = getUniqueMonths(ofType);
      return {
        type,
        label: CONSORTIUM_TYPE_LABELS[type],
        groups: getUniqueGroups(assemblies, type).length,
        rows: ofType.length,
        months: months.length,
        latestMonth: months[months.length - 1] ?? '—',
      };
    });
  }, [assemblies]);

  const reloadLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await fetchAuditLogs({ entity: 'assemblies_ingestion', limit: 50 });
      setAuditLogs(logs);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => { void reloadLogs(); }, [reloadLogs]);

  const refetchAssemblies = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ASSEMBLIES_QUERY_KEY });
  }, [queryClient]);

  // ─── Operações ───────────────────────────────────────────────

  const runReloadFromExcel = useCallback(async () => {
    if (!isAdmin) return;
    setIsMutating(true);
    const t0 = performance.now();
    try {
      const result = await initializeFromExcel([]);
      if (result.stats.total > 0 && user) {
        await upsertAssemblies(result.assemblies, user.userId);
        await refetchAssemblies();
        const dur = Math.round(performance.now() - t0);
        setLastIngestionMs(dur);
        emitMetric({
          type: 'interaction',
          name: 'assemblies.reload_excel',
          value: dur,
          module: 'admin-assemblies',
          meta: { rows: result.stats.total },
        });
        logAction({
          action: 'reload_assemblies_excel',
          entity: 'assemblies_ingestion',
          metadata: { rows: result.stats.total, durationMs: dur, ...result.stats },
        });
        toast.success(`Carregados ${result.stats.total} registros em ${formatMs(dur)}`);
      } else {
        toast.error('Nenhum dado encontrado no Excel');
      }
    } catch (err) {
      logger.error('[admin-assemblies] reload error', err);
      toast.error('Erro ao recarregar Excel');
    } finally {
      setIsMutating(false);
      void reloadLogs();
    }
  }, [isAdmin, user, refetchAssemblies, reloadLogs]);

  /**
   * Edge cutover: novo entrypoint canônico. Recebe records (file ou paste)
   * e abre o dialog institucional de preview→commit.
   */
  const openEdgePreview = useCallback((records: AssemblyRecord[], source: 'file' | 'paste', parserMeta?: { parserVersion?: string; contentHash?: string }) => {
    if (!isAdmin || !user) return;
    if (records.length === 0) { toast.error('Nenhum registro válido'); return; }
    setEdgePending({ records, source, parserMeta });
    setEdgeDialogOpen(true);
  }, [isAdmin, user]);

  /**
   * @deprecated Pipeline legacy client-side (upsertAssemblies direto).
   * Mantido apenas como fallback técnico — não é exposto na UI principal.
   * Removerá writes client-side em onda futura (ver `mem://constraints/data/assemblies-legacy-frozen`).
   */
  const runFileImportLegacy = useCallback(async (records: AssemblyRecord[]) => {
    if (!isAdmin || !user) return;
    setIsMutating(true);
    const t0 = performance.now();
    try {
      const result = addAssembliesWithPruning(assemblies, records);
      await upsertAssemblies(result.assemblies, user.userId);
      if (result.prunedMonths.length > 0) {
        const types = new Set(records.map(a => a.consortiumType));
        for (const t of types) await deleteAssembliesByMonths(t, result.prunedMonths);
      }
      await refetchAssemblies();
      const dur = Math.round(performance.now() - t0);
      setLastIngestionMs(dur);
      logAction({
        action: 'import_assemblies_file',
        entity: 'assemblies_ingestion',
        metadata: { rows: records.length, durationMs: dur, deprecated: true },
      });
      toast.success(`[legacy] Importados ${result.added}+${result.updated} em ${formatMs(dur)}`);
    } catch (err) {
      logger.error('[admin-assemblies] legacy file import error', err);
      toast.error('Erro ao importar arquivo (legacy)');
    } finally {
      setIsMutating(false);
      void reloadLogs();
    }
  }, [isAdmin, user, assemblies, refetchAssemblies, reloadLogs]);

  const handlePasteChange = useCallback((value: string) => {
    setPasteData(value);
  }, []);

  const handlePasteOpenPreview = useCallback(async () => {
    const text = pasteData.trim();
    if (!text) { toast.error('Cole dados antes de prosseguir'); return; }
    setIsParsingPaste(true);
    const t0 = performance.now();
    try {
      const res = await parsePasteServer(text, pasteType);
      const dur = Math.round(performance.now() - t0);
      emitMetric({
        type: 'interaction',
        name: 'assemblies.parse_paste_server',
        value: dur,
        module: 'admin-assemblies',
        meta: {
          rows: res.records.length,
          parserVersion: res.report.parserVersion,
          warnings: res.report.warnings.length,
        },
      });
      if (res.records.length === 0) {
        toast.error('Servidor não detectou registros válidos');
        return;
      }
      setIsPasteOpen(false);
      openEdgePreview(res.records, 'paste', { parserVersion: res.report.parserVersion, contentHash: res.report.contentHash });
    } catch (err) {
      logger.error('[edge-cutover] paste server parse error', err);
      toast.error('Falha no parser institucional');
    } finally {
      setIsParsingPaste(false);
    }
  }, [pasteData, pasteType, openEdgePreview]);

  const runClearType = useCallback(async (type: ConsortiumType) => {
    if (!isAdmin) return;
    setIsMutating(true);
    const t0 = performance.now();
    try {
      await deleteAssembliesByType(type);
      await refetchAssemblies();
      const dur = Math.round(performance.now() - t0);
      emitMetric({
        type: 'interaction', name: 'assemblies.clear_type', value: dur,
        module: 'admin-assemblies', meta: { consortiumType: type },
      });
      logAction({
        action: 'clear_assemblies_type',
        entity: 'assemblies_ingestion',
        metadata: { consortiumType: type, durationMs: dur },
      });
      toast.success(`${CONSORTIUM_TYPE_LABELS[type]} removido`);
    } catch (err) {
      logger.error('[admin-assemblies] clear type error', err);
      toast.error('Erro ao limpar tipo');
    } finally {
      setIsMutating(false);
      void reloadLogs();
    }
  }, [isAdmin, refetchAssemblies, reloadLogs]);

  const runClearAll = useCallback(async () => {
    if (!isAdmin) return;
    setIsMutating(true);
    const t0 = performance.now();
    try {
      await deleteAllAssemblies();
      await refetchAssemblies();
      const dur = Math.round(performance.now() - t0);
      emitMetric({
        type: 'interaction', name: 'assemblies.clear_all', value: dur,
        module: 'admin-assemblies',
      });
      logAction({
        action: 'clear_all_assemblies',
        entity: 'assemblies_ingestion',
        metadata: { durationMs: dur },
      });
      toast.success('Base de assembleias zerada');
    } catch (err) {
      logger.error('[admin-assemblies] clear all error', err);
      toast.error('Erro ao limpar base');
    } finally {
      setIsMutating(false);
      void reloadLogs();
    }
  }, [isAdmin, refetchAssemblies, reloadLogs]);

  // ─── Render ──────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acesso restrito</AlertTitle>
        <AlertDescription>Esta área é exclusiva de administradores.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminPageHeader
        title="Operações de Assembleias"
        subtitle="Pipeline administrativo de ingestão, validação e governança da base operacional"
      />
      {lastIngestionMs !== null && (
        <div className="flex justify-end">
          <Badge variant="secondary" className="gap-1">
            <Activity className="h-3 w-3" /> Última operação: {formatMs(lastIngestionMs)}
          </Badge>
        </div>
      )}

      {/* Saúde da base */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Estado da base canônica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.map(s => (
              <div key={s.type} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{s.label}</span>
                  <Badge variant="outline">{s.groups} grupos</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{s.rows} registros · {s.months} meses</p>
                <p className="text-xs text-muted-foreground">Último mês: <span className="font-mono">{s.latestMonth}</span></p>
                <Button
                  variant="ghost" size="sm" className="w-full mt-1 h-7 text-xs gap-1"
                  onClick={() => setClearConfirm({ kind: 'type', type: s.type })} disabled={isLoading || s.rows === 0}
                >
                  <Trash2 className="h-3 w-3" /> Limpar {s.label}
                </Button>
              </div>
            ))}
          </div>
          <Alert className="mt-3 border-primary/20 bg-primary/5">
            <Calendar className="h-4 w-4 text-primary" />
            <AlertTitle>Política de retenção</AlertTitle>
            <AlertDescription>
              O sistema mantém automaticamente apenas os <strong>{MAX_MONTHS_TO_KEEP} meses mais recentes</strong>
              {' '}por tipo. Meses mais antigos são removidos durante importações.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Ações operacionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações operacionais</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => setIsFileOpen(true)} disabled={isLoading} className="gap-2">
            <FileUp className="h-4 w-4" /> Upload Excel
          </Button>
          <Dialog open={isPasteOpen} onOpenChange={setIsPasteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isLoading} className="gap-2">
                <Upload className="h-4 w-4" /> Colar dados
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Importar dados colados</DialogTitle>
                <DialogDescription>Cole linhas tab-separadas (estilo Excel) para o tipo selecionado.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Tipo de Consórcio</Label>
                  <Select value={pasteType} onValueChange={(v) => setPasteType(v as ConsortiumType)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map(t => (
                        <SelectItem key={t} value={t}>{CONSORTIUM_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dados</Label>
                  <Textarea
                    value={pasteData}
                    onChange={(e) => handlePasteChange(e.target.value)}
                    placeholder="Cole as linhas aqui…"
                    className="min-h-[160px] font-mono text-xs mt-1"
                    disabled={isParsingPaste}
                  />
                  {pasteData.trim() && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {pasteData.trim().split(/\r?\n/).length} linhas · parsing institucional no servidor
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" disabled={isParsingPaste}>Cancelar</Button></DialogClose>
                <Button onClick={handlePasteOpenPreview} disabled={!pasteData.trim() || isParsingPaste || isLoading} className="gap-2">
                  {isParsingPaste
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Parsing servidor…</>
                    : <><ShieldCheck className="h-4 w-4" /> Previsualizar</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={runReloadFromExcel} disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Recarregar do Excel base
          </Button>
          <Button variant="destructive" onClick={() => setClearConfirm({ kind: 'all' })} disabled={isLoading} className="gap-2 ml-auto">
            <Trash2 className="h-4 w-4" /> Zerar tudo
          </Button>
        </CardContent>
      </Card>

      {/* Auditoria */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" /> Histórico de operações
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={reloadLogs} disabled={isLoadingLogs} className="gap-1">
            <RefreshCw className={`h-3 w-3 ${isLoadingLogs ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma operação registrada ainda.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {auditLogs.map(log => {
                const meta = log.metadata ?? {};
                const rows = (meta as Record<string, unknown>).rows;
                const dur = (meta as Record<string, unknown>).durationMs;
                const consType = (meta as Record<string, unknown>).consortiumType as string | undefined;
                return (
                  <div key={log.id} className="border rounded-md p-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="font-mono">{log.action}</Badge>
                      <span className="text-muted-foreground">{fmtDateTime(log.created_at)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                      {typeof rows === 'number' && <span>linhas: <strong>{rows}</strong></span>}
                      {typeof dur === 'number' && <span>duração: <strong>{formatMs(dur)}</strong></span>}
                      {consType && <span>tipo: <strong>{consType}</strong></span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <AdminAssembliesImportHistory
          key={historyReloadKey}
          onRolledBack={() => { void refetchAssemblies(); void reloadLogs(); setHistoryReloadKey(k => k + 1); }}
        />
      </Suspense>

      <ExcelFileImport
        isOpen={isFileOpen}
        onOpenChange={setIsFileOpen}
        onImport={(records, parserMeta) => openEdgePreview(records, 'file', parserMeta)}
      />

      {edgePending && (
        <Suspense fallback={null}>
          <EdgeImportPreviewDialog
            isOpen={edgeDialogOpen}
            onOpenChange={(v) => {
              setEdgeDialogOpen(v);
              if (!v) setEdgePending(null);
            }}
            records={edgePending.records}
            source={edgePending.source}
            parserMeta={edgePending.parserMeta}
            onCommitted={() => {
              void refetchAssemblies();
              void reloadLogs();
              setHistoryReloadKey(k => k + 1);
              setPasteData('');
            }}
          />
        </Suspense>
      )}

      <DestructiveConfirmDialog
        open={clearConfirm !== null}
        onOpenChange={(o) => { if (!o) setClearConfirm(null); }}
        title={
          clearConfirm?.kind === 'type'
            ? `Remover todos os dados de "${CONSORTIUM_TYPE_LABELS[clearConfirm.type]}"?`
            : 'Zerar TODA a base de assembleias?'
        }
        description={
          clearConfirm?.kind === 'type'
            ? `Esta ação é irreversível e removerá todos os registros, grupos e histórico de ${CONSORTIUM_TYPE_LABELS[clearConfirm.type]} da base canônica.`
            : 'Esta ação é irreversível e removerá todos os registros de assembleias (Imobiliário, Auto e Pesados) da base canônica.'
        }
        loading={isMutating}
        confirmLabel={clearConfirm?.kind === 'type' ? 'Excluir tipo' : 'Zerar tudo'}
        onConfirm={async () => {
          const c = clearConfirm;
          if (!c) return;
          setClearConfirm(null);
          if (c.kind === 'type') await runClearType(c.type);
          else await runClearAll();
        }}
      />
    </div>
  );
}
