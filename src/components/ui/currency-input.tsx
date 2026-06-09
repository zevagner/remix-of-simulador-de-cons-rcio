import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  /** Debounce em ms para propagar onChange ao sistema. Default 250ms. Use 0 para desativar. */
  debounceMs?: number;
  /** Força o wrapper a ocupar 100% da largura do container pai (útil em TableCell com table-fixed). */
  fullWidth?: boolean;
  hideSymbol?: boolean;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, debounceMs = 250, fullWidth = false, hideSymbol = false, ...props }, ref) => {
    const formatBR = (n: number) =>
      n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const [displayValue, setDisplayValue] = React.useState(() => formatBR(value));
    // Valor numérico local — atualizado imediatamente ao digitar
    const [internalValue, setInternalValue] = React.useState<number>(value);
    // Flag para distinguir mudanças vindas do usuário vs sincronização externa
    const userEditingRef = React.useRef(false);

    // Sincroniza display + internal quando o valor externo muda (ex: reset, carregamento de sessão)
    React.useEffect(() => {
      if (Math.abs(internalValue - value) > 0.001) {
        setInternalValue(value);
        setDisplayValue(formatBR(value));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // Debounce: propaga onChange ao sistema apenas quando o usuário pausa
    React.useEffect(() => {
      if (!userEditingRef.current) return;
      if (Math.abs(internalValue - value) < 0.001) {
        userEditingRef.current = false;
        return;
      }
      if (debounceMs <= 0) {
        onChange(internalValue);
        userEditingRef.current = false;
        return;
      }
      const timer = setTimeout(() => {
        onChange(internalValue);
        userEditingRef.current = false;
      }, debounceMs);
      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [internalValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^\d]/g, '');
      const numericValue = parseInt(rawValue || '0', 10) / 100;
      const safeValue = (!Number.isFinite(numericValue) || numericValue < 0)
        ? 0
        : Math.min(numericValue, 999_999_999.99);
      userEditingRef.current = true;
      setDisplayValue(formatBR(safeValue));
      setInternalValue(safeValue);
    };

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {!hideSymbol && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            R$
          </span>
        )}
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className={cn(hideSymbol ? 'pl-2' : 'pl-10', className)}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
