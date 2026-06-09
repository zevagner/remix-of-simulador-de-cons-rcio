import { Flame, AlertTriangle, Moon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const ENGAGEMENT_CONFIG = {
  hot:  { icon: Flame, label: '🔥 Quente', color: 'bg-success/15 text-success', tooltip: 'Usuário com alto potencial de conversão', action: 'Pronto para avançar — ideal para contato imediato' },
  warm: { icon: AlertTriangle, label: '⚠️ Em desenvolvimento', color: 'bg-warning/15 text-warning', tooltip: 'Usuário ativo, mas ainda sem conversão', action: 'Ativo — ajudar a converter em proposta' },
  cold: { icon: Moon, label: '💤 Frio', color: 'bg-muted text-muted-foreground', tooltip: 'Usuário com baixo uso', action: 'Baixo uso — orientar ou reengajar' },
} as const;

export function getEngagementLevel(score: number) {
  if (score >= 70) return 'hot';
  if (score >= 30) return 'warm';
  return 'cold';
}

export function formatRecency(lastActivityAt: string | null): string | null {
  if (!lastActivityAt) return null;
  const hours = (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60);
  if (hours < 1) return 'Ativo agora';
  if (hours < 24) return `Há ${Math.floor(hours)}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Há 1 dia' : `Há ${days} dias`;
}

interface EngagementBadgeProps {
  score: number;
  showAction?: boolean;
  lastActivityAt?: string | null;
}

export function EngagementBadge({ score, showAction = false, lastActivityAt }: EngagementBadgeProps) {
  const level = getEngagementLevel(score);
  const config = ENGAGEMENT_CONFIG[level];
  const Icon = config.icon;
  const recencyText = formatRecency(lastActivityAt ?? null);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-start gap-0.5">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
              <Icon className="h-3 w-3" />
              {config.label} ({score})
            </span>
            {showAction && (
              <span className={`text-caption leading-tight pl-1 ${level === 'hot' ? 'text-success' : level === 'warm' ? 'text-warning' : 'text-muted-foreground'}`}>
                {config.action}
              </span>
            )}
            {recencyText && (
              <span className="text-caption leading-tight pl-1 text-muted-foreground/70">
                {recencyText}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top"><p className="text-xs">{config.tooltip}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
