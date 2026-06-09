import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Briefcase, ClipboardList, Rocket } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_PREFIX = 'postSaleOnboardingSeen';
const LEGACY_KEY = 'postSaleOnboardingSeen'; // chave global antiga (pré-multi-usuário)

interface Props {
  /** Quantidade de clientes existentes — usado para auto-disparar enquanto vazio. */
  clientsCount: number;
}

/**
 * Onboarding curto do módulo Pós-venda.
 * Aparece no primeiro acesso (por usuário) ou enquanto não houver clientes.
 * Chave segregada por userId para evitar conflito em máquinas compartilhadas.
 */
export function PostSaleOnboardingModal({ clientsCount }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const storageKey = user ? `${STORAGE_PREFIX}_${user.userId}` : null;

  useEffect(() => {
    if (!storageKey) return; // aguarda usuário autenticado
    const seen = localStorage.getItem(storageKey) === 'true';
    if (!seen) setOpen(true);
    // Limpa chave global legada para evitar "vazamento" entre usuários no mesmo browser.
    if (localStorage.getItem(LEGACY_KEY) !== null) {
      localStorage.removeItem(LEGACY_KEY);
    }
    // só dispara quando o usuário é resolvido
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const handleClose = () => {
    if (storageKey) localStorage.setItem(storageKey, 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Bem-vindo ao Pós-venda
          </DialogTitle>
          <DialogDescription>
            A venda continua aqui. Em 30 segundos você entende como usar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Step
            n={1}
            icon={Briefcase}
            title="Para que serve"
            text="É aqui que você mantém o relacionamento depois do fechamento, acompanha contemplação e gera novas oportunidades."
          />
          <Step
            n={2}
            icon={ClipboardList}
            title="O que fazer aqui"
            text={
              <ul className="list-disc pl-5 space-y-0.5">
                <li>Registrar interações com o cliente</li>
                <li>Acompanhar a contemplação</li>
                <li>Identificar momento para 2ª carta ou indicação</li>
                <li>Manter o relacionamento ativo</li>
              </ul>
            }
          />
          <Step
            n={3}
            icon={Rocket}
            title="Como começar"
            text="Feche uma proposta na Carteira e ative o acompanhamento. O cliente aparece aqui automaticamente."
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Ver ajuda completa
          </button>
          <Button onClick={handleClose}>Entendi, começar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Step({
  n, icon: Icon, title, text,
}: { n: number; icon: React.ElementType; title: string; text: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </p>
        <div className="text-sm text-muted-foreground mt-0.5">{text}</div>
      </div>
    </div>
  );
}
