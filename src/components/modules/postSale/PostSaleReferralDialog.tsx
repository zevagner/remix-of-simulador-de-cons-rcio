import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

export function PostSaleReferralDialog({ client, open, onOpenChange }: Props) {
  const createEvent = useCreatePostSaleEvent();
  const currentUserId = useCurrentUserId();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Informe o nome do indicado');
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
      description: `Indicação: ${name.trim()}`,
      event_date: new Date().toISOString().slice(0, 10),
      metadata: {
        kind: 'referral',
        name: name.trim(),
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      },
    }, {
      onSuccess: () => {
        toast.success('Indicação registrada ✓');
        setName(''); setPhone(''); setNotes('');
        onOpenChange(false);
      },
      onError: (err: unknown) => {
        logger.error('[PostSaleReferral] insert error', err);
        const msg = err instanceof Error ? err.message : 'Erro ao registrar';
        toast.error(msg);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Registrar indicação</DialogTitle>
          <DialogDescription>Indicado por {client.client_name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Nome do indicado *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Telefone (opcional)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexto da indicação..."
              className="min-h-[70px] resize-none text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
