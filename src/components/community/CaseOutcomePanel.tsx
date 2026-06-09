/**
 * CaseOutcomePanel — "O que aconteceu depois?" + bloco "Resultado do caso".
 *
 * Para o autor: form discreto convidando a registrar o desfecho.
 * Para todos: bloco visual destacado quando outcome existe (memória coletiva).
 */
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  RadioGroup, RadioGroupItem,
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Clock, MinusCircle, Trophy, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  setCaseOutcome, OUTCOME_KIND_LABEL, type OutcomeKind, type CommunityCase,
} from '@/services/community';
import { cn } from '@/lib/utils';

interface Props {
  caseRow: CommunityCase & {
    outcome?: string | null;
    outcome_kind?: string | null;
    outcome_at?: string | null;
  };
  isAuthor: boolean;
  onUpdated: () => void;
}

const KIND_VISUAL: Record<OutcomeKind, { icon: typeof CheckCircle2; tone: string; bg: string }> = {
  aplicou_funcionou: { icon: CheckCircle2, tone: 'text-success', bg: 'border-success/40 bg-success/5' },
  aplicou_nao_funcionou: { icon: XCircle, tone: 'text-destructive', bg: 'border-destructive/30 bg-destructive/5' },
  nao_aplicou: { icon: MinusCircle, tone: 'text-muted-foreground', bg: 'border-border bg-muted/30' },
  em_andamento: { icon: Clock, tone: 'text-primary', bg: 'border-primary/30 bg-primary/5' },
};

export function CaseOutcomePanel({ caseRow, isAuthor, onUpdated }: Props) {
  const hasOutcome = !!caseRow.outcome;
  const kind = (caseRow.outcome_kind as OutcomeKind | null) ?? null;

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(caseRow.outcome ?? '');
  const [pickedKind, setPickedKind] = useState<OutcomeKind>(kind ?? 'aplicou_funcionou');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) {
      toast.error('Conta rapidinho o que aconteceu.');
      return;
    }
    setSaving(true);
    try {
      await setCaseOutcome(caseRow.id, text.trim(), pickedKind);
      toast.success('Desfecho registrado. Obrigado por compartilhar.');
      setEditing(false);
      onUpdated();
    } catch (err) {
      toast.error(err?.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Bloco "Resultado do caso" (visível quando outcome existe) ───
  if (hasOutcome && !editing) {
    const v = KIND_VISUAL[kind ?? 'em_andamento'];
    const Icon = v.icon;
    return (
      <Card className={cn('p-4 border-2', v.bg)}>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className={cn('h-4 w-4', v.tone)} />
          <h3 className="text-sm font-semibold">Resultado do caso</h3>
          {kind && (
            <Badge variant="outline" className={cn('text-caption gap-1', v.tone)}>
              <Icon className="h-2.5 w-2.5" />
              {OUTCOME_KIND_LABEL[kind]}
            </Badge>
          )}
          {isAuthor && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 px-2 text-xs gap-1"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3 w-3" /> Editar
            </Button>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
          {caseRow.outcome}
        </p>
        {caseRow.outcome_at && (
          <p className="text-caption text-muted-foreground mt-2">
            Registrado em {new Date(caseRow.outcome_at).toLocaleDateString('pt-BR')}
          </p>
        )}
      </Card>
    );
  }

  // ─── Convite ao autor (sem outcome, não editando) ───
  if (isAuthor && !hasOutcome && !editing) {
    return (
      <Card className="p-3 border-dashed border-primary/30 bg-primary/5">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">O que aconteceu depois?</span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Conta pra Comunidade se a estratégia funcionou. Vira repertório pra outros gerentes.
        </p>
        <Button size="sm" onClick={() => setEditing(true)}>
          Registrar desfecho
        </Button>
      </Card>
    );
  }

  // ─── Form de edição ───
  if (editing && isAuthor) {
    return (
      <Card className="p-4 space-y-3 border-primary/40">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">O que aconteceu depois?</h3>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Como foi?</Label>
          <RadioGroup
            value={pickedKind}
            onValueChange={(v) => setPickedKind(v as OutcomeKind)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-1.5"
          >
            {(Object.keys(OUTCOME_KIND_LABEL) as OutcomeKind[]).map((k) => {
              const Icon = KIND_VISUAL[k].icon;
              return (
                <Label
                  key={k}
                  htmlFor={`outcome-${k}`}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-2.5 py-2 cursor-pointer text-xs',
                    'hover:border-primary/40 transition-colors',
                    pickedKind === k && 'border-primary bg-primary/5',
                  )}
                >
                  <RadioGroupItem id={`outcome-${k}`} value={k} className="sr-only" />
                  <Icon className={cn('h-3.5 w-3.5', KIND_VISUAL[k].tone)} />
                  {OUTCOME_KIND_LABEL[k]}
                </Label>
              );
            })}
          </RadioGroup>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="outcome-text" className="text-xs">
            Conta o que aconteceu
          </Label>
          <Textarea
            id="outcome-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="Apliquei a estratégia X. O cliente reagiu Y. O resultado foi Z. (anônimo)"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Salvar desfecho
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}
