/**
 * Follow-up automático pós-envio do PDF Premium.
 *
 * Sequência de 5 estágios baseada em comportamento do cliente:
 *   1. sent          → mensagem de envio do PDF
 *   2. nudge_24h     → cliente não respondeu em 24h
 *   3. nudge_48h     → cliente não respondeu em 48h
 *   4. score_*       → cliente devolveu nota 0–10 (3 segmentos)
 *   5. conversion    → resposta positiva, fecha próximo passo
 *
 * Princípios (regra final do brief):
 *   - mensagens curtas (≤ ~3 linhas)
 *   - tom natural, conversacional, sem jargão
 *   - sempre termina com pergunta ou CTA leve
 *   - nunca empurra venda
 *
 * Texto é determinístico; usa o primeiro nome quando disponível.
 */

export type FollowupSegment = 'resistencia' | 'interesse' | 'quase_fechado';

export type FollowupStage =
  | 'sent'
  | 'nudge_24h'
  | 'nudge_48h'
  | 'score_resistencia'
  | 'score_interesse'
  | 'score_quase_fechado'
  | 'conversion';

export interface FollowupResult {
  /** Estágio do funil que originou a mensagem. */
  stage: FollowupStage;
  /** Segmento baseado em score (apenas estágios `score_*`). */
  segment?: FollowupSegment;
  /** Texto pronto para enviar via WhatsApp. */
  message: string;
}

function firstName(fullName?: string): string {
  const n = (fullName || '').trim().split(/\s+/)[0];
  return n || '';
}

function greet(name: string): string {
  return name ? `Oi, ${name}! ` : '';
}

export function segmentFromScore(score: number): FollowupSegment {
  const s = Math.max(0, Math.min(10, Math.round(score)));
  if (s <= 4) return 'resistencia';
  if (s <= 7) return 'interesse';
  return 'quase_fechado';
}

function stageFromScore(score: number): FollowupStage {
  const seg = segmentFromScore(score);
  if (seg === 'resistencia') return 'score_resistencia';
  if (seg === 'interesse') return 'score_interesse';
  return 'score_quase_fechado';
}

/**
 * Constrói a mensagem de uma etapa específica do follow-up.
 * Score é obrigatório apenas para `score_*`.
 */
export function buildFollowupStage(
  stage: FollowupStage,
  opts: { clientName?: string; score?: number } = {},
): FollowupResult {
  const hi = greet(firstName(opts.clientName));
  const s = opts.score != null ? Math.max(0, Math.min(10, Math.round(opts.score))) : null;

  switch (stage) {
    case 'sent':
      return {
        stage,
        message:
          `${hi}te enviei um estudo bem direto com base no que você me falou.\n\n` +
          `Dá uma olhada com calma — ele mostra uma forma de reduzir custo e manter sua capacidade de investir.\n\n` +
          `Depois me diz o que achou 👍`,
      };

    case 'nudge_24h':
      return {
        stage,
        message:
          `${hi}conseguiu dar uma olhada no material?\n\n` +
          `Tem um ponto ali que costuma mudar bastante a forma como o pessoal vê financiamento vs consórcio.`,
      };

    case 'nudge_48h':
      return {
        stage,
        message:
          `${hi}vou ser direto contigo — aquele estudo mostra um detalhe que normalmente faz diferença grande no custo final.\n\n` +
          `Se quiser, te explico em 2 minutos por aqui mesmo.`,
      };

    case 'score_resistencia':
      return {
        stage,
        segment: 'resistencia',
        message:
          `${hi}vi que ainda não fez tanto sentido.\n\n` +
          `O que mais te travou ali? Foi prazo, estratégia ou outra coisa?`,
      };

    case 'score_interesse':
      return {
        stage,
        segment: 'interesse',
        message:
          `${hi}você marcou ${s ?? '—'}.\n\n` +
          `O que falta pra isso virar um 9 pra você?`,
      };

    case 'score_quase_fechado':
      return {
        stage,
        segment: 'quase_fechado',
        message:
          `${hi}perfeito.\n\n` +
          `Faz sentido então dar o próximo passo? Posso te orientar da forma mais segura pra começar.`,
      };

    case 'conversion':
      return {
        stage,
        message:
          `${hi}boa.\n\n` +
          `Então vamos estruturar isso direito pra você não correr risco.\n\n` +
          `Te explico agora o melhor formato pra começar.`,
      };
  }
}

/**
 * Compatibilidade: gera a mensagem certa só com o score.
 * Mantém a API antiga usada pelo FollowupCard original.
 */
export function buildFollowupMessage(score: number, clientName?: string): FollowupResult {
  const stage = stageFromScore(score);
  return buildFollowupStage(stage, { clientName, score });
}

/** Metadados de UI por estágio — labels curtas, tom amigável. */
export const STAGE_META: Record<FollowupStage, { label: string; hint: string }> = {
  sent:                { label: 'Envio do PDF',           hint: 'Manda junto com o PDF.' },
  nudge_24h:           { label: 'Sem resposta em 24h',    hint: 'Lembrete leve, sem pressão.' },
  nudge_48h:           { label: 'Sem resposta em 48h',    hint: 'Direto ao ponto, ainda sem cobrança.' },
  score_resistencia:   { label: 'Nota 0–4 (resistência)', hint: 'Investiga o que travou.' },
  score_interesse:     { label: 'Nota 5–7 (morno)',       hint: 'Descobre o que falta.' },
  score_quase_fechado: { label: 'Nota 8–10 (quente)',     hint: 'Oferece o próximo passo.' },
  conversion:          { label: 'Conversão final',        hint: 'Cliente respondeu sim — fecha o passo.' },
};
