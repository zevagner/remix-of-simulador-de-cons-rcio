import { Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentInput } from '@/components/ui/percent-input';
import { PillToggle } from '@/components/ui/pill-toggle';
import { Switch } from '@/components/ui/switch';
import { ScrollAffordance } from '@/components/shared/ScrollAffordance';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency } from '@/core/finance';
import { typeLabels, typeIcons, getMaxEmbeddedBid } from './structuredOpsConstants';
import type { CreditCard, CardResult } from './structuredOpsTypes';
import type { ConsortiumType } from '@/types/consortium';

interface Props {
  cards: CreditCard[];
  results: CardResult[];
  onUpdate: <K extends keyof CreditCard>(id: string, key: K, value: CreditCard[K]) => void;
  onUpdateAll: <K extends keyof CreditCard>(key: K, value: CreditCard[K]) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

export function StructuredOpsTable({ cards, results, onUpdate, onUpdateAll, onRemove, onAdd }: Props) {
  const isMobile = useIsMobile();
  // Cálculo dos Totais
  const totalCredit = results.reduce((acc, r) => acc + r.totalCreditValue, 0);
  const totalQty = results.reduce((acc, r) => acc + r.quantity, 0);
  const totalInitialInstallment = results.reduce((acc, r) => acc + r.totalInitialInstallment, 0);
  const totalPostInstallment = results.reduce((acc, r) => acc + r.totalInstallmentAfterContemplation, 0);
  const totalFreeBidValue = results.reduce((acc, r) => acc + r.freeBidValue, 0);
  const totalEmbeddedBidValue = results.reduce((acc, r) => acc + r.embeddedBidValue, 0);
  const totalBidValue = results.reduce((acc, r) => acc + r.totalBid, 0);
  const totalAvailableCredit = results.reduce((acc, r) => acc + r.availableCredit, 0);

  // Médias ponderadas (pelo Valor Total da Carta de cada linha)
  const weightedAdminFee = totalCredit > 0 
    ? results.reduce((acc, r, i) => acc + (cards[i].adminFeePercent * r.totalCreditValue), 0) / totalCredit
    : 0;
  
  const weightedReserveFund = totalCredit > 0
    ? results.reduce((acc, r, i) => acc + (cards[i].reserveFundPercent * r.totalCreditValue), 0) / totalCredit
    : 0;

  const weightedTerm = totalCredit > 0
    ? results.reduce((acc, r, i) => acc + (cards[i].termMonths * r.totalCreditValue), 0) / totalCredit
    : 0;

  const totalBidPercent = totalCredit > 0 ? (totalBidValue / totalCredit) * 100 : 0;

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">Grupos da Operação</h2>
        </div>

        {cards.map((card, index) => {
          const result = results[index];
          if (!result) return null;

          return (
            <Card key={card.id} className="border-l-4 border-l-primary overflow-hidden shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-0 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wide">
                  Grupo {index + 1} — {typeLabels[card.consortiumType]}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 -mr-2"
                  onClick={() => onRemove(card.id)}
                  disabled={cards.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground/80 font-bold tracking-wider">Tipo</Label>
                    <div className="flex items-center h-8 rounded-md border border-input bg-background overflow-hidden">
                      {(['imobiliario', 'auto', 'pesados'] as const).map((opt) => {
                        const active = card.consortiumType === opt;
                        const OptIcon = typeIcons[opt];
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => onUpdate(card.id, 'consortiumType', opt as ConsortiumType)}
                            className={`flex-1 h-full flex items-center justify-center transition-colors border-r last:border-r-0 border-input ${
                              active ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:bg-muted'
                            }`}
                            title={typeLabels[opt]}
                          >
                            <OptIcon className="h-3.5 w-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground/80 font-bold tracking-wider">Pessoa</Label>
                    <Select
                      value={card.personType ?? 'PF'}
                      onValueChange={(v) => onUpdate(card.id, 'personType', v as 'PF' | 'PJ')}
                    >
                      <SelectTrigger className="h-8 w-full text-[11px] focus:ring-0 focus:ring-offset-0 px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF" className="text-xs">PF</SelectItem>
                        <SelectItem value="PJ" className="text-xs">PJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground/80 font-bold tracking-wider">Qtde</Label>
                    <Input
                      type="number"
                      value={card.quantity}
                      onChange={(e) => onUpdate(card.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-8 w-full text-[11px] px-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground/80 font-bold tracking-wider">Vl. Carta</Label>
                    <CurrencyInput
                      fullWidth
                      value={card.creditValue}
                      onChange={(v) => onUpdate(card.id, 'creditValue', v)}
                      className="h-8 w-full text-[11px] px-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground/80 font-bold tracking-wider">Prazo</Label>
                    <Input
                      type="number"
                      value={card.termMonths}
                      onChange={(e) => onUpdate(card.id, 'termMonths', parseInt(e.target.value) || 0)}
                      className="h-8 w-full text-[11px] px-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground/80 font-bold tracking-wider">Tx. Adm %</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={card.adminFeePercent}
                        step="0.01"
                        onChange={(e) => onUpdate(card.id, 'adminFeePercent', parseFloat(e.target.value) || 0)}
                        className="h-8 text-[11px] w-full pr-5 px-2"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground opacity-50">%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground/80 font-bold tracking-wider">F. Res %</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={card.reserveFundPercent}
                        step="0.01"
                        onChange={(e) => onUpdate(card.id, 'reserveFundPercent', parseFloat(e.target.value) || 0)}
                        className="h-8 text-[11px] w-full pr-5 px-2"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground opacity-50">%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground/80 font-bold tracking-wider">Seguro</Label>
                    <div className="flex items-center h-8">
                      <Switch
                        checked={card.insuranceEnabled}
                        disabled={(card.personType ?? 'PF') === 'PJ'}
                        onCheckedChange={(v) => onUpdate(card.id, 'insuranceEnabled', v)}
                        className="scale-90 origin-left"
                      />
                      <span className="ml-2 text-[10px] text-muted-foreground font-medium">
                        {card.insuranceEnabled ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground/80 font-bold tracking-wider">L. Emb %</Label>
                    <PercentInput
                      fullWidth
                      value={card.embeddedBidPercent}
                      onChange={(v) => onUpdate(card.id, 'embeddedBidPercent', Math.min(getMaxEmbeddedBid(card.consortiumType), v))}
                      className="h-8 text-[11px] w-full px-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground/80 font-bold tracking-wider">
                      Lance Próp. (%)
                    </Label>
                    <PercentInput
                      fullWidth
                      value={card.freeBidPercent}
                      onChange={(v) => onUpdate(card.id, 'freeBidPercent', v)}
                      className="h-8 text-[11px] w-full px-2"
                    />
                  </div>
                </div>

                <div className="bg-primary/[0.03] dark:bg-primary/[0.06] -mx-4 -mb-4 p-4 mt-2 space-y-2 border-t border-primary/10">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground uppercase font-semibold">Carta Total</span>
                    <span className="font-bold tabular-nums">{formatCurrency(result.totalCreditValue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground uppercase font-semibold">Parc. Inicial</span>
                    <span className="font-medium tabular-nums text-muted-foreground">{formatCurrency(result.totalInitialInstallment)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground uppercase font-semibold">Lance Total</span>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(result.totalBid)} 
                      <span className="ml-1 text-[9px] text-muted-foreground font-normal">({((result.totalBid / result.totalCreditValue) * 100).toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground uppercase font-semibold">Crédito Disponível</span>
                    <span className="font-bold text-primary tabular-nums">{formatCurrency(result.availableCredit)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-primary/10">
                    <span className="text-[11px] text-foreground uppercase font-black tracking-tight">Parc. Pós Contemplação</span>
                    <span className="text-[13px] font-black text-green-600 dark:text-green-500 tabular-nums">{formatCurrency(result.totalInstallmentAfterContemplation)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button 
          variant="outline" 
          onClick={onAdd} 
          disabled={cards.length >= 10}
          className="w-full h-12 gap-2 text-primary border-primary/30 hover:bg-primary/5 shadow-sm font-bold uppercase tracking-widest text-[11px]"
        >
          <Plus className="h-5 w-5" />
          Adicionar Grupo ({cards.length}/10)
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div id="structured-ops-main-table" className="w-full overflow-hidden rounded-lg border shadow-sm">
        <div className="w-full overflow-x-auto">
          <table
            className="w-full caption-bottom text-sm border-collapse"
            style={{ tableLayout: 'fixed', width: '100%', minWidth: '100%' }}
          >
            <colgroup>
              <col style={{ width: '1.5%' }} />   {/* 1. # */}
              <col style={{ width: '6%' }} />     {/* 2. Tipo */}
              <col style={{ width: '3%' }} />     {/* 3. Pessoa */}
              <col style={{ width: '2.5%' }} />   {/* 4. Qtde */}
              <col style={{ width: '7.5%' }} />   {/* 5. Carta R$ */}
              <col style={{ width: '4%' }} />     {/* 6. Prazo */}
              <col style={{ width: '3.5%' }} />   {/* 7. Tx.Adm */}
              <col style={{ width: '3.5%' }} />   {/* 8. Fundo Res. */}
              <col style={{ width: '3%' }} />     {/* 9. Seguro */}
              <col style={{ width: '5.5%' }} />   {/* 10. L.Emb% */}
              <col style={{ width: '5.5%' }} />   {/* 11. Lance Própr. */}
              <col style={{ width: '9%' }} />     {/* 12. Carta Tot. */}
              <col style={{ width: '5%' }} />     {/* 13. Parc. Ini. */}
              <col style={{ width: '5%' }} />     {/* 14. Parc. Tot. */}
              <col style={{ width: '6.5%' }} />   {/* 15. Lance Próp. resultado */}
              <col style={{ width: '6.5%' }} />   {/* 16. Lance Emb. resultado */}
              <col style={{ width: '3%' }} />     {/* 17. L.% */}
              <col style={{ width: '8.5%' }} />   {/* 18. Créd.Disp. */}
              <col style={{ width: '6.5%' }} />   {/* 19. Parc.Pós */}
              <col style={{ width: '4.5%' }} />   {/* 20. Ações */}
            </colgroup>
            <thead>
              <tr className="border-b-2">
                <th colSpan={11} className="bg-muted/30 text-center font-bold text-xs uppercase tracking-wider py-2 border-r px-2">
                  Dados de Entrada
                </th>
                <th colSpan={9} className="bg-primary/5 text-center font-bold text-xs uppercase tracking-wider py-2 px-2">
                  Resultados
                </th>
              </tr>
              <tr className="text-[9px] uppercase font-semibold border-b">
                <th className="text-center py-1 px-0">#</th>
                <th className="text-center py-1 px-0" title="Tipo de Consórcio">Tipo</th>
                <th className="text-center py-1 px-0" title="Pessoa Física ou Jurídica">Pess.</th>
                <th className="text-center py-1 px-0" title="Quantidade de Cotas">Qtd</th>
                <th className="text-center py-1 px-1" title="Valor da Carta">
                  <div>Carta</div>
                  <div className="text-muted-foreground">R$</div>
                </th>
                <th className="text-center py-1 px-0" title="Prazo em meses">Prazo</th>
                <th className="text-center py-1 px-0" title="Taxa de Administração">
                  <div>Tx.</div>
                  <div>Adm<span className="text-muted-foreground">%</span></div>
                </th>
                <th className="text-center py-1 px-0" title="Fundo de Reserva">
                  <div>Fundo</div>
                  <div>Res<span className="text-muted-foreground">%</span></div>
                </th>
                <th className="text-center py-1 px-0" title="Seguro Prestamista">
                  <div>Seg.</div>
                </th>
                <th className="text-center py-1 px-1" title="Lance Embutido % (máx 50% imobiliário, 30% veículos e pesados)">
                  <div>Lance</div>
                  <div>Emb.</div>
                </th>
                <th className="text-center py-1 px-1" title="Lance Recursos Próprios %">
                  <div>Lance</div>
                  <div>Próp.</div>
                </th>
                <th className="text-center py-1 px-1" title="Carta de Crédito Total"><div>Carta</div><div>Tot.</div></th>
                <th className="text-center py-1 px-1" title="Parcela Inicial"><div>Parc.</div><div>Ini.</div></th>
                <th className="text-center py-1 px-1" title="Parcela Inicial Total"><div>Parc.</div><div>Tot.</div></th>
                <th className="text-center py-1 px-1" title="Lance Recursos Próprios R$"><div>Lance</div><div>Próp.</div></th>
                <th className="text-center py-1 px-1" title="Lance Embutido R$"><div>Lance</div><div>Emb.</div></th>
                <th className="text-center py-1 px-0" title="Lance / Crédito Disponível">Lance %</th>
                <th className="text-center py-1 px-1" title="Crédito Disponível"><div>Créd.</div><div>Disp.</div></th>
                <th className="text-center py-1 px-1" title="Parcela pós-contemplação"><div>Parc.</div><div>Pós</div></th>
                <th className="text-center py-1 px-0">Ações</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card, index) => {
                const result = results[index];
                if (!result) return null;
                return (
                  <tr key={card.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="text-center text-[10px] font-medium text-muted-foreground px-0 py-0.5">{index + 1}</td>
                    <td className="p-0.5">
                      <div className="flex items-center h-8 rounded-md border border-input bg-background overflow-hidden">
                        {(['imobiliario', 'auto', 'pesados'] as const).map((opt) => {
                          const active = card.consortiumType === opt;
                          const OptIcon = typeIcons[opt];
                          return (
                            <button key={opt} type="button"
                              onClick={() => onUpdate(card.id, 'consortiumType', opt as ConsortiumType)}
                              className={`flex-1 h-full flex items-center justify-center transition-colors border-r last:border-r-0 border-input ${active ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:bg-muted'}`}
                              title={typeLabels[opt]}
                            ><OptIcon className="h-3 w-3" /></button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-0.5">
                      <Select value={card.personType ?? 'PF'} onValueChange={(v) => onUpdate(card.id, 'personType', v as 'PF' | 'PJ')}>
                        <SelectTrigger className="h-8 w-full text-[10px] px-1 focus:ring-0 focus:ring-offset-0 min-w-0"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PF" className="text-[10px]">PF</SelectItem>
                          <SelectItem value="PJ" className="text-[10px]">PJ</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-0.5">
                      <Input type="number" value={card.quantity}
                        onChange={(e) => onUpdate(card.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-8 w-full text-center text-[10px] px-0.5 min-w-0" />
                    </td>
                    <td className="p-0.5">
                      <CurrencyInput fullWidth hideSymbol value={card.creditValue}
                        onChange={(v) => onUpdate(card.id, 'creditValue', v)}
                        className="h-8 w-full text-[10px] px-1 text-right min-w-0" />
                    </td>
                    <td className="p-0.5">
                      <Input type="number" value={card.termMonths}
                        onChange={(e) => onUpdate(card.id, 'termMonths', parseInt(e.target.value) || 0)}
                        className="h-8 w-full text-center text-[10px] px-0.5 min-w-0" />
                    </td>
                    <td className="p-0.5">
                      <Input type="number" value={card.adminFeePercent} step="0.01"
                        onChange={(e) => onUpdate(card.id, 'adminFeePercent', parseFloat(e.target.value) || 0)}
                        className="h-8 w-full text-center text-[10px] px-0.5 min-w-0" />
                    </td>
                    <td className="p-0.5">
                      <Input type="number" value={card.reserveFundPercent} step="0.01"
                        onChange={(e) => onUpdate(card.id, 'reserveFundPercent', parseFloat(e.target.value) || 0)}
                        className="h-8 w-full text-center text-[10px] px-0.5 min-w-0" />
                    </td>
                    <td className="p-0.5 text-center">
                      <div className="flex justify-center">
                        <Switch checked={card.insuranceEnabled}
                          disabled={(card.personType ?? 'PF') === 'PJ'}
                          onCheckedChange={(v) => onUpdate(card.id, 'insuranceEnabled', v)}
                          className="scale-75" />
                      </div>
                    </td>
                    <td className="p-0.5">
                      <PercentInput
                        fullWidth
                        value={card.embeddedBidPercent}
                        onChange={(v) => onUpdate(card.id, 'embeddedBidPercent', Math.min(getMaxEmbeddedBid(card.consortiumType), v))}
                        className="h-8 w-full text-[10px] px-1 min-w-0"
                      />
                    </td>
                    <td className="p-0.5">
                      <PercentInput
                        fullWidth
                        value={card.freeBidPercent}
                        onChange={(v) => onUpdate(card.id, 'freeBidPercent', v)}
                        className="h-8 w-full text-[10px] px-1 min-w-0"
                      />
                    </td>
                    <td className="text-center text-[10px] font-medium tabular-nums bg-primary/[0.02] px-1 overflow-hidden">{formatCurrency(result.totalCreditValue)}</td>
                    <td className="text-center text-[10px] tabular-nums bg-primary/[0.02] px-1 text-muted-foreground overflow-hidden">{formatCurrency(result.initialInstallment)}</td>
                    <td className="text-center text-[10px] tabular-nums font-semibold bg-primary/[0.02] px-1 overflow-hidden">{formatCurrency(result.totalInitialInstallment)}</td>
                    <td className="text-center text-[10px] tabular-nums bg-primary/[0.02] px-1 text-muted-foreground overflow-hidden">{formatCurrency(result.freeBidValue)}</td>
                    <td className="text-center text-[10px] tabular-nums bg-primary/[0.02] px-1 text-muted-foreground overflow-hidden">{formatCurrency(result.embeddedBidValue)}</td>
                    <td className="text-center text-[10px] tabular-nums bg-primary/[0.02] px-1 text-muted-foreground overflow-hidden">{result.totalCreditValue > 0 ? ((result.totalBid / result.totalCreditValue) * 100).toFixed(1) : '0,0'}%</td>
                    <td className={`text-center text-[10px] tabular-nums font-medium ${result.isOverBid ? 'text-red-600 dark:text-red-500' : 'text-primary'} bg-primary/[0.02] px-1 overflow-hidden`}>{formatCurrency(result.availableCredit)}</td>
                    <td className="text-center text-[10px] tabular-nums font-bold text-green-600 dark:text-green-500 bg-primary/[0.02] px-1 overflow-hidden">{formatCurrency(result.totalInstallmentAfterContemplation)}</td>
                    <td className="text-center bg-primary/[0.02] p-0.5">
                      <button type="button"
                        onClick={() => onRemove(card.id)}
                        disabled={cards.length <= 1}
                        className="h-6 w-6 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded disabled:opacity-30"
                      ><Trash2 className="h-3 w-3" /></button>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-primary text-primary-foreground border-t-2 font-semibold hover:!bg-primary">
                <td className="text-center text-[9px] px-0 py-1 overflow-hidden">Tot.</td>
                <td className="text-[9px] px-1 py-1 overflow-hidden" colSpan={2}>Consol.</td>
                <td className="text-center text-[9px] px-0 tabular-nums overflow-hidden">{totalQty}</td>
                <td className="text-center text-[9px] text-primary-foreground/70 uppercase px-0 overflow-hidden">Pond.</td>
                <td className="text-center text-[9px] tabular-nums overflow-hidden">{weightedTerm.toFixed(0)}</td>
                <td className="text-center text-[9px] tabular-nums overflow-hidden">{weightedAdminFee.toFixed(2).replace('.', ',')}%</td>
                <td className="text-center text-[9px] tabular-nums overflow-hidden">{weightedReserveFund.toFixed(2).replace('.', ',')}%</td>
                <td className="text-center text-[9px] overflow-hidden">—</td>
                <td className="text-center text-[9px] overflow-hidden">—</td>
                <td className="text-right px-1 overflow-hidden">—</td>
                <td className="text-right text-[9px] tabular-nums px-1 overflow-hidden">{formatCurrency(totalCredit)}</td>
                <td className="text-right text-[9px] px-1 overflow-hidden">—</td>
                <td className="text-right text-[9px] tabular-nums px-1 overflow-hidden">{formatCurrency(totalInitialInstallment)}</td>
                <td className="text-right text-[9px] tabular-nums px-1 overflow-hidden">{formatCurrency(totalFreeBidValue)}</td>
                <td className="text-right text-[9px] tabular-nums px-1 overflow-hidden">{formatCurrency(totalEmbeddedBidValue)}</td>
                <td className="text-right text-[9px] tabular-nums px-1 overflow-hidden">{totalBidPercent.toFixed(1)}%</td>
                <td className="text-right text-[9px] tabular-nums px-1 overflow-hidden">{formatCurrency(totalAvailableCredit)}</td>
                <td className="text-right text-[9px] tabular-nums font-bold px-1 overflow-hidden">{formatCurrency(totalPostInstallment)}</td>
                <td className="overflow-hidden" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-start">
        <Button variant="outline" onClick={onAdd} disabled={cards.length >= 10}
          className="h-9 gap-2 text-primary border-primary/30 hover:bg-primary/5 shadow-sm">
          <Plus className="h-4 w-4" />
          Adicionar Grupo ({cards.length}/10)
        </Button>
      </div>
    </div>
  );
}
