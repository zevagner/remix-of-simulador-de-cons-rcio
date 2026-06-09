/**
 * SharedProposalPage — Visual decision page for shared proposals.
 * 6 blocks: Strategy, Simulation, Comparison, Storytelling, Before/After, CTA.
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2, FileText, DollarSign, Calendar, TrendingUp,
  Target, MessageCircle, Share2, Check, ArrowRight,
  ShieldCheck, Building2, Banknote, ChevronRight,
} from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DISCLAIMERS } from '@/config/copy';
import { annualToMonthlyRate, pricePmt } from '@/core/finance';

// ═══════ TYPES ═══════

interface SharedProposalData {
  client_name: string;
  credit_value: number;
  term_months: number;
  installment: number;
  total_cost: number;
  consortium_type: string;
  group_number: number | null;
  bid_percent: number | null;
  bid_zone: string | null;
  proposal_content: string;
  proposal_format: string;
  prospect_trigger?: string;
  created_at: string;
}

interface ComparisonRow {
  label: string;
  consortium: string;
  financing: string;
  highlight?: boolean;
}

// ═══════ HELPERS ═══════

function fmt(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function fmtShort(value: number): string {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(0)}mil`;
  return fmt(value);
}

/** Calculate financing comparison data */
function calcFinancing(creditValue: number, termMonths: number) {
  const annualRate = 0.12; // 12% a.a. typical
  const monthlyRate = annualToMonthlyRate(annualRate);
  const pmt = pricePmt(creditValue, monthlyRate, termMonths);
  const totalCost = pmt * termMonths;
  const totalInterest = totalCost - creditValue;
  return { pmt, totalCost, totalInterest, monthlyRate };
}

/** Map prospect_trigger to readable context */
function getTriggerContext(trigger?: string): { icon: string; label: string; strategy: string } {
  const map: Record<string, { icon: string; label: string; strategy: string }> = {
    'pagando-aluguel': { icon: '🏠', label: 'Saindo do aluguel', strategy: 'Transformar o valor do aluguel em patrimônio próprio, sem juros bancários.' },
    'tem-fgts': { icon: '💎', label: 'Aproveitando FGTS', strategy: 'Usar o FGTS como lance estratégico para acelerar a contemplação.' },
    'saindo-financiamento': { icon: '🏦', label: 'Alternativa ao financiamento', strategy: 'Eliminar juros compostos e reduzir o custo total de aquisição.' },
    'pj-custo-alto': { icon: '🏢', label: 'Imóvel empresarial', strategy: 'Adquirir sede própria sem comprometer capital de giro.' },
    'saldo-parado': { icon: '📊', label: 'Investimento inteligente', strategy: 'Converter saldo parado em patrimônio que valoriza.' },
    'primeiro-imovel': { icon: '🔑', label: 'Primeiro imóvel', strategy: 'Iniciar a construção de patrimônio sem entrada e sem juros.' },
  };
  return map[trigger || ''] || { icon: '🎯', label: 'Planejamento patrimonial', strategy: 'Construir patrimônio de forma planejada e sem juros.' };
}

/** Map trigger to before/after */
function getBeforeAfter(trigger?: string): { before: string; after: string } {
  const map: Record<string, { before: string; after: string }> = {
    'pagando-aluguel': { before: 'Pagando aluguel todo mês sem construir patrimônio', after: 'Mesmo valor mensal construindo patrimônio próprio' },
    'tem-fgts': { before: 'FGTS parado perdendo para a inflação', after: 'FGTS transformado em imóvel próprio' },
    'saindo-financiamento': { before: 'Maior parte da parcela era juros pro banco', after: 'Zero juros — 100% patrimônio' },
    'pj-custo-alto': { before: 'Aluguel comercial sem retorno', after: 'Sede própria no patrimônio da empresa' },
    'saldo-parado': { before: 'Dinheiro na poupança perdendo para inflação', after: 'Patrimônio imobiliário que valoriza' },
    'primeiro-imovel': { before: 'Sem perspectiva de imóvel próprio', after: 'Primeiro imóvel sem entrada e sem juros' },
  };
  return map[trigger || ''] || { before: 'Incerteza financeira', after: 'Patrimônio planejado com segurança' };
}

// ═══════ COMPONENT ═══════

export default function SharedProposalPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [data, setData] = useState<SharedProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) { setError('Link inválido'); setLoading(false); return; }

    (async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-proposal?token=${token}`;
        const resp = await fetch(url, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        });
        if (resp.status === 410) {
          const body = await resp.json().catch(() => ({}));
          setError(body?.error ?? 'Este link expirou. Solicite um novo ao consultor.');
          return;
        }
        if (!resp.ok) { setError('Proposta não encontrada ou link expirado.'); return; }
        setData(await resp.json());
      } catch {
        setError('Erro ao carregar proposta.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold">{error || 'Proposta não encontrada'}</h2>
            <p className="text-sm text-muted-foreground">
              Este link pode ter expirado ou a proposta foi removida.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const createdDate = new Date(data.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const financing = calcFinancing(data.credit_value, data.term_months);
  const savings = financing.totalCost - data.total_cost;
  const triggerCtx = getTriggerContext(data.prospect_trigger);
  const beforeAfter = getBeforeAfter(data.prospect_trigger);

  const comparisonRows: ComparisonRow[] = [
    { label: 'Parcela mensal', consortium: fmt(data.installment), financing: fmt(financing.pmt) },
    { label: 'Juros totais', consortium: 'R$0', financing: fmt(financing.totalInterest), highlight: true },
    { label: 'Custo total', consortium: fmt(data.total_cost), financing: fmt(financing.totalCost), highlight: true },
    { label: 'Prazo', consortium: `${data.term_months} meses`, financing: `${data.term_months} meses` },
  ];

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `Proposta — ${data.client_name}`, url: shareUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const text = `Olá! Confira a proposta que preparei para você: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* ═══ HEADER ═══ */}
      <header className="border-b border-border/50 bg-background sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <BrandLogo compact />
          <div className="flex items-center gap-2">
            <span className="text-caption text-muted-foreground hidden sm:inline">{createdDate}</span>
            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5 text-xs h-8">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? 'Copiado' : 'Compartilhar'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* ═══ BLOCO 1: ESTRATÉGIA ═══ */}
        <section className="text-center space-y-3">
          <Badge variant="secondary" className="text-xs gap-1">
            {triggerCtx.icon} {triggerCtx.label}
          </Badge>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            Estratégia recomendada{data.client_name ? ` para ${data.client_name}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {triggerCtx.strategy}
          </p>
        </section>

        {/* ═══ BLOCO 2: SIMULAÇÃO ═══ */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={<DollarSign className="h-4 w-4 text-primary" />}
              label="Carta de Crédito"
              value={fmt(data.credit_value)}
              accent
            />
            <MetricCard
              icon={<Calendar className="h-4 w-4 text-primary" />}
              label="Prazo"
              value={`${data.term_months} meses`}
            />
            <MetricCard
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              label="Parcela Estimada"
              value={fmt(data.installment)}
              accent
            />
            <MetricCard
              icon={<Target className="h-4 w-4 text-primary" />}
              label={data.group_number ? 'Grupo' : 'Tipo'}
              value={data.group_number
                ? `${data.group_number}${data.bid_zone ? ` • ${data.bid_zone}` : ''}`
                : `Consórcio ${data.consortium_type}`
              }
            />
          </div>
        </section>

        {/* ═══ BLOCO 3: COMPARAÇÃO VISUAL ═══ */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Por que consórcio e não financiamento?
          </h2>

          <Card className="overflow-hidden border-border/50">
            <div className="grid grid-cols-3 text-center text-xs font-medium bg-muted/50 border-b border-border/30">
              <div className="py-2.5 px-2" />
              <div className="py-2.5 px-2 text-primary border-l border-border/30">
                <Building2 className="h-3.5 w-3.5 mx-auto mb-0.5" />
                Consórcio
              </div>
              <div className="py-2.5 px-2 text-muted-foreground border-l border-border/30">
                <Banknote className="h-3.5 w-3.5 mx-auto mb-0.5" />
                Financiamento
              </div>
            </div>
            {comparisonRows.map((row, i) => (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-3 text-xs border-b border-border/20 last:border-0',
                  row.highlight && 'bg-primary/[0.03]',
                )}
              >
                <div className="py-2.5 px-3 text-muted-foreground font-medium">{row.label}</div>
                <div className={cn(
                  'py-2.5 px-3 text-center border-l border-border/20 font-semibold',
                  row.highlight ? 'text-primary' : 'text-foreground',
                )}>
                  {row.consortium}
                </div>
                <div className="py-2.5 px-3 text-center border-l border-border/20 text-muted-foreground">
                  {row.financing}
                </div>
              </div>
            ))}
          </Card>

          {savings > 0 && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-3 py-1">
                💰 Economia estimada: {fmt(savings)}
              </Badge>
            </div>
          )}
        </section>

        <Separator className="opacity-50" />

        {/* ═══ BLOCO 4: STORYTELLING ═══ */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            💬 Caso real semelhante
          </h2>
          <Card className="border-l-4 border-l-primary/60 bg-gradient-to-br from-card to-muted/20">
            <CardContent className="py-4">
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                {renderProposalContent(data.proposal_content)}
              </p>
            </CardContent>
          </Card>
        </section>

        <Separator className="opacity-50" />

        {/* ═══ BLOCO 5: ANTES vs DEPOIS ═══ */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            ✨ Sua transformação
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="border-destructive/20 bg-destructive/[0.03]">
              <CardContent className="py-4 px-4">
                <p className="text-caption font-semibold text-destructive/80 uppercase tracking-wider mb-1.5">Antes</p>
                <p className="text-sm text-foreground/80">{beforeAfter.before}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/[0.03]">
              <CardContent className="py-4 px-4">
                <p className="text-caption font-semibold text-primary uppercase tracking-wider mb-1.5">Depois</p>
                <p className="text-sm text-foreground/80">{beforeAfter.after}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="opacity-50" />

        {/* ═══ BLOCO 6: CTA ═══ */}
        <section className="space-y-3 pb-4">
          <h2 className="text-sm font-semibold text-foreground text-center">
            🚀 Próximo passo
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={handleWhatsApp}
              className="gap-2 bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white shadow-md"
            >
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleShare}
              className="gap-2"
            >
              <Share2 className="h-5 w-5" />
              Compartilhar proposta
            </Button>
          </div>
          <p className="text-center text-caption text-muted-foreground">
            Tire suas dúvidas sem compromisso
          </p>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="text-center space-y-3 pt-2 pb-8 border-t border-border/30">
          <p className="text-caption text-muted-foreground leading-relaxed whitespace-pre-line">
            {DISCLAIMERS.SHARED_PROPOSAL}
          </p>
          <div className="flex items-center justify-center gap-2">
            <BrandLogo compact />
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Conheça a ferramenta <ChevronRight className="h-3 w-3" />
          </a>
        </footer>
      </main>
    </div>
  );
}

// ═══════ SUB-COMPONENTS ═══════

function MetricCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className={cn('border-border/50', accent && 'border-primary/20 bg-primary/[0.02]')}>
      <CardContent className="py-3.5 px-4">
        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
          {icon}
          <span className="text-caption">{label}</span>
        </div>
        <p className={cn('text-sm font-semibold', accent ? 'text-primary' : 'text-foreground')}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

/** Render proposal content with WhatsApp-style bold markers */
function renderProposalContent(text: string) {
  return text.split('\n').map((line, i) => {
    if (line === '') return <br key={i} />;
    const parts = line.split(/\*(.*?)\*/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1
            ? <strong key={j} className="text-foreground">{part}</strong>
            : part
        )}
        {'\n'}
      </span>
    );
  });
}
