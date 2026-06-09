/**
 * OpenCaseDialog — criação de caso DENTRO da Comunidade (Onda 1.5 revitalização).
 * Não substitui o atalho contextual da Carteira; complementa.
 * Permite escolher categoria do caso para reduzir fricção de "o que escrever".
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
import {
  Lightbulb, Lock, Loader2, Plus, Users, Target, Compass, MessageCircle, Layers, HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { createCase } from '@/services/community';
import { useCommunityEngagement } from '@/hooks/useCommunity';
import { LEVEL_LABEL, LEVEL_THRESHOLDS } from '@/utils/community/score';
import { stripPII } from '@/utils/community/anonymize';
import { cn } from '@/lib/utils';

type CaseKind =
  | 'cliente_proposta'
  | 'duvida_operacional'
  | 'estrategia'
  | 'objecao'
  | 'grupos_lances'
  | 'outro';

const KINDS: { id: CaseKind; label: string; icon: typeof Users; hint: string; placeholder: string }[] = [
  {
    id: 'cliente_proposta',
    label: 'Caso sobre cliente / proposta',
    icon: Users,
    hint: 'Discutir um caso real (anônimo) com quem já passou pela mesma situação.',
    placeholder: 'Cliente com renda de R$ 8 mil, quer carta de R$ 300 mil em 200 meses. Está dividido entre lance fixo e livre. Como vocês abordariam?',
  },
  {
    id: 'duvida_operacional',
    label: 'Dúvida operacional',
    icon: HelpCircle,
    hint: 'Algo do dia a dia travou? Pergunte rápido — alguém já resolveu.',
    placeholder: 'Como vocês explicam a diferença entre lance livre e fixo para um cliente leigo?',
  },
  {
    id: 'estrategia',
    label: 'Estratégia consultiva',
    icon: Compass,
    hint: 'Validar uma abordagem antes de levar ao cliente.',
    placeholder: 'Pensei em propor parcela reduzida nos primeiros 12 meses + lance embutido na primeira assembleia. Faz sentido?',
  },
  {
    id: 'objecao',
    label: 'Objeção comercial',
    icon: MessageCircle,
    hint: 'Cliente travou em uma objeção? Veja como outros gerentes responderam.',
    placeholder: 'Cliente disse: "consórcio é loteria, prefiro financiamento". Qual a melhor resposta consultiva (sem prometer contemplação)?',
  },
  {
    id: 'grupos_lances',
    label: 'Grupos / lances',
    icon: Layers,
    hint: 'Dúvida sobre escolha de grupo, lance ideal ou tendência de assembleias.',
    placeholder: 'Para imóvel R$ 400k, qual faixa de lance livre vocês têm visto contemplar nos últimos 3 meses?',
  },
  {
    id: 'outro',
    label: 'Outro',
    icon: Target,
    hint: 'Qualquer assunto consultivo.',
    placeholder: 'Descreva o caso ou pergunta de forma clara…',
  },
];

interface Props {
  trigger?: React.ReactNode;
  onCreated?: () => void;
}

export function OpenCaseDialog({ trigger, onCreated }: Props) {
  const { permissions, level, score, progress } = useCommunityEngagement();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'kind' | 'form'>('kind');
  const [kind, setKind] = useState<CaseKind>('cliente_proposta');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = permissions.canCreateCases;
  const selectedKind = KINDS.find((k) => k.id === kind)!;

  const handleOpen = () => {
    if (!canCreate) {
      const target = LEVEL_THRESHOLDS[2];
      toast.info(
        `Comunidade liberada a partir do nível ${LEVEL_LABEL[2]} (${target} pts). Você tem ${score} pts.`,
      );
      return;
    }
    setStep('kind');
    setKind('cliente_proposta');
    setTitle('');
    setSummary('');
    setIsPrivate(false);
    setOpen(true);
  };

  const handlePickKind = (k: CaseKind) => {
    setKind(k);
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !summary.trim()) {
      toast.error('Preencha título e descrição do caso.');
      return;
    }
    setSubmitting(true);
    try {
      // PII strip client-side (trigger BEFORE INSERT no banco é a defesa final).
      const safeTitle = stripPII(title.trim());
      const safeSummary = stripPII(summary.trim());
      const created = await createCase({
        title: safeTitle,
        summary: safeSummary,
        consortium_type: null,
        stage: kind,
        source_kind: 'manual',
        source_id: null,
        payload: { kind },
        is_private: isPrivate,
      });
      if (created) {
        toast.success('Caso publicado. A Comunidade foi notificada.');
        setOpen(false);
        onCreated?.();
      }
    } catch (err) {
      toast.error(err?.message || 'Não foi possível publicar o caso.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <span onClick={handleOpen} className="inline-flex">
        {trigger ?? (
          <Button size="lg" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Abrir um caso
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              {step === 'kind' ? 'Sobre o que é o caso?' : selectedKind.label}
            </DialogTitle>
            <DialogDescription>
              {step === 'kind'
                ? 'Escolha a categoria para que outros gerentes encontrem rápido.'
                : 'O caso é compartilhado sem nome, telefone, e-mail ou CPF.'}
            </DialogDescription>
          </DialogHeader>

          {step === 'kind' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {KINDS.map((k) => {
                const Icon = k.icon;
                return (
                  <button
                    key={k.id}
                    onClick={() => handlePickKind(k.id)}
                    className={cn(
                      'text-left rounded-md border border-border p-3 transition-colors',
                      'hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{k.label}</span>
                    </div>
                    <p className="text-caption text-muted-foreground leading-snug">{k.hint}</p>
                  </button>
                );
              })}
            </div>
          ) : (
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
                <Label htmlFor="case-title" className="text-xs">Título do caso</Label>
                <Input
                  id="case-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={160}
                  placeholder="Ex.: Cliente quer dobrar lance — vale a pena?"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="case-summary" className="text-xs">Descreva o caso</Label>
                <Textarea
                  id="case-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  maxLength={4000}
                  rows={8}
                  placeholder={selectedKind.placeholder}
                />
                <p className="text-caption text-muted-foreground">
                  Evite incluir nomes, telefones ou e-mails. Use faixas (ex.: "renda ~R$ 8 mil").
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
          )}

          <DialogFooter>
            {step === 'form' && (
              <Button variant="ghost" onClick={() => setStep('kind')} disabled={submitting}>
                Voltar
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            {step === 'form' && (
              <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5">
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Publicar caso
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
