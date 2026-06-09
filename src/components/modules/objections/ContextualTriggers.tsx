import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Zap, ArrowRight } from 'lucide-react';
import { getRecommendedTriggers, type TriggerRecommendation } from './triggersData';
import { copyToClipboard } from '@/utils/clipboard';
import { trackEvent } from '@/services/analyticsTracker';
import { toast } from 'sonner';

interface ContextualTriggersProps {
  creditValue: number;
  termMonths: number;
  bidSimulated: boolean;
  onNavigateToTrigger: (triggerId: string) => void;
}

export function ContextualTriggers({ creditValue, termMonths, bidSimulated, onNavigateToTrigger }: ContextualTriggersProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const recommendations = useMemo(() =>
    getRecommendedTriggers({ creditValue, bidSimulated, termMonths }),
    [creditValue, bidSimulated, termMonths]
  );

  const handleCopy = useCallback(async (rec: TriggerRecommendation) => {
    await copyToClipboard(rec.trigger.script);
    setCopiedId(rec.trigger.id);
    trackEvent('contextual_trigger_copied', { module: 'objections', trigger: rec.trigger.id });
    toast.success('Script copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  if (recommendations.length === 0) return null;

  // Truncate script to ~3-4 lines
  const truncate = (text: string, max = 180) =>
    text.length > max ? text.slice(0, max).trimEnd() + '…' : text;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5 text-amber-500" />
        <p className="text-xs font-semibold text-foreground">Gatilhos Recomendados para Este Cenário</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {recommendations.map(rec => {
          const isCopied = copiedId === rec.trigger.id;
          return (
            <Card key={rec.trigger.id} className={`animate-fade-in ${rec.priority === 'secondary' ? 'opacity-75' : ''}`}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{rec.trigger.emoji}</span>
                  <span className="text-xs font-bold text-foreground">{rec.trigger.name}</span>
                  {rec.priority === 'secondary' && (
                    <Badge variant="outline" className="text-micro ml-auto">Opcional</Badge>
                  )}
                </div>

                <div className="border-l-2 border-amber-500/30 pl-2">
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    {truncate(rec.trigger.script)}
                  </p>
                </div>

                <p className="text-caption text-muted-foreground/75 italic">{rec.reason}</p>

                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(rec)}
                    className="h-7 gap-1 text-xs"
                  >
                    {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {isCopied ? 'Copiado' : 'Copiar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateToTrigger(rec.trigger.id)}
                    className="h-7 gap-1 text-xs text-primary"
                  >
                    Ver completo <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
