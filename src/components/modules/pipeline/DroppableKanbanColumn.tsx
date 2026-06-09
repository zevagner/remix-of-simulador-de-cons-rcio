import { memo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProposalRecord, ProposalStatus } from '@/services/proposals';
import type { ProposalWithPriority } from '@/utils/proposalPriority';
import { DraggableProposalCard } from './ProposalCardContent';
import { COLUMN_TOOLTIPS, type ColumnConfig } from './pipelineConstants';

interface DroppableKanbanColumnProps {
  column: ColumnConfig;
  proposals: ProposalWithPriority[];
  onStatusChange: (id: string, status: ProposalStatus) => void;
  onCopy: (p: ProposalRecord) => void;
  onDelete: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
  onEdit: (id: string) => void;
  onQuickCreate?: () => void;
  copiedId: string | null;
  savingStatus?: Record<string, 'saving' | 'success' | 'error' | null>;
  compact?: boolean;
  isOver?: boolean;
}


const CARDS_LIMIT = 8;
const WIP_SOFT_LIMIT = 10;
const WIP_TRACKED: ReadonlySet<string> = new Set([
  'prospeccao', 'aguardando_retorno', 'em_avaliacao', 'proposta_ajustada',
]);

function DroppableKanbanColumnImpl({
  column, proposals, onStatusChange, onCopy, onDelete, onSaveNotes,
  onEdit, onQuickCreate, copiedId, savingStatus = {}, compact = false, isOver = false,
}: DroppableKanbanColumnProps) {

  const [expanded, setExpanded] = useState(false);
  const { setNodeRef } = useDroppable({
    id: `column-${column.status}`,
    data: { type: 'column', status: column.status },
  });

  const visibleProposals = expanded ? proposals : proposals.slice(0, CARDS_LIMIT);
  const hasMore = proposals.length > CARDS_LIMIT;
  const isOverWip = WIP_TRACKED.has(column.status) && proposals.length > WIP_SOFT_LIMIT;

  const wipTooltip = isOverWip
    ? `Foco: ${proposals.length} leads aqui (limite sugerido: ${WIP_SOFT_LIMIT}). Avance ou descarte os mais antigos para manter o ritmo.`
    : COLUMN_TOOLTIPS[column.status];

  return (
    <div 
      className={cn('flex flex-col min-w-[280px]', compact ? 'min-h-0' : 'min-h-[300px]')}
    >
      {/* Column header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-3 bg-card border border-border border-t-0',
      )}>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-help">
                <span className={cn('text-sm font-semibold text-foreground', isOverWip && 'text-warning')}>{column.label}</span>
                {isOverWip && <span className="text-warning text-xs" aria-label="WIP excedido">⚠️</span>}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs leading-relaxed">{wipTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Badge
          variant="secondary"
          className={cn('text-xs font-medium h-5 px-1.5 bg-muted text-muted-foreground border-0')}
        >
          {proposals.length}
        </Badge>
      </div>

      {/* Cards container wrapper for relative positioning of gradient */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={setNodeRef}
          className={cn(
            'h-full space-y-2 p-2 bg-muted/30 border border-border border-t-0 rounded-b-lg overflow-y-auto transition-colors duration-200 scrollbar-hide',
            compact ? 'max-h-[60vh]' : 'max-h-[calc(100vh-320px)]',
            isOver && 'ring-2 ring-primary/40 bg-primary/5',
          )}
        >
          {proposals.length === 0 ? (
            <p className={cn(
              'text-caption text-muted-foreground/70 text-center py-6 italic',
              isOver && 'text-primary/60 font-medium',
            )}>
              {isOver
                ? 'Soltar aqui'
                : column.status === 'fechado'
                  ? 'Nenhuma venda fechada ainda'
                  : column.status === 'perdido'
                    ? 'Nenhum lead perdido — bom trabalho'
                    : 'Nenhuma proposta'}
            </p>
          ) : (
            <>
              {visibleProposals.map(p => (
                <DraggableProposalCard
                  key={p.id}
                  proposal={p}
                  onStatusChange={onStatusChange}
                  onCopy={onCopy}
                  onDelete={onDelete}
                  onSaveNotes={onSaveNotes}
                  onEdit={onEdit}
                  copiedId={copiedId}
                  savingStatus={savingStatus}
                />

              ))}
              {hasMore && (
                <button
                  onClick={() => setExpanded(prev => !prev)}
                  className="w-full text-center py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors rounded-md hover:bg-primary/5"
                >
                  {expanded ? 'Recolher' : `Ver todos (${proposals.length})`}
                </button>
              )}
            </>
          )}
        </div>
        
        {/* Indicator gradient at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none rounded-b-lg z-10" />
      </div>
    </div>
  );
}

/**
 * Memo da coluna: re-renderiza só se a lista (referência) mudar, callbacks
 * mudarem, ou estados visuais (isOver/copiedId que pertença à coluna).
 */
export const DroppableKanbanColumn = memo(DroppableKanbanColumnImpl, (prev, next) => {
  if (prev.proposals !== next.proposals) return false;
  if (prev.column !== next.column) return false;
  if (prev.compact !== next.compact) return false;
  if (prev.isOver !== next.isOver) return false;
  if (prev.onStatusChange !== next.onStatusChange) return false;
  if (prev.onCopy !== next.onCopy) return false;
  if (prev.onDelete !== next.onDelete) return false;
  if (prev.onSaveNotes !== next.onSaveNotes) return false;
  if (prev.onEdit !== next.onEdit) return false;
  if (prev.onQuickCreate !== next.onQuickCreate) return false;
  if (prev.savingStatus !== next.savingStatus) return false;

  // copiedId só importa se algum card desta coluna está/estava copiado.
  const ids = next.proposals.map(p => p.id);
  const prevHas = prev.copiedId !== null && ids.includes(prev.copiedId);
  const nextHas = next.copiedId !== null && ids.includes(next.copiedId);
  if (prevHas || nextHas) {
    if (prev.copiedId !== next.copiedId) return false;
  }
  return true;
});
