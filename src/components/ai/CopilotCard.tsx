/**
 * CopilotCard — UI única reutilizável para o copiloto de vendas.
 *
 * Carregamento sob demanda (botão "Pedir copiloto" → run).
 * Não duplica nada do useCentralAI / useProposalData — recebe tudo via prop.
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, AlertTriangle, Copy, Check, ArrowRight, RefreshCw } from 'lucide-react';
import { copyToClipboard } from '@/utils/clipboard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ModuleCopilotResult } from '@/hooks/useModuleCopilot';

interface CopilotCardProps {
  title?: string;
  ready: boolean;
  loading: boolean;
  error: string | null;
  result: ModuleCopilotResult | null;
  onRun: () => void;
  /** Texto do CTA de geração inicial. */
  ctaLabel?: string;
  /** Compacto (sem padding extra). */
  compact?: boolean;
  className?: string;
  /** Sinaliza que o disparo foi automático (gatilho proativo). */
  auto?: boolean;
  /** Razões legíveis do gatilho proativo (ex.: "Custo elevado"). */
  autoReasons?: string[];
}

export function CopilotCard({
  title = 'Copiloto de venda',
  ready,
  loading,
  error,
  result,
  onRun,
  ctaLabel = 'Pedir orientação',
  compact = false,
  className,
  auto = false,
  autoReasons,
}: CopilotCardProps) {
  const [copied, setCopied] = useState(false);

  if (!ready) {
    return null;
  }

  const handleCopy = async () => {
    if (!result?.fraseSugerida) return;
    await copyToClipboard(result.fraseSugerida);
    setCopied(true);
    toast.success('Frase copiada');
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card
      className={cn(
        'border-primary/20 bg-primary/[0.03] print-hide',
        auto && 'border-primary/40 ring-1 ring-primary/20',
        className,
      )}
    >
      <CardContent className={cn('space-y-3', compact ? 'p-3' : 'p-4')}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <div className="rounded-full bg-primary/10 p-1.5 flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground truncate">{title}</p>
            {auto && (
              <Badge variant="secondary" className="h-5 text-caption gap-1">
                <Sparkles className="h-3 w-3" />
                Sugestão automática
              </Badge>
            )}
          </div>
          {result && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={onRun} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Atualizar
            </Button>
          )}
        </div>

        {auto && autoReasons && autoReasons.length > 0 && (
          <p className="text-caption text-muted-foreground -mt-1">
            Acionado por: {autoReasons.join(' · ')}
          </p>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!result && !loading && !error && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Análise contextual com base no cliente e na simulação.
            </p>
            <Button size="sm" className="gap-1.5 h-9" onClick={onRun}>
              <Sparkles className="h-3.5 w-3.5" />
              {ctaLabel}
            </Button>
          </div>
        )}

        {loading && !result && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Analisando cenário...
          </div>
        )}

        {result && (
          <div className="space-y-2.5">
            <Block label="Estratégia" text={result.estrategia} />
            <Block label="Argumento principal" text={result.argumentoPrincipal} />
            {result.alerta && (
              <div className="rounded-md border border-secondary/40 bg-secondary/10 px-3 py-2 text-xs">
                <p className="font-semibold text-secondary mb-0.5 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Atenção
                </p>
                <p className="text-foreground/90 leading-relaxed">{result.alerta}</p>
              </div>
            )}
            <div className="rounded-md border border-primary/20 bg-background px-3 py-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="h-5 text-caption gap-1">
                  <ArrowRight className="h-3 w-3" />
                  Próxima ação
                </Badge>
              </div>
              <p className="text-foreground leading-relaxed">{result.proximaAcao}</p>
            </div>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <Badge variant="secondary" className="h-5 text-caption">Frase para o cliente</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-caption"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <p className="text-foreground italic leading-relaxed whitespace-pre-line">
                "{result.fraseSugerida}"
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xs text-foreground/90 leading-relaxed">{text}</p>
    </div>
  );
}
