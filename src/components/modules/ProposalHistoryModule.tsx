/**
 * Acompanhamento Module — Sales Pipeline
 * Kanban board with 6 columns: Prospecção → Aguardando Retorno → Em Avaliação → Proposta Ajustada → Fechado → Perdido
 * Features: drag-and-drop, quick create, inline editing, delete confirmation, quick advance.
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { logger } from '@/utils/logger';
import {
  Flame, Clock, Search, ChevronLeft, ChevronRight, BarChart3, Archive, ArrowRight,
} from 'lucide-react';
import { copyToClipboard } from '@/utils/clipboard';
import {
  type ProposalRecord, type ProposalStatus, type UpdateProposalFields,
  PROPOSALS_PAGE_LIMIT,
} from '@/services/proposals';
import {
  useProposalsCache, useUpdateProposalStatus, useDeleteProposal,
  useUpdateProposal, useUpdateProposalNotes, useCreateProposal,
  useUpdateProposalStatusWithAction,
} from '@/hooks/useProposalsQueries';
import { useProposalsPage } from '@/hooks/usePaginatedQueries';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { EmptyStateMessage } from '@/components/ui/EmptyStateMessage';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import { scoreAndSortProposals, type ProposalWithPriority } from '@/utils/proposalPriority';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/services/analyticsTracker';
import { useIsMobile } from '@/hooks/use-mobile';

// DnD Kit
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, closestCenter,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';

// Pipeline components
import {
  COLUMNS, KANBAN_COLUMNS, type NewLeadData,
  NewLeadModal, EditProposalModal, ProposalCardContent, DroppableKanbanColumn, DailyAgenda,
  NextActionModal, type NextActionResult, TERMINAL_STATUSES, AlertsCenter, PipelineMetricsModal,
  InvalidStatusBanner, CarteiraFilters, applyCarteiraFilters, EMPTY_FILTERS, type CarteiraFilterState,
} from './pipeline';
import { SalesForecastCard } from './pipeline/SalesForecastCard';
import { PortfolioInsightsBar } from './pipeline/PortfolioInsightsBar';
import { computePortfolioSignals } from '@/utils/portfolioSignals';
import { ClosePostSaleConfirmModal } from './postSale/ClosePostSaleConfirmModal';
import { findPostSaleByProposal } from '@/services/postSale';
import { consumeOpenNewLeadRequest } from '@/utils/pipelineLaunch';
import { applyLostReason, readLostReason, type LostReason, LOST_REASONS } from './pipeline/lostReasons';

const COLUMN_ACCENT_COLORS: Record<string, string> = {
  prospeccao: '#94a3b8',
  aguardando_retorno: '#60a5fa',
  em_avaliacao: '#fbbf24',
  proposta_ajustada: '#fb923c',
  fechado: '#22c55e',
  perdido: '#f87171',
};

export function ProposalHistoryModule() {
  // Paginação server-side: carrega só leads ATIVOS (200/página) para o Kanban.
  // Hard cap server-side é 200; "Carregar mais" cresce em blocos de 200.
  const [pageLimit, setPageLimit] = useState(PROPOSALS_PAGE_LIMIT);
  const { data: page, isLoading: loading } = useProposalsPage({
    onlyActive: true,
    limit: pageLimit,
    offset: 0,
  });
  const proposals = page?.rows ?? [];
  const totalActive = page?.total ?? 0;
  const updateStatusMutation = useUpdateProposalStatus();
  const updateStatusWithActionMutation = useUpdateProposalStatusWithAction();
  const deleteMutation = useDeleteProposal();
  const updateMutation = useUpdateProposal();
  const updateNotesMutation = useUpdateProposalNotes();
  const createMutation = useCreateProposal();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState('');
  const [bankFilters, setBankFilters] = useState<CarteiraFilterState>(EMPTY_FILTERS);
  const [mobileColumn, setMobileColumn] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ id: string; targetStatus: ProposalStatus } | null>(null);
  const [pendingClose, setPendingClose] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<Record<string, 'saving' | 'success' | 'error' | null>>({});
  const [view, setView] = useState<'active' | 'archived'>('active');

  const { navigateTo } = useModuleNavigation();
  const isMobile = useIsMobile();

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const scored = useMemo(() => scoreAndSortProposals(proposals), [proposals]);

  const filtered = useMemo(() => {
    let base = scored;
    if (filterClient.trim()) {
      const q = filterClient.toLowerCase();
      base = base.filter(p =>
        p.client_name.toLowerCase().includes(q) ||
        (p.client_phone ?? '').toLowerCase().includes(q) ||
        (p.notes ?? '').toLowerCase().includes(q)
      );
    }
    return applyCarteiraFilters(base, bankFilters);
  }, [scored, filterClient, bankFilters]);

  // Itens com problema (status desconhecido) — NÃO entram nas colunas do funil.
  const invalidItems = useMemo(
    () => filtered.filter(p => p.hasInvalidStatus),
    [filtered],
  );

  // Urgência por card: menor número = mais urgente. Usado para ordenar dentro
  // de cada coluna sem alterar prioridade (que continua refletida no badge).
  // 0 = ação atrasada · 1 = ação hoje · 2 = sem próxima ação · 3 = resto.
  const urgencyRank = useCallback((p: ProposalWithPriority): number => {
    if (p.next_contact_date) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const d = new Date(p.next_contact_date + 'T00:00:00');
      if (d.getTime() < today.getTime()) return 0;
      if (d.getTime() === today.getTime()) return 1;
    }
    if (!p.next_action_type) return 2;
    return 3;
  }, []);

  const byStatus = useMemo(() => {
    const map: Record<ProposalStatus, ProposalWithPriority[]> = {
      prospeccao: [],
      aguardando_retorno: [],
      em_avaliacao: [],
      proposta_ajustada: [],
      fechado: [],
      perdido: [],
    };
    for (const p of filtered) {
      if (p.hasInvalidStatus) continue; // isolado na faixa de problema
      const bucket = map[p.status];
      if (bucket) bucket.push(p);
    }
    // Ordena cada coluna por urgência (estável: mantém priorityScore como tiebreaker).
    for (const status of Object.keys(map) as ProposalStatus[]) {
      map[status].sort((a, b) => {
        const ra = urgencyRank(a); const rb = urgencyRank(b);
        if (ra !== rb) return ra - rb;
        return b.priorityScore - a.priorityScore;
      });
    }
    return map;
  }, [filtered, urgencyRank]);

  const stats = useMemo(() => ({
    total: proposals.length,
    active: proposals.filter(p => p.status === 'prospeccao' || p.status === 'aguardando_retorno' || p.status === 'em_avaliacao' || p.status === 'proposta_ajustada').length,
    fechado: proposals.filter(p => p.status === 'fechado').length,
    hot: scored.filter(p => p.priority === 'alta').length,
    stale: scored.filter(p =>
      (p.status === 'aguardando_retorno' || p.status === 'em_avaliacao' || p.status === 'proposta_ajustada') &&
      (Date.now() - new Date(p.updated_at).getTime()) > 3 * 24 * 60 * 60 * 1000
    ).length,
  }), [proposals, scored]);

  // Onda 5 — Inteligência Estratégica Silenciosa: sinais macro da carteira.
  const portfolioSignals = useMemo(() => computePortfolioSignals(scored), [scored]);

  // ─── DnD Handlers ───

  const activeProposal = useMemo(() => {
    if (!activeId) return null;
    return scored.find(p => p.id === activeId) ?? null;
  }, [activeId, scored]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const over = event.over;
    if (!over) { setOverColumnId(null); return; }
    const overId = over.id as string;
    if (overId.startsWith('column-')) {
      setOverColumnId(overId.replace('column-', ''));
    } else {
      const overProposal = scored.find(p => p.id === overId);
      if (overProposal) setOverColumnId(overProposal.status);
    }
  }, [scored]);

  // Guard contra cliques/drag duplos: enquanto uma checagem/move estiver em curso
  // para um id, ignora novas chamadas até liberar.
  const closingInFlight = useRef<Set<string>>(new Set());

  // Solicita fechamento: bloqueia se já estiver fechado, se já houver pós-venda,
  // ou se já existir uma operação de fechamento em andamento para este id.
  const requestClose = useCallback(async (id: string) => {
    const current = proposals.find(p => p.id === id);
    if (!current) return;
    if (current.status === 'fechado') return; // já fechado: não reabre modal
    if (closingInFlight.current.has(id)) return; // já em processamento
    if (updateStatusMutation.isPending) return; // mutation global ativa
    closingInFlight.current.add(id);
    try {
      const existing = await findPostSaleByProposal(id);
      if (existing) {
        // Já existe pós-venda: move direto sem abrir modal de criação.
        toast.success('Cliente enviado automaticamente para o Pós-venda');
        trackEvent('pipeline_lead_moved', { module: 'pipeline', scenario: 'fechado' });
        updateStatusMutation.mutate({ id, status: 'fechado' }, {
          onError: () => {
            toast.error('Erro ao mover. Tente novamente.');
            setSavingStatus(prev => ({ ...prev, [id]: 'error' }));
            setTimeout(() => setSavingStatus(prev => ({ ...prev, [id]: null })), 3000);
          },
          onSettled: () => { closingInFlight.current.delete(id); },
        });

        return;
      }
    } catch (e) {
      logger.error('Erro ao verificar pós-venda existente', e);
      // Em caso de falha na checagem, segue o fluxo normal (modal abre).
    }
    setPendingClose(id);
    closingInFlight.current.delete(id);
  }, [proposals, updateStatusMutation]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumnId(null);

    if (!over) return;

    const draggedId = active.id as string;
    const draggedProposal = proposals.find(p => p.id === draggedId);
    if (!draggedProposal) return;

    let targetStatus: ProposalStatus | null = null;
    const overId = over.id as string;
    if (overId.startsWith('column-')) {
      targetStatus = overId.replace('column-', '') as ProposalStatus;
    } else {
      const overProposal = proposals.find(p => p.id === overId);
      if (overProposal) targetStatus = overProposal.status;
    }

    if (!targetStatus || targetStatus === draggedProposal.status) return;

    // Fechado: abre modal de ativação no Pós-venda antes de mover.
    if (targetStatus === 'fechado') {
      void requestClose(draggedId);
      return;
    }
    // Perdido (terminal não-fechado): move direto, sem próxima ação.
    if (TERMINAL_STATUSES.has(targetStatus)) {
      const label = COLUMNS.find(c => c.status === targetStatus)?.label ?? targetStatus;
      toast.success(`Movido para "${label}"`);
      trackEvent('pipeline_lead_moved', { module: 'pipeline', scenario: targetStatus });
      setSavingStatus(prev => ({ ...prev, [draggedId]: 'saving' }));
      updateStatusMutation.mutate({ id: draggedId, status: targetStatus }, {
        onSuccess: () => {
          setSavingStatus(prev => ({ ...prev, [draggedId]: 'success' }));
          setTimeout(() => setSavingStatus(prev => ({ ...prev, [draggedId]: null })), 2000);
        },
        onError: () => {
          toast.error('Erro ao mover. Tente novamente.');
          setSavingStatus(prev => ({ ...prev, [draggedId]: 'error' }));
          setTimeout(() => setSavingStatus(prev => ({ ...prev, [draggedId]: null })), 3000);
        },
      });

      return;
    }

    // Status ativo: força captura da próxima ação antes de salvar.
    setPendingMove({ id: draggedId, targetStatus });
  }, [proposals, updateStatusMutation, requestClose]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverColumnId(null);
  }, []);

  // ─── Other Handlers ───

  const handleCopy = useCallback(async (proposal: ProposalRecord) => {
    await copyToClipboard(proposal.proposal_content);
    setCopiedId(proposal.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Proposta copiada!');
  }, []);

  const handleStatusChange = useCallback((id: string, status: ProposalStatus) => {
    const current = proposals.find(p => p.id === id);
    if (current && current.status === status) return;

    if (status === 'fechado') {
      void requestClose(id);
      return;
    }
    if (TERMINAL_STATUSES.has(status)) {
      const label = COLUMNS.find(c => c.status === status)?.label ?? status;
      toast.success(`Movido para "${label}"`);
      trackEvent('pipeline_lead_moved', { module: 'pipeline', scenario: status });
      setSavingStatus(prev => ({ ...prev, [id]: 'saving' }));
      updateStatusMutation.mutate({ id, status }, {
        onSuccess: () => {
          setSavingStatus(prev => ({ ...prev, [id]: 'success' }));
          setTimeout(() => setSavingStatus(prev => ({ ...prev, [id]: null })), 2000);
        },
        onError: () => {
          toast.error('Erro ao atualizar status');
          setSavingStatus(prev => ({ ...prev, [id]: 'error' }));
          setTimeout(() => setSavingStatus(prev => ({ ...prev, [id]: null })), 3000);
        },
      });

      return;
    }
    setPendingMove({ id, targetStatus: status });
  }, [proposals, updateStatusMutation, requestClose]);

  /** Marca a próxima ação como concluída (limpa campos) e abre modal para definir a próxima. */
  const handleCompleteAction = useCallback((id: string) => {
    const current = proposals.find(p => p.id === id);
    if (!current) return;
    updateMutation.mutate(
      { id, fields: { next_action_type: null, next_action_notes: null, next_contact_date: null } },
      {
        onSuccess: () => {
          toast.success('Ação concluída ✓');
          trackEvent('pipeline_lead_moved', { module: 'pipeline', scenario: `action_completed:${current.status}` });
          // Reabre o NextActionModal apontando para o mesmo status para definir a próxima.
          setPendingMove({ id, targetStatus: current.status });
        },
        onError: () => toast.error('Erro ao concluir ação'),
      },
    );
  }, [proposals, updateMutation]);

  const pendingProposal = useMemo(() => {
    if (!pendingMove) return null;
    return proposals.find(p => p.id === pendingMove.id) ?? null;
  }, [pendingMove, proposals]);

  const commitPendingMove = useCallback((action: NextActionResult | null) => {
    if (!pendingMove) return;
    const { id, targetStatus } = pendingMove;
    const current = proposals.find(p => p.id === id);
    const isSameStatus = current?.status === targetStatus;
    const label = COLUMNS.find(c => c.status === targetStatus)?.label ?? targetStatus;

    const successMsg = isSameStatus
      ? (action ? 'Próxima ação registrada' : 'Nada alterado')
      : (action ? `Movido para "${label}" · próxima ação registrada` : `Movido para "${label}"`);

    if (action) {
      setSavingStatus(prev => ({ ...prev, [id]: 'saving' }));
      updateStatusWithActionMutation.mutate(
        { id, status: targetStatus, action },
        {
          onSuccess: () => {
            toast.success(successMsg);
            setSavingStatus(prev => ({ ...prev, [id]: 'success' }));
            setTimeout(() => setSavingStatus(prev => ({ ...prev, [id]: null })), 2000);
            if (!isSameStatus) {
              trackEvent('proposal_status_change', {
                from: current?.status, to: targetStatus, with_action: true,
              });
              trackEvent('pipeline_lead_moved', { module: 'pipeline', scenario: targetStatus });
            }
          },
          onError: () => {
            toast.error('Erro ao mover. Tente novamente.');
            setSavingStatus(prev => ({ ...prev, [id]: 'error' }));
            setTimeout(() => setSavingStatus(prev => ({ ...prev, [id]: null })), 3000);
          },
        },
      );
    } else if (!isSameStatus) {
      // "Pular" — só muda status, sem ação registrada.
      setSavingStatus(prev => ({ ...prev, [id]: 'saving' }));
      updateStatusMutation.mutate({ id, status: targetStatus }, {
        onSuccess: () => {
          toast.success(successMsg);
          setSavingStatus(prev => ({ ...prev, [id]: 'success' }));
          setTimeout(() => setSavingStatus(prev => ({ ...prev, [id]: null })), 2000);
          trackEvent('proposal_next_action_skip', { from: current?.status, to: targetStatus });
          trackEvent('proposal_status_change', { from: current?.status, to: targetStatus, with_action: false });
          trackEvent('pipeline_lead_moved', { module: 'pipeline', scenario: targetStatus, skipped_action: true });
        },
        onError: () => {
          toast.error('Erro ao mover. Tente novamente.');
          setSavingStatus(prev => ({ ...prev, [id]: 'error' }));
          setTimeout(() => setSavingStatus(prev => ({ ...prev, [id]: null })), 3000);
        },
      });
    }

    setPendingMove(null);
  }, [pendingMove, proposals, updateStatusMutation, updateStatusWithActionMutation]);

  const cancelPendingMove = useCallback(() => {
    if (pendingMove) {
      const current = proposals.find(p => p.id === pendingMove.id);
      trackEvent('proposal_move_cancelled', {
        from: current?.status, to: pendingMove.targetStatus,
      });
    }
    setPendingMove(null);
  }, [pendingMove, proposals]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => { setEditingId(null); toast.success('Removido com sucesso'); },
    });
  }, [deleteMutation]);

  const handleSaveNotes = useCallback((id: string, notes: string) => {
    updateNotesMutation.mutate({ id, notes }, {
      onSuccess: () => toast.success('Anotação salva'),
    });
  }, [updateNotesMutation]);

  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);

  // Conversão Simulador → Carteira: abre o modal "Novo lead" se o usuário
  // clicou em "Salvar como proposta" no Simulador. NewLeadModal já lê
  // SimulatorContext e pré-preenche os dados.
  useEffect(() => {
    if (consumeOpenNewLeadRequest()) {
      setNewLeadOpen(true);
    }
  }, []);

  const handleNewLeadCreate = useCallback((data: NewLeadData) => {
    createMutation.mutate({
      client_name: data.client_name,
      credit_value: data.credit_value,
      term_months: data.term_months,
      installment: data.installment,
      total_cost: data.total_cost,
      consortium_type: data.consortium_type,
      bid_percent: data.bid_percent || null,
      proposal_content: '',
      proposal_format: 'whatsapp',
      status: 'prospeccao',
      notes: data.notes || null,
      client_phone: data.client_phone || null,
      next_contact_date: data.next_contact_date || null,
      prospect_trigger: data.prospect_trigger || 'nao_identificado',
    }, {
      onSuccess: (record) => {
        toast.success(`Lead "${data.client_name}" adicionado!`);
        trackEvent('pipeline_lead_created', {
          module: 'pipeline',
          consortium_type: data.consortium_type,
          proposal_id: record?.id,
        });
      },
    });
  }, [createMutation]);

  const handleEdit = useCallback((id: string) => {
    setEditingId(id);
  }, []);

  /**
   * Foca um card vindo do painel de alertas / agenda:
   *  • Em mobile, troca para a coluna do lead.
   *  • Faz scroll suave até o card e aplica flash temporário.
   *  • Se não encontrar (ex.: filtrado), abre o modal de edição como fallback.
   */
  const handleFocusLead = useCallback((id: string) => {
    const target = scored.find(p => p.id === id);
    if (!target) { handleEdit(id); return; }

    if (isMobile) {
      const colIdx = COLUMNS.findIndex(c => c.status === target.status);
      if (colIdx >= 0) setMobileColumn(colIdx);
    }

    // Aguarda render para o card existir no DOM.
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>(`[data-proposal-id="${id}"]`);
        if (!el) { handleEdit(id); return; }
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        }, 1800);
      }, 50);
    });
  }, [scored, isMobile, handleEdit]);

  const editingProposal = useMemo(() => {
    if (!editingId) return null;
    return scored.find(p => p.id === editingId) ?? null;
  }, [editingId, scored]);

  const handleSaveEdit = useCallback((id: string, fields: UpdateProposalFields, newStatus?: ProposalStatus) => {
    // Atômico: se o status mudou (especialmente para fechado/perdido), aplica
    // status + fields numa única mutation. Evita race condition em que campos
    // de "próxima ação" voltariam a ser preenchidos depois do clear.
    const finalFields: UpdateProposalFields = newStatus ? { ...fields, status: newStatus } : fields;
    updateMutation.mutate({ id, fields: finalFields }, {
      onSuccess: () => { setEditingId(null); toast.success('Atualizado!'); },
      onError: () => toast.error('Erro ao atualizar'),
    });
  }, [updateMutation]);

  // Mobile column navigation (sobre KANBAN_COLUMNS — fechado/perdido fora do Kanban)
  const handlePrevColumn = useCallback(() => setMobileColumn(prev => Math.max(0, prev - 1)), []);
  const handleNextColumn = useCallback(() => setMobileColumn(prev => Math.min(KANBAN_COLUMNS.length - 1, prev + 1)), []);

  // Estável: callback de "Novo lead" não pode ser recriado por render — quebra
  // memoização das colunas e dispara N re-renders no Kanban.
  const handleOpenNewLead = useCallback(() => setNewLeadOpen(true), []);

  // Onda Carteira 3 — handlers de "Mover para Pós-venda" e "Arquivar lead"
  const handleMoveToPostSale = useCallback((id: string) => {
    void requestClose(id);
  }, [requestClose]);

  const handleArchive = useCallback((id: string, reason: LostReason) => {
    const current = proposals.find(p => p.id === id);
    const mergedNotes = applyLostReason(current?.notes ?? '', reason);
    updateMutation.mutate(
      { id, fields: { status: 'perdido', notes: mergedNotes || null, next_action_type: null, next_action_notes: null, next_contact_date: null } },
      {
        onSuccess: () => {
          toast.success('Lead arquivado');
          trackEvent('pipeline_lead_moved', { module: 'pipeline', scenario: 'perdido', archived: true, reason });
        },
        onError: () => toast.error('Erro ao arquivar'),
      },
    );
  }, [proposals, updateMutation]);

  const handleReactivate = useCallback((id: string) => {
    const current = proposals.find(p => p.id === id);
    const cleaned = current?.notes ? current.notes.replace(/^\[Motivo:\s*[a-z_]+\]\s*/i, '').trim() : null;
    updateMutation.mutate(
      { id, fields: { status: 'prospeccao', notes: cleaned || null } },
      {
        onSuccess: () => {
          toast.success('Lead reativado em Prospecção');
          setView('active');
        },
        onError: () => toast.error('Erro ao reativar'),
      },
    );
  }, [proposals, updateMutation]);

  // columnProps memoizado — referência estável preserva memo das colunas.
  const columnProps = useMemo(() => ({
    onStatusChange: handleStatusChange,
    onCopy: handleCopy,
    onDelete: handleDelete,
    onSaveNotes: handleSaveNotes,
    onEdit: handleEdit,
    onQuickCreate: handleOpenNewLead,
    copiedId,
    savingStatus,
  }), [handleStatusChange, handleCopy, handleDelete, handleSaveNotes, handleEdit, handleOpenNewLead, copiedId, savingStatus]);


  return (
    <div className="space-y-5 animate-fade-in pb-24 md:pb-8">
      <div id="pipeline-header">
        <ModuleHeader title="Carteira" subtitle={`${stats.active} ativas · ${stats.fechado} fechadas — acompanhe e priorize suas oportunidades`} moduleId="proposals" hideTip />
      </div>

      {/* Barra compacta única: badges de prioridade + Alertas + Métricas */}
      {proposals.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1 min-h-10">
          {stats.hot > 0 && (
            <Badge id="pipeline-priority-badges" className="gap-1 bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20">
              <Flame className="h-3 w-3" />
              {stats.hot} quente{stats.hot > 1 ? 's' : ''}
            </Badge>
          )}
          {stats.stale > 0 && (
            <Badge className="gap-1 bg-warning/10 text-warning border-warning/30 hover:bg-warning/20">
              <Clock className="h-3 w-3" />
              {stats.stale} parada{stats.stale > 1 ? 's' : ''}
            </Badge>
          )}
          <AlertsCenter proposals={scored} onOpenLead={handleFocusLead} />
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setMetricsOpen(true)}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Métricas
          </Button>
        </div>
      )}

      {/* Onda 5 — Visão estratégica colapsada (Banner Insights) */}
      {proposals.length > 0 && portfolioSignals.length > 0 && (
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between text-xs h-9 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
            onClick={() => setMetricsOpen(true)}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">💡</span>
              Ver insights estratégicos da carteira
            </span>
            <span className="flex items-center gap-1 font-semibold">
              Abrir <ArrowRight className="h-3 w-3" />
            </span>
          </Button>
          {/* PortfolioInsightsBar original removida para simplificar área acima do board */}
        </div>
      )}

      {/* Linha 1: Busca + Filtros de Temperatura + Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div id="pipeline-search" className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou anotação…"
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={view === 'active' ? 'default' : 'outline'}
            className="h-9 text-xs flex-1 sm:flex-none"
            onClick={() => setView('active')}
          >
            Ativos
          </Button>
          <Button
            size="sm"
            variant={view === 'archived' ? 'default' : 'outline'}
            className="h-9 text-xs gap-1 flex-1 sm:flex-none"
            onClick={() => setView('archived')}
          >
            <Archive className="h-3.5 w-3.5" />
            Arquivados
          </Button>
        </div>
      </div>

      {/* Linha 2: Lentes (Triggers e Filtros) - Agora integradas no CarteiraFilters */}
      {proposals.length > 0 && (
        <div className="w-full overflow-x-auto scrollbar-hide">
          <CarteiraFilters proposals={scored} filters={bankFilters} onChange={setBankFilters} />
        </div>
      )}

      {/* Linha 3: Insights colapsados (já feito acima no banner Insights) */}

      {/* Linha 4: Daily Agenda — "O que fazer hoje" colapsado por padrão */}
      {proposals.length > 0 && (
        <DailyAgenda proposals={scored} onOpenLead={handleFocusLead} onCompleteAction={handleCompleteAction} />
      )}


      {/* Loading / Empty / Kanban / Archived */}
      {loading ? (
        <EmptyStateMessage title="Carregando..." message="Buscando suas propostas" />
      ) : view === 'archived' ? (
        <ArchivedLeadsList onReactivate={handleReactivate} onEdit={handleEdit} />
      ) : proposals.length === 0 ? (
        <div className="space-y-4">
          <EmptyStateMessage
            title="Pipeline vazio"
            message="Comece adicionando um lead na coluna Prospecção ou gere uma proposta na Venda Direta."
          />
          {isMobile ? (
            <DroppableKanbanColumn
              column={KANBAN_COLUMNS[0]}
              proposals={[]}
              {...columnProps}
              compact
            />
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {KANBAN_COLUMNS.map(col => (
                <DroppableKanbanColumn
                  key={col.status}
                  column={col}
                  proposals={[]}
                  {...columnProps}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {isMobile ? (
            /* ═══════ MOBILE: Swipeable columns ═══════ */
            <div id="pipeline-kanban" className="space-y-3">
              {/* Column tabs */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePrevColumn}
                  disabled={mobileColumn === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex-1 flex gap-1 justify-center overflow-x-auto scrollbar-hide">
                  {KANBAN_COLUMNS.map((col, i) => {
                    const count = byStatus[col.status].length;
                    return (
                      <button
                        key={col.status}
                        onClick={() => setMobileColumn(i)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-[colors,box-shadow,transform] whitespace-nowrap',
                          i === mobileColumn
                            ? `${col.bg} ${col.color} border ${col.borderColor}`
                            : 'text-muted-foreground'
                        )}
                      >
                        <span>{col.emoji}</span>
                        {count > 0 && <span className="text-caption">({count})</span>}
                      </button>
                    );
                  })}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleNextColumn}
                  disabled={mobileColumn === KANBAN_COLUMNS.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Active column */}
              <DroppableKanbanColumn
                column={KANBAN_COLUMNS[mobileColumn]}
                proposals={byStatus[KANBAN_COLUMNS[mobileColumn].status]}
                {...columnProps}
                compact
                isOver={overColumnId === KANBAN_COLUMNS[mobileColumn].status}
              />
            </div>
          ) : (
            /* ═══════ DESKTOP: 4-column Kanban (fechado/perdido fora) ═══════ */
            <div
              id="pipeline-kanban"
              className="flex h-full overflow-x-auto"
              style={{ gap: 0 }}
            >
              {KANBAN_COLUMNS.map((col, index) => (
                <div
                  key={col.status}
                  className="flex-1 min-w-[260px]"
                  style={{
                    borderRight: index < KANBAN_COLUMNS.length - 1
                      ? '1px solid var(--border)'
                      : 'none',
                    borderTop: `3px solid ${COLUMN_ACCENT_COLORS[col.status] ?? '#94a3b8'}`,
                  }}
                >
                  <DroppableKanbanColumn
                    column={col}
                    proposals={byStatus[col.status]}
                    {...columnProps}
                    isOver={overColumnId === col.status && activeProposal?.status !== col.status}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Drag Overlay */}
          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            {activeProposal ? (
              <div className="w-[220px]">
                <ProposalCardContent
                  proposal={activeProposal}
                  onStatusChange={() => {}}
                  onCopy={() => {}}
                  onDelete={() => {}}
                  onSaveNotes={() => {}}
                  onEdit={() => {}}
                  copiedId={null}
                  isOverlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Edit Modal */}
      <EditProposalModal
        proposal={editingProposal}
        open={!!editingId}
        onOpenChange={(open) => { if (!open) setEditingId(null); }}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onMoveToPostSale={handleMoveToPostSale}
        onArchive={handleArchive}
      />

      {/* New Lead Modal */}
      <NewLeadModal
        open={newLeadOpen}
        onOpenChange={setNewLeadOpen}
        onCreate={handleNewLeadCreate}
      />

      {/* Onda 4: Dashboard de métricas */}
      <PipelineMetricsModal open={metricsOpen} onOpenChange={setMetricsOpen} />

      {/* Onda 2: Próxima Ação Obrigatória */}
      <NextActionModal
        open={!!pendingMove}
        proposal={pendingProposal}
        targetStatus={pendingMove?.targetStatus ?? null}
        onConfirm={(result) => commitPendingMove(result)}
        onSkip={() => commitPendingMove(null)}
        onCancel={cancelPendingMove}
      />

      {/* Pós-venda: ativação ao fechar */}
      <ClosePostSaleConfirmModal
        proposal={pendingClose ? proposals.find(p => p.id === pendingClose) ?? null : null}
        open={!!pendingClose}
        onOpenChange={(open) => { if (!open) setPendingClose(null); }}
        onConfirmClose={() => {
          if (!pendingClose) return;
          const id = pendingClose;
          trackEvent('pipeline_lead_moved', { module: 'pipeline', scenario: 'fechado' });
          updateStatusMutation.mutate({ id, status: 'fechado' }, {
            onSuccess: () => {
              toast.success('Movido para "Fechado" — abrindo Pós-venda');
              // Onda Carteira 3: navega direto ao Pós-venda após ativar
              setTimeout(() => navigateTo('post-sale'), 200);
            },
            onError: () => toast.error('Erro ao mover. Tente novamente.'),
          });
        }}
      />
    </div>
  );
}

// ─── Aba "Arquivados" (Onda Carteira 3) ───
// Inclui leads `perdido` (arquivados manualmente) E `fechado` (movidos para
// Pós-venda ou fechados antes desta onda). Antes só listava `perdido`, o que
// fazia leads fechados sumirem da Carteira sem ficar visíveis em lugar nenhum.
function ArchivedLeadsList({
  onReactivate, onEdit,
}: {
  onReactivate: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  // Busca todos (sem onlyActive) e filtra client-side; volume baixo (~dezenas).
  const { data: page, isLoading } = useProposalsPage({
    onlyActive: false,
    limit: 200,
    offset: 0,
  });
  const rows = (page?.rows ?? []).filter(
    p => p.status === 'perdido' || p.status === 'fechado',
  );

  if (isLoading) {
    return <EmptyStateMessage title="Carregando..." message="Buscando arquivados" />;
  }
  if (rows.length === 0) {
    return (
      <EmptyStateMessage
        title="Nenhum lead arquivado"
        message="Leads arquivados (perdidos) ou fechados aparecerão aqui."
      />
    );
  }
  return (
    <div className="rounded-md border bg-card divide-y divide-border">
      {rows.map((p) => {
        const reason = readLostReason(p.notes);
        const reasonMeta = LOST_REASONS.find(r => r.value === reason);
        const isClosed = p.status === 'fechado';
        return (
          <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <button
              type="button"
              onClick={() => onEdit(p.id)}
              className="flex-1 min-w-0 text-left hover:bg-muted/30 -mx-1 px-1 py-0.5 rounded transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{p.client_name || 'Sem nome'}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'h-4 px-1.5 text-[10px] shrink-0',
                    isClosed
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-destructive/10 text-destructive border-destructive/20',
                  )}
                >
                  {isClosed ? 'Fechado' : 'Perdido'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                <span>R$ {p.credit_value.toLocaleString('pt-BR')}</span>
                <span>•</span>
                <span>
                  {isClosed ? 'Fechado em ' : 'Arquivado em '}
                  {new Date(p.updated_at).toLocaleDateString('pt-BR')}
                </span>
                {reasonMeta && !isClosed && (
                  <>
                    <span>•</span>
                    <span>{reasonMeta.emoji} {reasonMeta.label}</span>
                  </>
                )}
              </div>
            </button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 shrink-0"
              onClick={() => onReactivate(p.id)}
              title="Volta para Prospecção no Kanban"
            >
              Reativar
            </Button>
          </div>
        );
      })}
    </div>
  );
}
