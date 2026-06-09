import { useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { isAllowedEmail, DOMAIN_HINT } from '@/utils/emailValidation';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface EmailMigrationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCreateNew: () => void;
  currentEmail: string;
}

export function EmailMigrationModal({ open, onClose, onSuccess, onCreateNew, currentEmail }: EmailMigrationModalProps) {
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newEmail.trim();

    if (!trimmed) {
      toast({ title: 'Informe o novo e-mail', variant: 'destructive' });
      return;
    }

    if (!isAllowedEmail(trimmed)) {
      toast({ title: 'O e-mail deve ser @caixa.gov.br', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: 'Sessão expirada', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.functions.invoke('update-user-email', {
      body: { new_email: trimmed },
    });

    setLoading(false);

    if (error || data?.error) {
      toast({ title: data?.error || 'Erro ao atualizar e-mail', variant: 'destructive' });
      return;
    }

    toast({ title: 'E-mail atualizado com sucesso! Faça login novamente.' });
    await supabase.auth.signOut();
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Atualização necessária</DialogTitle>
          </div>
          <DialogDescription>
            Seu cadastro foi feito com o e-mail <strong>{currentEmail}</strong>, que não é corporativo.
            Para continuar usando o sistema, atualize para seu e-mail @caixa.gov.br.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Novo e-mail corporativo</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="nome@caixa.gov.br"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{DOMAIN_HINT}</p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Atualizando...' : <><ArrowRight className="h-4 w-4 mr-2" /> Atualizar e-mail</>}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { onClose(); onCreateNew(); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Prefiro criar um novo cadastro
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
