import { useState } from 'react';
import { createUser } from '@/services/users';
import { logAdminAction } from '@/services/adminLogs';

import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateUserDialog({ open, onOpenChange, onCreated }: CreateUserDialogProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();

  const resetForm = () => {
    setNome('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanNome = nome.trim();

    if (!cleanNome || cleanNome.length < 2) {
      toast({ title: 'Nome deve ter no mínimo 2 caracteres', variant: 'destructive' });
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast({ title: 'Informe um e-mail válido', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Senha deve ter no mínimo 6 caracteres', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const result = await createUser({ email: cleanEmail, nome: cleanNome, password });
      // Edge function already logs the creation with minimized PII, 
      // but we ensure frontend call also follows minimization if it was to log separately.
      // We pass undefined details to rely on target_user_id and sanitized logic.
      toast({
        title: 'Usuário criado com sucesso',
        description: 'Informe a senha temporária ao colaborador para que ele acesse o sistema.',
      });
      resetForm();
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast({ title: err.message || 'Erro ao criar usuário', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Crie uma conta para o colaborador. Ele poderá alterar a senha após o primeiro acesso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-nome">Nome completo</Label>
            <Input
              id="create-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do colaborador"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-email">E-mail</Label>
            <Input
              id="create-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              maxLength={255}
              required
            />
            <p className="text-xs text-muted-foreground">Qualquer e-mail válido (corporativo ou externo)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-password">Senha temporária</Label>
            <div className="relative">
              <Input
                id="create-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                maxLength={72}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
