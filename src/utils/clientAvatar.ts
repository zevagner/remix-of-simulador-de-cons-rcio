/**
 * Generates initials and a stable background color for a client avatar.
 * Color is deterministic per name (same name → same color across cards).
 */

// 8 cores semânticas suaves (HSL via tokens). Mantém legibilidade em fundo claro/escuro.
const AVATAR_PALETTE = [
  'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
  'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300',
  'bg-orange-500/15 text-orange-700 dark:text-orange-300',
] as const;

export function getClientInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const cleaned = name.trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getClientAvatarColor(name: string | null | undefined): string {
  if (!name) return 'bg-muted text-muted-foreground';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
