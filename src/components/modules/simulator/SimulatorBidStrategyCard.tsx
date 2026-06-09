import { memo, useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentInput } from '@/components/ui/percent-input';
import { PillToggle } from '@/components/ui/pill-toggle';
import { formatCurrency } from '@/core/finance';
import { useSimulatorInput, useSimulatorResult } from './SimulatorContext';

type UnitMode = 'value' | 'percent';

const UNIT_OPTIONS: { value: UnitMode; label: string }[] = [
  { value: 'value', label: 'R$' },
  { value: 'percent', label: '%' },
];

interface UnitPillToggleProps {
  value: UnitMode;
  onChange: (v: UnitMode) => void;
  ariaLabel: string;
  showDiscovery?: boolean;
  discoveryText?: string;
}

function UnitPillToggle({ value, onChange, ariaLabel, showDiscovery, discoveryText }: UnitPillToggleProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Recalcula posição quando o balão aparece e em scroll/resize, para acompanhar o toggle.
  useLayoutEffect(() => {
    if (!showDiscovery || !discoveryText) {
      setPos(null);
      return;
    }
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.left + rect.width / 2 });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [showDiscovery, discoveryText]);

  return (
    <div ref={anchorRef} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      {showDiscovery && discoveryText && pos && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full animate-fade-in"
            style={{ top: pos.top - 8, left: pos.left }}
            role="tooltip"
          >
            <div className="bg-[#003641] text-white text-xs rounded-md px-3 py-2 whitespace-nowrap shadow-md">
              {discoveryText}
            </div>
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
              style={{
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid #003641',
              }}
            />
          </div>,
          document.body,
        )}
      <PillToggle
        options={UNIT_OPTIONS}
        value={value}
        onChange={onChange}
        ariaLabel={ariaLabel}
        tooltip="Alternar entre percentual e valor em reais"
      />
    </div>
  );
}


function discoveryMessage(mode: UnitMode): string {
  return mode === 'percent'
    ? 'Clique em R$ para digitar o valor em reais'
    : 'Clique em % para digitar em percentual da carta';
}

function useDiscoveryHint() {
  const [show, setShow] = useState(false);
  const seenRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const trigger = useCallback(() => {
    if (seenRef.current) return;
    seenRef.current = true;
    setShow(true);
    clearTimer();
    timerRef.current = setTimeout(() => setShow(false), 5000);
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setShow(false);
  }, []);

  useEffect(() => () => clearTimer(), []);

  return { show, trigger, dismiss };
}

export const SimulatorBidStrategyCard = memo(function SimulatorBidStrategyCard() {
  const {
    input,
    updateInput,
    freeBidType, setFreeBidType,
    embeddedBidType, setEmbeddedBidType,
    freeBidPercent, setFreeBidPercent,
    embeddedBidPercent, setEmbeddedBidPercent,
    isFlexPlan,
  } = useSimulatorInput();
  const { actualFreeBidValue, actualEmbeddedBidValue } = useSimulatorResult();

  const freeHint = useDiscoveryHint();
  const embeddedHint = useDiscoveryHint();

  const handleFreeSetType = (v: UnitMode) => {
    freeHint.dismiss();
    setFreeBidType(v);
  };
  const handleEmbeddedSetType = (v: UnitMode) => {
    embeddedHint.dismiss();
    setEmbeddedBidType(v);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Estratégia de Lance</CardTitle>
        <p className="text-xs text-muted-foreground">
          {isFlexPlan
            ? 'Aproveite o caixa sazonal (safra/faturamento) para um lance forte e antecipar a contemplação'
            : 'Defina os lances para aumentar as chances de contemplação'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFlexPlan && (
          <div className="p-3 rounded-lg border border-secondary/40 bg-secondary/5 text-xs text-foreground">
            <strong className="text-secondary">Dica Flex:</strong> com pagamento semestral, o cliente acumula caixa entre as parcelas.
            Use parte desse caixa sazonal (safra, recebíveis, 13º) como <strong>lance com recursos próprios</strong> para antecipar a contemplação sem comprometer o fluxo.
          </div>
        )}
        {/* Lance com recursos próprios */}
        <div className="input-group" onClick={freeHint.trigger}>
          <div className="flex items-center justify-between mb-1">
            <Label className="input-label">Lance com recursos próprios</Label>
            <UnitPillToggle
              value={freeBidType}
              onChange={handleFreeSetType}
              ariaLabel="Unidade do lance com recursos próprios"
              showDiscovery={freeHint.show}
              discoveryText={discoveryMessage(freeBidType)}
            />
          </div>
          <p className="text-xs text-gray-400 mb-2">
            {freeBidType === 'percent' ? 'Digite o percentual da carta' : 'Digite o valor em reais'}
          </p>
          {freeBidType === 'value' ? (
            <CurrencyInput
              value={input.freeBidValue}
              onChange={(v) => updateInput('freeBidValue', v)}
              placeholder="Ex: 100.000"
              className="text-right pr-4"
            />
          ) : (
            <div className="space-y-1">
              <PercentInput value={freeBidPercent} onChange={setFreeBidPercent} placeholder="Ex: 20" className="text-center" />
              <p className="text-xs text-muted-foreground">= {formatCurrency(actualFreeBidValue)}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Valor pago à vista pelo consorciado</p>
        </div>

        {/* Lance embutido */}
        <div className="input-group" onClick={embeddedHint.trigger}>
          <div className="flex items-center justify-between mb-1">
            <Label className="input-label">Lance embutido (reduz a carta)</Label>
            <UnitPillToggle
              value={embeddedBidType}
              onChange={handleEmbeddedSetType}
              ariaLabel="Unidade do lance embutido"
              showDiscovery={embeddedHint.show}
              discoveryText={discoveryMessage(embeddedBidType)}
            />
          </div>
          <p className="text-xs text-gray-400 mb-2">
            {embeddedBidType === 'percent' ? 'Digite o percentual da carta' : 'Digite o valor em reais'}
          </p>
          {embeddedBidType === 'value' ? (
            <CurrencyInput
              value={input.embeddedBidValue}
              onChange={(v) => updateInput('embeddedBidValue', v)}
              placeholder="Ex: 100.000"
              className="text-right pr-4"
            />
          ) : (
            <div className="space-y-1">
              <PercentInput value={embeddedBidPercent} onChange={setEmbeddedBidPercent} placeholder="Ex: 20" className="text-center" />
              <p className="text-xs text-muted-foreground">= {formatCurrency(actualEmbeddedBidValue)}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Não exige desembolso financeiro imediato</p>
        </div>


        {/* Soma dos Lances */}
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-foreground">Total de Lances</span>
              <p className="text-xs text-muted-foreground">Recursos próprios + embutido</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">
                {formatCurrency(actualFreeBidValue + actualEmbeddedBidValue)}
              </p>
              <p className="text-xs text-muted-foreground">
                {input.creditValue > 0
                  ? `${(((actualFreeBidValue + actualEmbeddedBidValue) / input.creditValue) * 100).toFixed(2).replace('.', ',')}% da carta`
                  : '0,00% da carta'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
