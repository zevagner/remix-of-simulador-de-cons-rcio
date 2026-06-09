import { useState } from 'react';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Phone, Calendar, Save, Trash2, Plus, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentInput } from '@/components/ui/percent-input';
import { formatCurrency } from '@/core/finance';
import {
  usePostSaleEvents, usePostSaleBids, useUpdatePostSaleClient, useDeletePostSaleClient,
  useCreatePostSaleEvent, useCreatePostSaleBid,
} from '@/hooks/usePostSaleQueries';
import {
  STATUS_LABELS, STATUS_EMOJI, PRIORITY_LABELS, EVENT_TYPE_EMOJI, EVENT_TYPE_LABELS,
} from './postSaleConstants';
import { computeClientAlerts } from './postSaleAlerts';
import type { PostSaleClient, PostSaleStatus, PostSalePriority } from '@/services/postSale';
import { toast } from 'sonner';
import { CONSORTIUM_TYPE_LABELS, type ConsortiumType } from '@/types/consortium';
import { CrossModuleLink } from '@/components/shared/CrossModuleLink';

interface Props {
  client: PostSaleClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostSaleClientDetail({ client, open, onOpenChange }: Props) {
  if (!client) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[560px] overflow-y-auto">
        <DetailContent client={client} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

function DetailContent({ client, onClose }: { client: PostSaleClient; onClose: () => void }) {
  const { data: events = [] } = usePostSaleEvents(client.id);
  const { data: bids = [] } = usePostSaleBids(client.id);
  const updateMutation = useUpdatePostSaleClient();
  const deleteMutation = useDeletePostSaleClient();
  const createEvent = useCreatePostSaleEvent();
  const createBid = useCreatePostSaleBid();

  const [status, setStatus] = useState<PostSaleStatus>(client.status);
  const [priority, setPriority] = useState<PostSalePriority>(client.priority);
  const [notes, setNotes] = useState(client.notes ?? '');
  const [contactDate, setContactDate] = useState(client.last_contact_date ?? '');
  const [contemplationDate, setContemplationDate] = useState(client.contemplation_date ?? '');
  const [patrimonyStrategy, setPatrimonyStrategy] = useState(client.patrimony_strategy ?? '');
  const [bidCapacityValue, setBidCapacityValue] = useState(client.bid_capacity_value ?? 0);
  const [bidCapacityPercent, setBidCapacityPercent] = useState(client.bid_capacity_percent ?? 0);
  const [showDelete, setShowDelete] = useState(false);

  const alerts = computeClientAlerts(client);

  const handleSave = () => {
    updateMutation.mutate({
      id: client.id,
      fields: {
        status,
        priority,
        notes: notes.trim() || null,
        last_contact_date: contactDate || null,
        contemplation_date: contemplationDate || null,
        patrimony_strategy: patrimonyStrategy.trim() || null,
        bid_capacity_value: bidCapacityValue > 0 ? bidCapacityValue : null,
        bid_capacity_percent: bidCapacityPercent > 0 ? bidCapacityPercent : null,
      },
    }, {
      onSuccess: () => toast.success('Cliente atualizado'),
      onError: () => toast.error('Erro ao salvar'),
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(client.id, {
      onSuccess: () => { toast.success('Cliente removido'); onClose(); },
      onError: () => toast.error('Erro ao remover'),
    });
  };

  const handleQuickContact = () => {
    const today = new Date().toISOString().slice(0, 10);
    createEvent.mutate({
      client_id: client.id,
      user_id: client.user_id,
      event_type: 'contact',
      description: 'Contato realizado',
      event_date: today,
    });
    updateMutation.mutate({ id: client.id, fields: { last_contact_date: today } });
    setContactDate(today);
    toast.success('Contato registrado ✓');
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span className="text-xl">{STATUS_EMOJI[client.status]}</span>
          {client.client_name}
        </SheetTitle>
        <SheetDescription className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">
            {CONSORTIUM_TYPE_LABELS[client.consortium_type as ConsortiumType] ?? client.consortium_type}
          </Badge>
          {client.plan_modality && client.plan_modality !== 'tradicional' && (
            <Badge variant="secondary">
              {client.plan_modality === 'agroflex' ? 'AgroFlex' : 'EmpresarialFlex'} • Pagamento semestral
            </Badge>
          )}
          <span>{formatCurrency(client.credit_value)}</span>
          <span>•</span>
          <span>{client.term_months}m</span>
          {client.group_number && <span>• Grupo {client.group_number}</span>}
        </SheetDescription>
        {/* UX Wave 3 — continuidade operacional: link para a Carteira (proposta de origem). */}
        <div className="pt-1">
          <CrossModuleLink
            to="proposals"
            label="Ver na Carteira"
            variant="chip"
            data-source="post-sale-detail"
          />
        </div>
      </SheetHeader>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {alerts.map((a, i) => {
            const Icon = a.level === 'critical' ? AlertTriangle : a.level === 'warning' ? AlertCircle : Sparkles;
            const cls = a.level === 'critical'
              ? 'border-destructive/30 bg-destructive/5 text-destructive'
              : a.level === 'warning'
              ? 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300'
              : 'border-primary/30 bg-primary/5 text-primary';
            return (
              <div key={i} className={`flex items-start gap-2 text-xs p-2.5 rounded-md border ${cls}`}>
                <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{a.label}</p>
                  <p className="text-foreground/80">{a.reason}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-2 mt-4 flex-wrap">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={handleQuickContact}>
          <Phone className="h-3.5 w-3.5" />
          Registrar contato
        </Button>
        {client.client_phone && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-whatsapp-green/40 text-whatsapp-green hover:bg-whatsapp-green/10"
            onClick={() => {
              const digits = client.client_phone!.replace(/\D/g, '');
              const number = digits.startsWith('55') ? digits : `55${digits}`;
              window.open(`https://wa.me/${number}`, '_blank');
            }}
          >
            WhatsApp
          </Button>
        )}
      </div>

      <Tabs defaultValue="dados" className="mt-5">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dados" className="text-xs">Dados</TabsTrigger>
          <TabsTrigger value="lances" className="text-xs">Lances ({bids.length})</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">Timeline ({events.length})</TabsTrigger>
        </TabsList>

        {/* Dados */}
        <TabsContent value="dados" className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PostSaleStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as PostSaleStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_EMOJI[s]} {STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as PostSalePriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as PostSalePriority[]).map(p => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs flex items-center gap-1.5"><Calendar className="h-3 w-3" />Último contato</Label>
              <Input type="date" value={contactDate} onChange={(e) => setContactDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs flex items-center gap-1.5"><Calendar className="h-3 w-3" />Contemplação</Label>
              <Input type="date" value={contemplationDate} onChange={(e) => setContemplationDate(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium">Capacidade de Lance</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label className="text-caption text-muted-foreground">Valor (R$)</Label>
                <CurrencyInput
                  value={bidCapacityValue}
                  onChange={setBidCapacityValue}
                  className="text-right"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-caption text-muted-foreground">% da carta</Label>
                <PercentInput
                  value={bidCapacityPercent}
                  onChange={setBidCapacityPercent}
                  className="text-center"
                />
              </div>
            </div>
            <p className="text-caption text-muted-foreground">Recursos disponíveis para lance na próxima assembleia</p>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs font-medium">Estratégia Patrimonial</Label>
            <Textarea
              value={patrimonyStrategy}
              onChange={(e) => setPatrimonyStrategy(e.target.value)}
              placeholder="Ex: Vender a carta com ágio após contemplação, usar para imóvel de renda..."
              className="min-h-[80px] resize-none text-xs"
            />
            <p className="text-caption text-muted-foreground">Estratégia combinada com o cliente para uso da carta</p>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre o cliente..."
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {showDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">Confirma?</span>
                <Button size="sm" variant="destructive" onClick={handleDelete} className="h-8 text-xs gap-1">
                  <Trash2 className="h-3 w-3" /> Sim
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowDelete(false)} className="h-8 text-xs">Não</Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setShowDelete(true)} className="h-8 text-xs text-destructive/70 hover:text-destructive gap-1">
                <Trash2 className="h-3 w-3" /> Remover
              </Button>
            )}
            <Button size="sm" onClick={handleSave} className="gap-1.5">
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </TabsContent>

        {/* Lances */}
        <TabsContent value="lances" className="mt-4">
          <BidRegisterForm clientId={client.id} userId={client.user_id} creditValue={client.credit_value} onCreate={(input) => createBid.mutate(input)} />
          <div className="mt-4 space-y-2">
            {bids.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum lance registrado.</p>
            ) : bids.map((b) => (
              <div key={b.id} className={`p-3 rounded-md border ${b.was_winner ? 'border-success/40 bg-success/5' : 'border-border bg-muted/30'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {b.bid_percent.toFixed(2).replace('.', ',')}% • {formatCurrency(b.bid_value)}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {new Date(b.bid_date).toLocaleDateString('pt-BR')} • {b.bid_type}
                      {b.was_winner && ' • 🏆 Vencedor'}
                    </p>
                  </div>
                </div>
                {b.notes && <p className="text-xs text-foreground/80 mt-1">{b.notes}</p>}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="mt-4">
          <NoteForm clientId={client.id} userId={client.user_id} onCreate={(input) => createEvent.mutate(input)} />
          <div className="mt-4 space-y-2">
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sem eventos.</p>
            ) : events.map((e) => (
              <div key={e.id} className="flex gap-2.5 p-2.5 rounded-md border border-border bg-card">
                <span className="text-base shrink-0">{EVENT_TYPE_EMOJI[e.event_type] ?? '•'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {EVENT_TYPE_LABELS[e.event_type] ?? e.event_type}
                  </p>
                  {e.description && <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>}
                  <p className="text-caption text-muted-foreground mt-1">
                    {new Date(e.event_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function BidRegisterForm({
  clientId, userId, creditValue, onCreate,
}: {
  clientId: string; userId: string; creditValue: number;
  onCreate: (input: any) => void;
}) {
  const [percent, setPercent] = useState(0);
  const [bidDate, setBidDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<'livre' | 'fixo' | 'embutido'>('livre');
  const [winner, setWinner] = useState(false);
  const [notes, setNotes] = useState('');

  const value = (creditValue * percent) / 100;

  const handleSubmit = () => {
    if (percent <= 0) {
      toast.error('Informe o percentual do lance');
      return;
    }
    onCreate({
      client_id: clientId,
      user_id: userId,
      bid_date: bidDate,
      bid_value: value,
      bid_percent: percent,
      bid_type: type,
      was_winner: winner,
      notes: notes.trim() || null,
    });
    toast.success('Lance registrado ✓');
    setPercent(0); setNotes(''); setWinner(false);
  };

  return (
    <div className="p-3 rounded-md border border-primary/20 bg-primary/5 space-y-2">
      <Label className="text-xs font-semibold text-primary flex items-center gap-1.5">
        <Plus className="h-3.5 w-3.5" /> Registrar lance
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-caption">Percentual</Label>
          <PercentInput value={percent} onChange={setPercent} />
        </div>
        <div>
          <Label className="text-caption">Data</Label>
          <Input type="date" value={bidDate} onChange={(e) => setBidDate(e.target.value)} className="h-9 text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-caption">Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="livre">Livre</SelectItem>
              <SelectItem value="fixo">Fixo</SelectItem>
              <SelectItem value="embutido">Embutido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox" checked={winner} onChange={(e) => setWinner(e.target.checked)} />
            Foi contemplado
          </label>
        </div>
      </div>
      {percent > 0 && (
        <p className="text-caption text-muted-foreground">≈ {formatCurrency(value)}</p>
      )}
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Observação (opcional)"
        className="min-h-[50px] resize-none text-xs"
      />
      <Button size="sm" className="w-full h-8 text-xs" onClick={handleSubmit}>
        Registrar
      </Button>
    </div>
  );
}

function NoteForm({
  clientId, userId, onCreate,
}: {
  clientId: string; userId: string;
  onCreate: (input: any) => void;
}) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onCreate({
      client_id: clientId,
      user_id: userId,
      event_type: 'note',
      description: text.trim(),
      event_date: new Date().toISOString().slice(0, 10),
    });
    setText('');
    toast.success('Anotação registrada ✓');
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Adicionar anotação à timeline..."
        className="min-h-[60px] resize-none text-xs"
      />
      <Button size="sm" className="w-full h-8 text-xs gap-1.5" onClick={handleSubmit} disabled={!text.trim()}>
        <Plus className="h-3.5 w-3.5" /> Adicionar à timeline
      </Button>
    </div>
  );
}
