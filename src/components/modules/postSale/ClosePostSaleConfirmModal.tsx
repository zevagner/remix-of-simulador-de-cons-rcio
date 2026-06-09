import { useState } from 'react';
import { logger } from '@/utils/logger';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, Check } from 'lucide-react';
import { useCreatePostSaleClient } from '@/hooks/usePostSaleQueries';
import { findPostSaleByProposal } from '@/services/postSale';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { ProposalRecord } from '@/services/proposals';

interface ClosePostSaleConfirmModalProps {
  proposal: ProposalRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Confirma o fechamento — chamada após (ou em caso de skip) a criação no pós-venda. */
  onConfirmClose: () => void;
}

/**
 * Modal exibido quando uma proposta é movida para "Fechado" no Kanban.
 * Permite ativar o cliente no módulo Pós-venda confirmando dados-chave
 * (data de entrada no grupo, número do grupo, observação inicial).
 */
export function ClosePostSaleConfirmModal({
  proposal, open, onOpenChange, onConfirmClose,
}: ClosePostSaleConfirmModalProps) {
  const createMutation = useCreatePostSaleClient();
  const { user } = useAuth();
  const [groupEntryDate, setGroupEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [groupNumber, setGroupNumber] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!proposal) return null;

  const handleActivate = async () => {
    if (!user) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }
    setSubmitting(true);
    try {
      // Evita duplicação se já existir (também há UNIQUE no banco como salvaguarda)
      const existing = await findPostSaleByProposal(proposal.id);
      if (existing) {
        toast.info('Cliente já está no Pós-venda');
        onConfirmClose();
        onOpenChange(false);
        return;
      }
      await createMutation.mutateAsync({
        // Ownership = dono da proposta (admin não sobrescreve)
        user_id: proposal.user_id,
        proposal_id: proposal.id,
        client_name: proposal.client_name || 'Cliente',
        client_phone: proposal.client_phone ?? null,
        consortium_type: proposal.consortium_type,
        credit_value: proposal.credit_value,
        term_months: proposal.term_months,
        group_number: groupNumber ? parseInt(groupNumber, 10) : (proposal.group_number ?? null),
        plan_modality: proposal.plan_type ?? 'tradicional',
        status: 'ativo',
        priority: 'normal',
        group_entry_date: groupEntryDate || null,
        notes: notes.trim() || null,
      });
      toast.success('Cliente ativado no Pós-venda 🎉');
      onConfirmClose();
      onOpenChange(false);
    } catch (e: unknown) {
      logger.error(e);
      const code = (e as { code?: string })?.code;
      if (code === '23505') {
        toast.info('Cliente já está no Pós-venda');
        onConfirmClose();
        onOpenChange(false);
      } else {
        toast.error('Erro ao ativar no Pós-venda');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onConfirmClose();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Ativar no Pós-venda?
          </DialogTitle>
          <DialogDescription>
            <strong>{proposal.client_name}</strong> está sendo movido para "Fechado". Confirme os dados para iniciar o acompanhamento contínuo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ps-entry-date">Data de entrada no grupo</Label>
              <Input
                id="ps-entry-date"
                type="date"
                value={groupEntryDate}
                onChange={(e) => setGroupEntryDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ps-group-num">Nº do grupo</Label>
              <Input
                id="ps-group-num"
                type="number"
                value={groupNumber}
                onChange={(e) => setGroupNumber(e.target.value)}
                placeholder={proposal.group_number?.toString() ?? '—'}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ps-notes">Observação inicial (opcional)</Label>
            <Textarea
              id="ps-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Cliente pretende dar lance no 6º mês"
              className="min-h-[70px] resize-none"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            💡 O cliente continuará na sua Carteira como "Fechado" e ficará disponível também no módulo
            Pós-venda para registrar lances, contemplação, contatos e oportunidades.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" size="sm" onClick={handleSkip} disabled={submitting}>
            Apenas fechar (sem pós-venda)
          </Button>
          <Button onClick={handleActivate} disabled={submitting} className="gap-1.5">
            <Check className="h-4 w-4" />
            {submitting ? 'Ativando…' : 'Ativar e fechar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
