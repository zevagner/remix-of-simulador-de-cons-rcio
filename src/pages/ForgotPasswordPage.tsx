import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { MailCheck, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: 'Informe seu email', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({ title: 'Erro ao enviar email', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-landing-dark via-landing-dark-mid to-landing-dark-deep px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-landing-gold/20 flex items-center justify-center">
              <MailCheck className="h-8 w-8 text-landing-gold" />
            </div>
            <h1 className="text-2xl font-bold text-white">Email enviado!</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Enviamos um link de redefinição para <strong className="text-white">{email}</strong>.
              <br /><br />
              Verifique sua caixa de entrada e clique no link para criar uma nova senha.
            </p>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-card/10"
            >
              Voltar ao Login
            </Button>
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
          <h1 className="text-2xl font-bold text-white">Esqueci minha senha</h1>
          <p className="text-white/60 mt-2 text-sm">Informe seu email para receber o link de redefinição</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-card/10 border-white/20 text-white placeholder:text-white/40"
              autoComplete="email"
              maxLength={100}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-landing-gold hover:bg-landing-gold-hover text-landing-dark font-bold">
            {loading ? 'Enviando...' : 'Enviar link de redefinição'}
          </Button>

          <button type="button" onClick={() => navigate('/login')} className="w-full text-center text-sm text-white/50 hover:text-white/80 transition-colors flex items-center justify-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Voltar ao Login
          </button>
        </form>
      </div>
    </div>
  );
}
