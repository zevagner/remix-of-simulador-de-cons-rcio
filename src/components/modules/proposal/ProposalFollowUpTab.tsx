import { useState, useCallback, useRef, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Send, Copy, Check, Loader2, MessageCircle, Pencil,
  HelpCircle, ShieldAlert, ThumbsUp, Clock,
} from 'lucide-react';
import { WhatsAppTextPreview } from '@/components/shared/WhatsAppTextPreview';
import {
  generateSalesResponses,
  type SalesResponseResult,
  type ResponseClassification,
  type ProposalContext,
} from '@/services/salesResponse';
import { copyToClipboard } from '@/utils/clipboard';
import { openInWhatsApp, isMobileDevice } from '@/utils/whatsapp';
import { trackEvent } from '@/services/analyticsTracker';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAIInstrumentation } from '@/hooks/useAIInstrumentation';

const CLASSIFICATION_CONFIG: Record<ResponseClassification, { icon: typeof HelpCircle; label: string; color: string }> = {
  duvida: { icon: HelpCircle, label: 'Dúvida', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  objecao: { icon: ShieldAlert, label: 'Objeção', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  interesse: { icon: ThumbsUp, label: 'Interesse', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  indecisao: { icon: Clock, label: 'Indecisão', color: 'bg-muted text-muted-foreground border-border' },
};

const QUICK_INPUTS = [
  'Vou pensar',
  'Tá caro',
  'Não tenho esse valor',
  'Quanto fica menor?',
  'Demora muito',
  'Prefiro financiar',
];

interface ProposalFollowUpTabProps {
  proposalContext: ProposalContext;
}

export const ProposalFollowUpTab = memo(function ProposalFollowUpTab({
  proposalContext,
}: ProposalFollowUpTabProps) {
  const [clientInput, setClientInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SalesResponseResult | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editedTexts, setEditedTexts] = useState<Record<number, string>>({});
  const abortRef = useRef<AbortController | null>(null);
  const ai = useAIInstrumentation('sales-response');

  const handleGenerate = useCallback(async (input?: string) => {
    const text = input ?? clientInput;
    if (!text.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // limpa estado anterior + mostra resposta parcial (loading state)
    setIsLoading(true);
    setResult(null);
    setEditingIdx(null);
    setEditedTexts({});
    setCopiedIdx(null);
    ai.start();

    try {
      const data = await generateSalesResponses({
        clientResponse: text.trim(),
        proposalContext,
        signal: controller.signal,
      });
      ai.markFirstToken();
      setResult(data);
      ai.markComplete();
      trackEvent('sales_response_generated', { classification: data.classification });
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        ai.markAbandon('cancel');
        return;
      }
      ai.markError();
      toast.error((e as Error).message || 'Erro ao gerar respostas');
    } finally {
      setIsLoading(false);
    }
  }, [clientInput, proposalContext, ai]);

  const handleCopy = useCallback(async (idx: number, text: string) => {
    await copyToClipboard(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2500);
    trackEvent('sales_response_copied', { index: idx });
    toast.success('Resposta copiada!');
  }, []);

  const handleQuickInput = useCallback((text: string) => {
    setClientInput(text);
    handleGenerate(text);
  }, [handleGenerate]);

  const getSuggestionText = (idx: number, original: string) => editedTexts[idx] ?? original;

  return (
    <div className="space-y-6">

      {/* Input area */}
      <Card className="border-border">
        <CardContent className="pt-4 space-y-3">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <MessageCircle className="h-3 w-3" />
            O que o cliente respondeu?
          </Label>
          <Textarea
            id="followup-client-input"
            value={clientInput}
            onChange={(e) => setClientInput(e.target.value)}
            placeholder='Ex: "Vou pensar", "Tá caro", "Quanto fica menor?"'
            className="min-h-[70px] text-sm resize-none"
            rows={2}
          />

          {/* Quick inputs */}
          <div id="followup-quick-inputs" className="flex flex-wrap gap-1.5">
            {QUICK_INPUTS.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickInput(q)}
                className="text-caption px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground transition-[colors,box-shadow,transform]"
              >
                "{q}"
              </button>
            ))}
          </div>

          <Button
            id="followup-generate-btn"
            onClick={() => handleGenerate()}
            disabled={!clientInput.trim() || isLoading}
            className="w-full gap-2 min-h-[44px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Gerar sugestões de resposta
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <div id="followup-results">
      {result && (
        <div className="space-y-3 animate-fade-in">
          {/* Classification badge */}
          <div className="flex items-center justify-center gap-2">
            {(() => {
              const config = CLASSIFICATION_CONFIG[result.classification];
              const Icon = config.icon;
              return (
                <Badge variant="outline" className={cn('gap-1.5 px-3 py-1', config.color)}>
                  <Icon className="h-3 w-3" />
                  {result.classificationLabel}
                </Badge>
              );
            })()}
          </div>

          {/* Suggestions */}
          {result.suggestions.map((suggestion, idx) => {
            const text = getSuggestionText(idx, suggestion.text);
            const isEditing = editingIdx === idx;
            const isCopied = copiedIdx === idx;

            return (
              <Card key={idx} className="border-border">
                <CardContent className="pt-3 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {suggestion.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (isEditing) {
                            setEditingIdx(null);
                          } else {
                            setEditingIdx(idx);
                            if (!editedTexts[idx]) {
                              setEditedTexts((prev) => ({ ...prev, [idx]: suggestion.text }));
                            }
                          }
                        }}
                        className="text-xs h-7 px-2 text-muted-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(idx, text)}
                        className="text-xs h-7 px-2 text-primary"
                      >
                        {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedTexts[idx] ?? suggestion.text}
                        onChange={(e) =>
                          setEditedTexts((prev) => ({ ...prev, [idx]: e.target.value }))
                        }
                        className="min-h-[80px] text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleCopy(idx, editedTexts[idx] ?? suggestion.text)}
                          className="flex-1 gap-1.5 h-8 text-xs"
                        >
                          {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {isCopied ? 'Copiada!' : 'Copiar editada'}
                        </Button>
                        {isMobileDevice() && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openInWhatsApp(editedTexts[idx] ?? suggestion.text)}
                            className="h-8 text-xs border-whatsapp-green/40 text-whatsapp-green"
                          >
                            WhatsApp
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-[#ece5dd] dark:bg-[#0b141a] p-2.5">
                      <WhatsAppTextPreview text={text} bubble />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Send via WhatsApp (mobile only, non-editing) */}
          {isMobileDevice() && editingIdx === null && (
            <p className="text-caption text-muted-foreground text-center">
              Toque em copiar e cole no WhatsApp, ou edite antes de enviar
            </p>
          )}
        </div>
      )}
      </div>

      {/* Empty state hint */}
      {!result && !isLoading && (
        <div className="text-center py-6">
          <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Digite a resposta do cliente para receber sugestões inteligentes
          </p>
          <p className="text-caption text-muted-foreground/70 mt-1">
            O sistema analisa o contexto da proposta para gerar respostas personalizadas
          </p>
        </div>
      )}
    </div>
  );
});
