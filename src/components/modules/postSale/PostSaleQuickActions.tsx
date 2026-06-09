import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone, MessageCircle, Calendar, Users, MoreHorizontal, RefreshCw } from 'lucide-react';
import {
  useCreatePostSaleEvent, useUpdatePostSaleClient,
} from '@/hooks/usePostSaleQueries';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { toast } from 'sonner';
import type { PostSaleClient, PostSaleStatus } from '@/services/postSale';
import { STATUS_LABELS, STATUS_EMOJI } from './postSaleConstants';
import { PostSaleNextActionDialog } from './PostSaleNextActionDialog';
import { PostSaleReferralDialog } from './PostSaleReferralDialog';

interface Props {
  client: PostSaleClient;
  onOpenDetail: () => void;
  /** se true, mostra apenas ícones (modo card compacto) */
  compact?: boolean;
}

export function PostSaleQuickActions({ client, onOpenDetail, compact }: Props) {
  const createEvent = useCreatePostSaleEvent();
  const updateClient = useUpdatePostSaleClient();
  const currentUserId = useCurrentUserId();
  const [nextOpen, setNextOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);

  const isOwner = !!currentUserId && currentUserId === client.user_id;

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }
    if (!isOwner) {
      toast.error('Este cliente pertence a outro usuário.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    createEvent.mutate({
      client_id: client.id,
      user_id: currentUserId,
      event_type: 'contact',
      description: 'Contato realizado',
      event_date: today,
    }, {
      onSuccess: () => toast.success('Contato registrado ✓'),
      onError: (err: unknown) => {
        logger.error('[PostSaleContact] insert error', err);
        toast.error(err instanceof Error ? err.message : 'Erro ao registrar contato');
      },
    });
    updateClient.mutate({ id: client.id, fields: { last_contact_date: today } });
  };


  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client.client_phone) {
      toast.error('Cliente sem telefone cadastrado');
      return;
    }
    const digits = client.client_phone.replace(/\D/g, '');
    const number = digits.startsWith('55') ? digits : `55${digits}`;
    window.open(`https://wa.me/${number}`, '_blank');
  };

  const handleStatus = (status: PostSaleStatus) => {
    if (status === client.status) return;
    updateClient.mutate(
      { id: client.id, fields: { status } },
      {
        onSuccess: () => toast.success(`Status: ${STATUS_LABELS[status]}`),
        onError: () => toast.error('Erro ao atualizar status'),
      },
    );
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="flex items-center gap-1.5 flex-wrap" onClick={stop}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-11 w-11 p-0 rounded-md"
              onClick={handleContact}
              aria-label="Registrar contato"
            >
              <Phone className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Registrar contato</TooltipContent>
        </Tooltip>

        {client.client_phone && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-11 w-11 p-0 rounded-md border-whatsapp-green/40 text-whatsapp-green hover:bg-whatsapp-green/10"
                onClick={handleWhatsApp}
                aria-label="Abrir WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir WhatsApp</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-11 w-11 p-0 rounded-md"
              onClick={(e) => { e.stopPropagation(); setNextOpen(true); }}
              aria-label="Definir próxima ação"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Definir próxima ação</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-11 w-11 p-0"
            onClick={stop}
            title="Mais ações"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs">Atualizar status</DropdownMenuLabel>
          {(Object.keys(STATUS_LABELS) as PostSaleStatus[]).map((s) => (
            <DropdownMenuItem
              key={s}
              onClick={() => handleStatus(s)}
              disabled={s === client.status}
              className="text-xs"
            >
              <span className="mr-2">{STATUS_EMOJI[s]}</span>
              {STATUS_LABELS[s]}
              {s === client.status && <RefreshCw className="ml-auto h-3 w-3 opacity-50" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setReferralOpen(true)} className="text-xs">
            <Users className="mr-2 h-3.5 w-3.5" />
            Registrar indicação
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenDetail} className="text-xs">
            Abrir detalhes completos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PostSaleNextActionDialog client={client} open={nextOpen} onOpenChange={setNextOpen} />
      <PostSaleReferralDialog client={client} open={referralOpen} onOpenChange={setReferralOpen} />
    </div>
  );
}
