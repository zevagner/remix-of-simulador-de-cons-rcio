/**
 * Pipeline constants — shared types, column configs, tooltips.
 */
import type { ProposalStatus } from '@/services/proposals';

export interface ColumnConfig {
  status: ProposalStatus;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  borderColor: string;
  accentColor: string;
}

export interface NewLeadData {
  client_name: string;
  client_phone: string;
  consortium_type: string;
  credit_value: number;
  term_months: number;
  bid_percent: number;
  installment: number;
  total_cost: number;
  next_contact_date: string;
  notes: string;
  prospect_trigger: string;
}

export const PROSPECT_TRIGGERS = [
  { value: 'aluguel', label: '🏠 Pagando aluguel', icon: '🏠' },
  { value: 'fgts', label: '💎 Tem FGTS parado', icon: '💎' },
  { value: 'financiamento', label: '🔄 Saindo de financiamento', icon: '🔄' },
  { value: 'pj', label: '🚛 Cliente PJ / frota', icon: '🚛' },
  { value: 'liquidez', label: '💰 Tem liquidez parada', icon: '💰' },
  { value: 'investidor', label: '📈 Investidor / renda passiva', icon: '📈' },
  { value: 'sucessao', label: '🏛️ Sucessão patrimonial', icon: '🏛️' },
  { value: 'agro', label: '🌾 Produtor rural / agro', icon: '🌾' },
  { value: 'nao_identificado', label: '❓ Não identificado', icon: '❓' },
] as const;

export const TRIGGER_TO_CONTEXT: Record<string, string> = {
  aluguel: 'aluguel',
  fgts: 'fgts',
  financiamento: 'financiamento',
  pj: 'pj',
  liquidez: 'liquidez',
  investidor: 'investidor',
  sucessao: 'sucessao',
  agro: 'agro',
  nao_identificado: 'generico',
};

export const COLUMNS: ColumnConfig[] = [
  { status: 'prospeccao', label: 'Prospecção', emoji: '🎯', color: 'text-accent-foreground', bg: 'bg-accent/10', borderColor: 'border-accent/30', accentColor: 'bg-slate-400' },
  { status: 'aguardando_retorno', label: 'Aguardando Retorno', emoji: '📤', color: 'text-muted-foreground', bg: 'bg-muted/30', borderColor: 'border-border', accentColor: 'bg-blue-400' },
  { status: 'em_avaliacao', label: 'Em Avaliação', emoji: '💬', color: 'text-primary', bg: 'bg-primary/5', borderColor: 'border-primary/20', accentColor: 'bg-amber-400' },
  { status: 'proposta_ajustada', label: 'Proposta Ajustada', emoji: '🔄', color: 'text-chart-4', bg: 'bg-chart-4/5', borderColor: 'border-chart-4/20', accentColor: 'bg-orange-400' },
  { status: 'fechado', label: 'Fechado', emoji: '✅', color: 'text-success', bg: 'bg-success/5', borderColor: 'border-success/20', accentColor: 'bg-green-500' },
  { status: 'perdido', label: 'Perdido', emoji: '❌', color: 'text-destructive', bg: 'bg-destructive/5', borderColor: 'border-destructive/20', accentColor: 'bg-red-400' },
];

/**
 * Colunas exibidas no Kanban da Carteira (Onda 3).
 * Status terminais (fechado/perdido) ficam fora — gerenciados via ações
 * explícitas no EditProposalModal ("Mover para Pós-venda" e "Arquivar lead").
 * `COLUMNS` continua fonte única para lookup de label/emoji/cor de qualquer status.
 */
export const KANBAN_COLUMNS: ColumnConfig[] = COLUMNS.filter(
  c => c.status !== 'fechado' && c.status !== 'perdido',
);

export const COLUMN_TOOLTIPS: Record<ProposalStatus, string> = {
  prospeccao: 'Cliente identificado mas ainda sem contato ou proposta enviada. Aqui entram leads novos aguardando abordagem inicial.',
  aguardando_retorno: 'Proposta já enviada ao cliente. Aguardando resposta. Se o cliente não responder em 48h, priorize o follow-up.',
  em_avaliacao: 'Cliente respondeu e demonstrou interesse real. Está considerando a proposta — pode estar comparando opções ou consultando familiares.',
  proposta_ajustada: 'Proposta foi revisada conforme pedido do cliente — novo prazo, valor ou condição de lance. Decisão de fechamento é iminente.',
  fechado: 'Venda concluída. Cliente assinou e entrou no grupo de consórcio.',
  perdido: 'Negociação encerrada sem fechamento. Registre o motivo nas notas para aprendizado futuro.',
};

export const NEXT_STATUS: Partial<Record<ProposalStatus, { status: ProposalStatus; label: string }>> = {
  prospeccao: { status: 'aguardando_retorno', label: 'Enviar' },
  aguardando_retorno: { status: 'em_avaliacao', label: 'Avaliar' },
  em_avaliacao: { status: 'proposta_ajustada', label: 'Ajustar' },
  proposta_ajustada: { status: 'fechado', label: '→ Pós-venda' },
};

export const consortiumTypeLabel: Record<string, string> = {
  imobiliario: 'Imobiliário',
  auto: 'Veículos',
  pesados: 'Pesados',
};

// ─── Próxima Ação (Onda 2) ───

export type NextActionType =
  | 'ligar' | 'whatsapp' | 'enviar_proposta' | 'reuniao' | 'follow_up' | 'outro';

export interface NextActionConfig {
  value: NextActionType;
  label: string;
  icon: string;
  shortLabel: string;
}

export const NEXT_ACTIONS: NextActionConfig[] = [
  { value: 'ligar',           label: 'Ligar',                icon: '📞', shortLabel: 'Ligar' },
  { value: 'whatsapp',        label: 'Mandar WhatsApp',      icon: '💬', shortLabel: 'WhatsApp' },
  { value: 'enviar_proposta', label: 'Enviar proposta',      icon: '📤', shortLabel: 'Enviar proposta' },
  { value: 'reuniao',         label: 'Reunião / visita',     icon: '🤝', shortLabel: 'Reunião' },
  { value: 'follow_up',       label: 'Follow-up rápido',     icon: '🔔', shortLabel: 'Follow-up' },
  { value: 'outro',           label: 'Outro',                icon: '📝', shortLabel: 'Outro' },
];

export const NEXT_ACTION_LOOKUP: Record<NextActionType, NextActionConfig> =
  NEXT_ACTIONS.reduce((acc, a) => { acc[a.value] = a; return acc; }, {} as Record<NextActionType, NextActionConfig>);

/** Estados em que a próxima ação não faz sentido (lead encerrado). */
export const TERMINAL_STATUSES: ReadonlySet<ProposalStatus> = new Set(['fechado', 'perdido']);

/** Sugestão de ação padrão por coluna de destino. */
export const DEFAULT_ACTION_FOR_STATUS: Record<ProposalStatus, NextActionType | null> = {
  prospeccao: 'ligar',
  aguardando_retorno: 'follow_up',
  em_avaliacao: 'whatsapp',
  proposta_ajustada: 'ligar',
  fechado: null,
  perdido: null,
};
