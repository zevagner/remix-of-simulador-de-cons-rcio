import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Database, CheckCircle, Calendar } from 'lucide-react';
import { APP_VERSION, NEW_FEATURES, DATA_STATUS } from '@/config/versionConfig';

const STORAGE_KEY = 'app-last-seen-version';

export function VersionModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    if (lastSeen !== APP_VERSION) {
      const timer = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, APP_VERSION);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="bg-primary px-6 py-5 text-primary-foreground">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-warning" />
              <DialogTitle className="text-lg text-primary-foreground">
                Novidades da Versão {APP_VERSION}
              </DialogTitle>
            </div>
            <p className="text-sm text-primary-foreground/80">Confira o que há de novo no simulador</p>
          </DialogHeader>
        </div>

        {/* Features list */}
        <div className="px-6 py-5 space-y-5">
          <ul className="space-y-3">
            {NEW_FEATURES.map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
                  <CheckCircle className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-foreground leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Data status */}
          <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Database className="h-4 w-4 text-primary" />
              Status da Base de Dados
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Assembleias atualizadas em: {DATA_STATUS.assembliesLastUpdate}
            </div>
            <Badge variant={DATA_STATUS.assembliesProcessed ? 'default' : 'destructive'} className="text-xs">
              {DATA_STATUS.assembliesProcessed ? '✅ Dados processados' : '⏳ Processamento pendente'}
            </Badge>
            {DATA_STATUS.assembliesNote && (
              <p className="text-xs text-muted-foreground">{DATA_STATUS.assembliesNote}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-5">
          <Button onClick={handleDismiss} className="w-full">
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
