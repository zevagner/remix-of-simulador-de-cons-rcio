/**
 * NextActionModal — força o vendedor a registrar a próxima ação ao mover lead.
 * Aparece quando o status muda para uma coluna ativa (não-terminal).
 *
 * Onda 4 — Bloqueio parcial:
 *   • Tipo de ação e data são OBRIGATÓRIOS para confirmar o avanço.
 *   • Botão "Pular" só aparece quando NÃO houve mudança de status (definição
 *     avulsa de próxima ação após "Concluir ação"), permitindo cancelar sem persistir.
 *   • Para mudanças reais de coluna ativa, só há "Cancelar" (volta ao estado anterior)
 *     ou "Salvar e mover" (com ação completa). Não dá para avançar sem registrar.
 */
import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarClock, Save, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProposalStatus } from '@/services/proposals';
import type { ProposalRecord } from '@/services/proposals';
import {
  COLUMNS, NEXT_ACTIONS, DEFAULT_ACTION_FOR_STATUS, type NextActionType,
} from './pipelineConstants';

export interface NextActionResult {
  next_action_type: NextActionType | null;
  next_action_notes: string | null;
  next_contact_date: string | null;
}

interface NextActionModalProps {
  open: boolean;
  proposal: ProposalRecord | null;
  targetStatus: ProposalStatus | null;
  onConfirm: (result: NextActionResult) => void;
  onSkip: () => void;
  onCancel: () => void;
}

function defaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function NextActionModal({
  open, proposal, targetStatus, onConfirm, onSkip, onCancel,
}: NextActionModalProps) {
  const [actionType, setActionType] = useState<NextActionType>('ligar');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (open && targetStatus) {
      const suggested = DEFAULT_ACTION_FOR_STATUS[targetStatus] ?? 'ligar';
      setActionType(suggested);
      setNotes('');
      setDate(defaultDate());
    }
  }, [open, targetStatus]);

  if (!proposal || !targetStatus) return null;

  const targetCol = COLUMNS.find(c => c.status === targetStatus);
  // Quando targetStatus === status atual, é uma definição avulsa (ex.: vindo de
  // "Concluir ação"). Nesse caso permitimos pular sem persistir nada.
  // Quando há mudança real de coluna ativa, ação é OBRIGATÓRIA.
  const isStatusChange = proposal.status !== targetStatus;
  const canConfirm = Boolean(actionType && date);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      next_action_type: actionType,
      next_action_notes: notes.trim() || null,
      next_contact_date: date || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span>{targetCol?.emoji}</span>
            Qual a próxima ação?
          </DialogTitle>
          <DialogDescription className="text-xs">
            <span className="font-medium text-foreground">{proposal.client_name || 'Lead'}</span>
            {isStatusChange ? (
              <> movido para <span className="font-medium text-foreground">{targetCol?.label}</span>. Defina o que fazer a seguir — <span className="text-destructive font-semibold">obrigatório</span> para concluir a movimentação.</>
            ) : (
              <> · defina a próxima ação. Você pode cancelar se preferir definir depois.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2">
          {/* Action type — grid de botões */}
          <div className="grid gap-1.5">
            <Label>Tipo de ação</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {NEXT_ACTIONS.map(a => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setActionType(a.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-2 py-2.5 rounded-md border text-caption font-medium transition-[colors,box-shadow,transform]',
                    actionType === a.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:bg-muted/40 text-foreground',
                  )}
                >
                  <span className="text-base leading-none">{a.icon}</span>
                  <span className="leading-tight text-center">{a.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date + snooze rápido (Onda Carteira 1) */}
          <div className="grid gap-1.5">
            <Label htmlFor="next-action-date">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                Quando
              </span>
            </Label>
            <Input
              id="next-action-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[1, 3, 7, 14, 30].map((d) => {
                const dt = new Date(); dt.setDate(dt.getDate() + d);
                const iso = dt.toISOString().slice(0, 10);
                const label = d === 1 ? 'Amanhã' : `+${d}d`;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(iso)}
                    className={cn(
                      'px-2 py-0.5 rounded-full border text-caption font-medium transition',
                      date === iso
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:bg-muted/40 text-muted-foreground',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label htmlFor="next-action-notes">Notas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Textarea
              id="next-action-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: confirmar valor disponível para lance"
              className="min-h-[60px] resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {isStatusChange ? (
            <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1.5 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Cancelar movimentação
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onSkip} className="gap-1.5 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Definir depois
            </Button>
          )}
          <Button onClick={handleConfirm} disabled={!canConfirm} className="gap-1.5">
            <Save className="h-4 w-4" />
            {isStatusChange ? 'Salvar e mover' : 'Salvar ação'}
          </Button>
        </DialogFooter>
        {isStatusChange && !canConfirm && (
          <p className="flex items-center gap-1.5 text-caption text-destructive -mt-2">
            <AlertCircle className="h-3 w-3" />
            Tipo de ação e data são obrigatórios para mover o lead.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
