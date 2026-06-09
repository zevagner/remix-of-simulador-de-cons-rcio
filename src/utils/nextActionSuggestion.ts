/**
 * nextActionSuggestion — sugestão DETERMINÍSTICA da próxima ação para
 * Carteira (proposals) e Pós-venda (post_sale_clients).
 *
 * Por que determinístico (e não chamada de IA por cliente)?
 *   • A lista pode ter centenas de cards renderizados ao mesmo tempo —
 *     uma chamada de IA por linha esgotaria a cota imediatamente.
 *   • O CentralAI permanece disponível sob demanda (botão "Gerar orientação"
 *     nos módulos), com contexto rico. Aqui, oferecemos uma orientação
 *     instantânea e coerente derivada das mesmas regras de score/prioridade.
 */
import type { ProposalRecord } from '@/services/proposals';
import type { PostSaleClient, PostSaleEvent } from '@/services/postSale';
import type { ActionPriority, ClientScore } from './clientScoring';
import { getNextActionUrgency } from '@/components/modules/postSale/postSaleNextAction';

export interface ActionSuggestion {
  /** Texto curto, imperativo, pronto para exibir ao vendedor. */
  text: string;
  /** Verbo da ação para CTAs (ligar/whatsapp/proposta/reuniao/follow_up). */
  verb: 'ligar' | 'whatsapp' | 'enviar_proposta' | 'reuniao' | 'follow_up';
}

// ─── Carteira ───
export function suggestProposalAction(
  proposal: ProposalRecord,
  scoring: ClientScore,
): ActionSuggestion {
  // Status terminal: não há ação ativa.
  if (proposal.status === 'fechado') {
    return { text: 'Migrar para o pós-venda e pedir indicação', verb: 'follow_up' };
  }
  if (proposal.status === 'perdido') {
    return { text: 'Reabordar em 30 dias com nova proposta', verb: 'whatsapp' };
  }

  // Próxima ação programada — respeite o que o vendedor já planejou.
  if (proposal.next_action_type && proposal.next_contact_date) {
    const verbMap: Record<string, ActionSuggestion['verb']> = {
      ligar: 'ligar',
      whatsapp: 'whatsapp',
      enviar_proposta: 'enviar_proposta',
      reuniao: 'reuniao',
      follow_up: 'follow_up',
      outro: 'follow_up',
    };
    const verb = verbMap[proposal.next_action_type] ?? 'follow_up';
    return { text: `Executar ação programada (${proposal.next_action_type.replace('_', ' ')})`, verb };
  }

  // Sem ação definida → orientação por estágio + temperatura.
  switch (proposal.status) {
    case 'prospeccao':
      return scoring.temperature === 'quente'
        ? { text: 'Ligar para qualificar — lead aquecido', verb: 'ligar' }
        : { text: 'Enviar mensagem de qualificação no WhatsApp', verb: 'whatsapp' };
    case 'aguardando_retorno':
      return scoring.priority === 'urgente'
        ? { text: 'Ligar para destravar a decisão hoje', verb: 'ligar' }
        : { text: 'Follow-up por WhatsApp com prova social', verb: 'whatsapp' };
    case 'em_avaliacao':
      return { text: 'Marcar reunião para fechar dúvidas técnicas', verb: 'reuniao' };
    case 'proposta_ajustada':
      return { text: 'Reenviar proposta ajustada e confirmar leitura', verb: 'enviar_proposta' };
    default:
      return { text: 'Definir próxima ação para não perder o lead', verb: 'follow_up' };
  }
}

// ─── Pós-venda ───
export function suggestPostSaleAction(
  client: PostSaleClient,
  nextAction: PostSaleEvent | null,
  _scoring: ClientScore,
): ActionSuggestion {
  // Próxima ação cadastrada — priorize a urgência.
  if (nextAction) {
    const meta = nextAction.metadata as Record<string, unknown> | null;
    const due = String(meta?.due_date ?? nextAction.event_date);
    const urgency = getNextActionUrgency(due);
    const action = String(meta?.action ?? 'ação programada');
    if (urgency === 'overdue') return { text: `Atrasada: ${action}`, verb: 'ligar' };
    if (urgency === 'today')   return { text: `Hoje: ${action}`, verb: 'whatsapp' };
    return { text: `Próxima: ${action}`, verb: 'follow_up' };
  }

  // Sem ação programada → derivado do status.
  switch (client.status) {
    case 'inadimplente':
      return { text: 'Ligar para regularizar inadimplência', verb: 'ligar' };
    case 'contemplado':
      return { text: 'Parabenizar e orientar próximos passos', verb: 'ligar' };
    case 'quitado':
      return { text: 'Pedir indicações e oferecer nova venda', verb: 'whatsapp' };
    case 'ativo':
    default:
      return { text: 'Contato de manutenção e checagem de satisfação', verb: 'whatsapp' };
  }
}

// ─── Estilo do CTA por verbo ───
export const ACTION_VERB_LABEL: Record<ActionSuggestion['verb'], string> = {
  ligar: '📞 Ligar',
  whatsapp: '💬 WhatsApp',
  enviar_proposta: '📤 Reenviar',
  reuniao: '🤝 Reunião',
  follow_up: '🎯 Follow-up',
};

export const ACTION_PRIORITY_HINT: Record<ActionPriority, string> = {
  urgente: 'Faça hoje, antes do meio-dia',
  atencao: 'Resolva nos próximos 2 dias',
  reativar: 'Reabordagem com novo gancho',
  acompanhar: 'Mantenha cadência normal',
};
