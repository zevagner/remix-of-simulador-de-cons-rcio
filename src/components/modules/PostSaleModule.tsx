import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { EmptyStateMessage } from '@/components/ui/EmptyStateMessage';
import { ModuleSkeleton } from '@/components/ui/ModuleSkeleton';
import { Search, Briefcase, CalendarCheck, ChevronDown, Phone } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  usePostSaleClients, useActiveNextActions, useDeletePostSaleClient,
  useUpdatePostSaleClient, useCreatePostSaleEvent
} from '@/hooks/usePostSaleQueries';
import { useAssemblies } from '@/hooks/useAssemblies';
import { CONSORTIUM_TYPE_LABELS, type ConsortiumType } from '@/types/consortium';
import {
  STATUS_LABELS, STATUS_EMOJI,
} from './postSale/postSaleConstants';
import { computeClientAlerts } from './postSale/postSaleAlerts';
import { getClientRisk, type RiskLevel } from './postSale/postSaleRisk';
import { getNextActionUrgency } from './postSale/postSaleNextAction';
import { computeClientPriority, type PriorityLevel } from './postSale/postSalePriority';
import { scorePostSaleClient } from '@/utils/clientScoring';
import {
  getClientMoment, getOpportunityChips, MOMENT_META,
  type Moment, type OpportunityChip,
} from './postSale/postSaleMoments';
import { PostSaleClientDetail } from './postSale/PostSaleClientDetail';
import { PostSaleOnboardingModal } from './postSale/PostSaleOnboardingModal';
import { ClientCard } from './postSale/ClientCard';
import { suggestPostSaleAction } from '@/utils/nextActionSuggestion';
import type { PostSaleClient, PostSaleStatus, PostSaleEvent } from '@/services/postSale';
import { useTrackModuleAccess } from '@/hooks/useTrackModuleAccess';
import { computePostSalePortfolioSignals } from '@/utils/portfolioSignals';
import { PortfolioInsightsBar } from './pipeline/PortfolioInsightsBar';

const PRIORITY_FILTER_KEY = 'postSalePriorityFilter';
const TODAY_MODE_KEY = 'postSaleTodayMode';

const isValidPriorityFilter = (v: string | null): v is PriorityLevel | 'all' =>
  v === 'all' || v === 'alta' || v === 'media' || v === 'baixa';

export function PostSaleModule() {
  useTrackModuleAccess('postsale');
  const { data: clients = [], isLoading } = usePostSaleClients();
  const { data: nextActions = [] } = useActiveNextActions();
  const { assemblies } = useAssemblies();
  const deleteMutation = useDeletePostSaleClient();
  const updateMutation = useUpdatePostSaleClient();
  const createEvent = useCreatePostSaleEvent();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostSaleStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ConsortiumType | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>(() => {
    if (typeof window === 'undefined') return 'all';
    const saved = localStorage.getItem(PRIORITY_FILTER_KEY);
    return isValidPriorityFilter(saved) ? saved : 'all';
  });
  const [todayMode, setTodayMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(TODAY_MODE_KEY) === '1';
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PostSaleClient | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const clearDeleteTargetTimer = useRef<number | null>(null);

  // Persistência dos preferenciais do usuário (sem perder contexto após reload).
  useEffect(() => {
    localStorage.setItem(PRIORITY_FILTER_KEY, priorityFilter);
  }, [priorityFilter]);
  useEffect(() => {
    localStorage.setItem(TODAY_MODE_KEY, todayMode ? '1' : '0');
  }, [todayMode]);

  // Tick horário para forçar recálculo de alertas/risco baseados em "dias desde X".
  // Sem isso, useMemo congela o resultado de Date.now() até clients mudarem.
  const [timeTick, setTimeTick] = useState(0);
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (id !== null) return;
      id = setInterval(() => setTimeTick((t) => t + 1), 60 * 60 * 1000); // 1h
    };

    const stop = () => {
      if (id === null) return;
      clearInterval(id);
      id = null;
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    if (document.visibilityState === 'visible') start();

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => () => {
    if (clearDeleteTargetTimer.current) window.clearTimeout(clearDeleteTargetTimer.current);
  }, []);

  const scheduleDeleteTargetClear = () => {
    if (clearDeleteTargetTimer.current) window.clearTimeout(clearDeleteTargetTimer.current);
    clearDeleteTargetTimer.current = window.setTimeout(() => {
      setDeleteTarget(null);
      clearDeleteTargetTimer.current = null;
    }, 220);
  };

  const releaseStaleRadixPointerLock = () => {
    if (typeof document === 'undefined') return;
    requestAnimationFrame(() => {
      const hasOpenBlockingLayer = document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-radix-popper-content-wrapper] [data-state="open"]',
      );
      if (!hasOpenBlockingLayer && document.body.style.pointerEvents === 'none') {
        document.body.style.removeProperty('pointer-events');
      }
    });
  };

  const requestDeleteClient = useCallback((client: PostSaleClient) => {
    if (clearDeleteTargetTimer.current) window.clearTimeout(clearDeleteTargetTimer.current);
    clearDeleteTargetTimer.current = null;
    setDeleteTarget(client);
    setDeleteDialogOpen(true);
  }, []);

  // Wave 2 — render stabilization: callbacks de linha estáveis evitam invalidar
  // o memo de ClientCard quando outro estado do módulo (filtros/busca) muda.
  const handleOpenDetail = useCallback((id: string) => setSelectedId(id), []);

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (deleteMutation.isPending) return;
    setDeleteDialogOpen(open);
    if (!open) scheduleDeleteTargetClear();
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const clientToDelete = deleteTarget;
    setDeleteDialogOpen(false);
    window.setTimeout(() => {
      deleteMutation.mutate(clientToDelete.id, {
        onSuccess: () => {
          toast.success('Cliente removido da carteira.');
        },
        onError: (err) => {
          toast.error('Não foi possível remover o cliente.', {
            description: err instanceof Error ? err.message : undefined,
          });
        },
        onSettled: () => {
          scheduleDeleteTargetClear();
          releaseStaleRadixPointerLock();
        },
      });
    }, 180);
  };

  // Indexa próxima ação ativa por client_id (mais próxima)
  const nextActionByClient = useMemo(() => {
    const map = new Map<string, PostSaleEvent>();
    for (const ev of nextActions) {
      if (!map.has(ev.client_id)) map.set(ev.client_id, ev);
    }
    return map;
  }, [nextActions]);

  // Mapa (tipo:grupo) → próxima assembleia, derivado das assembleias já carregadas.
  // Reaproveita a fonte única do módulo Assembleias — sem nova query.
  const assemblyMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assemblies) {
      if (!a.nextAssemblyDate) continue;
      const key = `${a.consortiumType}:${a.groupNumber}`;
      const existing = map.get(key);
      // Mantém a data mais próxima do futuro (menor timestamp ≥ hoje).
      if (!existing || new Date(a.nextAssemblyDate).getTime() < new Date(existing).getTime()) {
        map.set(key, a.nextAssemblyDate);
      }
    }
    return map;
  }, [assemblies]);

  const enriched = useMemo(() => {
    const list = clients.map((c) => {
      const risk = getClientRisk(c);
      const alerts = computeClientAlerts(c);
      const nextAction = nextActionByClient.get(c.id) ?? null;
      const isOpportunity = c.status === 'contemplado' || c.status === 'quitado';
      const priority = computeClientPriority(c, nextAction);
      const unified = scorePostSaleClient(c, nextAction);
      const nextAssemblyDate = c.group_number
        ? assemblyMap.get(`${c.consortium_type}:${c.group_number}`) ?? null
        : null;
      const moment = getClientMoment({ client: c, risk, unified, nextAssemblyDate });
      const opportunityChips = getOpportunityChips(c, unified, !!nextAction);
      // Data da próxima ação (epoch ms) — usada como tiebreaker da fila.
      let nextActionDueMs = Number.POSITIVE_INFINITY;
      if (nextAction) {
        const meta = nextAction.metadata as Record<string, unknown> | null;
        const due = String(meta?.due_date ?? nextAction.event_date);
        const t = new Date(due).getTime();
        if (!Number.isNaN(t)) nextActionDueMs = t;
      }
      return {
        client: c, risk, alerts, nextAction, isOpportunity, priority,
        nextActionDueMs, unified, nextAssemblyDate, moment, opportunityChips,
      };
    });
    // Ordenação inteligente:
    //   1) score desc · 2) próxima ação mais antiga primeiro · 3) nome asc.
    list.sort((a, b) => {
      if (b.priority.score !== a.priority.score) return b.priority.score - a.priority.score;
      if (a.nextActionDueMs !== b.nextActionDueMs) return a.nextActionDueMs - b.nextActionDueMs;
      return a.client.client_name.localeCompare(b.client.client_name);
    });
    return list;
  }, [clients, nextActionByClient, assemblyMap, timeTick]);

  type EnrichedItem = (typeof enriched)[number];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(({ client, risk, priority, nextAction }) => {
      if (statusFilter !== 'all' && client.status !== statusFilter) return false;
      if (typeFilter !== 'all' && client.consortium_type !== typeFilter) return false;
      if (riskFilter !== 'all' && risk.level !== riskFilter) return false;
      if (priorityFilter !== 'all' && priority.level !== priorityFilter) return false;
      if (q && !client.client_name.toLowerCase().includes(q)) return false;
      // Modo "O que fazer hoje": alta prioridade OU ação atrasada/hoje.
      if (todayMode) {
        if (priority.level === 'alta') return true;
        if (nextAction) {
          const meta = nextAction.metadata as Record<string, unknown> | null;
          const due = String(meta?.due_date ?? nextAction.event_date);
          const u = getNextActionUrgency(due);
          if (u === 'overdue' || u === 'today') return true;
        }
        return false;
      }
      return true;
    });
  }, [enriched, search, statusFilter, typeFilter, riskFilter, priorityFilter, todayMode]);

  const counts = useMemo(() => {
    const acc = {
      ativo: 0, contemplado: 0, quitado: 0, inadimplente: 0,
      risk: 0, opportunities: 0, pendingActions: 0,
      preAssembly: 0, recentlyContemplated: 0, dormant: 0, noNextAction: 0,
    };
    enriched.forEach(({ client, risk, isOpportunity, nextAction, moment }) => {
      acc[client.status] += 1;
      if (risk.level === 'critical') acc.risk += 1;
      if (isOpportunity) acc.opportunities += 1;
      if (nextAction) acc.pendingActions += 1;
      if (moment === 'pre_assembly') acc.preAssembly += 1;
      if (moment === 'recently_contemplated') acc.recentlyContemplated += 1;
      if (moment === 'dormant') acc.dormant += 1;
      if (!nextAction && client.status === 'ativo') acc.noNextAction += 1;
    });
    return acc;
  }, [enriched]);

  // Onda 5 — sinais estratégicos macro do Pós-venda.
  const portfolioSignals = useMemo(() => computePostSalePortfolioSignals({
    total: enriched.length,
    riskCount: counts.risk,
    preAssemblyCount: counts.preAssembly,
    recentlyContemplatedCount: counts.recentlyContemplated,
    dormantCount: counts.dormant,
    noNextActionCount: counts.noNextAction,
  }), [enriched.length, counts.risk, counts.preAssembly, counts.recentlyContemplated, counts.dormant, counts.noNextAction]);

  const callQueue = useMemo(() => {
    return enriched
      .filter((it) => (
        it.risk.level === 'critical' ||
        it.moment === 'pre_assembly' ||
        (it.moment === 'recently_contemplated' && !it.nextAction) ||
        it.priority.level === 'alta'
      ))
      .slice(0, 5);
  }, [enriched]);

  const handleQuickContact = useCallback((client: PostSaleClient) => {
    const today = new Date().toISOString().slice(0, 10);
    createEvent.mutate({
      client_id: client.id,
      user_id: client.user_id,
      event_type: 'contact',
      description: 'Contato realizado (Fila rápida)',
      event_date: today,
    });
    updateMutation.mutate({
      id: client.id,
      fields: { last_contact_date: today },
    });
    toast.success(`Contato com ${client.client_name} registrado ✓`);
  }, [createEvent, updateMutation]);

  const selected = useMemo(
    () => clients.find(c => c.id === selectedId) ?? null,
    [clients, selectedId],
  );

  if (isLoading) return <ModuleSkeleton />;

  return (
    <div className="space-y-5 animate-fade-in">
      <ModuleHeader title="Pós-venda" subtitle="Acompanhe clientes ativos e gere novas oportunidades" moduleId="post-sale" hideTip />

      {/* Onda 5 — Visão estratégica leve do pós-venda (silenciosa, máx. 2). */}
      {portfolioSignals.length > 0 && (
        <PortfolioInsightsBar signals={portfolioSignals} />
      )}

      {/* Fila de ligações rápida */}
      {callQueue.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-primary">
            <Phone className="h-4 w-4" />
            Ligar hoje
          </h2>
          <div className="divide-y divide-primary/10">
            {callQueue.map((it) => {
              const suggestion = suggestPostSaleAction(it.client, it.nextAction, it.unified);
              let reason = "🔴 Alta prioridade";
              if (it.risk.level === 'critical') reason = "⚠️ Em risco — atender hoje";
              else if (it.moment === 'pre_assembly') reason = "⏰ Assembleia próxima — verificar lance";
              else if (it.moment === 'recently_contemplated') reason = "🏆 Recém contemplado — orientar próximos passos";

              return (
                <div key={it.client.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{it.client.client_name}</p>
                    <p className="text-xs text-muted-foreground">{reason}</p>
                    <p className="text-[10px] text-primary/70 font-medium uppercase mt-0.5">
                      💡 {suggestion.text}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary shrink-0"
                    onClick={() => handleQuickContact(it.client)}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Registrar contato
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPIs — clicáveis: cada cartão alterna o filtro correspondente da lista */}
      <section>
        <div className="metric-row" style={{ ['--metric-cols' as never]: 4 }}>
          <KpiCell
            label="Ativos"
            value={counts.ativo}
            emoji="🟢"
            active={statusFilter === 'ativo'}
            onClick={() => {
              setRiskFilter('all');
              setStatusFilter((s) => (s === 'ativo' ? 'all' : 'ativo'));
            }}
          />
          <KpiCell
            label="Contemplados"
            value={counts.contemplado}
            emoji="🏆"
            active={statusFilter === 'contemplado'}
            onClick={() => {
              setRiskFilter('all');
              setStatusFilter((s) => (s === 'contemplado' ? 'all' : 'contemplado'));
            }}
          />
          <KpiCell
            label="Quitados"
            value={counts.quitado}
            emoji="✅"
            active={statusFilter === 'quitado'}
            onClick={() => {
              setRiskFilter('all');
              setStatusFilter((s) => (s === 'quitado' ? 'all' : 'quitado'));
            }}
          />
          <KpiCell
            label="Em risco"
            value={counts.risk}
            emoji="🚨"
            highlight={counts.risk > 0}
            active={riskFilter === 'critical'}
            onClick={() => {
              setStatusFilter('all');
              setRiskFilter((r) => (r === 'critical' ? 'all' : 'critical'));
            }}
          />
        </div>
      </section>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {(Object.keys(STATUS_LABELS) as PostSaleStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{STATUS_EMOJI[s]} {STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tipos</SelectItem>
                {(Object.keys(CONSORTIUM_TYPE_LABELS) as ConsortiumType[]).map(t => (
                  <SelectItem key={t} value={t}>{CONSORTIUM_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as typeof riskFilter)}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos riscos</SelectItem>
                <SelectItem value="critical">🚨 Em risco</SelectItem>
                <SelectItem value="warning">⚠️ Atenção</SelectItem>
                <SelectItem value="normal">✅ Em dia</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as typeof priorityFilter)}>
              <SelectTrigger className="w-full sm:w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas prioridades</SelectItem>
                <SelectItem value="alta">🔴 Apenas alta prioridade</SelectItem>
                <SelectItem value="media">🟡 Média</SelectItem>
                <SelectItem value="baixa">🟢 Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista — sem Card wrapper (Wave PostSale: surface única) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap px-1">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Briefcase className="h-4 w-4 text-primary" />
            Clientes <span className="text-muted-foreground font-normal">({filtered.length})</span>
          </h2>
          <Button
            size="sm"
            variant={todayMode ? 'default' : 'outline'}
            className="h-8 gap-1.5 text-xs"
            onClick={() => setTodayMode((v) => !v)}
            title="Mostra apenas alta prioridade e ações de hoje/atrasadas"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            {todayMode ? 'Vendo: O que fazer hoje' : 'O que fazer hoje'}
          </Button>
        </div>
        {filtered.length === 0 ? (
          <EmptyStateMessage
            title="Você ainda não tem clientes em acompanhamento"
            message="Feche uma proposta e ative o pós-venda para começar."
          />
        ) : (
          <MomentGroupedList
            items={filtered}
            onOpenDetail={handleOpenDetail}
            onRequestDelete={requestDeleteClient}
          />
        )}
      </section>

      <PostSaleClientDetail
        client={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
        {deleteTarget && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p>Essa ação removerá o cliente da carteira de pós-venda.</p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Nome:</span>{' '}
                    <span className="font-semibold text-foreground">{deleteTarget.client_name}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Esta ação não poderá ser desfeita.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Excluindo…' : 'Excluir cliente'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

      <PostSaleOnboardingModal clientsCount={clients.length} />
    </div>
  );
}

function KpiCell({
  label, value, emoji, highlight, active, onClick,
}: {
  label: string; value: number; emoji: string;
  highlight?: boolean; active?: boolean; onClick?: () => void;
}) {
  const emphasis = active ? 'primary' : highlight ? 'primary' : undefined;
  if (!onClick) {
    return (
      <div className="metric-cell" data-emphasis={emphasis}>
        <div className="metric-cell-label">{emoji} {label}</div>
        <div className="metric-cell-value">{value}</div>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      data-emphasis={emphasis}
      aria-pressed={!!active}
      className={`metric-cell text-left transition-colors cursor-pointer hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md ${
        active ? 'ring-2 ring-primary/60' : ''
      }`}
    >
      <div className="metric-cell-label">{emoji} {label}</div>
      <div className="metric-cell-value">{value}</div>
    </button>
  );
}

// ClientCard + NextActionStrip extraídos para ./postSale/ClientCard.tsx
// (Wave 2 — render stabilization: callbacks por id estáveis + React.memo).

// ─── Lista agrupada por momento de relacionamento ───
interface MomentItem {
  client: PostSaleClient;
  risk: ReturnType<typeof getClientRisk>;
  nextAction: PostSaleEvent | null;
  isOpportunity: boolean;
  priority: ReturnType<typeof computeClientPriority>;
  nextAssemblyDate: string | null;
  moment: Moment;
  opportunityChips: OpportunityChip[];
}

function MomentGroupedList({
  items, onOpenDetail, onRequestDelete,
}: {
  items: MomentItem[];
  onOpenDetail: (id: string) => void;
  onRequestDelete: (c: PostSaleClient) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<Moment, MomentItem[]>();
    for (const it of items) {
      const arr = map.get(it.moment) ?? [];
      arr.push(it);
      map.set(it.moment, arr);
    }
    return map;
  }, [items]);

  const sections = (Object.keys(MOMENT_META) as Moment[])
    .map((m) => ({ moment: m, meta: MOMENT_META[m], items: grouped.get(m) ?? [] }))
    .filter((s) => s.items.length > 0)
    .sort((a, b) => a.meta.order - b.meta.order);

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <MomentSection
          key={section.moment}
          meta={section.meta}
          items={section.items}
          onOpenDetail={onOpenDetail}
          onRequestDelete={onRequestDelete}
        />
      ))}
    </div>
  );
}

// Wave 2 — render stabilization: memo evita re-render do collapsible inteiro
// quando outras seções mudam. Callbacks já chegam estáveis do parent
// (id-based), então repassamos como referência — sem inline arrows que
// invalidariam o memo de ClientCard.
const MomentSection = memo(function MomentSection({
  meta, items, onOpenDetail, onRequestDelete,
}: {
  meta: typeof MOMENT_META[Moment];
  items: MomentItem[];
  onOpenDetail: (id: string) => void;
  onRequestDelete: (c: PostSaleClient) => void;
}) {
  return (
    <Collapsible defaultOpen={meta.defaultOpen} className="group">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">{meta.emoji}</span>
            <span className="font-semibold text-sm text-foreground truncate">{meta.label}</span>
            <Badge variant="outline" className="text-caption">{items.length}</Badge>
            <span className="text-caption text-muted-foreground hidden sm:inline truncate">
              · {meta.description}
            </span>
          </div>
          <ChevronDown
            className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1.5 mt-1.5">
          {items.map((it) => (
            <ClientCard
              key={it.client.id}
              client={it.client}
              risk={it.risk}
              nextAction={it.nextAction}
              isOpportunity={it.isOpportunity}
              priority={it.priority}
              nextAssemblyDate={it.nextAssemblyDate}
              opportunityChips={it.opportunityChips}
              onOpenDetail={onOpenDetail}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
