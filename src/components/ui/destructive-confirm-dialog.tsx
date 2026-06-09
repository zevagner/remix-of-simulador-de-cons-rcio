/**
 * DestructiveConfirmDialog
 *
 * Modal padronizado para ações irreversíveis (limpar base, rollback, seed wipe,
 * exclusão massiva). Segue o mesmo padrão de UX do PrivacyCenter (account-purge):
 * o botão de confirmação só habilita quando o usuário digita exatamente a palavra
 * configurada (default `EXCLUIR`).
 *
 * Uso:
 *   <DestructiveConfirmDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     title="Remover todos os dados?"
 *     description="Esta ação é irreversível…"
 *     confirmWord="EXCLUIR"
 *     onConfirm={runClearAll}
 *     loading={busy}
 *   />
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export interface DestructiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmWord?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function DestructiveConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmWord = 'EXCLUIR',
  confirmLabel = 'Confirmar exclusão',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
}: DestructiveConfirmDialogProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!open) setValue('');
  }, [open]);

  const enabled = value.trim() === confirmWord && !loading;

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!loading) onOpenChange(o); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>{description}</div>
              <div className="text-foreground">
                Digite <code className="font-mono font-semibold">{confirmWord}</code> para confirmar.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="destructive-confirm-input" className="sr-only">
            Confirmação digitada
          </Label>
          <Input
            id="destructive-confirm-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Digite ${confirmWord} para confirmar`}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={loading}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={!enabled}
            onClick={(e) => {
              e.preventDefault();
              if (!enabled) return;
              void onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
