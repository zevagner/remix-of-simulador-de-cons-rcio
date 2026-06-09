import { useRef, useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { LogIn, Eye, EyeOff, Loader2, MailCheck, RefreshCw } from 'lucide-react';
import { isAllowedEmail, DOMAIN_HINT } from '@/utils/emailValidation';
import { EmailMigrationModal } from '@/components/auth/EmailMigrationModal';
import { RecentImprovements } from '@/components/auth/RecentImprovements';

import { logger } from '@/utils/logger';
import { prefetchAppShell } from '@/utils/prefetchAppShell';
import { markLoginStart, markLoginSuccess } from '@/lib/observers/runtimeObservers';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [showPendingInstructions, setShowPendingInstructions] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const loginAttemptRef = useRef(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const handleResendConfirmation = async () => {
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
    if (!email.trim() || !senha.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    const attemptId = ++loginAttemptRef.current;
    const isCurrentAttempt = () => loginAttemptRef.current === attemptId;

    logger.log(`[LoginPage] Iniciando login (tentativa ${attemptId})`, {
      email: email.trim().toLowerCase(),
    });

    setLoading(true);
    setStatusMsg('');
    markLoginStart();

    // Progressive feedback — never blocks login
    const slowTimer = setTimeout(() => {
      if (!isCurrentAttempt()) return;
      logger.log(`[LoginPage] Tentativa ${attemptId}: Conectando...`);
      setStatusMsg('Conectando...');
    }, 3000);

    const verySlowTimer = setTimeout(() => {
      if (!isCurrentAttempt()) return;
      logger.log(`[LoginPage] Tentativa ${attemptId}: Ainda conectando...`);
      setStatusMsg('Ainda conectando, aguarde...');
    }, 8000);

    // Diagnóstico: libera retry manual sem bloquear resposta tardia
    const diagnosticTimer = setTimeout(() => {
      if (!isCurrentAttempt()) return;
      logger.warn(`[LoginPage] Tentativa ${attemptId}: sem resposta após 15s (diagnóstico).`);
      setLoading(false);
      setStatusMsg('');
      toast({
        title: 'Conexão lenta',
        description: 'A autenticação está demorando mais que o normal. Você pode tentar novamente.',
      });
    }, 15000);

    const clearFeedbackTimers = () => {
      clearTimeout(slowTimer);
      clearTimeout(verySlowTimer);
      clearTimeout(diagnosticTimer);
    };

    try {
      // Allow legacy users to login but show migration modal
      if (!isAllowedEmail(email.trim())) {
        logger.log(`[LoginPage] Tentativa ${attemptId}: iniciando login legado`);
        const result = await login(email.trim(), senha);
        logger.log(`[LoginPage] Tentativa ${attemptId}: login legado retornou`, result);

        if (!isCurrentAttempt()) {
          logger.warn(`[LoginPage] Tentativa ${attemptId}: resultado legado ignorado (tentativa mais nova ativa).`);
          return;
        }

        setLoading(false);
        setStatusMsg('');

        if (result.success) {
          setShowMigration(true);
          return;
        } else {
          toast({ title: 'Utilize seu e-mail corporativo (@caixa.gov.br). Se você já tinha cadastro com outro e-mail, entre em contato com o administrador.', variant: 'destructive' });
          return;
        }
      }

      logger.log(`[LoginPage] Tentativa ${attemptId}: iniciando login corporativo`);
      const result = await login(email.trim(), senha);
      logger.log(`[LoginPage] Tentativa ${attemptId}: login corporativo retornou`, result);

      if (!isCurrentAttempt()) {
        logger.warn(`[LoginPage] Tentativa ${attemptId}: resultado corporativo ignorado (tentativa mais nova ativa).`);
        return;
      }

      setLoading(false);
      setStatusMsg('');

      if (result.success) {
        markLoginSuccess();
        toast({ title: 'Login realizado com sucesso!' });
        setExiting(true);
        prefetchAppShell();
        logger.log(`[LoginPage] Tentativa ${attemptId}: navegação para /app`);
        setTimeout(() => navigate('/app', { replace: true }), 400);
      } else {
        const isEmailNotConfirmed = result.error?.includes('não confirmado') || result.error?.includes('e-mail');
        const isBlocked = result.error?.includes('bloqueado');
        if (isEmailNotConfirmed) {
          setShowPendingInstructions(true);
        } else if (isBlocked) {
          toast({ title: 'Acesso bloqueado', description: result.error, variant: 'destructive' });
        } else {
          toast({ title: 'Erro no login', description: result.error, variant: 'destructive' });
        }
      }
    } catch (error) {
      if (!isCurrentAttempt()) {
        logger.warn(`[LoginPage] Tentativa ${attemptId}: erro ignorado (tentativa mais nova ativa).`, error);
        return;
      }

      logger.error(`[LoginPage] Tentativa ${attemptId}: erro no handleSubmit`, error);
      setLoading(false);
      setStatusMsg('');

      const isNetwork = !navigator.onLine || error?.message?.toLowerCase()?.includes('fetch') || error?.message?.toLowerCase()?.includes('network');
      toast({
        title: isNetwork ? 'Sem conexão' : 'Erro inesperado',
        description: isNetwork
          ? 'Verifique sua internet e tente novamente.'
          : 'Tente novamente em alguns segundos.',
        variant: 'destructive',
      });
    } finally {
      clearFeedbackTimers();
      if (isCurrentAttempt()) {
        logger.log(`[LoginPage] Tentativa ${attemptId}: fluxo finalizado`);
      }
    }
  };

  if (showPendingInstructions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-landing-dark via-landing-dark-mid to-landing-dark-deep px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <MailCheck className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Confirme seu e-mail</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Sua conta foi criada, mas o e-mail ainda não foi confirmado.
              <br /><br />
              Verifique sua caixa de entrada (e a pasta de spam) e clique no link de confirmação que enviamos.
            </p>

            <Button
              onClick={handleResendConfirmation}
              disabled={resendCooldown > 0}
              variant="outline"
              className="w-full border-landing-gold/30 text-landing-gold hover:bg-landing-gold/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar e-mail de confirmação'}
            </Button>

            <Button
              onClick={() => setShowPendingInstructions(false)}
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
    <div
      className={`min-h-screen flex items-center justify-center px-4 transition-[colors,box-shadow,transform] duration-400 ${exiting ? 'opacity-0 scale-95' : 'animate-fade-in'}`}
      style={{
        backgroundColor: '#003641',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/app-icon.png" alt="Simulador de Consórcio" className="h-48 md:h-60 w-auto object-contain mx-auto mb-6 rounded-2xl drop-shadow-2xl" />
        </div>

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="bg-card rounded-2xl p-8 shadow-2xl space-y-5"
        >
          <div className="text-center space-y-1 mb-2">
            <h1 className="text-2xl font-bold" style={{ color: '#003641' }}>Acesso ao Simulador</h1>
            <p className="text-sm text-gray-500">Acesso mediante liberação interna</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
            <Input
              id="email" type="email" placeholder="nome@caixa.gov.br"
              value={email} onChange={e => setEmail(e.target.value)}
              onFocus={prefetchAppShell}
              className="bg-card border-gray-200 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#003641]/30 focus-visible:ring-offset-0 caret-[#003641]"
              autoComplete="off" name="login-email-field" maxLength={100}
            />
            <p className="text-xs text-gray-500">{DOMAIN_HINT}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha" className="text-sm font-medium text-gray-700">Senha</Label>
            <div className="relative">
              <Input
                id="senha" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                value={senha} onChange={e => setSenha(e.target.value)}
                className="bg-card border-gray-200 text-foreground placeholder:text-muted-foreground pr-10 focus-visible:ring-2 focus-visible:ring-[#003641]/30 focus-visible:ring-offset-0 caret-[#003641]"
                autoComplete="new-password" name="login-pwd-field" maxLength={100}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold relative overflow-hidden hover:opacity-90"
            style={{ backgroundColor: '#003641' }}
          >
            {loading && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-card/10">
                <div className="h-full bg-card/40 animate-[loading_1.5s_ease-in-out_infinite]" />
              </div>
            )}
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {statusMsg || 'Entrando...'}</> : <>Entrar <LogIn className="ml-2 h-4 w-4" /></>}
          </Button>

          <div className="flex flex-col items-center gap-2 mt-2">
            <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm hover:underline transition-colors" style={{ color: '#003641' }}>
              Esqueci minha senha
            </button>
            <button type="button" onClick={() => navigate('/signup')} className="text-sm font-medium hover:underline transition-colors" style={{ color: '#003641' }}>
              ✨ Criar conta
            </button>
            <button type="button" onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Voltar para a página inicial
            </button>
            <div className="flex items-center gap-4 mt-2">
              <button type="button" onClick={() => window.open('/termos', '_blank')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Termos de Uso
              </button>
              <button type="button" onClick={() => window.open('/privacidade', '_blank')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Política de Privacidade
              </button>
            </div>
          </div>
        </form>

        <RecentImprovements />
      </div>


      <EmailMigrationModal
        open={showMigration}
        onClose={() => setShowMigration(false)}
        onSuccess={() => {
          setShowMigration(false);
          setEmail('');
          setSenha('');
        }}
        onCreateNew={() => navigate('/signup')}
        currentEmail={email}
      />
    </div>
  );
}
