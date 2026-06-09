/**
 * useModuleCopilot — orquestração: snapshot do useProposalData() → edge `module-copilot`.
 *
 * REGRAS:
 *  - NÃO recalcula nada (apenas lê valores já calculados).
 *  - NÃO cria contexto novo — depende exclusivamente de useProposalData().
 *  - Carregamento sob demanda (`run()`), não dispara automático.
 *
 * Output: ModuleCopilotResult (estrategia, argumentoPrincipal, alerta, proximaAcao, fraseSugerida)
 */
import { useCallback, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProposalData } from '@/contexts/proposal';
import type { PostSaleClient } from '@/services/postSale';
import type { ProposalRecord } from '@/services/proposals';

export type CopilotModule =
  | 'analysis'
  | 'approach'
  | 'proposal'
  | 'proposal-pdf'
  | 'wallet'
  | 'post-sale';

export interface ModuleCopilotResult {
  estrategia: string;
  argumentoPrincipal: string;
  alerta?: string;
  proximaAcao: string;
  fraseSugerida: string;
}

interface RunOptions {
  /** Cliente de carteira (opcional — para módulo wallet). */
  proposal?: ProposalRecord | null;
  /** Cliente de pós-venda (opcional — para módulo post-sale). */
  postSaleClient?: PostSaleClient | null;
  /** Texto livre extra (ex.: última mensagem do cliente). */
  freeText?: string;
}

function profileFromRecommendation(path?: string | null): 'conservador' | 'equilibrado' | 'agressivo' | undefined {
  if (!path) return undefined;
  if (path === 'compra_a_vista') return 'agressivo';
  if (path === 'consorcio_com_lance') return 'equilibrado';
  return 'conservador';
}

function daysSince(dateIso?: string | null): number | undefined {
  if (!dateIso) return undefined;
  const t = new Date(dateIso).getTime();
  if (!Number.isFinite(t)) return undefined;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

// Labels legíveis (evita enviar enums brutos ao prompt da IA)
const CONSORTIUM_TYPE_LABELS: Record<string, string> = {
  auto: 'Veículo',
  imovel: 'Imóvel',
  pesados: 'Veículos pesados',
  servicos: 'Serviços',
};
const OBJETIVO_LABELS: Record<string, string> = {
  comprar_carro: 'Comprar veículo',
  trocar_carro: 'Trocar veículo',
  comprar_imovel: 'Comprar imóvel',
  quitar_imovel: 'Quitar imóvel',
  investir: 'Investir',
  reforma: 'Reforma',
  veiculo: 'Comprar veículo',
  troca_veiculo: 'Trocar veículo',
};
const PRIORITY_LABELS: Record<string, string> = {
  menor_custo: 'Menor custo',
  rapidez: 'Rapidez',
  manter_liquidez: 'Manter liquidez',
  equilibrio: 'Equilíbrio',
};
const URGENCY_LABELS: Record<string, string> = {
  imediato: 'Imediato',
  curto_prazo: 'Curto prazo',
  sem_pressa: 'Sem pressa',
};
const CONFIDENCE_LABELS: Record<string, string> = {
  alta: 'Alta — cliente confiante',
  media: 'Média — cliente neutro',
  baixa: 'Baixa — cliente resistente',
};

export function useModuleCopilot(module: CopilotModule) {
  const data = useProposalData();
  const [result, setResult] = useState<ModuleCopilotResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildSnapshot = useCallback((opts?: RunOptions): Record<string, unknown> => {
    const sim = data.simulation;
    const diag = data.diagnostic?.data;
    const inv = data.investment;
    const bid = data.journey?.slots?.bidStrategy;

    const rawConsortiumType = sim?.input?.consortiumType;
    const rawObjetivo = diag?.objetivoPrincipal;
    const rawUrgencia = diag?.urgencia;
    const rawPrioridade = diag?.prioridade;
    const rawConfianca = diag?.confiancaConsorcio;

    const snap: Record<string, unknown> = {
      consortiumType: (rawConsortiumType && CONSORTIUM_TYPE_LABELS[rawConsortiumType]) || rawConsortiumType,
      creditValue: sim?.input?.creditValue,
      installment: sim?.result?.installmentAfterContemplation,
      termMonths: sim?.input?.termMonths,
      totalCost: sim?.result?.totalCost,
      effectiveClientCost: sim?.effectiveClientCost ?? sim?.result?.totalCost,
      bidPercent: bid?.bidPercent,
      bidZone: bid?.zone,
      contemplationMonth: sim?.contemplationMonth,
      clientName: opts?.proposal?.client_name || opts?.postSaleClient?.client_name || diag?.clientName,
      clientObjective: (rawObjetivo && OBJETIVO_LABELS[rawObjetivo]) || diag?.clientObjective || rawObjetivo,
      scenarioProfile: profileFromRecommendation(data.journey?.recommendation?.recommendedPath),
      urgency: (rawUrgencia && URGENCY_LABELS[rawUrgencia]) || rawUrgencia,
      priority: (rawPrioridade && PRIORITY_LABELS[rawPrioridade]) || rawPrioridade,
      consortiumConfidence: (rawConfianca && CONFIDENCE_LABELS[rawConfianca]) || rawConfianca,
      clientProfile: data.diagnostic?.clientProfile,
      clientBehavior: data.diagnostic?.clientBehavior,
      clientProfileLabel: data.diagnostic?.clientProfileLabel,
      subObjetivo: diag?.subObjetivo || undefined,
      capacidadeMensal: diag?.capacidadeMensal || undefined,
      recommendedPath: data.journey?.recommendation?.recommendedPath,
      incomeMonthly: inv?.incomeMonthly,
      saleProfit: inv?.saleProfit,
      saleStage: opts?.proposal?.status,
      daysSinceLastContact: daysSince(opts?.proposal?.updated_at ?? opts?.postSaleClient?.last_contact_date ?? null),
      freeText: opts?.freeText,
    };
    // Limpa undefined/null/NaN
    for (const k of Object.keys(snap)) {
      const v = snap[k];
      if (v === undefined || v === null) delete snap[k];
      if (typeof v === 'number' && !Number.isFinite(v)) delete snap[k];
    }
    return snap;
  }, [data]);

  const run = useCallback(async (opts?: RunOptions) => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = buildSnapshot(opts);
      const { data: resp, error: invokeErr } = await supabase.functions.invoke('module-copilot', {
        body: { module, snapshot },
      });
      if (invokeErr) {
        const msg = invokeErr.message || 'Erro ao consultar copiloto.';
        setError(msg);
        return null;
      }
      if ((resp as { error?: string })?.error) {
        setError((resp as { error: string }).error);
        return null;
      }
      const r = resp as ModuleCopilotResult;
      setResult(r);
      return r;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [module, buildSnapshot]);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);

  /** Pronto = simulação válida (mesmo critério usado por useCentralAI). */
  const ready = useMemo(() => !!data.simulation?.isValidSimulation, [data]);

  return { ready, loading, error, result, run, reset };
}
