/**
 * Audit Log service — registra ações críticas dos usuários.
 * Uso: logAction({ action, entity, entity_id, metadata })
 *
 * Padrão de nomenclatura: verbo_contexto (ex.: create_proposal, close_proposal,
 * schedule_post_sale_action, generate_pdf).
 *
 * Regras:
 * - Não logar tudo: apenas ações com valor de auditoria
 *   (criação/fechamento de proposta, ações pós-venda, geração de PDF, simulação salva)
 * - Falha silenciosa: jamais bloqueia o fluxo do usuário
 * - Lightweight: fire-and-forget (não aguarda resposta)
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/** Padrão verbo_contexto. */
export type AuditAction =
  // Propostas
  | 'create_proposal'
  | 'close_proposal'
  | 'lose_proposal'
  | 'delete_proposal'
  // Pós-venda
  | 'contact_post_sale_client'
  | 'schedule_post_sale_action'
  | 'register_post_sale_referral'
  | 'change_post_sale_status'
  | 'register_post_sale_bid'
  // PDFs / Simulação
  | 'generate_pdf'
  | 'save_simulation'
  // Comunidade
  | 'create_community_case'
  | 'reply_community_case'
  | 'vote_community_reply'
  // Assembleias — pipeline operacional administrativo
  | 'import_assemblies_file'
  | 'import_assemblies_paste'
  | 'reload_assemblies_excel'
  | 'clear_assemblies_type'
  | 'clear_all_assemblies';

export type AuditEntity =
  | 'proposal'
  | 'post_sale_client'
  | 'post_sale_event'
  | 'post_sale_bid'
  | 'pdf'
  | 'simulation'
  | 'community_case'
  | 'community_reply'
  | 'assemblies_ingestion';

export interface LogActionInput {
  action: AuditAction;
  entity: AuditEntity;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRecord {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Registra uma ação. Fire-and-forget: nunca lança. */
export function logAction(input: LogActionInput): void {
  void (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('audit_logs').insert([{
        user_id: user.id,
        action: input.action,
        entity: input.entity,
        entity_id: input.entity_id ?? null,
        metadata: (input.metadata ?? {}) as never,
      }]);

      if (error) logger.warn('[auditLog] insert error', error.message);
    } catch (err) {
      logger.warn('[auditLog] unexpected error', err);
    }
  })();
}

/** Lista global para o módulo Admin (RLS admin-only retorna tudo). */
export async function fetchAuditLogs(opts?: {
  action?: string;
  entity?: string;
  fromDate?: string; // ISO date
  userId?: string;
  limit?: number;
}): Promise<AuditLogRecord[]> {
  let q = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(opts?.limit ?? 200);

  if (opts?.action && opts.action !== 'todos') q = q.eq('action', opts.action);
  if (opts?.entity && opts.entity !== 'todos') q = q.eq('entity', opts.entity);
  if (opts?.userId && opts.userId !== 'todos') q = q.eq('user_id', opts.userId);
  if (opts?.fromDate) q = q.gte('created_at', opts.fromDate);

  const { data, error } = await q;
  if (error) {
    logger.error('[auditLog] fetch error', error);
    return [];
  }
  return (data ?? []) as AuditLogRecord[];
}
