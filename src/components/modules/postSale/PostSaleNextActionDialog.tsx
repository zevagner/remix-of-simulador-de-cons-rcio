import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePostSaleEvent } from '@/hooks/usePostSaleQueries';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { toast } from 'sonner';
import type { PostSaleClient } from '@/services/postSale';

import { logger } from '@/utils/logger';
interface Props {
  client: PostSaleClient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESETS = [
  'Ligar para confirmar interesse',
  'Enviar WhatsApp de follow-up',
  'Agendar reunião',
  'Acompanhar pagamento da parcela',
  'Confirmar uso da carta de crédito',
  'Sugerir nova venda / indicação',
];

export function PostSaleNextActionDialog({ client, open, onOpenChange }: Props) {
  const createEvent = useCreatePostSaleEvent();
  const currentUserId = useCurrentUserId();
  const [action, setAction] = useState(PRESETS[0]);
  const [custom, setCustom] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });

  const handleSave = () => {
    const finalAction = custom.trim() || action;
    if (!finalAction) {
      toast.error('Informe a próxima ação');
      return;
    }
    if (!currentUserId) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }
    if (currentUserId !== client.user_id) {
      toast.error('Este cliente pertence a outro usuário.');
      return;
    }
    createEvent.mutate({
      client_id: client.id,
      user_id: currentUserId,
      event_type: 'opportunity',
      description: `Próxima ação: ${finalAction}`,
      event_date: dueDate,
      metadata: { kind: 'next_action', action: finalAction, due_date: dueDate, done: false },
    }, {
      onSuccess: () => { toast.success('Próxima ação agendada ✓'); onOpenChange(false); setCustom(''); },
      onError: (err: unknown) => {
        logger.error('[PostSaleNextAction] insert error', err);
        const msg = err instanceof Error ? err.message : 'Erro ao agendar';
        toast.error(msg);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Definir próxima ação</DialogTitle>
          <DialogDescription>Cliente: {client.client_name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Ação sugerida</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRESETS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Ou descreva (opcional)</Label>
            <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Ex: Enviar simulação atualizada" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Data prevista</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Agendar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
