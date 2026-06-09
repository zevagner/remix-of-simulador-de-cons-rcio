import { useState, useEffect } from 'react';
import { useSimulatorContext } from '@/components/modules/simulator/SimulatorContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Flame, Save, UserPlus, CalendarClock } from 'lucide-react';
import { formatCurrency } from '@/core/finance';
import { CurrencyInput } from '@/components/ui/currency-input';
import { cn } from '@/lib/utils';
import type { NewLeadData } from './pipelineConstants';
import { PROSPECT_TRIGGERS } from './pipelineConstants';

interface NewLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: NewLeadData) => void;
}

export function NewLeadModal({ open, onOpenChange, onCreate }: NewLeadModalProps) {
  let simCtx: import('@/components/modules/simulator/SimulatorContext').SimulatorContextType | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    simCtx = useSimulatorContext();
  } catch { /* not inside provider */ }

  const hasSimData = !!(simCtx && simCtx.isValidSimulation);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [consortiumType, setConsortiumType] = useState('imobiliario');
  const [creditValue, setCreditValue] = useState(0);
  const [termMonths, setTermMonths] = useState(0);
  const [bidPercent, setBidPercent] = useState(0);
  const [nextContactDate, setNextContactDate] = useState('');
  const [notes, setNotes] = useState('');
  // Trigger é OBRIGATÓRIO — sem default. Reseta no abrir; bloqueia o botão Criar.
  const [prospectTrigger, setProspectTrigger] = useState<string>('');

  useEffect(() => {
    if (open && hasSimData && simCtx) {
      setConsortiumType(simCtx.input.consortiumType);
      setCreditValue(simCtx.input.creditValue);
      setTermMonths(simCtx.input.termMonths);
      setBidPercent(simCtx.freeBidPercent || simCtx.embeddedBidPercent || 0);
    }
    if (open && !hasSimData) {
      setConsortiumType('imobiliario');
      setCreditValue(0);
      setTermMonths(0);
      setBidPercent(0);
    }
    if (open) {
      setClientName('');
      setClientPhone('');
      setNextContactDate('');
      setNotes('');
      setProspectTrigger('');
    }
  }, [open, hasSimData]);

  const installment = hasSimData && simCtx ? simCtx.result.installmentBeforeContemplation : 0;
  const totalCost = hasSimData && simCtx ? simCtx.result.totalCost : 0;

  const handleCreate = () => {
    if (!clientName.trim()) return;
    if (!prospectTrigger) return; // trigger obrigatório
    onCreate({
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      consortium_type: consortiumType,
      credit_value: creditValue,
      term_months: termMonths,
      bid_percent: bidPercent,
      installment,
      total_cost: totalCost,
      next_contact_date: nextContactDate,
      notes: notes.trim(),
      prospect_trigger: prospectTrigger,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Novo Lead
          </DialogTitle>
          <DialogDescription>
            Adicione um novo cliente ao pipeline de prospecção.
          </DialogDescription>
        </DialogHeader>

        {hasSimData && (
          <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
            <Flame className="h-3.5 w-3.5 shrink-0" />
            Dados preenchidos com a última simulação
          </div>
        )}

        <div className="grid gap-6 py-1">
          {/* Client name */}
          <div className="grid gap-1.5">
            <Label htmlFor="new-name">Nome do cliente</Label>
            <Input
              id="new-name"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Nome do cliente"
              autoFocus
            />
          </div>

          {/* Phone */}
          <div className="grid gap-1.5">
            <Label htmlFor="new-phone">Telefone do cliente</Label>
            <Input
              id="new-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          {/* Prospect trigger — OBRIGATÓRIO */}
          <div className="grid gap-1.5">
            <Label>
              Por que o cliente compraria? <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {PROSPECT_TRIGGERS.filter(t => t.value !== 'nao_identificado').map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setProspectTrigger(t.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-caption font-medium transition-[colors,box-shadow,transform] border',
                    prospectTrigger === t.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {!prospectTrigger && (
              <p className="text-caption text-muted-foreground">
                Selecione um motivo — propostas com motivo definido convertem 3-5x mais.
              </p>
            )}
          </div>

          {/* Consortium type + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Tipo de consórcio</Label>
              <Select value={consortiumType} onValueChange={setConsortiumType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imobiliario">Imobiliário</SelectItem>
                  <SelectItem value="auto">Veículos</SelectItem>
                  <SelectItem value="pesados">Pesados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Valor da carta</Label>
              <CurrencyInput value={creditValue} onChange={setCreditValue} />
            </div>
          </div>

          {/* Term + Bid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Prazo (meses)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={termMonths || ''}
                onChange={e => setTermMonths(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Lance (%)</Label>
              <Input
                type="text"
                inputMode="decimal"
                step="0.01"
                value={bidPercent || ''}
                onChange={e => setBidPercent(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 30"
              />
            </div>
          </div>

          {/* Read-only computed values */}
          {hasSimData && (
            <div className="flex gap-3 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              <span>Parcela: <strong className="text-foreground">{formatCurrency(installment)}</strong></span>
              <span>Total: <strong className="text-foreground">{formatCurrency(totalCost)}</strong></span>
            </div>
          )}

          {/* Next contact date */}
          <div className="grid gap-1.5">
            <Label htmlFor="new-next-contact">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                Data de próximo contato
              </span>
            </Label>
            <Input
              id="new-next-contact"
              type="date"
              value={nextContactDate}
              onChange={e => setNextContactDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label htmlFor="new-notes">Observações</Label>
            <Textarea
              id="new-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Interesse do cliente / Objeções levantadas / Próximo passo combinado"
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={!clientName.trim() || !prospectTrigger} className="gap-1">
            <Save className="h-4 w-4" /> Criar lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}