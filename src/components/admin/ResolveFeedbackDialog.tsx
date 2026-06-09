import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';

export interface ResolvePayload {
  admin_response: string | null;
  is_public: boolean;
  public_summary: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedbackPreview: string;
  initial?: { admin_response?: string | null; is_public?: boolean; public_summary?: string | null };
  onConfirm: (payload: ResolvePayload) => void;
  isPending?: boolean;
}

export function ResolveFeedbackDialog({ open, onOpenChange, feedbackPreview, initial, onConfirm, isPending }: Props) {
  const [adminResponse, setAdminResponse] = useState(initial?.admin_response ?? '');
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? false);
  const [publicSummary, setPublicSummary] = useState(initial?.public_summary ?? '');

  const handleConfirm = () => {
    onConfirm({
      admin_response: adminResponse.trim() || null,
      is_public: isPublic && publicSummary.trim().length > 0,
      public_summary: publicSummary.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Marcar como resolvido
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{feedbackPreview}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="admin-response">Resposta para o usuário (opcional)</Label>
            <Textarea
              id="admin-response"
              placeholder="Ex: Corrigimos o cálculo da parcela reduzida. Obrigado pelo report!"
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Aparece para o usuário na próxima sessão.</p>
          </div>

          <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="is-public" className="cursor-pointer">
                Tornar público em "Melhorias recentes"
              </Label>
              <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            {isPublic && (
              <div className="space-y-2">
                <Label htmlFor="public-summary" className="text-xs">Resumo público (até 120 caracteres)</Label>
                <Textarea
                  id="public-summary"
                  placeholder="Ex: Cálculo da parcela reduzida corrigido"
                  value={publicSummary}
                  onChange={(e) => setPublicSummary(e.target.value.slice(0, 120))}
                  maxLength={120}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground text-right">{publicSummary.length}/120</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isPending ? 'Salvando...' : 'Marcar resolvido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
