import { Lightbulb, Copy, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import type { UserEngagementMetrics } from '@/hooks/useAdminQueries';

interface Recommendation {
  text: string;
  priority: number;
  color: string;
  message: string;
}

export function getUserRecommendation(m: UserEngagementMetrics, isNew: boolean, nome: string): Recommendation | null {
  const firstName = nome.split(' ')[0];
  if (m.sessions >= 10 && m.proposals === 0 && m.simulations >= 3) {
    return { text: 'Pronto para fechar — fazer contato', priority: 100, color: 'text-success',
      message: `Oi ${firstName}! Vi que você já explorou bastante o sistema e fez várias simulações. Que tal a gente montar uma proposta personalizada pra você? Estou à disposição!` };
  }
  if (m.simulations >= 3 && m.proposals === 0) {
    return { text: 'Ajudar a converter em proposta', priority: 80, color: 'text-warning',
      message: `Oi ${firstName}! Vi que você já fez algumas simulações. Posso te ajudar a avançar com uma proposta? Fico à disposição pra tirar dúvidas!` };
  }
  if (m.sessions >= 5 && m.simulations === 0) {
    return { text: 'Orientar sobre simulações', priority: 60, color: 'text-warning',
      message: `Oi ${firstName}! Vi que você acessou o sistema mas ainda não fez uma simulação. Quer que eu te mostre como funciona? É bem rápido!` };
  }
  if (isNew && m.sessions < 5) {
    return { text: 'Precisa de onboarding', priority: 40, color: 'text-muted-foreground',
      message: `Oi ${firstName}! Bem-vindo(a) ao sistema! Se precisar de ajuda para começar a usar, estou à disposição. Posso fazer uma demonstração rápida!` };
  }
  if (m.engagement < 30 && m.sessions > 0) {
    return { text: 'Reengajar usuário', priority: 30, color: 'text-muted-foreground',
      message: `Oi ${firstName}! Faz um tempo que você não acessa o sistema. Temos novidades que podem te ajudar! Quer dar uma olhada juntos?` };
  }
  return null;
}

interface RecommendationBadgeProps {
  metrics: UserEngagementMetrics;
  isNew: boolean;
  nome: string;
}

export function RecommendationBadge({ metrics, isNew, nome }: RecommendationBadgeProps) {
  const rec = getUserRecommendation(metrics, isNew, nome);
  const isMobile = useIsMobile();
  if (!rec) return null;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(rec.message);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = rec.message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    const { toast } = await import('@/hooks/use-toast');
    toast({ title: 'Mensagem copiada!' });
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const encoded = encodeURIComponent(rec.message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center gap-1 text-caption ${rec.color}`}>
        <Lightbulb className="h-3 w-3" />
        {rec.text}
      </span>
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleCopy} className="inline-flex items-center gap-0.5 text-caption px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0">
                <Copy className="h-2.5 w-2.5" />
                Copiar
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs"><p className="text-xs whitespace-pre-wrap">{rec.message}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isMobile && (
          <button onClick={handleWhatsApp} className="inline-flex items-center gap-0.5 text-caption px-1.5 py-0.5 rounded bg-whatsapp-green/10 text-whatsapp-green hover:bg-whatsapp-green/20 transition-colors shrink-0">
            <ExternalLink className="h-2.5 w-2.5" />
            WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}
