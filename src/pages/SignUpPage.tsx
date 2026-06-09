import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp } from '@/services/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Eye, EyeOff, MailCheck, RefreshCw } from 'lucide-react';
import { isAllowedEmail, DOMAIN_ERROR_SIGNUP, DOMAIN_HINT } from '@/utils/emailValidation';


export default function SignUpPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    if (error) {
      toast({ title: 'Erro ao reenviar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Novo e-mail de confirmação enviado!' });
    }
    setResendCooldown(30);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !senha || !confirmar || !acceptedTerms) {
      toast({ title: 'Preencha todos os campos e aceite os termos', variant: 'destructive' });
      return;
    }
    if (senha.length < 6) {
      toast({ title: 'Senha deve ter no mínimo 6 caracteres', variant: 'destructive' });
      return;
    }
    if (senha !== confirmar) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }
    if (!isAllowedEmail(email)) {
      toast({ title: DOMAIN_ERROR_SIGNUP, variant: 'destructive' });
      return;
    }

    setLoading(true);
    const result = await signUp({ nome: nome.trim(), email: email.trim(), senha });
    setLoading(false);

    if (result.success) {
      setRegistered(true);
    } else {
      console.error('[SignUp] Falha na criação:', result.error);
      toast({ title: 'Erro ao criar conta', description: result.error, variant: 'destructive' });
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-landing-dark via-landing-dark-mid to-landing-dark-deep px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-landing-gold/20 flex items-center justify-center">
              <MailCheck className="h-8 w-8 text-landing-gold" />
            </div>
            <h1 className="text-2xl font-bold text-white">Verifique seu e-mail</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Enviamos um link de confirmação para <strong className="text-white">{email}</strong>.
              <br /><br />
              Clique no link recebido para <strong className="text-white">ativar sua conta</strong>.
              {email.toLowerCase().endsWith('@caixaconsorcio.com.br') && (
                <>
                  <br /><br />
                  <span className="text-landing-gold font-medium">Seu acesso está sendo analisado pelo administrador. Você receberá acesso em breve.</span>
                </>
              )}
            </p>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-300/90 leading-relaxed">
                ⚠️ Não recebeu? Verifique a pasta de spam ou lixo eletrônico. E-mails corporativos podem demorar alguns minutos.
              </p>
            </div>

            <Button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              variant="outline"
              className="w-full border-landing-gold/30 text-landing-gold hover:bg-landing-gold/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar e-mail de confirmação'}
            </Button>

            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-card/10"
            >
              Ir para o Login
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
          <h1 className="text-2xl font-bold text-white">Criar Conta</h1>
          <p className="text-white/60 mt-2 text-sm">Preencha seus dados para se cadastrar</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-white/80">Nome</Label>
            <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" className="bg-card/10 border-white/20 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/40" autoComplete="name" maxLength={100} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@caixa.gov.br" className="bg-card/10 border-white/20 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/40" autoComplete="email" maxLength={100} />
            <p className="text-xs text-white/50">{DOMAIN_HINT}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha" className="text-white/80">Senha</Label>
            <div className="relative">
              <Input id="senha" type={showPassword ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} placeholder="Crie uma senha exclusiva (não reutilize senhas corporativas)" className="bg-card/10 border-white/20 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/40 pr-10" autoComplete="new-password" maxLength={100} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 text-sm mt-0.5">⚠️</span>
              <p className="text-xs text-amber-300/90 leading-relaxed">
                Nunca utilize a mesma senha de outros sistemas corporativos neste simulador. Use uma senha exclusiva.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar" className="text-white/80">Confirmar senha</Label>
            <Input id="confirmar" type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="Repita a senha" className="bg-card/10 border-white/20 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/40" autoComplete="new-password" maxLength={100} />
          </div>

          <div className="flex items-start space-x-2 py-2">
            <Checkbox 
              id="terms" 
              checked={acceptedTerms} 
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-1 border-white/30 data-[state=checked]:bg-landing-gold data-[state=checked]:text-landing-dark"
            />
            <label
              htmlFor="terms"
              className="text-xs leading-relaxed text-white/60 cursor-pointer select-none"
            >
              Li e concordo com os{' '}
              <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-landing-gold hover:underline">
                Termos de Uso
              </a>{' '}
              e a{' '}
              <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-landing-gold hover:underline">
                Política de Privacidade
              </a>
            </label>
          </div>

          <Button type="submit" disabled={loading || !acceptedTerms} className="w-full bg-landing-gold hover:bg-landing-gold-hover text-landing-dark font-bold">
            {loading ? 'Criando...' : <>Criar Conta <UserPlus className="ml-2 h-4 w-4" /></>}
          </Button>

          <button type="button" onClick={() => navigate('/login')} className="w-full text-center text-sm text-white/50 hover:text-white/80 transition-colors mt-2">
            Já tem conta? <span className="text-landing-gold">Entrar</span>
          </button>

        </form>
      </div>
    </div>
  );
}
