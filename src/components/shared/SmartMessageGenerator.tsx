import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Check, RefreshCw, MessageSquareText, User, ChevronDown, ChevronUp } from 'lucide-react';
import { copyToClipboard } from '@/utils/clipboard';
import { generateSmartMessage, getSmartMessageVariations, getLevelLabel, type EngagementLevel, type SmartMessageContext } from '@/services/smartMessages';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SmartMessageGeneratorProps {
  level: EngagementLevel;
  defaultName?: string;
  consortiumType?: string;
  creditValue?: number;
  compact?: boolean;
  className?: string;
}

export function SmartMessageGenerator({ level, defaultName = '', consortiumType, creditValue, compact = false, className }: SmartMessageGeneratorProps) {
  const [clientName, setClientName] = useState(defaultName);
  const [currentVariation, setCurrentVariation] = useState(0);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(!compact);

  const ctx: SmartMessageContext = { level, clientName, consortiumType, creditValue };
  const message = generateSmartMessage(ctx, currentVariation);
  const variations = getSmartMessageVariations(ctx);

  const handleCopy = async () => {
    await copyToClipboard(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Mensagem copiada!');
  };

  const nextVariation = () => {
    setCurrentVariation(prev => (prev + 1) % variations.length);
  };

  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={cn('flex items-center gap-1.5 text-xs text-primary hover:underline', className)}
      >
        <MessageSquareText className="h-3 w-3" />
        Gerar mensagem
        <ChevronDown className="h-3 w-3" />
      </button>
    );
  }

  return (
    <Card className={cn('border-primary/15 bg-primary/[0.02]', className)}>
      <CardContent className={cn('space-y-3', compact ? 'p-3' : 'p-4')}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Mensagem de abordagem</span>
            <span className="text-caption text-muted-foreground">{getLevelLabel(level)}</span>
          </div>
          {compact && (
            <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground">
              <ChevronUp className="h-4 w-4" />
            </button>
          )}
        </div>

        {!compact && (
          <div className="max-w-[200px]">
            <Label className="text-caption text-muted-foreground flex items-center gap-1 mb-1">
              <User className="h-3 w-3" /> Nome do cliente
            </Label>
            <Input
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Ex: João"
              className="h-8 text-sm"
            />
          </div>
        )}

        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{message}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={handleCopy} className="gap-1.5 h-8 text-xs">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
          <Button size="sm" variant="ghost" onClick={nextVariation} className="gap-1.5 h-8 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            Outra variação ({currentVariation + 1}/{variations.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
