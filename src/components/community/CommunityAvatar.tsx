/**
 * CommunityAvatar — avatar visual anonimizado para a Comunidade.
 *
 * Gera iniciais determinísticas a partir do `userId` (2 primeiros chars em
 * maiúsculas — nunca exibe nome real, e-mail ou qualquer PII). Cor de fundo
 * varia pelo nível (1 cinza-azulado · 2 laranja CAIXA · 3+ navy).
 *
 * Restrições: componente puramente visual, sem queries, sem efeitos colaterais.
 */
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md';

interface CommunityAvatarProps {
  userId: string | null | undefined;
  level?: number;
  size?: Size;
  className?: string;
}

function initialsFrom(userId: string | null | undefined): string {
  if (!userId) return '··';
  const clean = userId.replace(/[^a-zA-Z0-9]/g, '');
  return (clean.slice(0, 2) || '··').toUpperCase();
}

function bgForLevel(level: number): string {
  if (level >= 3) return '#003641';
  if (level === 2) return '#F5821F';
  return '#64748B';
}

const SIZE_MAP: Record<Size, { box: string; font: string }> = {
  sm: { box: 'h-7 w-7', font: 'text-[10px]' },
  md: { box: 'h-9 w-9', font: 'text-[12px]' },
};

export function CommunityAvatar({ userId, level = 1, size = 'sm', className }: CommunityAvatarProps) {
  const initials = initialsFrom(userId);
  const dims = SIZE_MAP[size];
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold text-white select-none shrink-0',
        dims.box,
        dims.font,
        className,
      )}
      style={{ backgroundColor: bgForLevel(level) }}
    >
      {initials}
    </span>
  );
}
