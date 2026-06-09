/**
 * CentralAI — fachada única de inteligência do sistema.
 *
 * REGRAS:
 *  - NÃO duplica edge functions: roteia para `generate-proposal`, `sales-copilot`
 *    e `sales-response` já existentes (mantendo prompts e validação Zod).
 *  - NÃO contradiz cálculos: o payload é SEMPRE derivado do ClientJourneyContext,
 *    que por sua vez lê o SimulatorContext (única fonte da verdade financeira).
 *  - NÃO gera conteúdo genérico: se o contexto não tem simulação válida e o
 *    intent depende dela, retorna erro estruturado em vez de "alucinar".
 *  - Consistência: o mesmo contexto + mesmo intent produz o mesmo prompt.
 *
 * Como usar (preferencial via hook):
 *   const { generateInsight, streamInsight } = useCentralAI();
 *   const out = await generateInsight('summary');
 *   await streamInsight('sales_argument', { onDelta, onDone });
 *
 * Como usar (direto, fora de componentes React):
 *   import { generateInsight } from '@/services/centralAI';
 *   await generateInsight({ context, intent: 'next_step' });
 */

import { streamCopilotResponse, type CopilotSimulationContext } from '@/services/salesCopilot';
import {
  generateSalesResponses,
  type ProposalContext,
  type SalesResponseResult,
} from '@/services/salesResponse';
import {
  buildMessageContext,
  toAIProposalData,
  type MessageContext,
} from '@/utils/buildMessageContext';
import type { ClientJourneyContextValue } from '@/components/layout/ClientJourneyContext';
import type { DecisionOutput } from '@/utils/decisionEngine';

// ═══════ TYPES ═══════

export type CentralAIIntent =
  | 'analysis'           // análise consultiva do cenário (não-stream, texto longo)
  | 'sales_argument'     // argumento de venda (stream, copilot)
  | 'objection_handling' // resposta a objeção do cliente (não-stream, classificado)
  | 'next_step'          // sugestão de próximo passo (determinístico, sem AI)
  | 'summary';           // resumo executivo da jornada (determinístico + AI opcional)

export interface CentralAIError {
  ok: false;
  code: 'no_simulation' | 'no_diagnostic' | 'rate_limited' | 'payment_required' | 'gateway' | 'unknown';
  message: string;
}

export interface CentralAINextStep {
  ok: true;
  kind: 'next_step';
  stepId: string;
  label: string;
  reason: string;
}

export interface CentralAIText {
  ok: true;
  kind: 'text';
  text: string;
}

export interface CentralAIObjection {
  ok: true;
  kind: 'objection';
  data: SalesResponseResult;
}

export type CentralAIResult = CentralAIError | CentralAINextStep | CentralAIText | CentralAIObjection;

export interface GenerateInsightInput {
  context: ClientJourneyContextValue;
  intent: CentralAIIntent;
  /** Para `objection_handling`: a mensagem do cliente. */
  clientMessage?: string;
}

export interface StreamInsightInput extends GenerateInsightInput {
  onDelta: (chunk: string) => void;
  onDone: () => void;
  onError?: (msg: string) => void;
  signal?: AbortSignal;
}

// ═══════ PAYLOAD CANÔNICO ═══════

/**
 * Constrói o MessageContext canônico a partir do journey.
 * Esta é a única função que traduz "estado do app" → "payload de IA".
 * Todos os intents passam por aqui — garantindo coerência absoluta.
 */
function buildCanonicalContext(journey: ClientJourneyContextValue): MessageContext | null {
  const { simulation, diagnostic, slots } = journey;
  if (!simulation.isValid) return null;

  const d = diagnostic?.data;
  const bid = slots.bidStrategy;

  return buildMessageContext({
    cliente: {
      nome: d?.clientName,
      objetivo: d?.clientObjective || d?.objetivoPrincipal,
      situacao: d?.clientSituation,
      perfilCenario: profileFromRecommendation(journey.recommendation),
    },
    credito: {
      consortiumType: simulation.consortiumType,
      creditValue: simulation.creditValue,
      // Custo real de bolso (sem lance embutido). Evita IA inflar valor pro cliente.
      totalCost: simulation.effectiveClientCost ?? simulation.totalCost,
    },
    parcela: {
      installment: simulation.installmentAfterContemplation,
      termMonths: simulation.termMonths,
      installmentAfterContemplation: simulation.installmentAfterContemplation,
    },
    lance: {
      bidPercent: bid?.bidPercent,
      bidZone: bid?.zone,
    },
    estrategia: {
      contemplated: !!bid,
      contemplationType: bid ? 'lance' : 'none',
    },
    format: 'whatsapp',
  });
}

function profileFromRecommendation(rec: DecisionOutput | null): 'conservador' | 'equilibrado' | 'agressivo' {
  if (!rec) return 'conservador';
  if (rec.recommendedPath === 'consorcio_com_lance') return 'equilibrado';
  if (rec.recommendedPath === 'compra_a_vista') return 'agressivo';
  return 'conservador';
}

function toCopilotContext(ctx: MessageContext, journey: ClientJourneyContextValue): CopilotSimulationContext {
  const bid = journey.slots.bidStrategy;
  return {
    consortiumType: ctx.credito.consortiumType,
    creditValue: ctx.credito.creditValue,
    installment: ctx.parcela.installment,
    termMonths: ctx.parcela.termMonths,
    totalCost: ctx.credito.totalCost,
    bidPercent: bid?.bidPercent,
    bidZone: bid?.zone,
    groupNumber: bid?.groupNumber,
    clientName: ctx.cliente.nome || undefined,
    scenarioProfile: ctx.cliente.perfilCenario,
    strategyLabel: journey.recommendation?.recommendedPath,
  };
}

function toProposalContext(ctx: MessageContext): ProposalContext {
  return {
    consortiumType: ctx.credito.consortiumType,
    creditValue: ctx.credito.creditValue,
    installment: ctx.parcela.installment,
    termMonths: ctx.parcela.termMonths,
    totalCost: ctx.credito.totalCost,
    bidPercent: ctx.lance.bidPercent,
    clientName: ctx.cliente.nome || undefined,
    clientObjective: ctx.cliente.objetivo,
  };
}

// ═══════ INTENT HANDLERS ═══════

/**
 * `analysis` — texto consultivo a partir do contexto.
 *
 * IMPORTANTE: o edge `generate-proposal` retorna **SSE streaming** (text/event-stream),
 * portanto NÃO pode ser consumido por `supabase.functions.invoke` (que tenta parsear JSON).
 * Aqui fazemos `fetch` direto e agregamos os deltas até o final, devolvendo texto único.
 */
async function runAnalysis(ctx: MessageContext): Promise<CentralAIResult> {
  try {
    const payload = toAIProposalData(ctx);
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-proposal`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ proposalData: payload }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return { ok: false, code: 'rate_limited', message: 'Muitas requisições. Tente em alguns instantes.' };
      if (resp.status === 402) return { ok: false, code: 'payment_required', message: 'Cota de IA esgotada.' };
      const body = await resp.json().catch(() => ({}));
      return { ok: false, code: 'gateway', message: body?.error ?? `Erro ${resp.status} ao gerar análise.` };
    }
    if (!resp.body) {
      return { ok: false, code: 'gateway', message: 'Resposta vazia do servidor.' };
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let done = false;

    while (!done) {
      const { done: streamDone, value } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') { done = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed?.choices?.[0]?.delta?.content as string | undefined;
          if (content) fullText += content;
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    if (!fullText.trim()) {
      return { ok: false, code: 'gateway', message: 'Resposta vazia da IA.' };
    }
    return { ok: true, kind: 'text', text: fullText.trim() };
  } catch (e) {
    return { ok: false, code: 'unknown', message: e instanceof Error ? e.message : 'Erro desconhecido' };
  }
}

/**
 * `objection_handling` — classifica + sugere 3 respostas. Edge `sales-response`.
 */
async function runObjection(ctx: MessageContext, clientMessage: string): Promise<CentralAIResult> {
  if (!clientMessage?.trim()) {
    return { ok: false, code: 'unknown', message: 'Mensagem do cliente é obrigatória para objection_handling.' };
  }
  try {
    const data = await generateSalesResponses({
      clientResponse: clientMessage,
      proposalContext: toProposalContext(ctx),
    });
    return { ok: true, kind: 'objection', data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    if (/429/.test(msg)) return { ok: false, code: 'rate_limited', message: 'Muitas requisições. Aguarde alguns instantes.' };
    if (/402/.test(msg)) return { ok: false, code: 'payment_required', message: 'Cota de IA esgotada.' };
    return { ok: false, code: 'gateway', message: msg };
  }
}

/**
 * `next_step` — DETERMINÍSTICO. Não chama IA: deriva do journey.steps.
 * Garantia de zero alucinação para algo que já é regra de negócio.
 */
function runNextStep(journey: ClientJourneyContextValue): CentralAIResult {
  const next = journey.nextStep;
  if (!next) {
    return { ok: true, kind: 'next_step', stepId: 'done', label: 'Fluxo completo', reason: 'Todas as etapas foram concluídas.' };
  }
  const reasonMap: Record<string, string> = {
    diagnostic: 'O diagnóstico personaliza toda a recomendação seguinte.',
    simulator: 'A simulação fornece os números base (parcela, custo, prazo).',
    analysis: 'A análise valida estratégia e compara cenários.',
    objections: 'A abordagem prepara argumentos e respostas a objeções.',
    proposal: 'A proposta consolida o cenário recomendado para o cliente.',
    proposals: 'A carteira acompanha o follow-up até o fechamento.',
    'post-sale': 'O pós-venda mantém o relacionamento ativo.',
  };
  return {
    ok: true,
    kind: 'next_step',
    stepId: next.id,
    label: next.label,
    reason: reasonMap[next.id] ?? 'Próximo passo recomendado.',
  };
}

/**
 * `summary` — resumo executivo determinístico (sem IA), 100% derivado do contexto.
 * Sem alucinação possível.
 */
function runSummary(ctx: MessageContext, journey: ClientJourneyContextValue): CentralAIResult {
  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const lines: string[] = [];
  if (ctx.cliente.nome) lines.push(`Cliente: ${ctx.cliente.nome}`);
  lines.push(`Crédito: ${fmt(ctx.credito.creditValue)} em ${ctx.credito.consortiumType}`);
  lines.push(`Parcela: ${fmt(ctx.parcela.installment)} / ${ctx.parcela.termMonths} meses`);
  lines.push(`Custo total do plano: ${fmt(ctx.credito.totalCost)}`);
  if (ctx.lance.bidPercent) {
    lines.push(`Estratégia de lance: ${ctx.lance.bidPercent}% (${ctx.lance.bidZone ?? 'n/d'})`);
  }
  if (journey.recommendation) {
    lines.push(`Recomendação: ${journey.recommendation.recommendedPath.replace(/_/g, ' ')}`);
  }
  if (journey.slots.proposalStatus) {
    lines.push(`Status da proposta: ${journey.slots.proposalStatus.status}`);
  }
  return { ok: true, kind: 'text', text: lines.join('\n') };
}


// ═══════ API PÚBLICA ═══════

/**
 * Ponto único de inteligência. Roteia o intent para o handler correto,
 * sempre com payload derivado do ClientJourneyContext.
 */
export async function generateInsight(input: GenerateInsightInput): Promise<CentralAIResult> {
  const { context, intent, clientMessage } = input;

  // `next_step` não exige simulação válida — funciona desde o passo 1.
  if (intent === 'next_step') {
    return runNextStep(context);
  }

  const ctx = buildCanonicalContext(context);
  if (!ctx) {
    return {
      ok: false,
      code: 'no_simulation',
      message: 'Conclua a simulação antes de gerar este insight.',
    };
  }

  switch (intent) {
    case 'analysis':           return runAnalysis(ctx);
    case 'objection_handling': return runObjection(ctx, clientMessage ?? '');
    case 'summary':            return runSummary(ctx, context);
    case 'sales_argument':
      return {
        ok: false,
        code: 'unknown',
        message: 'sales_argument é streaming — use streamInsight() em vez de generateInsight().',
      };
    default:
      return { ok: false, code: 'unknown', message: `Intent desconhecido: ${intent}` };
  }
}

/**
 * Versão streaming — atualmente apenas `sales_argument` é stream
 * (delegado ao edge `sales-copilot`).
 */
export async function streamInsight(input: StreamInsightInput): Promise<void> {
  const { context, intent, clientMessage, onDelta, onDone, onError, signal } = input;

  if (intent !== 'sales_argument') {
    onError?.(`streamInsight não suporta intent "${intent}". Use generateInsight().`);
    onDone();
    return;
  }

  const ctx = buildCanonicalContext(context);
  if (!ctx) {
    onError?.('Conclua a simulação antes de gerar o argumento.');
    onDone();
    return;
  }

  await streamCopilotResponse({
    clientMessage: clientMessage ?? 'Gere um argumento consultivo para este cenário.',
    simulationContext: toCopilotContext(ctx, context),
    onDelta,
    onDone,
    onError: onError ?? (() => { /* noop */ }),
    signal,
  });
}
