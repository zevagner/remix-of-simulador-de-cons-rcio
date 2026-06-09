/**
 * Motivos estruturados para "Perdido" (Onda Carteira 1).
 *
 * Backend não muda: o motivo é persistido como prefixo em `notes` no formato
 * `[Motivo: <slug>] <observação livre>`. Permite agregação por grep/regex
 * sem migração de schema. Quando houver volume, vira coluna dedicada.
 */
export type LostReason =
  | 'preco'
  | 'timing'
  | 'concorrente'
  | 'sem_fit'
  | 'sem_retorno'
  | 'desistiu'
  | 'financiamento'
  | 'prioridade_mudou'
  | 'sem_interesse'
  | 'sem_condicao_financeira'
  | 'outro';

export const LOST_REASONS: ReadonlyArray<{ value: LostReason; label: string; emoji: string }> = [
  { value: 'sem_interesse',          label: 'Sem interesse',            emoji: '🙅' },
  { value: 'financiamento',          label: 'Optou por financiamento',  emoji: '🏦' },
  { value: 'sem_condicao_financeira',label: 'Sem condição financeira',  emoji: '💸' },
  { value: 'concorrente',            label: 'Perdido para concorrente', emoji: '🏁' },
  { value: 'sem_retorno',            label: 'Sem retorno',              emoji: '📵' },
  { value: 'preco',                  label: 'Preço',                    emoji: '💰' },
  { value: 'timing',                 label: 'Timing',                   emoji: '⏳' },
  { value: 'sem_fit',                label: 'Sem fit',                  emoji: '🧩' },
  { value: 'desistiu',               label: 'Desistiu',                 emoji: '🚪' },
  { value: 'prioridade_mudou',       label: 'Prioridade mudou',         emoji: '🔀' },
  { value: 'outro',                  label: 'Outro',                    emoji: '📝' },
];

/** Subset usado no diálogo "Arquivar lead" (Onda Carteira 3). */
export const ARCHIVE_REASONS: ReadonlyArray<{ value: LostReason; label: string }> = [
  { value: 'sem_interesse',           label: 'Sem interesse' },
  { value: 'financiamento',           label: 'Optou por financiamento' },
  { value: 'sem_condicao_financeira', label: 'Sem condição financeira' },
  { value: 'concorrente',             label: 'Perdido para concorrente' },
  { value: 'outro',                   label: 'Outro' },
];

const REASON_TAG_REGEX = /^\[Motivo:\s*([a-z_]+)\]\s*/i;

/** Lê o motivo registrado em `notes` (se houver). */
export function readLostReason(notes: string | null | undefined): LostReason | null {
  if (!notes) return null;
  const m = notes.match(REASON_TAG_REGEX);
  if (!m) return null;
  const slug = m[1].toLowerCase() as LostReason;
  return LOST_REASONS.some(r => r.value === slug) ? slug : null;
}

/** Remove o tag de motivo de `notes`, devolvendo só a parte livre. */
export function stripLostReason(notes: string | null | undefined): string {
  if (!notes) return '';
  return notes.replace(REASON_TAG_REGEX, '').trim();
}

/** Aplica o motivo escolhido em `notes` (substitui se já houver). */
export function applyLostReason(notes: string | null | undefined, reason: LostReason | null): string {
  const free = stripLostReason(notes);
  if (!reason) return free;
  return free ? `[Motivo: ${reason}] ${free}` : `[Motivo: ${reason}]`;
}

export function lostReasonLabel(reason: LostReason | null): string | null {
  if (!reason) return null;
  const r = LOST_REASONS.find(x => x.value === reason);
  return r ? `${r.emoji} ${r.label}` : null;
}
