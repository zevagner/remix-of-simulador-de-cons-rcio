import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface PercentInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  decimalPlaces?: number;
  /** Debounce em ms para propagar onChange ao sistema. Default 250ms. Use 0 para desativar. */
  debounceMs?: number;
  /** Força o wrapper a ocupar 100% da largura do container pai (útil em TableCell com table-fixed). */
  fullWidth?: boolean;
}

export const PercentInput = React.forwardRef<HTMLInputElement, PercentInputProps>(
  ({ value, onChange, className, decimalPlaces = 2, debounceMs = 250, fullWidth = false, onFocus, onBlur, ...props }, ref) => {
    const formatPct = (n: number) => n.toFixed(decimalPlaces).replace('.', ',');

    const [displayValue, setDisplayValue] = useState<string>(formatPct(value));
    const [internalValue, setInternalValue] = useState<number>(value);
    const userEditingRef = useRef(false);
    const isFocusedRef = useRef(false);

    // Sincroniza com mudanças externas (reset, sessão carregada, sugestão automática, auto-cap).
    // Enquanto o input está focado, NÃO sobrescreve o que o usuário está digitando.
    useEffect(() => {
      if (Math.abs(internalValue - value) > 0.0001) {
        setInternalValue(value);
      }
      if (isFocusedRef.current) return;
      const currentNumeric = parseFloat(displayValue.replace(',', '.')) || 0;
      if (Math.abs(currentNumeric - value) > 0.0001 || displayValue !== formatPct(value)) {
        setDisplayValue(formatPct(value));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, decimalPlaces]);

    // Debounce do onChange para o sistema
    useEffect(() => {
      if (!userEditingRef.current) return;
      if (Math.abs(internalValue - value) < 0.0001) {
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
      const input = e.target.value;
      const sanitized = input.replace(/[^\d.,]/g, '');
      const normalized = sanitized.replace(',', '.');
      const parts = normalized.split('.');
      let formatted = parts[0];
      if (parts.length > 1) {
        formatted += '.' + parts[1].slice(0, decimalPlaces);
      }

      setDisplayValue(sanitized.replace('.', ',').replace(/,/g, (match, offset) =>
        offset === sanitized.indexOf('.') || offset === sanitized.indexOf(',') ? ',' : ''
      ));

      const numericValue = parseFloat(formatted);
      const safeValue = (!Number.isFinite(numericValue) || numericValue < 0) ? 0 : numericValue;
      const multiplier = Math.pow(10, decimalPlaces);
      const finalValue = Math.min(100, Math.round(safeValue * multiplier) / multiplier);
      userEditingRef.current = true;
      setInternalValue(finalValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = true;
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = false;
      // Garante propagação imediata no blur (sem esperar debounce)
      if (userEditingRef.current && Math.abs(internalValue - value) > 0.0001) {
        onChange(internalValue);
        userEditingRef.current = false;
      }
      // Reformata exibindo o valor canônico (após cap externo, o useEffect sincroniza).
      const finalNumeric = userEditingRef.current ? internalValue : value;
      setDisplayValue(formatPct(finalNumeric));
      onBlur?.(e);
    };

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn('pr-8', className)}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          %
        </span>
      </div>
    );
  }
);

PercentInput.displayName = 'PercentInput';
