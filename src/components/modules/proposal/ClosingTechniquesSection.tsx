/**
 * Closing techniques section shown only when engagement level is "Pronto" (hot).
 * Contains two techniques: Fechamento por Condução and Pergunta Dupla.
 */
import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Target, XCircle, CheckCircle2 } from 'lucide-react';
import { copyToClipboard } from '@/utils/clipboard';
import { trackEvent } from '@/services/analyticsTracker';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ClientContext } from '@/services/smartMessages';

interface ClosingTechniquesSectionProps {
  clientContext: ClientContext;
  clientName?: string;
}

interface Script {
  label: string;
  text: string;
  contexts?: ClientContext[];
}

const CONDUCAO_SCRIPTS: Script[] = [
  {
    label: 'Processo de adesão',
    text: 'Deixa eu te explicar como funciona o processo de adesão — é simples e rápido. Você prefere fazer isso ainda hoje ou amanhã de manhã?',
  },
  {
    label: 'Próxima assembleia',
    text: 'A próxima assembleia do grupo é em [data]. Para você participar já nesse ciclo, precisamos finalizar a adesão até [data limite]. Como fica melhor para você — resolvemos agora por aqui ou você prefere passar na agência?',
  },
  {
    label: 'Estratégia de lance',
    text: 'Com base nos dados do grupo, já tenho a estratégia de lance montada para você. Assim que a adesão for confirmada, te passo o planejamento completo para a primeira assembleia. Vamos dar esse passo agora?',
  },
];

const PERGUNTA_DUPLA_SCRIPTS: Script[] = [
  {
    label: 'Para PF',
    text: 'Para o faturamento da taxa de adesão, fica melhor no seu CPF ou você prefere que eu verifique as opções de parcelamento?',
    contexts: ['generico', 'aluguel', 'financiamento', 'liquidez', 'sucessao', 'agro'],
  },
  {
    label: 'Para PJ',
    text: 'Para o faturamento da taxa de adesão, é mais estratégico alocar no CNPJ da empresa — para aproveitar a dedutibilidade fiscal — ou prefere no seu CPF pessoal?',
    contexts: ['pj'],
  },
  {
    label: 'Para investidor',
    text: 'Você prefere estruturar essa cota no seu nome ou já pensamos numa holding para otimizar a sucessão patrimonial?',
    contexts: ['investidor'],
  },
  {
    label: 'Com FGTS',
    text: 'Você prefere usar o FGTS já no primeiro lance ou guardar para uma assembleia mais estratégica nos próximos meses?',
    contexts: ['fgts'],
  },
];

const NEVER_SAY = [
  'O que você achou da proposta?',
  'Podemos avançar?',
  'Você tem interesse?',
];

function ScriptCard({ script, onCopy }: { script: Script; onCopy: (text: string, label: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    onCopy(script.text, script.label);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [script, onCopy]);

  return (
    <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30">
      <p className="text-sm leading-relaxed text-foreground/90 flex-1">
        <span className="text-xs font-semibold text-muted-foreground block mb-1">{script.label}</span>
        "{script.text}"
      </p>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 shrink-0 p-0"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export function ClosingTechniquesSection({ clientContext, clientName }: ClosingTechniquesSectionProps) {
  const handleCopy = useCallback((text: string, label: string) => {
    const finalText = clientName ? text.replace(/\[Nome\]/g, clientName) : text;
    copyToClipboard(finalText);
    trackEvent('closing_script_copied', { technique: label, context: clientContext });
    toast.success('Script copiado!');
  }, [clientContext, clientName]);

  // Sort pergunta dupla scripts based on context
  const sortedPerguntaDupla = useMemo(() => {
    const contextPriority: Record<string, ClientContext[]> = {
      pj: ['pj'],
      fgts: ['fgts'],
      investidor: ['investidor'],
    };
    const prioritized = contextPriority[clientContext];
    if (!prioritized) return PERGUNTA_DUPLA_SCRIPTS;

    return [...PERGUNTA_DUPLA_SCRIPTS].sort((a, b) => {
      const aMatch = a.contexts?.some(c => prioritized.includes(c)) ? 0 : 1;
      const bMatch = b.contexts?.some(c => prioritized.includes(c)) ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [clientContext]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Section header */}
      <div className="text-center space-y-1 pt-2">
        <h3 className="text-sm font-bold text-foreground flex items-center justify-center gap-1.5">
          🎯 Técnicas de Fechamento
        </h3>
        <p className="text-caption text-muted-foreground">
          Use quando o cliente está pronto — conduza sem pressão aparente
        </p>
      </div>

      {/* Técnica 1 — Fechamento por Condução */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-caption bg-primary/10 text-primary border-primary/20">
              Técnica 1
            </Badge>
            <span className="text-xs font-bold text-foreground">Fechamento por Condução</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Age sob a premissa de que a decisão já está tomada. Conduz naturalmente para os trâmites práticos sem fazer perguntas abertas que estimulam procrastinação.
          </p>

          {/* O que NÃO dizer */}
          <div className="space-y-1.5">
            <span className="text-caption font-semibold text-destructive flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Nunca dizer
            </span>
            <div className="flex flex-wrap gap-1.5">
              {NEVER_SAY.map((phrase) => (
                <span
                  key={phrase}
                  className="text-caption px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20"
                >
                  "{phrase}"
                </span>
              ))}
            </div>
          </div>

          {/* Scripts */}
          <div className="space-y-1.5">
            <span className="text-caption font-semibold text-primary flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Scripts de condução
            </span>
            <div className="space-y-2">
              {CONDUCAO_SCRIPTS.map((script) => (
                <ScriptCard key={script.label} script={script} onCopy={handleCopy} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Técnica 2 — Pergunta Dupla */}
      <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-caption bg-accent/10 text-accent-foreground border-accent/20">
              Técnica 2
            </Badge>
            <span className="text-xs font-bold text-foreground">Pergunta Dupla</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Oferece duas opções onde qualquer escolha confirma o fechamento. Direciona a mente do cliente para minúcias logísticas — não para a decisão de comprar ou não comprar.
          </p>

          {/* Scripts */}
          <div className="space-y-2">
            {sortedPerguntaDupla.map((script) => (
              <ScriptCard key={script.label} script={script} onCopy={handleCopy} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
