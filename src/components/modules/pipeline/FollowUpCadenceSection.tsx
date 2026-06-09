/**
 * Follow-up cadence section shown inside EditProposalModal.
 * Displays suggested script with copy button and highlighted placeholders.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '@/utils/clipboard';
import { cn } from '@/lib/utils';
import type { CadenceConfig } from './followUpCadence';
import { highlightPlaceholders } from './followUpCadence';

interface FollowUpCadenceSectionProps {
  cadence: CadenceConfig;
  clientName?: string;
}

export function FollowUpCadenceSection({ cadence, clientName }: FollowUpCadenceSectionProps) {
  const [copied, setCopied] = useState(false);

  const displayScript = clientName
    ? cadence.script.replace(/\[Nome\]/g, clientName)
    : cadence.script;

  const handleCopy = async () => {
    await copyToClipboard(displayScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parts = highlightPlaceholders(cadence.script);

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">📋 Cadência Sugerida</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className={cn(
            'h-7 text-xs gap-1.5',
            copied && 'border-success/40 text-success',
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
        {parts.map((part, i) =>
          part.isPlaceholder ? (
            <span
              key={i}
              className="bg-primary/15 text-primary font-semibold px-1 py-0.5 rounded"
            >
              {clientName && part.text === '[Nome]' ? clientName : part.text}
            </span>
          ) : (
            <span key={i}>{part.text}</span>
          ),
        )}
      </p>
      <p className="text-caption text-muted-foreground/75 italic">
        D+{cadence.daysOffset} · Substitua os campos destacados antes de enviar
      </p>
    </div>
  );
}
