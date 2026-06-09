import { useMemo, useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, ChevronDown, ChevronUp, Sparkles, Copy, Printer, AlertCircle, ArrowRight, Check, AlertTriangle, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAdminAnalytics, useAdminFeedbacks, useAdminUsers } from '@/hooks/useAdminQueries';
import { formatCurrency } from '@/utils/format';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { copyToClipboard } from '@/utils/clipboard';
import {
  extractSection, removeSections, splitItems, parseRecommendation,
  resolveAction, navigateAdminTab,
} from '@/utils/intelligenceReportParser';
import { AdminPageHeader } from './AdminPageHeader';

type Period = '7d' | '30d' | '90d';
const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 };
const LS_KEY = 'admin_intelligence_last_report';
const LS_PROMPTS_IMPLEMENTED = 'intelligence_prompts_implemented';

interface PromptItem {
  titulo: string;
  categoria: string;
  problema: string;
  prompt: string;
}

interface StoredReport {
  markdown: string;
  generatedAt: string;
  periodo: Period;
  model?: string;
}

interface IntelligenceSnapshot {
  periodo: Period;
  usuarios: { total: number; novos: number; ativos: number; retidos: number; emRisco: number };
  funil: {
    simulacoes: number; intencaoProposta: number; leadsCriados: number;
    propostasEnviadas: number; negociosFechados: number; taxaConversaoGeral: number;
  };
  carteira: {
    totalPropostas: number; fechadas: number; perdidas: number; deletadas: number;
    taxaFechamento: number; ticketMedioImovel: number; ticketMedioVeiculo: number; ticketMedioPesados: number;
  };
  ia: { totalChamadas: number; funcaoMaisUsada: string; usuariosAtivosIA: number; taxaAdocaoIA: number };
  pdfs: { gerados: number; enviados: number; taxaEnvio: number };
  feedbacks: {
    total: number; erros: number; sugestoes: number; pendentes: number;
    tempoMedioResposta: number; taxaResolucao: number;
  };
  comunidade: { casosAbertos: number; casosResolvidos: number; respostas: number; taxaResolucao: number };
}

// ─── Hooks auxiliares (reusam tabelas já consumidas pelos outros módulos) ──
function useAICalls(period: Period) {
  const since = useMemo(() => new Date(Date.now() - PERIOD_DAYS[period] * 86400000).toISOString(), [period]);
  return useQuery({
    queryKey: ['intel-ai-calls', period],
    queryFn: async () => {
      // Amostra recente é suficiente para o snapshot executivo — evita payload pesado.
      const { data } = await supabase
        .from('analytics_events')
        .select('user_id, event_data')
        .eq('event_name', 'ai_call')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useCommunityStats(period: Period) {
  const since = useMemo(() => new Date(Date.now() - PERIOD_DAYS[period] * 86400000).toISOString(), [period]);
  return useQuery({
    queryKey: ['intel-community', period],
    queryFn: async () => {
      const [cases, replies] = await Promise.all([
        supabase.from('community_cases').select('id, status').gte('created_at', since),
        supabase.from('community_replies').select('id').gte('created_at', since),
      ]);
      const list = cases.data ?? [];
      return {
        casosAbertos: list.filter((c) => c.status === 'aberto').length,
        casosResolvidos: list.filter((c) => c.status === 'resolvido').length,
        total: list.length,
        respostas: replies.data?.length ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Component ────────────────────────────────────────────
export function AdminIntelligence() {
  const [period, setPeriod] = useState<Period>('30d');
  const [showData, setShowData] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<StoredReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prompts (Nível 2) — fire-and-forget após o relatório.
  const [prompts, setPrompts] = useState<PromptItem[] | null>(null);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [promptsError, setPromptsError] = useState<string | null>(null);
  const [implementedPrompts, setImplementedPrompts] = useLocalStorage<string[]>(LS_PROMPTS_IMPLEMENTED, []);

  // Carrega relatório anterior do LS
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setReport(JSON.parse(raw) as StoredReport);
    } catch { /* noop */ }
  }, []);

  const days = PERIOD_DAYS[period];
  const { data: analytics, isLoading: loadingA } = useAdminAnalytics(days);
  const { data: feedbacks = [], isLoading: loadingF } = useAdminFeedbacks();
  const { data: users = [], isLoading: loadingU } = useAdminUsers();
  const { data: aiCalls = [], isLoading: loadingAI } = useAICalls(period);
  const { data: community, isLoading: loadingC } = useCommunityStats(period);

  const isLoadingData = loadingA || loadingF || loadingU || loadingAI || loadingC;

  // ─── Snapshot derivado ───────────────────────────────────
  const snapshot: IntelligenceSnapshot | null = useMemo(() => {
    if (!analytics || !community) return null;
    const sinceMs = Date.now() - days * 86400000;

    // Usuários
    const novos = users.filter((u) => new Date(u.created_at).getTime() >= sinceMs).length;
    const ativos = analytics.retention.totalActiveUsers;
    const retidos = analytics.retention.retained;
    const emRisco = analytics.retention.atRisk;

    // Funil
    const funnelByKey = Object.fromEntries(analytics.funnel.map((f) => [f.key, f.count]));
    const simulacoes = funnelByKey.simulation_generated ?? 0;
    const fechados = funnelByKey.deal_closed ?? 0;

    // Carteira — ticket por tipo (chaves em PT)
    const ticketByType = analytics.carteira.avgTicketByType;
    const ticket = (k: string) => Math.round(ticketByType[k]?.avg ?? 0);

    // IA
    const moduleCounts = new Map<string, number>();
    const uniqueAI = new Set<string>();
    for (const e of aiCalls) {
      const m = (e.event_data as { module?: string } | null)?.module ?? 'unknown';
      moduleCounts.set(m, (moduleCounts.get(m) ?? 0) + 1);
      if (e.user_id) uniqueAI.add(e.user_id);
    }
    const topModule = [...moduleCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    // Feedbacks (todos — admin não tem filtro de período aqui)
    const fbInPeriod = feedbacks.filter((f) => new Date(f.created_at).getTime() >= sinceMs);
    const erros = fbInPeriod.filter((f) => f.type === 'erro').length;
    const sugestoes = fbInPeriod.filter((f) => f.type === 'sugestao').length;
    const pendentes = fbInPeriod.filter((f) => (f.status === 'novo' || f.status === 'lido') && !f.admin_response).length;
    const resolvidos = fbInPeriod.filter((f) => f.status === 'resolvido').length;
    const responseTimes = fbInPeriod
      .filter((f) => f.resolved_at)
      .map((f) => (new Date(f.resolved_at!).getTime() - new Date(f.created_at).getTime()) / 86400000);
    const tempoMedio = responseTimes.length ? responseTimes.reduce((s, d) => s + d, 0) / responseTimes.length : 0;

    return {
      periodo: period,
      usuarios: { total: users.length, novos, ativos, retidos, emRisco },
      funil: {
        simulacoes,
        intencaoProposta: funnelByKey.proposal_intent ?? 0,
        leadsCriados: funnelByKey.lead_created ?? 0,
        propostasEnviadas: funnelByKey.proposal_sent ?? 0,
        negociosFechados: fechados,
        taxaConversaoGeral: simulacoes > 0 ? Math.round((fechados / simulacoes) * 1000) / 10 : 0,
      },
      carteira: {
        totalPropostas: analytics.carteira.created,
        fechadas: analytics.carteira.closed,
        perdidas: analytics.carteira.lost,
        deletadas: analytics.carteira.deleted,
        taxaFechamento: Math.round((analytics.carteira.closeRate ?? 0) * 10) / 10,
        ticketMedioImovel: ticket('imobiliario') || ticket('imovel'),
        ticketMedioVeiculo: ticket('automovel') || ticket('veiculo'),
        ticketMedioPesados: ticket('pesados'),
      },
      ia: {
        totalChamadas: aiCalls.length,
        funcaoMaisUsada: topModule,
        usuariosAtivosIA: uniqueAI.size,
        taxaAdocaoIA: ativos > 0 ? Math.round((uniqueAI.size / ativos) * 1000) / 10 : 0,
      },
      pdfs: {
        gerados: analytics.pdfFunnel.generated,
        enviados: analytics.pdfFunnel.sent,
        taxaEnvio: Math.round((analytics.pdfFunnel.sendRate ?? 0) * 10) / 10,
      },
      feedbacks: {
        total: fbInPeriod.length,
        erros,
        sugestoes,
        pendentes,
        tempoMedioResposta: Math.round(tempoMedio * 10) / 10,
        taxaResolucao: fbInPeriod.length > 0 ? Math.round((resolvidos / fbInPeriod.length) * 1000) / 10 : 0,
      },
      comunidade: {
        casosAbertos: community.casosAbertos,
        casosResolvidos: community.casosResolvidos,
        respostas: community.respostas,
        taxaResolucao: community.total > 0 ? Math.round((community.casosResolvidos / community.total) * 1000) / 10 : 0,
      },
    };
  }, [analytics, users, feedbacks, aiCalls, community, days, period]);

  // ─── Geração de prompts (Nível 2) — fire-and-forget ──────
  const fetchPrompts = useCallback(async (markdown: string, snap: IntelligenceSnapshot) => {
    setPromptsLoading(true);
    setPromptsError(null);
    setPrompts(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('admin-intelligence-prompts', {
        body: { report: markdown, snapshot: snap },
      });
      if (fnErr) throw new Error(fnErr.message);
      const list = Array.isArray(data?.prompts) ? (data.prompts as PromptItem[]) : null;
      if (!list || list.length === 0) throw new Error('Sem prompts retornados.');
      setPrompts(list);
    } catch (e) {
      setPromptsError(e instanceof Error ? e.message : 'Erro ao gerar prompts.');
    } finally {
      setPromptsLoading(false);
    }
  }, []);

  // ─── Geração ─────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!snapshot) return;
    setGenerating(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-intelligence-report', {
        body: { snapshot },
      });
      if (fnError) throw new Error(fnError.message);
      if (!data?.markdown) throw new Error('Resposta vazia da IA.');
      const next: StoredReport = {
        markdown: data.markdown,
        generatedAt: data.generatedAt ?? new Date().toISOString(),
        periodo: period,
        model: data.model,
      };
      setReport(next);
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* noop */ }
      toast({ title: 'Relatório gerado' });
      void fetchPrompts(next.markdown, snapshot);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar relatório.';
      setError(msg);
      toast({ title: 'Falha ao gerar', description: msg, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }, [snapshot, period, fetchPrompts]);

  const togglePromptImplemented = useCallback((key: string) => {
    setImplementedPrompts((prev) => {
      const set = new Set(prev);
      if (set.has(key)) set.delete(key); else set.add(key);
      return Array.from(set);
    });
  }, [setImplementedPrompts]);

  // Memos de parsing do relatório
  const parsedSections = useMemo(() => {
    if (!report) return null;
    const md = report.markdown;
    const recs = splitItems(extractSection(md, 'recomenda') ?? '').slice(0, 5);
    const alertsRaw = extractSection(md, 'alerta') ?? '';
    const isNoAlert = /nenhum alerta/i.test(alertsRaw);
    const alerts = isNoAlert ? [] : splitItems(alertsRaw).slice(0, 5);
    const cleaned = removeSections(md, ['recomenda', 'alerta']);
    return { recs, alerts, cleaned, noAlerts: isNoAlert };
  }, [report]);

  const handleCopy = useCallback(async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.markdown);
      toast({ title: 'Relatório copiado' });
    } catch {
      toast({ title: 'Não foi possível copiar', variant: 'destructive' });
    }
  }, [report]);

  const handlePrint = useCallback(() => {
    if (!report) return;
    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Inteligência da Plataforma</title>
      <style>
        body { font-family: -apple-system, system-ui, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 24px; color: #111; line-height: 1.6; }
        h1,h2,h3 { color: #0a1e3f; }
        h2 { border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-top: 32px; }
        pre { white-space: pre-wrap; font: inherit; }
        .meta { color: #666; font-size: 12px; margin-bottom: 24px; }
      </style></head><body>
      <h1>Inteligência da Plataforma</h1>
      <p class="meta">Gerado em ${escape(new Date(report.generatedAt).toLocaleString('pt-BR'))} · Período ${escape(report.periodo)}</p>
      <pre>${escape(report.markdown)}</pre>
      </body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'width=900,height=900');
    if (!w) {
      URL.revokeObjectURL(url);
      return;
    }
    w.addEventListener('load', () => {
      try { w.print(); } catch { /* noop */ }
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    });
  }, [report]);

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Inteligência da Plataforma"
        subtitle="Análise executiva gerada por IA com base em dados reais"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-end">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-input overflow-hidden">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 h-9 text-sm transition-colors ${p === period ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <Button onClick={handleGenerate} disabled={!snapshot || isLoadingData || generating}>
            <Sparkles className="h-4 w-4 mr-1.5" />
            {generating ? 'Gerando…' : report ? 'Atualizar análise' : 'Gerar análise'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5" /> <span>{error}</span>
        </div>
      )}

      {/* Painel de dados (transparência) */}
      <Card>
        <button
          onClick={() => setShowData((v) => !v)}
          className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-muted/40 transition-colors"
        >
          <span className="flex items-center gap-2 text-foreground/90">
            Dados utilizados nesta análise
            <span className="text-caption text-muted-foreground font-normal">
              ({isLoadingData ? 'carregando…' : `período ${period}`})
            </span>
          </span>
          {showData ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showData && (
          <CardContent className="pt-0 border-t border-border">
            {snapshot ? <SnapshotGrid s={snapshot} /> : <p className="text-sm text-muted-foreground py-4">Carregando dados…</p>}
          </CardContent>
        )}
      </Card>

      {/* Relatório */}
      <Card>
        <CardContent className="p-6">
          {generating ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-6 w-1/4 mt-6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : report ? (
            <div>
              <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Relatório executivo</h2>
                  <p className="text-caption text-muted-foreground mt-0.5">
                    Gerado em {new Date(report.generatedAt).toLocaleString('pt-BR')}
                    {' · '}período {report.periodo}
                    {report.model ? ` · ${report.model}` : ''}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handlePrint}>
                    <Printer className="h-3.5 w-3.5 mr-1" /> Exportar PDF
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90">
                <ReactMarkdown>{parsedSections?.cleaned ?? report.markdown}</ReactMarkdown>
              </div>

              {/* Recomendações acionáveis */}
              {parsedSections && parsedSections.recs.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" /> Recomendações prioritárias
                  </h3>
                  <div className="grid gap-3">
                    {parsedSections.recs.map((item, idx) => (
                      <RecommendationCard key={idx} index={idx + 1} text={item} />
                    ))}
                  </div>
                </div>
              )}

              {/* Alertas */}
              {parsedSections && (
                <div className="mt-8 space-y-3">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" /> Alertas
                  </h3>
                  {parsedSections.alerts.length > 0 ? (
                    <div className="grid gap-3">
                      {parsedSections.alerts.map((item, idx) => (
                        <AlertCard key={idx} text={item} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum alerta crítico identificado.</p>
                  )}
                </div>
              )}

              {/* Prompts sugeridos (Nível 2) */}
              <PromptsSection
                loading={promptsLoading}
                error={promptsError}
                prompts={prompts}
                implemented={implementedPrompts}
                onToggle={togglePromptImplemented}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Brain className="h-10 w-10 mx-auto mb-3 opacity-40" />
              Nenhum relatório gerado ainda. Clique em <strong>Gerar análise</strong> para começar.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Snapshot grid ────────────────────────────────────────
function SnapshotGrid({ s }: { s: IntelligenceSnapshot }) {
  const Group = ({ title, items }: { title: string; items: Array<[string, string | number]> }) => (
    <div className="space-y-1.5">
      <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="grid grid-cols-2 gap-1 text-xs">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 py-0.5">
            <span className="text-muted-foreground truncate">{k}</span>
            <span className="font-medium tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
      <Group title="Usuários" items={[
        ['Total', s.usuarios.total], ['Novos', s.usuarios.novos],
        ['Ativos', s.usuarios.ativos], ['Retidos', s.usuarios.retidos], ['Em risco', s.usuarios.emRisco],
      ]} />
      <Group title="Funil" items={[
        ['Simulações', s.funil.simulacoes], ['Intenção proposta', s.funil.intencaoProposta],
        ['Leads', s.funil.leadsCriados], ['Enviadas', s.funil.propostasEnviadas],
        ['Fechados', s.funil.negociosFechados], ['Conv. geral', `${s.funil.taxaConversaoGeral}%`],
      ]} />
      <Group title="Carteira" items={[
        ['Total', s.carteira.totalPropostas], ['Fechadas', s.carteira.fechadas],
        ['Perdidas', s.carteira.perdidas], ['Taxa fech.', `${s.carteira.taxaFechamento}%`],
        ['Ticket imóvel', formatCurrency(s.carteira.ticketMedioImovel)],
        ['Ticket veículo', formatCurrency(s.carteira.ticketMedioVeiculo)],
      ]} />
      <Group title="IA" items={[
        ['Chamadas', s.ia.totalChamadas], ['Função top', s.ia.funcaoMaisUsada],
        ['Usuários IA', s.ia.usuariosAtivosIA], ['Adoção', `${s.ia.taxaAdocaoIA}%`],
      ]} />
      <Group title="PDFs / Feedbacks" items={[
        ['PDFs gerados', s.pdfs.gerados], ['PDFs enviados', s.pdfs.enviados],
        ['Taxa envio', `${s.pdfs.taxaEnvio}%`],
        ['Feedbacks', s.feedbacks.total], ['Pendentes', s.feedbacks.pendentes],
        ['Resolução', `${s.feedbacks.taxaResolucao}%`],
      ]} />
      <Group title="Comunidade" items={[
        ['Casos abertos', s.comunidade.casosAbertos],
        ['Casos resolvidos', s.comunidade.casosResolvidos],
        ['Respostas', s.comunidade.respostas],
        ['Taxa resolução', `${s.comunidade.taxaResolucao}%`],
      ]} />
    </div>
  );
}

// ─── Recommendation / Alert cards ─────────────────────────
function RecommendationCard({ index, text }: { index: number; text: string }) {
  const parts = useMemo(() => parseRecommendation(text), [text]);
  const action = useMemo(() => resolveAction(text), [text]);
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4 flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <span className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-semibold">
          {index}
        </span>
        <div className="flex-1 min-w-0 space-y-1.5 text-sm">
          {parts.problema ? (
            <p><span className="font-semibold text-foreground">Problema:</span> <span className="text-foreground/90">{parts.problema}</span></p>
          ) : null}
          {parts.acao ? (
            <p><span className="font-semibold text-foreground">Ação:</span> <span className="text-foreground/90">{parts.acao}</span></p>
          ) : null}
          {parts.impacto ? (
            <p><span className="font-semibold text-foreground">Impacto esperado:</span> <span className="text-foreground/90">{parts.impacto}</span></p>
          ) : null}
          {!parts.problema && !parts.acao && !parts.impacto && (
            <p className="text-foreground/90 whitespace-pre-wrap">{parts.raw}</p>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => navigateAdminTab(action.module)}>
          {action.label} <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function AlertCard({ text }: { text: string }) {
  const action = useMemo(() => resolveAction(text), [text]);
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex flex-col gap-2">
      <div className="flex items-start gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
        <p className="text-foreground/90 whitespace-pre-wrap">{text}</p>
      </div>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => navigateAdminTab(action.module)}>
          Investigar <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Prompts (Nível 2) ────────────────────────────────────
function categoryClasses(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('ux')) return 'bg-blue-500/15 text-blue-700 dark:text-blue-300';
  if (c.includes('fluxo')) return 'bg-purple-500/15 text-purple-700 dark:text-purple-300';
  if (c.includes('engaj')) return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
  return 'bg-muted text-muted-foreground';
}

function promptKey(p: PromptItem): string {
  // Estável o suficiente para localStorage sem PII relevante.
  return `${p.titulo}::${p.prompt.slice(0, 60)}`;
}

function PromptsSection({
  loading, error, prompts, implemented, onToggle,
}: {
  loading: boolean;
  error: string | null;
  prompts: PromptItem[] | null;
  implemented: string[];
  onToggle: (key: string) => void;
}) {
  if (!loading && !error && !prompts) return null;
  return (
    <div className="mt-10 pt-6 border-t border-border space-y-3">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" /> Prompts sugeridos para melhorar o sistema
      </h3>
      {loading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      )}
      {error && !loading && (
        <p className="text-sm text-muted-foreground">Não foi possível gerar prompts desta vez.</p>
      )}
      {prompts && !loading && (
        <div className="grid gap-3">
          {prompts.map((p) => (
            <PromptCard
              key={promptKey(p)}
              item={p}
              done={implemented.includes(promptKey(p))}
              onToggle={() => onToggle(promptKey(p))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PromptCard({ item, done, onToggle }: { item: PromptItem; done: boolean; onToggle: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(item.prompt);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast({ title: 'Não foi possível copiar', variant: 'destructive' });
    }
  };
  return (
    <div className={`rounded-lg border p-4 transition-colors ${done ? 'border-green-500/60 bg-green-500/5' : 'border-border bg-card'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className={`text-sm font-semibold text-foreground ${done ? 'line-through opacity-70' : ''}`}>
            {item.titulo}
          </h4>
          <span className={`inline-block mt-1 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded ${categoryClasses(item.categoria)}`}>
            {item.categoria}
          </span>
        </div>
      </div>
      <p className={`mt-2 text-xs italic text-muted-foreground ${done ? 'line-through' : ''}`}>
        {item.problema}
      </p>
      <pre className={`mt-3 rounded-md bg-muted/60 p-3 text-xs font-mono whitespace-pre-wrap break-words text-foreground/90 max-h-72 overflow-auto ${done ? 'line-through opacity-70' : ''}`}>
        {item.prompt}
      </pre>
      <div className="mt-3 flex flex-wrap gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={handleCopy}>
          <Copy className="h-3.5 w-3.5 mr-1" /> {copied ? 'Copiado!' : 'Copiar prompt'}
        </Button>
        <Button size="sm" variant={done ? 'default' : 'outline'} onClick={onToggle}>
          <Check className="h-3.5 w-3.5 mr-1" /> {done ? 'Implementado' : 'Marcar implementado'}
        </Button>
      </div>
    </div>
  );
}

export default AdminIntelligence;
