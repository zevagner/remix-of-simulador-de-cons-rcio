/**
 * RequestCommunityHelpButton — botão "Solicitar ajuda sobre este cliente".
 * Anonimiza a proposta e cria um caso na Comunidade.
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
import type { ProposalRecord } from '@/services/proposals';
import { anonymizeProposal } from '@/utils/community/anonymize';
import { createCase } from '@/services/community';
import { useCommunityEngagement } from '@/hooks/useCommunity';
import { LEVEL_LABEL, LEVEL_THRESHOLDS } from '@/utils/community/score';

interface Props {
  proposal: ProposalRecord;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'icon';
}

export function RequestCommunityHelpButton({ proposal, variant = 'outline', size = 'sm' }: Props) {
  const { permissions, level, score, progress, loading: engLoading } = useCommunityEngagement();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = permissions.canCreateCases;

  const handleOpen = () => {
    if (!canCreate) {
      const target = LEVEL_THRESHOLDS[2];
      toast.info(
        `Comunidade liberada a partir do nível ${LEVEL_LABEL[2]} (${target} pts). Você tem ${score} pts.`,
      );
      return;
    }
    const anon = anonymizeProposal(proposal);
    setTitle(anon.title);
    setSummary(anon.summary);
    setIsPrivate(false);
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !summary.trim()) {
      toast.error('Preencha título e resumo do caso.');
      return;
    }
    setSubmitting(true);
    try {
      const anon = anonymizeProposal(proposal);
      const created = await createCase({
        ...anon,
        title: title.trim(),
        summary: summary.trim(),
        is_private: isPrivate,
      });
      if (created) {
        toast.success('Caso enviado à Comunidade. Sem dados pessoais.');
        setOpen(false);
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
        variant={variant}
        size={size}
        onClick={handleOpen}
        disabled={engLoading}
        className="gap-1.5"
        title="Solicitar ajuda sobre este cliente (sem expor dados pessoais)"
      >
        <Users className="h-3.5 w-3.5" />
        Pedir ajuda
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Pedir ajuda sobre este caso
            </DialogTitle>
            <DialogDescription>
              O caso é compartilhado <strong>sem nome, telefone, e-mail ou CPF</strong>.
              A renda, quando informada, é convertida em faixa.
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
              <Label htmlFor="case-title" className="text-xs">Título</Label>
              <Input
                id="case-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={160}
                placeholder="Ex.: Cliente quer dobrar lance — vale a pena?"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="case-summary" className="text-xs">Resumo do caso (anônimo)</Label>
              <Textarea
                id="case-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={4000}
                rows={10}
                className="font-mono text-xs"
              />
              <p className="text-caption text-muted-foreground">
                Edite à vontade. Evite incluir nomes ou números de contato.
              </p>
            </div>

            <div className="flex items-center justify-between bg-muted/40 rounded px-3 py-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="case-private" className="text-xs font-medium">Caso restrito</Label>
                  <p className="text-caption text-muted-foreground">
                    Apenas Colaboradores e Referências verão.
                  </p>
                </div>
              </div>
              <Switch id="case-private" checked={isPrivate} onCheckedChange={setIsPrivate} />
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
