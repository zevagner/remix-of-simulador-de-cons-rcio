import { useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Check, ExternalLink, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { WhatsAppTextPreview } from '@/components/shared/WhatsAppTextPreview';
import {
  generateWhatsAppProposal,
  generateShortWhatsAppProposal,
  type ProposalData,
} from '@/services/proposals/proposalGenerator';
import { type Tone, selectTone } from '@/services/proposals/proposalTemplates';
import { copyToClipboard } from '@/utils/clipboard';
import { openInWhatsApp, isMobileDevice } from '@/utils/whatsapp';

import { trackEvent } from '@/services/analyticsTracker';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TONE_OPTIONS: { value: Tone; label: string; emoji: string; desc: string }[] = [
  { value: 0, label: 'Direta', emoji: '🎯', desc: 'Objetiva e rápida' },
  { value: 1, label: 'Explicativa', emoji: '📖', desc: 'Detalhada e didática' },
  { value: 2, label: 'Consultiva', emoji: '🤝', desc: 'Empática e personalizada' },
];

type ProposalLength = 'short' | 'full';

interface ProposalTemplateTabProps {
  proposalData: ProposalData;
  clientName: string;
  creditValue: number;
  termMonths: number;
  installment: number;
  totalCost: number;
  typeLabel: string;
  totalBidPercent: number;
  planModality?: string;
}

export const ProposalTemplateTab = memo(function ProposalTemplateTab({
  proposalData, clientName, creditValue, termMonths, installment, totalCost, typeLabel, totalBidPercent, planModality = 'tradicional',
}: ProposalTemplateTabProps) {
  const [selectedTone, setSelectedTone] = useState<Tone | null>(null);
  const [copied, setCopied] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [proposalLength, setProposalLength] = useState<ProposalLength>('full');

  const effectiveTone = useMemo(() => {
    if (selectedTone !== null) return selectedTone;
    return selectTone(clientName, creditValue, termMonths);
  }, [selectedTone, clientName, creditValue, termMonths]);

  const generateFn = proposalLength === 'short' ? generateShortWhatsAppProposal : generateWhatsAppProposal;

  const proposalsByTone = useMemo(() => ({
    0: generateFn(proposalData, 0),
    1: generateFn(proposalData, 1),
    2: generateFn(proposalData, 2),
  } as Record<Tone, string>), [proposalData, proposalLength]);

  const currentProposal = useMemo(
    () => generateFn(proposalData, effectiveTone),
    [proposalData, effectiveTone, proposalLength],
  );

  const handleCopy = useCallback(async () => {
    await copyToClipboard(currentProposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    trackEvent('ai_content_copied', { module: 'proposal', scenario: 'template', copy_format: 'whatsapp' });
    trackEvent('proposal_generated', { tone: String(effectiveTone), format: 'whatsapp', length: proposalLength });
    trackEvent('proposal_copied', { module: 'proposal', scenario: 'template', copy_format: 'whatsapp' });

    toast.success('Proposta copiada!', {
      description: 'Salve no histórico para acompanhar o cliente.',
      action: {
        label: 'Salvar como proposta',
        onClick: async () => {
          const { requestOpenNewLead } = await import('@/utils/pipelineLaunch');
          requestOpenNewLead();
          trackEvent('simulator_save_as_proposal_click', { module: 'proposal', credit_value: creditValue });
          window.location.hash = '#proposals';
        },
      },
    });
  }, [currentProposal, creditValue, effectiveTone, proposalLength]);

  return (
    <div className="space-y-6">

      {/* Length selector */}
      <div id="proposal-length-selector" className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tamanho da proposta</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setProposalLength('short')}
            className={cn(
              'flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl border-2 transition-[colors,box-shadow,transform] text-center',
              proposalLength === 'short'
                ? 'bg-primary/10 border-primary text-primary shadow-sm'
                : 'bg-background border-border text-foreground hover:border-primary/30',
            )}
          >
            <span className="text-lg">⚡</span>
            <span className="text-xs font-semibold">Curta</span>
            <span className="text-caption text-muted-foreground leading-tight">Envio rápido</span>
          </button>
          <button
            onClick={() => setProposalLength('full')}
            className={cn(
              'flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl border-2 transition-[colors,box-shadow,transform] text-center',
              proposalLength === 'full'
                ? 'bg-primary/10 border-primary text-primary shadow-sm'
                : 'bg-background border-border text-foreground hover:border-primary/30',
            )}
          >
            <span className="text-lg">📋</span>
            <span className="text-xs font-semibold">Completa</span>
            <span className="text-caption text-muted-foreground leading-tight">Contexto + estratégia</span>
          </button>
        </div>
      </div>

      {/* Tone selector */}
      <div id="proposal-tone-selector" className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tom da proposta</Label>
        <div className="grid grid-cols-3 gap-2">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone.value}
              onClick={() => setSelectedTone(selectedTone === tone.value ? null : tone.value)}
              className={cn(
                'flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-[colors,box-shadow,transform] text-center',
                (selectedTone === tone.value || (selectedTone === null && effectiveTone === tone.value))
                  ? 'bg-primary/10 border-primary text-primary shadow-sm'
                  : 'bg-background border-border text-foreground hover:border-primary/30',
              )}
            >
              <span className="text-lg">{tone.emoji}</span>
              <span className="text-xs font-semibold">{tone.label}</span>
              <span className="text-caption text-muted-foreground leading-tight">{tone.desc}</span>
            </button>
          ))}
        </div>
        {selectedTone === null && (
          <p className="text-caption text-muted-foreground text-center">
            ✨ Tom selecionado automaticamente: <strong>{TONE_OPTIONS[effectiveTone].label}</strong>
          </p>
        )}
      </div>

      {/* Message preview */}
      <Card id="proposal-whatsapp-preview" className="border-border">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Prévia da mensagem
              <span className="text-caption text-muted-foreground font-normal">
                ({proposalLength === 'short' ? 'curta' : 'completa'})
              </span>
            </span>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-caption text-primary hover:underline flex items-center gap-0.5"
            >
              {showComparison ? 'Ocultar' : 'Comparar tons'}
              {showComparison ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto rounded-lg bg-muted p-3">
            <WhatsAppTextPreview text={currentProposal} bubble />
          </div>
        </CardContent>
      </Card>

      {/* Tone comparison */}
      {showComparison && (
        <div className="space-y-3 animate-fade-in">
          {TONE_OPTIONS.filter(t => t.value !== effectiveTone).map((tone) => (
            <Card key={tone.value} className="border-border">
              <CardContent className="pt-3 pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {tone.emoji} {tone.label}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedTone(tone.value)} className="text-xs h-7 text-primary">
                    Usar este
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-lg bg-muted p-2">
                  <WhatsAppTextPreview text={proposalsByTone[tone.value] || ''} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <Button id="proposal-copy-btn" onClick={handleCopy} className="gap-2 w-full min-h-[48px]">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiada!' : 'Copiar proposta'}
        </Button>
      </div>
    </div>
  );
});
