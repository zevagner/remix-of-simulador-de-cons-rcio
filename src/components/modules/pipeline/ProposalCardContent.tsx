import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Copy, Check, Trash2, StickyNote, ArrowRight, Pencil,
  GripVertical, ExternalLink, CalendarClock, MoreHorizontal, Clock, Loader2,
} from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

import { formatCurrency } from '@/core/finance';
import { getClientInitials, getClientAvatarColor } from '@/utils/clientAvatar';
import { openInWhatsApp, isMobileDevice } from '@/utils/whatsapp';
import type { ProposalRecord, ProposalStatus } from '@/services/proposals';
import { PRIORITY_CONFIG, type ProposalWithPriority } from '@/utils/proposalPriority';
import { scoreProposalUnified, TEMPERATURE_BADGE } from '@/utils/clientScoring';
import { getProposalRelationshipSignals, SIGNAL_TONE_CLASS } from '@/utils/relationshipSignals';
import { getProposalTimingSignal, TIMING_TONE_CLASS } from '@/utils/relationshipTimingSignals';
import { suggestProposalAction } from '@/utils/nextActionSuggestion';
import { computeExpectedValue, getStageProbability } from '@/utils/salesForecast';
import { cn } from '@/lib/utils';
import { NEXT_STATUS } from './pipelineConstants';
import {
  getStalenessForStatus, getCardAlertLevel, ACTIVE_STATUSES, daysSince,
  COLUMN_SLA, NEW_LEAD_GRACE_HOURS, MISSING_ACTION_STRONG_SLA_RATIO,
  MISSING_ACTION_MIN_SOFT_WINDOW_HOURS,
  type CardAlertLevel,
} from './cadenceRules';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RequestCommunityHelpButton } from '@/components/community/RequestCommunityHelpButton';
import { ContextualCommunityWidget } from '@/components/community/ContextualCommunityWidget';


// ─── Draggable wrapper ───

interface DraggableProposalCardProps {
  proposal: ProposalWithPriority;
  onStatusChange: (id: string, status: ProposalStatus) => void;
  onCopy: (p: ProposalRecord) => void;
  onDelete: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
  onEdit: (id: string) => void;
  copiedId: string | null;
  savingStatus?: Record<string, 'saving' | 'success' | 'error' | null>;
  isDragDisabled?: boolean;
}


function DraggableProposalCardImpl({
  proposal, onStatusChange, onCopy, onDelete, onSaveNotes, onEdit, copiedId, savingStatus, isDragDisabled,
}: DraggableProposalCardProps) {

  const isMobile = useIsMobile();
  // Mobile uses swipe gestures instead of drag-and-drop to avoid conflicts.
  const dragOff = isDragDisabled || isMobile;

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: proposal.id,
    data: { type: 'proposal', proposal },
    disabled: dragOff,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ProposalCardContent
        proposal={proposal}
        onStatusChange={onStatusChange}
        onCopy={onCopy}
        onDelete={onDelete}
        onSaveNotes={onSaveNotes}
        onEdit={onEdit}
        copiedId={copiedId}
        savingStatus={savingStatus}
        dragHandleProps={dragOff ? undefined : { ...attributes, ...listeners }}

        isDragging={isDragging}
      />
    </div>
  );
}

/**
 * Memo do card: re-renderiza apenas se a proposta (referência) mudar,
 * se um callback mudar, ou se o `copiedId` passar a impactar este card.
 * Crítico para Kanban com 100+ cards — evita N re-renders quando outro
 * card é copiado/arrastado.
 */
export const DraggableProposalCard = memo(DraggableProposalCardImpl, (prev, next) => {
  if (prev.proposal !== next.proposal) return false;
  if (prev.isDragDisabled !== next.isDragDisabled) return false;
  if (prev.onStatusChange !== next.onStatusChange) return false;
  if (prev.onCopy !== next.onCopy) return false;
  if (prev.onDelete !== next.onDelete) return false;
  if (prev.onSaveNotes !== next.onSaveNotes) return false;
  if (prev.onEdit !== next.onEdit) return false;
  // copiedId só importa quando passa por (ou deixa de passar por) este card.
  const wasCopied = prev.copiedId === prev.proposal.id;
  const isCopied = next.copiedId === next.proposal.id;
  if (wasCopied !== isCopied) return false;
  if (prev.savingStatus !== next.savingStatus) return false;
  return true;
});


// ─── Card content (shared between draggable and overlay) ───

interface ProposalCardContentProps {
  proposal: ProposalWithPriority;
  onStatusChange: (id: string, status: ProposalStatus) => void;
  onCopy: (p: ProposalRecord) => void;
  onDelete: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
  onEdit: (id: string) => void;
  copiedId: string | null;
  savingStatus?: Record<string, 'saving' | 'success' | 'error' | null>;
  dragHandleProps?: Record<string, any>;
  isDragging?: boolean;
  isOverlay?: boolean;
}


export function ProposalCardContent({
  proposal, onStatusChange, onCopy, onDelete, onSaveNotes, onEdit,
  copiedId, savingStatus, dragHandleProps, isDragging, isOverlay,
}: ProposalCardContentProps) {

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(proposal.notes ?? '');
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const isCopied = copiedId === proposal.id;
  const status = savingStatus?.[proposal.id];

  const pCfg = PRIORITY_CONFIG[proposal.priority];
  // Camada unificada quente/morno/frio + sugestão determinística de ação.
  const unified = scoreProposalUnified(proposal, proposal.credit_value || 1);
  const tempCfg = TEMPERATURE_BADGE[unified.temperature];
  const suggestion = suggestProposalAction(proposal, unified);
  const relationshipSignals = getProposalRelationshipSignals(proposal, unified);
  const timingSignal = getProposalTimingSignal(proposal);
  const isProspect = proposal.status === 'prospeccao';
  const isFinalStatus = proposal.status === 'fechado' || proposal.status === 'perdido';
  const isActive = ACTIVE_STATUSES.has(proposal.status);
  // Onda 5: SLA por coluna + hierarquia visual.
  // alertLevel decide qual sinal primário o card exibe (1 só por vez).
  const staleness = getStalenessForStatus(proposal.updated_at, proposal.status);
  const daysSinceUpdate = daysSince(proposal.updated_at);
  const alertLevel: CardAlertLevel = isOverlay || isFinalStatus
    ? 'none'
    : getCardAlertLevel(proposal);

  // Onda 7.1: tooltip explicativo do badge missing-action.
  // "Há Xd sem definir próxima ação · vira alerta forte aos Yd"
  const missingActionTooltip = (() => {
    if (alertLevel !== 'missing-action-soft' && alertLevel !== 'missing-action-strong') return undefined;
    const ageDays = daysSince(proposal.created_at);
    const warnHours = COLUMN_SLA[proposal.status].warn * 24;
    const strongHours = Math.max(
      NEW_LEAD_GRACE_HOURS + MISSING_ACTION_MIN_SOFT_WINDOW_HOURS,
      warnHours * MISSING_ACTION_STRONG_SLA_RATIO,
    );
    const strongDays = +(strongHours / 24).toFixed(1);
    const ageLabel = ageDays === 0 ? 'menos de 1 dia' : `${ageDays} dia${ageDays > 1 ? 's' : ''}`;
    return alertLevel === 'missing-action-strong'
      ? `Há ${ageLabel} sem definir próxima ação (limiar de alerta forte: ${strongDays}d). Defina já para não perder o cliente.`
      : `Há ${ageLabel} sem definir próxima ação. Vira alerta forte aos ${strongDays}d.`;
  })();

  const handleSave = () => {
    onSaveNotes(proposal.id, notesValue);
    setEditingNotes(false);
  };

  const next = NEXT_STATUS[proposal.status];
  const cardId = proposal.status === 'prospeccao' && !isOverlay ? 'pipeline-first-card' : undefined;

  // ── Swipe gestures (mobile only) ──
  // Apenas dispara o fluxo padrão (que abre NextActionModal). NÃO emite toast aqui:
  // o toast de confirmação só pode aparecer DEPOIS do commit no modal — caso contrário
  // mostraria sucesso enganoso se o usuário cancelar.
  const triggerAdvance = () => {
    if (!next) return;
    onStatusChange(proposal.id, next.status);
  };

  const { translateX, swipeHandlers, isSwiping } = useSwipeGesture({
    onSwipeRight: triggerAdvance,
    onSwipeLeft: () => setMenuOpen(true),
    disabled: !isMobile || isOverlay || editingNotes,
    disableRight: !next || isFinalStatus,
  });

  // ── Status badge (next contact urgency) ──
  const renderStatusBadge = () => {
    if (!proposal.next_contact_date || isOverlay) return null;
    const contactDate = new Date(proposal.next_contact_date + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const isOverdue = contactDate < today;
    const isToday = contactDate.getTime() === today.getTime();
    const isTomorrow = contactDate.getTime() === tomorrow.getTime();
    if (!isOverdue && !isToday && !isTomorrow) return null;

    return (
      <div className={cn(
        'flex items-center gap-1.5 text-caption px-2 py-1 rounded font-semibold w-full',
        (isOverdue || isToday) && 'bg-destructive/15 text-destructive',
        isTomorrow && 'bg-warning/15 text-warning',
      )}>
        <CalendarClock className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {isOverdue && 'Contato pendente'}
          {isToday && 'Contato hoje'}
          {isTomorrow && 'Contatar amanhã'}
        </span>
      </div>
    );
  };

  // ── Secondary actions (used inline on desktop, in dropdown on mobile) ──
  const secondaryActions: Array<{ key: string; label: string; icon: JSX.Element; onClick: () => void; className?: string }> = [
    { key: 'edit', label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => onEdit(proposal.id) },
    ...(!isProspect ? [{
      key: 'copy',
      label: isCopied ? 'Copiado' : 'Copiar proposta',
      icon: isCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />,
      onClick: () => onCopy(proposal),
    }] : []),
    {
      key: 'note',
      label: 'Anotação',
      icon: <StickyNote className="h-4 w-4" />,
      onClick: () => { setEditingNotes(true); setNotesValue(proposal.notes ?? ''); },
    },
    ...(!isProspect && isMobileDevice() ? [{
      key: 'wa',
      label: 'WhatsApp',
      icon: <ExternalLink className="h-4 w-4" />,
      onClick: () => openInWhatsApp(proposal.proposal_content),
      className: 'text-whatsapp-green',
    }] : []),
  ];

  // Direction-aware overlay reveals (mobile only). translateX>0 → moving right (advance); <0 → moving left (actions).
  const showAdvanceHint = isMobile && translateX > 0 && next && !isFinalStatus;
  const showActionsHint = isMobile && translateX < 0;

  return (
    <div className="relative" {...(isMobile && !isOverlay ? swipeHandlers : {})}>
      {/* Swipe reveal backgrounds */}
      {showAdvanceHint && (
        <div className="absolute inset-0 flex items-center justify-start pl-4 rounded-lg bg-success/15 text-success font-semibold text-xs pointer-events-none">
          <ArrowRight className="h-4 w-4 mr-1.5" />
          Avançar
        </div>
      )}
      {showActionsHint && (
        <div className="absolute inset-0 flex items-center justify-end pr-4 rounded-lg bg-muted text-muted-foreground font-semibold text-xs pointer-events-none">
          <MoreHorizontal className="h-4 w-4 mr-1.5" />
          Ações
        </div>
      )}
      <Card
        id={cardId}
        data-proposal-id={proposal.id}
        className={cn(
          'shadow-sm hover:shadow-md transition-shadow animate-fade-in overflow-hidden relative',
          // Onda 5: faixa lateral única, governada por alertLevel (sem competição).
          alertLevel === 'critical' && 'border-l-4 border-l-destructive',
          alertLevel === 'warn' && 'border-l-4 border-l-warning',
          isOverlay && 'shadow-xl ring-2 ring-primary/30 rotate-[2deg] scale-105',
          isDragging && 'opacity-30',
        )}
        style={isMobile && !isOverlay ? {
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
        } : undefined}
      >
        {(alertLevel === 'critical' || alertLevel === 'warn') && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  aria-label={
                    alertLevel === 'critical'
                      ? 'Contato atrasado — ação necessária hoje'
                      : 'Sem atualização recente — retomar contato em breve'
                  }
                  className="absolute left-0 top-0 h-full w-1 z-10 cursor-help"
                />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[240px]">
                <p className="text-caption">
                  {alertLevel === 'critical'
                    ? 'Contato atrasado — ação necessária hoje'
                    : 'Sem atualização recente — retomar contato em breve'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <CardContent className="p-3 space-y-2">
        {/* ── LINHA 1 — Identidade: avatar + nome + badge temperatura ── */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              'h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-caption font-semibold tabular-nums select-none',
              getClientAvatarColor(proposal.client_name),
            )}
            aria-hidden="true"
            title={proposal.client_name || 'Sem nome'}
          >
            {getClientInitials(proposal.client_name)}
          </div>
          <p className="min-w-0 flex-1 text-sm font-semibold text-foreground truncate">
            {proposal.client_name || 'Sem nome'}
          </p>
          {!isFinalStatus && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(
                    'flex items-center gap-1 text-caption px-1.5 py-0.5 rounded-full border cursor-help font-medium shrink-0 whitespace-nowrap',
                    tempCfg.chip,
                  )}>
                    <span aria-label={tempCfg.label}>{tempCfg.emoji}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[220px]">
                  <p className="text-xs font-semibold mb-0.5">Classificação · {tempCfg.label}</p>
                  <p className="text-caption text-muted-foreground leading-relaxed">
                    Score unificado: {unified.score}/100 (≥80 quente · 50–79 morno · &lt;50 frio)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* ── LINHA 2 — Valor principal ── */}
        {(proposal.credit_value > 0) && (
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-foreground tabular-nums">
              {formatCurrency(proposal.credit_value)}
            </span>
          </div>
        )}

        {/* ── LINHA 3 — Um único chip de alerta (mais urgente) ── */}
        {!isOverlay && (() => {
          if (proposal.next_contact_date) {
            const contactDate = new Date(proposal.next_contact_date + 'T00:00:00');
            const today = new Date(); today.setHours(0, 0, 0, 0);
            if (contactDate < today) {
              return (
                <span className="inline-flex items-center gap-1 text-caption px-2 py-0.5 rounded-full font-medium bg-destructive/15 text-destructive border border-destructive/30 max-w-full">
                  <CalendarClock className="h-3 w-3 shrink-0" />
                  <span className="truncate">Contato pendente</span>
                </span>
              );
            }
          }
          return null;
        })()}

        {/* ── LINHA 4 — Sugestão AI ── */}
        {suggestion && (
          <p className="text-[11px] text-muted-foreground/60 italic leading-snug">
            {suggestion.text}
          </p>
        )}

        {/* ── LINHA 5 — Saving Status ── */}
        {status && (
          <div className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200",
            status === 'saving' && "bg-muted text-muted-foreground",
            status === 'success' && "bg-success/10 text-success",
            status === 'error' && "bg-destructive/10 text-destructive"
          )}>
            {status === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</>}
            {status === 'success' && <><Check className="h-3 w-3" /> Atualizado ✓</>}
            {status === 'error' && <><Trash2 className="h-3 w-3" /> Falha ao salvar — tente novamente</>}
          </div>
        )}

        {/* ── LINHA 6 — Rodapé: botão principal + menu de ações ── */}

        {!isOverlay && (
          <div id={cardId ? 'pipeline-first-card-actions' : undefined} className="flex items-center gap-1 pt-1.5 border-t border-border">
            {next && (
              <Button
                size="sm"
                onClick={() => onStatusChange(proposal.id, next.status)}
                className="h-8 text-xs gap-1.5 flex-1 min-w-0 font-semibold"
              >
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{next.label}</span>
              </Button>
            )}

            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-foreground" title="Mais ações">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {secondaryActions.map(a => (
                  <DropdownMenuItem
                    key={a.key}
                    onClick={() => { a.onClick(); setMenuOpen(false); }}
                    className={a.className}
                  >
                    {a.icon}
                    <span>{a.label}</span>
                  </DropdownMenuItem>
                ))}
                
                <div className="h-px bg-border my-1" />
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="gap-2 text-destructive focus:text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir {isProspect ? 'lead' : 'proposta'}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {proposal.client_name ? `"${proposal.client_name}" será removido.` : 'Este item será removido.'} Essa ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(proposal.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* ── Anotações em edição (drawer interno via botão "Anotação") ── */}
        {!isOverlay && editingNotes && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-2 space-y-1.5">
            <Textarea
              value={notesValue}
              onChange={e => setNotesValue(e.target.value)}
              placeholder="Anotações..."
              className="text-xs min-h-[50px] resize-none"
              autoFocus
            />
            <div className="flex gap-1.5">
              <Button size="sm" onClick={handleSave} className="h-7 text-xs flex-1">Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)} className="h-7 text-xs">✕</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
