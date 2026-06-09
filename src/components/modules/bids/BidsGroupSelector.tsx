import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PillToggle } from '@/components/ui/pill-toggle';
import { ConsortiumType } from '@/types/consortium';
import { Building2, Car, Truck } from 'lucide-react';
import { useBidsContext } from './BidsContext';

export function BidsGroupSelector() {
  const { selectedType, setSelectedType, selectedGroupNumber, setSelectedGroupNumber, availableGroups } = useBidsContext();

  return (
    <Card id="bids-group-selector">
      <CardHeader>
        <CardTitle className="text-lg">Selecionar Grupo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="input-group">
          <Label className="input-label">Tipo de Consórcio</Label>
          <PillToggle<ConsortiumType>
            ariaLabel="Tipo de consórcio"
            value={selectedType}
            onChange={(v) => {
              setSelectedType(v);
              setSelectedGroupNumber('');
            }}
            options={[
              { value: 'imobiliario', label: <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />Imobiliário</span> },
              { value: 'auto', label: <span className="inline-flex items-center gap-1.5"><Car className="h-3.5 w-3.5" />Veículos</span> },
              { value: 'pesados', label: <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" />Pesados</span> },
            ]}
          />
        </div>

        <div className="input-group">
          <Label className="input-label">Número do Grupo</Label>
          <Select value={selectedGroupNumber} onValueChange={setSelectedGroupNumber}>
            <SelectTrigger><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
            <SelectContent>
              {availableGroups.length === 0 ? (
                <div className="py-2 px-3 text-sm text-muted-foreground">Nenhum grupo cadastrado</div>
              ) : (
                availableGroups.map((groupNum) => (
                  <SelectItem key={groupNum} value={groupNum.toString()}>Grupo {groupNum}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
