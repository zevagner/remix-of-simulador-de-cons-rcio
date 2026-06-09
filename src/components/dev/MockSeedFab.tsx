/**
 * MockSeedFab — botão flutuante DEV/Admin para gerar e limpar massa mock
 * de Carteira (proposals) e Pós-venda (post_sale_clients/events).
 *
 * Visível apenas para:
 * - admins (useAuth().isAdmin === true), OU
 * - ambiente de desenvolvimento (import.meta.env.DEV)
 *
 * Todos os registros são marcados com `[MOCK]` em `notes` (e metadata.mock)
 * para limpeza segura sem tocar em dados reais.
 */
import { useState } from 'react';
import { Database, Loader2, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { generateMockData, clearMockData, type SeedSummary } from '@/utils/dev/mockSeed';
import { DestructiveConfirmDialog } from '@/components/ui/destructive-confirm-dialog';

export function MockSeedFab() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(110);
  const [busy, setBusy] = useState<'seed' | 'clear' | null>(null);
  const [lastSummary, setLastSummary] = useState<SeedSummary | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const visible = isAdmin || import.meta.env.DEV;
  if (!visible) return null;

  async function handleSeed() {
    setBusy('seed');
    try {
      const s = await generateMockData(count);
      setLastSummary(s);
      qc.invalidateQueries();
      toast.success(`Massa mock gerada: ${s.proposals} propostas, ${s.postSaleClients} pós-venda, ${s.postSaleEvents} eventos.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar massa mock';
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  async function handleClear() {
    setBusy('clear');
    try {
      const r = await clearMockData();
      setLastSummary(null);
      qc.invalidateQueries();
      toast.success(`Removidos: ${r.proposals} propostas, ${r.postSaleClients} pós-venda, ${r.postSaleEvents} eventos.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao limpar massa mock';
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          // Stack vertical com FeedbackButton (right-6, bottom calc(72px + safe-area), h-10):
          // Mock fica logo acima — mesmo eixo direito + gap de 12px.
          // Mobile: FeedbackButton vai para left-3, então Mock fica em right-4 sem conflito.
          className="fixed right-4 md:right-6 z-40 h-11 w-11 rounded-full border-dashed border-primary/40 bg-background/90 shadow-md backdrop-blur"
          style={{ bottom: 'calc(124px + env(safe-area-inset-bottom, 0px))' }}
          title="DEV: massa mock"
          aria-label="DEV: gerar massa mock"
        >
          <Database className="h-4 w-4 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Massa Mock — Carteira & Pós-venda
          </DialogTitle>
          <DialogDescription>
            Gera carteira realista para testar UX, filtros, paginação e performance.
            Todos os registros são marcados com <code>[MOCK]</code> e podem ser
            removidos com segurança. Visível apenas em DEV ou para admins.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="mock-count">Quantidade de propostas</Label>
            <Input
              id="mock-count"
              type="number"
              min={20}
              max={300}
              value={count}
              onChange={e => setCount(Math.max(20, Math.min(300, Number(e.target.value) || 110)))}
            />
            <p className="text-xs text-muted-foreground">
              ~35% das fechadas + 15 órfãs viram clientes pós-venda, com 1–3 eventos cada.
            </p>
          </div>

          {lastSummary && (
            <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-2">
              <div><strong>Última geração:</strong> {lastSummary.proposals} propostas · {lastSummary.postSaleClients} pós-venda · {lastSummary.postSaleEvents} eventos</div>
              <div>
                <strong>Por status:</strong>{' '}
                {Object.entries(lastSummary.byStatus).map(([k, v]) => `${k}: ${v}`).join(' · ')}
              </div>
              <div>
                <strong>Por consórcio:</strong>{' '}
                {Object.entries(lastSummary.byConsortium).map(([k, v]) => `${k}: ${v}`).join(' · ')}
              </div>
              <div>
                <strong>Por segmento:</strong>{' '}
                {Object.entries(lastSummary.bySegment).map(([k, v]) => `${k}: ${v}`).join(' · ')}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setConfirmClear(true)} disabled={busy !== null}>
            {busy === 'clear' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            <span className="ml-2">Limpar Dados Mock</span>
          </Button>
          <Button onClick={handleSeed} disabled={busy !== null}>
            {busy === 'seed' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="ml-2">Gerar Carteira Mock</span>
          </Button>
        </DialogFooter>
      </DialogContent>

      <DestructiveConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Remover todos os dados marcados como [MOCK]?"
        description="Todas as propostas, clientes pós-venda e eventos do seu usuário marcados como [MOCK] serão removidos. Dados reais não são afetados."
        confirmLabel="Remover mock"
        loading={busy === 'clear'}
        onConfirm={async () => {
          setConfirmClear(false);
          await handleClear();
        }}
      />
    </Dialog>
  );
}
