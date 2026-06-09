/**
 * RequestCommunityHelpFromSimulationButton
 *
 * Variante do botão "Pedir ajuda" para uso DIRETO na tela do Simulador,
 * antes de existir uma proposta gravada. Anonimiza os dados da simulação
 * (sem nome, sem PII) e abre um caso na Comunidade.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Lock, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { anonymizeSimulation, type SimulationSnapshot } from '@/utils/community/anonymize';
import { createCase } from '@/services/community';
import { useCommunityEngagement } from '@/hooks/useCommunity';
import { LEVEL_LABEL, LEVEL_THRESHOLDS } from '@/utils/community/score';

interface Props {
  /** Função chamada no clique para coletar o snapshot atual da simulação. */
  getSnapshot: () => SimulationSnapshot | null;
  /** Habilitado apenas quando há simulação válida. */
  disabled?: boolean;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'sm' | 'default';
  className?: string;
  /** Após criar o caso, navega para a Comunidade. */
  onCaseCreated?: () => void;
}

export function RequestCommunityHelpFromSimulationButton({
  getSnapshot, disabled, variant = 'outline', size = 'sm', className, onCaseCreated,
}: Props) {
  const { permissions, level, score, progress, loading: engLoading } = useCommunityEngagement();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [question, setQuestion] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);

  const canCreate = permissions.canCreateCases;

  const handleOpen = () => {
    if (!canCreate) {
      const target = LEVEL_THRESHOLDS[2];
      toast.info(
        `Comunidade liberada a partir do nível ${LEVEL_LABEL[2]} (${target} pts). Você tem ${score} pts.`,
      );
      return;
    }
    const snap = getSnapshot();
    if (!snap) {
      toast.info('Conclua a simulação para pedir ajuda nesse caso.');
      return;
    }
    const anon = anonymizeSimulation(snap);
    setSnapshot(snap);
    setTitle(anon.title);
    setSummary(anon.summary);
    setQuestion('');
    setIsPrivate(false);
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!snapshot) return;
    if (!title.trim() || !summary.trim()) {
      toast.error('Preencha título e resumo do caso.');
      return;
    }
    setSubmitting(true);
    try {
      const anon = anonymizeSimulation({ ...snapshot, question: question.trim() || null });
      const finalSummary = question.trim()
        ? `${summary.trim()}\n\nDúvida do gerente:\n${question.trim()}`
        : summary.trim();
      const created = await createCase({
        ...anon,
        title: title.trim(),
        summary: finalSummary,
        is_private: isPrivate,
      });
      if (created) {
        toast.success('Caso enviado à Comunidade. Sem dados pessoais.');
        setOpen(false);
        onCaseCreated?.();
      }
    } catch (err) {
      toast.error(err?.message || 'Não foi possível criar o caso.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleOpen}
        disabled={engLoading || disabled}
        className={`gap-1.5 ${className ?? ''}`}
        title="Pedir ajuda nesse caso (sem expor dados do cliente)"
      >
        <Users className="h-4 w-4" />
        Pedir ajuda nesse caso
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Pedir ajuda nesse caso
            </DialogTitle>
            <DialogDescription>
              O caso é compartilhado <strong>sem nome, telefone, e-mail ou CPF</strong>.
              Os valores são preservados para que outros gerentes possam ajudar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">Seu nível: {LEVEL_LABEL[level]}</Badge>
              {progress.next && (
                <Badge variant="outline" className="text-muted-foreground">
                  {progress.pointsToNext} pts para {LEVEL_LABEL[progress.next]}
                </Badge>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sim-case-title" className="text-xs">Título</Label>
              <Input
                id="sim-case-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={160}
                placeholder="Ex.: Vale a pena dobrar o lance nesse cenário?"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sim-case-summary" className="text-xs">Resumo do caso (anônimo)</Label>
              <Textarea
                id="sim-case-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={4000}
                rows={9}
                className="font-mono text-xs"
              />
              <p className="text-caption text-muted-foreground">
                Dados do cliente já foram removidos. Edite à vontade.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sim-case-question" className="text-xs">
                Sua dúvida <span className="text-muted-foreground">(opcional, mas ajuda muito)</span>
              </Label>
              <Textarea
                id="sim-case-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={600}
                rows={3}
                placeholder="Ex.: Cliente está em dúvida entre lance livre 25% ou embutido 30%. O que recomendam?"
              />
            </div>

            <div className="flex items-center justify-between bg-muted/40 rounded px-3 py-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="sim-case-private" className="text-xs font-medium">Caso restrito</Label>
                  <p className="text-caption text-muted-foreground">
                    Apenas Colaboradores e Referências verão.
                  </p>
                </div>
              </div>
              <Switch id="sim-case-private" checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5">
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Publicar caso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
