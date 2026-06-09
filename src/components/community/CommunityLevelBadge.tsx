/**
 * CommunityLevelBadge — pill visual indicando o nível do consultor.
 * Visual-only: não consulta dados, recebe `level` pronto.
 */
import { cn } from '@/lib/utils';

interface CommunityLevelBadgeProps {
  level?: number;
  className?: string;
}

function styleForLevel(level: number): { bg: string; fg: string; border: string } {
  if (level >= 3) {
    return { bg: 'rgba(0, 54, 65, 0.10)', fg: '#003641', border: 'rgba(0, 54, 65, 0.25)' };
  }
  if (level === 2) {
    return { bg: '#FFF3E8', fg: '#F5821F', border: 'rgba(245, 130, 31, 0.35)' };
  }
  return { bg: 'hsl(var(--muted))', fg: 'hsl(var(--muted-foreground))', border: 'hsl(var(--border))' };
}

export function CommunityLevelBadge({ level = 1, className }: CommunityLevelBadgeProps) {
  const lvl = Math.max(1, Math.min(level, 9));
  const s = styleForLevel(lvl);
  const label = lvl >= 3 ? `Nível ${lvl}` : `Nível ${lvl}`;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none whitespace-nowrap',
        className,
      )}
      style={{ backgroundColor: s.bg, color: s.fg, borderColor: s.border }}
    >
      {label}
    </span>
  );
}
