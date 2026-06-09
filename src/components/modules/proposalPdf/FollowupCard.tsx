/**
 * FollowupCard — Sprint B.2 extraction.
 *
 * Sequência automática pós-envio do PDF: gerente seleciona etapa → mensagem
 * pronta para WhatsApp com botão Copiar/Enviar e marcação de "cliente
 * respondeu". Eventos: followup_message_generated, followup_message_sent,
 * followup_response_received.
 *
 * Behavior preserved 1:1 from previous inline component in ProposalPdfModule.
 */
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, MessageCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/services/analyticsTracker';
import { buildFollowupStage, STAGE_META, type FollowupStage } from '@/utils/proposalPdf/followupMessage';
import { openInWhatsApp } from '@/utils/whatsapp';

const STAGE_OPTIONS: FollowupStage[] = [
  'sent',
  'nudge_24h',
  'nudge_48h',
  'score_resistencia',
  'score_interesse',
  'score_quase_fechado',
  'conversion',
];

export function FollowupCard({ clientName }: { clientName: string }) {
  const [stage, setStage] = useState<FollowupStage>('sent');
  const [score, setScore] = useState<string>('');
  const [editedMessage, setEditedMessage] = useState<string>('');
  const [touched, setTouched] = useState(false);

  const numericScore = score === '' ? null : Number(score);
  const scoreValid =
    numericScore !== null && Number.isFinite(numericScore) && numericScore >= 0 && numericScore <= 10;

  // Para etapas de score, determina segmento automaticamente quando válido.
  const effectiveStage: FollowupStage = useMemo(() => {
    if (stage !== 'score_resistencia' && stage !== 'score_interesse' && stage !== 'score_quase_fechado') {
      return stage;
    }
    if (!scoreValid) return stage;
    const s = numericScore!;
    if (s <= 4) return 'score_resistencia';
    if (s <= 7) return 'score_interesse';
    return 'score_quase_fechado';
  }, [stage, scoreValid, numericScore]);

  const result = useMemo(
    () => buildFollowupStage(effectiveStage, { clientName, score: scoreValid ? numericScore! : undefined }),
    [effectiveStage, clientName, scoreValid, numericScore],
  );

  // Regenera o textarea quando o stage/score muda — só sobrescreve se o gerente não editou.
  // CRÍTICO: useEffect (não useMemo) — setState dentro de useMemo causa loop infinito.
  useEffect(() => {
    if (!touched) setEditedMessage(result.message);
  }, [result.message, touched]);

  const message = editedMessage || result.message;
  const isScoreStage = stage.startsWith('score_');
  const needsScore = isScoreStage && !scoreValid;

  const switchStage = (next: FollowupStage) => {
    setStage(next);
    setTouched(false);
  };

  const trackPayload = () => ({
    stage: effectiveStage,
    segment: result.segment,
    score: scoreValid ? numericScore! : undefined,
  });

  const handleCopy = async () => {
    if (needsScore) return;
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Mensagem copiada');
      trackEvent('followup_message_generated', { ...trackPayload(), action: 'copy' });
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const handleWhatsApp = () => {
    if (needsScore) return;
    openInWhatsApp(message);
    trackEvent('followup_message_generated', { ...trackPayload(), action: 'whatsapp' });
    trackEvent('followup_message_sent', trackPayload());
  };

  const handleResponseReceived = () => {
    trackEvent('followup_response_received', trackPayload());
    toast.success('Resposta registrada', {
      description: 'Avance para a etapa que melhor descreve a reação do cliente.',
    });
  };

  return (
    <Card className="border-secondary/40">
      <CardContent className="p-card-sm space-y-3">
        <div className="flex items-start gap-3">
          <MessageCircle className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Sequência de follow-up</h3>
            <p className="text-xs text-muted-foreground">
              Mensagens curtas e naturais para cada momento — do envio do PDF até o fechamento.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STAGE_OPTIONS.map((opt) => {
            const active = stage === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => switchStage(opt)}
                className={
                  active
                    ? 'text-caption px-2.5 py-1 rounded-full border border-primary bg-primary text-primary-foreground transition-colors'
                    : 'text-caption px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors'
                }
              >
                {STAGE_META[opt].label}
              </button>
            );
          })}
        </div>

        <p className="text-caption text-muted-foreground -mt-1">{STAGE_META[stage].hint}</p>

        {isScoreStage && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="w-full sm:w-40">
              <Label htmlFor="followup-score" className="text-xs">Nota do cliente (0 a 10)</Label>
              <Input
                id="followup-score"
                type="number"
                inputMode="numeric"
                min={0}
                max={10}
                step={1}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Ex.: 7"
              />
            </div>
            {needsScore && (
              <p className="text-xs text-destructive">Informe a nota para gerar a mensagem.</p>
            )}
          </div>
        )}

        {!needsScore && (
          <>
            <div>
              <Label htmlFor="followup-message" className="text-xs">Mensagem sugerida (editável)</Label>
              <Textarea
                id="followup-message"
                value={message}
                onChange={(e) => { setTouched(true); setEditedMessage(e.target.value); }}
                rows={4}
                className="resize-none text-sm mt-1"
                maxLength={600}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleWhatsApp} className="gap-2">
                <MessageCircle className="h-4 w-4" /> 📲 Enviar mensagem sugerida
              </Button>
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                <Copy className="h-4 w-4" /> Copiar
              </Button>
              <Button variant="ghost" onClick={handleResponseReceived} className="gap-2 sm:ml-auto">
                <CheckCircle2 className="h-4 w-4" /> Cliente respondeu
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
