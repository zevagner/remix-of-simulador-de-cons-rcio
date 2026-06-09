import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Trash2, Save, Phone, CalendarClock, History, Target, ChevronDown, MessageCircle, Copy, Briefcase, MoreHorizontal, Archive } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { openInWhatsApp } from '@/utils/whatsapp';
import { notifyCopied, notifyError } from '@/utils/trustFeedback';
import { formatCurrency } from '@/core/finance';
import { CurrencyInput } from '@/components/ui/currency-input';
import type { ProposalStatus, UpdateProposalFields } from '@/services/proposals';
import type { ProposalWithPriority } from '@/utils/proposalPriority';
import {
  COLUMNS, consortiumTypeLabel, NEXT_ACTIONS, TERMINAL_STATUSES,
  type NextActionType,
} from './pipelineConstants';
import { FOLLOW_UP_CADENCE, HIDDEN_CADENCE_STATUSES, getSuggestedDate } from './followUpCadence';
import { LOST_REASONS, ARCHIVE_REASONS, readLostReason, stripLostReason, applyLostReason, type LostReason } from './lostReasons';
import { FollowUpCadenceSection } from './FollowUpCadenceSection';
import { ProposalHistoryTab } from './ProposalHistoryTab';
import { trackEvent } from '@/services/analyticsTracker';
import { cn } from '@/lib/utils';

interface EditProposalModalProps {
  proposal: ProposalWithPriority | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando `newStatus` é informado, o pai DEVE aplicar status + fields atomicamente
   *  (evita race entre duas mutations e impede que próxima ação seja "ressuscitada"
   *  após mover para fechado/perdido). */
  onSave: (id: string, fields: UpdateProposalFields, newStatus?: ProposalStatus) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ProposalStatus) => void;
  /** Onda Carteira 3 — dispara o fluxo de ativação no Pós-venda (delegado ao pai). */
  onMoveToPostSale?: (id: string) => void;
  /** Onda Carteira 3 — arquiva (status=perdido) com motivo estruturado em notes. */
  onArchive?: (id: string, reason: LostReason) => void;
}

export function EditProposalModal({
  proposal, open, onOpenChange, onSave, onDelete, onStatusChange,
  onMoveToPostSale, onArchive,
}: EditProposalModalProps) {
  const [clientName, setClientName] = useState('');
  const [creditValue, setCreditValue] = useState(0);
  const [bidPercent, setBidPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ProposalStatus>('prospeccao');
  const [clientPhone, setClientPhone] = useState('');
  const [nextContactDate, setNextContactDate] = useState('');
  const [nextActionType, setNextActionType] = useState<NextActionType | ''>('');
  const [nextActionNotes, setNextActionNotes] = useState('');
  // showDeleteConfirm removido: substituído por AlertDialog inline.
  // Trigger obrigatório no primeiro acesso de propostas legadas (nao_identificado)
  const [prospectTrigger, setProspectTrigger] = useState<string>('');
  const [triggerPromptShown, setTriggerPromptShown] = useState(false);
  // Motivo estruturado de "perdido" — Onda Carteira 1
  const [lostReason, setLostReason] = useState<LostReason | ''>('');
  // Onda Carteira 3 — confirmações de "Mover para Pós-venda" e "Arquivar lead"
  const [movePostSaleConfirmOpen, setMovePostSaleConfirmOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState<LostReason | ''>('');

  // Sync state when proposal changes
  useEffect(() => {
    if (proposal) {
      setClientName(proposal.client_name);
      setCreditValue(proposal.credit_value);
      setBidPercent(proposal.bid_percent ?? 0);
      // Notas: separa motivo estruturado da observação livre.
      setLostReason((readLostReason(proposal.notes) ?? '') as LostReason | '');
      setNotes(stripLostReason(proposal.notes));
      setStatus(proposal.status);
      setClientPhone(proposal.client_phone ?? '');
      setNextActionType((proposal.next_action_type as NextActionType | null) ?? '');
      setNextActionNotes(proposal.next_action_notes ?? '');
      // showDeleteConfirm removido — AlertDialog gerencia próprio estado interno.
      const initialTrigger = proposal.prospect_trigger ?? '';
      setProspectTrigger(initialTrigger === 'nao_identificado' ? '' : initialTrigger);
      // Telemetria: prompt aparecerá para propostas legadas sem trigger
      if ((!initialTrigger || initialTrigger === 'nao_identificado') && !triggerPromptShown) {
        setTriggerPromptShown(true);
        trackEvent('proposal_trigger_required_prompt', { module: 'pipeline' });
      }

      // Store prospect trigger for Abordagem tab context
      const trigger = proposal.prospect_trigger;
      if (trigger && trigger !== 'nao_identificado') {
        try {
          const contextMap: Record<string, string> = {
            aluguel: 'aluguel', fgts: 'fgts', financiamento: 'financiamento',
            pj: 'pj', liquidez: 'liquidez', investidor: 'investidor',
            sucessao: 'sucessao', agro: 'agro',
          };
          if (contextMap[trigger]) {
            localStorage.setItem('pipeline_prospect_context', contextMap[trigger]);
          }
        } catch { /* ignore */ }
      }

      if (proposal.next_contact_date) {
        setNextContactDate(proposal.next_contact_date);
      } else {
        const cadence = FOLLOW_UP_CADENCE[proposal.status];
        setNextContactDate(cadence ? getSuggestedDate(cadence.daysOffset) : '');
      }
    }
  }, [proposal]);

  if (!proposal) return null;

  const isProspect = proposal.status === 'prospeccao';
  const currentCol = COLUMNS.find(c => c.status === proposal.status);
  const daysSinceUpdate = Math.floor((Date.now() - new Date(proposal.updated_at).getTime()) / (1000 * 60 * 60 * 24));

  const needsTrigger = !prospectTrigger;

  const handleSave = () => {
    if (needsTrigger) return; // bloqueio leve: trigger obrigatório
    const isTerminal = TERMINAL_STATUSES.has(status);
    const statusChanged = status !== proposal.status;
    const fields: UpdateProposalFields = {
      client_name: clientName.trim() || proposal.client_name,
      credit_value: creditValue || proposal.credit_value,
      bid_percent: bidPercent || null,
      // Onda Carteira 1: motivo de "perdido" embute prefixo `[Motivo: X]` em notes.
      notes: (() => {
        const merged = status === 'perdido'
          ? applyLostReason(notes, lostReason || null)
          : notes.trim();
        return merged.trim() || null;
      })(),
      client_phone: clientPhone.trim() || null,
      next_contact_date: isTerminal ? null : (nextContactDate || null),
      next_action_type: isTerminal ? null : (nextActionType || null),
      next_action_notes: isTerminal ? null : (nextActionNotes.trim() || null),
      prospect_trigger: prospectTrigger,
    };

    if (statusChanged) {
      onSave(proposal.id, fields, status);
    } else {
      onSave(proposal.id, fields);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(proposal.id);
    onOpenChange(false);
  };

  // Ações em destaque (Carteira 3) — disponíveis antes dos campos de formulário.
  const phoneDigits = clientPhone.replace(/\D/g, '');
  const hasPhone = phoneDigits.length >= 8;
  const waNumber = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`;
  const hasProposalContent = !!proposal.proposal_content?.trim() && !isProspect;

  const handleCall = () => {
    if (!hasPhone) return;
    window.location.href = `tel:+${waNumber}`;
  };
  const handleWhatsApp = () => {
    if (!hasPhone) return;
    if (hasProposalContent) {
      openInWhatsApp(proposal.proposal_content);
    } else {
      window.open(`https://wa.me/${waNumber}`, '_blank');
    }
  };
  const handleCopyProposal = async () => {
    if (!hasProposalContent) return;
    try {
      await navigator.clipboard.writeText(proposal.proposal_content);
      notifyCopied('Proposta copiada');
    } catch {
      notifyError('Não foi possível copiar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {currentCol && <span className="text-lg">{currentCol.emoji}</span>}
            <div>
              <DialogTitle className="text-lg">{proposal.client_name || 'Sem nome'}</DialogTitle>
              <DialogDescription className="text-xs">
                Criado em {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                {daysSinceUpdate > 0 && ` · Atualizado há ${daysSinceUpdate}d`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Ações em destaque (sempre no topo, antes dos campos) ── */}
        <div className="flex gap-2 -mt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasPhone}
            onClick={handleCall}
            className="flex-1 gap-1.5"
            title={hasPhone ? `Ligar para ${clientPhone}` : 'Cadastre o telefone abaixo'}
          >
            <Phone className="h-4 w-4" />
            Ligar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasPhone}
            onClick={handleWhatsApp}
            className="flex-1 gap-1.5 border-whatsapp-green/40 bg-whatsapp-green/10 text-whatsapp-green hover:bg-whatsapp-green/20 hover:text-whatsapp-green disabled:opacity-50"
            title={hasPhone ? 'Abrir WhatsApp' : 'Cadastre o telefone abaixo'}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasProposalContent}
            onClick={handleCopyProposal}
            className="flex-1 gap-1.5"
            title={hasProposalContent ? 'Copiar texto da proposta' : 'Disponível após salvar a proposta'}
          >
            <Copy className="h-4 w-4" />
            Copiar
          </Button>
          {/* Onda Carteira 3 — Mover para Pós-venda (só em proposta_ajustada) */}
          {proposal.status === 'proposta_ajustada' && onMoveToPostSale && (
            <Button
              type="button"
              size="sm"
              onClick={() => setMovePostSaleConfirmOpen(true)}
              className="flex-1 gap-1.5 bg-success text-success-foreground hover:bg-success/90"
              title="Confirmar venda e ativar o cliente no Pós-venda"
            >
              <Briefcase className="h-4 w-4" />
              Pós-venda
            </Button>
          )}
          {/* Onda Carteira 3 — Menu ⋯ (Arquivar) */}
          {onArchive && proposal.status !== 'perdido' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-2"
                  aria-label="Mais ações"
                  title="Mais ações"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setArchiveReason('');
                    setArchiveDialogOpen(true);
                  }}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Confirmação — Mover para Pós-venda */}
        <AlertDialog open={movePostSaleConfirmOpen} onOpenChange={setMovePostSaleConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar fechamento da venda?</AlertDialogTitle>
              <AlertDialogDescription>
                Confirmar que a venda de <strong>{proposal.client_name || 'este cliente'}</strong> foi fechada e mover para o Pós-venda? A proposta sairá do Kanban e o cliente entrará no acompanhamento contínuo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setMovePostSaleConfirmOpen(false);
                  onOpenChange(false);
                  onMoveToPostSale?.(proposal.id);
                }}
                className="bg-success text-success-foreground hover:bg-success/90"
              >
                Confirmar e mover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog — Arquivar lead (motivo obrigatório) */}
        <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Arquivar lead</DialogTitle>
              <DialogDescription>
                O lead sai do Kanban e fica disponível na aba "Arquivados". Você pode reativá-lo a qualquer momento.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="archive-reason">Motivo</Label>
              <Select value={archiveReason || undefined} onValueChange={(v) => setArchiveReason(v as LostReason)}>
                <SelectTrigger id="archive-reason">
                  <SelectValue placeholder="Selecione um motivo" />
                </SelectTrigger>
                <SelectContent>
                  {ARCHIVE_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>Cancelar</Button>
              <Button
                disabled={!archiveReason}
                onClick={() => {
                  if (!archiveReason) return;
                  setArchiveDialogOpen(false);
                  onOpenChange(false);
                  onArchive?.(proposal.id, archiveReason);
                }}
                className="gap-1"
              >
                <Archive className="h-4 w-4" /> Arquivar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados" className="text-xs">Dados</TabsTrigger>
            <TabsTrigger value="historico" className="text-xs gap-1.5">
              <History className="h-3.5 w-3.5" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="historico" className="mt-3">
            <ProposalHistoryTab proposalId={proposal.id} />
          </TabsContent>

          <TabsContent value="dados" className="mt-3">
        <div className="grid gap-4 py-2">
          {/* ── SEÇÃO 1 — Ação imediata (sempre visível) ── */}
          {!HIDDEN_CADENCE_STATUSES.includes(status) && (
            <div className="grid gap-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Ação imediata</h3>

              {/* Próxima ação (tipo + data + detalhes) */}
              <div className="grid gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Target className="h-3.5 w-3.5" />
                  Próxima ação
                </Label>
                <Select
                  value={nextActionType || 'none'}
                  onValueChange={(v) => setNextActionType(v === 'none' ? '' : (v as NextActionType))}
                >
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder="Selecione uma ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sem ação definida —</SelectItem>
                    {NEXT_ACTIONS.map(a => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.icon} {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-next-contact" className="text-xs flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Data de próximo contato
                  </Label>
                  <Input
                    id="edit-next-contact"
                    type="date"
                    value={nextContactDate}
                    onChange={e => setNextContactDate(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <Textarea
                  value={nextActionNotes}
                  onChange={e => setNextActionNotes(e.target.value)}
                  placeholder="Detalhes (ex: confirmar prazo, enviar PDF, ligar após 14h…)"
                  className="min-h-[60px] resize-none text-xs bg-background"
                />
              </div>

              {/* Cadência Sugerida */}
              {FOLLOW_UP_CADENCE[status] && (
                <FollowUpCadenceSection
                  cadence={FOLLOW_UP_CADENCE[status]!}
                  clientName={clientName.trim() || undefined}
                />
              )}

              <Separator />
            </div>
          )}

          {/* ── SEÇÃO 2 — Dados do lead (colapsável, aberto) ── */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md py-3 text-left">
              <h3 className="text-sm font-semibold text-muted-foreground">Dados do lead</h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="grid gap-4 pt-3">
              {/* Client name */}
              <div className="grid gap-1.5">
                <Label htmlFor="edit-name">Nome do cliente</Label>
                <Input
                  id="edit-name"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>

              {/* Phone */}
              <div className="grid gap-1.5">
                <Label htmlFor="edit-phone">Telefone do cliente</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-phone"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="flex-1"
                  />
                  {clientPhone.trim() && (
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="shrink-0 border-whatsapp-green/40 bg-whatsapp-green/10 text-whatsapp-green hover:bg-whatsapp-green/20 hover:text-whatsapp-green"
                      title="Abrir WhatsApp"
                      aria-label="Abrir conversa no WhatsApp"
                      onClick={() => {
                        const digits = clientPhone.replace(/\D/g, '');
                        const number = digits.startsWith('55') ? digits : `55${digits}`;
                        window.open(`https://wa.me/${number}`, '_blank');
                      }}
                    >
                      <Phone aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-caption text-muted-foreground/70">
                  💡 Use pelo celular — WhatsApp pode estar bloqueado na rede corporativa
                </p>
              </div>

              {/* Status + Consortium Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => {
                      const newStatus = v as ProposalStatus;
                      setStatus(newStatus);
                      const cadence = FOLLOW_UP_CADENCE[newStatus];
                      if (cadence) {
                        setNextContactDate(getSuggestedDate(cadence.daysOffset));
                      } else {
                        setNextContactDate('');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMNS.map(col => (
                        <SelectItem key={col.status} value={col.status}>
                          {col.emoji} {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Tipo de consórcio</Label>
                  <Input
                    value={consortiumTypeLabel[proposal.consortium_type] || proposal.consortium_type || '—'}
                    readOnly
                    className="bg-muted/30 cursor-default"
                  />
                </div>
              </div>

              {/* Value + Bid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Valor da carta</Label>
                  <CurrencyInput value={creditValue} onChange={setCreditValue} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Lance (%)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    step="0.01"
                    value={bidPercent || ''}
                    onChange={e => setBidPercent(parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 30"
                  />
                </div>
              </div>

              {/* Read-only info for non-prospects */}
              {!isProspect && (
                <div className="flex gap-3 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                  <span>Prazo: <strong className="text-foreground">{proposal.term_months}m</strong></span>
                  <span>Parcela: <strong className="text-foreground">{formatCurrency(proposal.installment)}</strong></span>
                  <span>Total: <strong className="text-foreground">{formatCurrency(proposal.total_cost)}</strong></span>
                </div>
              )}

              {/* Motivo de "Perdido" — Onda Carteira 1 */}
              {status === 'perdido' && (
                <div className="grid gap-1.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <Label className="text-xs font-semibold text-destructive">Por que esse lead foi perdido?</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {LOST_REASONS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setLostReason(lostReason === r.value ? '' : r.value)}
                        className={cn(
                          'px-2.5 py-1 rounded-full border text-caption font-medium transition',
                          lostReason === r.value
                            ? 'border-destructive bg-destructive/15 text-destructive'
                            : 'border-border bg-card hover:bg-muted/40 text-muted-foreground',
                        )}
                      >
                        <span className="mr-1">{r.emoji}</span>{r.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-caption text-muted-foreground">Ajuda a identificar padrões. A observação livre fica abaixo.</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* ── SEÇÃO 3 — Observações (colapsável, fechado) ── */}
          <Collapsible>
            <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md py-3 text-left">
              <h3 className="text-sm font-semibold text-muted-foreground">Observações</h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-notes" className="sr-only">Observações</Label>
                <Textarea
                  id="edit-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Interesse do cliente / Objeções levantadas / Próximo passo combinado"
                  className="min-h-[100px] resize-none"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {/* Delete */}
          <div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {clientName ? `"${clientName}" será removido.` : 'Esta proposta será removida.'} Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={needsTrigger} className="gap-1">
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
