import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { WhatsAppTextPreview } from '@/components/shared/WhatsAppTextPreview';
import {
  generateSmartMessage,
  getSmartMessageVariations,
  getLevelLabel,
  type EngagementLevel,
  type ClientContext,
} from '@/services/smartMessages';
import { copyToClipboard } from '@/utils/clipboard';
import { openInWhatsApp, isMobileDevice } from '@/utils/whatsapp';
import { trackEvent } from '@/services/analyticsTracker';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ClosingTechniquesSection } from './ClosingTechniquesSection';

const ENGAGEMENT_LEVELS: { value: EngagementLevel; label: string }[] = [
  { value: 'hot', label: '🔥 Pronto' },
  { value: 'warm', label: '⚠️ Em desenvolvimento' },
  { value: 'cold', label: '💤 Frio' },
  { value: 'new', label: '🆕 Novo' },
];

const CLIENT_CONTEXTS: { value: ClientContext; label: string }[] = [
  { value: 'generico', label: '🎯 Genérico' },
  { value: 'aluguel', label: '🏠 Pagando Aluguel' },
  { value: 'fgts', label: '💎 Tem FGTS Parado' },
  { value: 'financiamento', label: '🔄 Saindo de Financiamento' },
  { value: 'pj', label: '🚛 Cliente PJ' },
  { value: 'liquidez', label: '💰 Tem Liquidez Parada' },
  { value: 'investidor', label: '📈 Investidor / Renda Passiva' },
  { value: 'sucessao', label: '🏛️ Sucessão Patrimonial' },
  { value: 'agro', label: '🌾 Produtor Rural / Agro' },
];

interface ProposalSmartTabProps {
  clientName: string;
  typeLabel: string;
  creditValue: number;
  initialContext?: ClientContext;
}

export const ProposalSmartTab = memo(function ProposalSmartTab({
  clientName, typeLabel, creditValue, initialContext,
}: ProposalSmartTabProps) {
  // Check localStorage for pipeline trigger context
  const storedContext = useMemo(() => {
    try {
      const stored = localStorage.getItem('pipeline_prospect_context');
      if (stored) {
        localStorage.removeItem('pipeline_prospect_context');
        return stored as ClientContext;
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  const [engagementLevel, setEngagementLevel] = useState<EngagementLevel>('warm');
  const [clientContext, setClientContext] = useState<ClientContext>(storedContext || initialContext || 'generico');
  const [smartVariation, setSmartVariation] = useState(0);
  const [smartCopied, setSmartCopied] = useState(false);

  const ctx = useMemo(() => ({
    level: engagementLevel,
    clientContext,
    clientName: clientName.trim() || undefined,
    consortiumType: typeLabel,
    creditValue: creditValue > 0 ? creditValue : undefined,
  }), [engagementLevel, clientContext, clientName, typeLabel, creditValue]);

  const smartMessage = useMemo(() => generateSmartMessage(ctx, smartVariation), [ctx, smartVariation]);
  const smartVariations = useMemo(() => getSmartMessageVariations(ctx), [ctx]);

  const handleCopy = useCallback(async () => {
    await copyToClipboard(smartMessage);
    setSmartCopied(true);
    setTimeout(() => setSmartCopied(false), 2500);
    trackEvent('smart_message_copied', { level: engagementLevel, context: clientContext });
    toast.success('Mensagem copiada!');
  }, [smartMessage, engagementLevel, clientContext]);

  return (
    <div className="space-y-6">

      {/* Engagement selector */}
      <div id="smart-engagement-selector" className="space-y-2">
        <Label className="text-xs text-muted-foreground">Nível de engajamento do cliente</Label>
        <div className="grid grid-cols-2 gap-2">
          {ENGAGEMENT_LEVELS.map((lvl) => (
            <button
              key={lvl.value}
              onClick={() => { setEngagementLevel(lvl.value); setSmartVariation(0); }}
              className={cn(
                'py-2.5 px-3 rounded-xl border-2 text-xs font-medium transition-[colors,box-shadow,transform] text-left',
                engagementLevel === lvl.value
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-background border-border text-foreground hover:border-primary/30',
              )}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client context selector */}
      <div id="smart-context-selector" className="space-y-2">
        <Label className="text-xs text-muted-foreground">Contexto do cliente</Label>
        <div className="flex flex-wrap gap-1.5">
          {CLIENT_CONTEXTS.map((c) => (
            <button
              key={c.value}
              onClick={() => { setClientContext(c.value); setSmartVariation(0); }}
              className={cn(
                'px-3 py-1.5 rounded-full text-caption font-medium transition-[colors,box-shadow,transform] border',
                clientContext === c.value
                  ? 'bg-[hsl(220,60%,25%)] border-[hsl(220,60%,25%)] text-white'
                  : 'bg-background border-border text-muted-foreground hover:border-[hsl(220,60%,40%)]/40 hover:text-foreground',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message preview */}
      <Card id="smart-message-preview" className="border-border">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Mensagem de abordagem</span>
            <span className="text-caption text-muted-foreground">{getLevelLabel(engagementLevel)}</span>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg bg-[#ece5dd] dark:bg-[#0b141a] p-3">
            <WhatsAppTextPreview text={smartMessage} bubble />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button id="smart-copy-btn" size="sm" onClick={handleCopy} className="gap-1.5 h-9">
              {smartCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {smartCopied ? 'Copiada!' : 'Copiar'}
            </Button>
            {isMobileDevice() && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openInWhatsApp(smartMessage)}
                className="gap-1.5 h-9 border-whatsapp-green/40 text-whatsapp-green hover:bg-whatsapp-green/10"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                WhatsApp
              </Button>
            )}
            <Button
              id="smart-variation-btn"
              size="sm"
              variant="ghost"
              onClick={() => setSmartVariation((prev) => (prev + 1) % smartVariations.length)}
              className="gap-1.5 h-9 text-muted-foreground ml-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Variação {smartVariation + 1}/{smartVariations.length}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Closing techniques — only for "Pronto" (hot) */}
      {engagementLevel === 'hot' && (
        <ClosingTechniquesSection
          clientContext={clientContext}
          clientName={clientName.trim() || undefined}
        />
      )}
    </div>
  );
});
