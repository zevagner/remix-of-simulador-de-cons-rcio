import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();
  

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the URL token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check if there's already a session (user clicked the link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Senha deve ter no mínimo 6 caracteres', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      const lower = (error.message || '').toLowerCase();
      const friendly =
        lower.includes('pwned') || lower.includes('compromised') || lower.includes('breach') || (lower.includes('password') && lower.includes('weak'))
          ? 'Esta senha já apareceu em vazamentos públicos de dados. Escolha uma senha diferente para proteger sua conta.'
          : error.message;
      toast({ title: 'Erro ao redefinir senha', description: friendly, variant: 'destructive' });
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-landing-dark via-landing-dark-mid to-landing-dark-deep px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Senha redefinida!</h1>
            <p className="text-white/70 text-sm">Sua senha foi alterada com sucesso. Você já pode fazer login.</p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-landing-gold hover:bg-landing-gold-hover text-landing-dark font-bold"
            >
              Ir para o Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-landing-dark via-landing-dark-mid to-landing-dark-deep px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-landing-gold mx-auto" />
            <p className="text-white/70 text-sm">Verificando link de redefinição...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-landing-dark via-landing-dark-mid to-landing-dark-deep px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/app-icon.png" alt="Simulador de Consórcio" className="h-20 w-auto object-contain mx-auto mb-6 rounded-2xl" />
          <h1 className="text-2xl font-bold text-white">Nova senha</h1>
          <p className="text-white/60 mt-2 text-sm">Defina sua nova senha abaixo</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">Nova Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-card/10 border-white/20 text-white placeholder:text-white/40 pr-10"
                maxLength={100}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-white/80">Confirmar Nova Senha</Label>
            <Input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repita a nova senha"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="bg-card/10 border-white/20 text-white placeholder:text-white/40"
              maxLength={100}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-landing-gold hover:bg-landing-gold-hover text-landing-dark font-bold">
            {loading ? 'Salvando...' : 'Redefinir Senha'}
          </Button>
        </form>
      </div>
    </div>
  );
}
