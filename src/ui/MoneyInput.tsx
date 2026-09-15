import { forwardRef, useState, useEffect } from 'react';
import { Field, type FieldProps } from './Field';

export interface MoneyInputProps extends Omit<FieldProps, 'onChange' | 'value'> {
  value: number; // in cents
  onChange: (cents: number | null) => void;
}

export function parseMoneyString(value: string): number | null {
  const clean = value.replace(/[^0-9.,-]/g, '');
  if (!clean || clean === '-' || clean === ',' || clean === '.') return null;

  let normalized = clean;

  // Se contiene sia punto che virgola, l'ultimo è il separatore decimale
  if (clean.includes(',') && clean.includes('.')) {
    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');
    if (lastComma > lastDot) {
      // virgola è decimale
      const before = clean.substring(0, lastComma).replace(/[^0-9-]/g, '');
      const after = clean.substring(lastComma + 1).replace(/[^0-9]/g, '');
      normalized = before + '.' + after;
    } else {
      // punto è decimale
      const before = clean.substring(0, lastDot).replace(/[^0-9-]/g, '');
      const after = clean.substring(lastDot + 1).replace(/[^0-9]/g, '');
      normalized = before + '.' + after;
    }
  } else if (clean.includes(',')) {
    // Solo virgola
    const parts = clean.split(',');
    const beforeDec = parts
      .slice(0, -1)
      .join('')
      .replace(/[^0-9-]/g, '');
    const afterDec = parts[parts.length - 1];
    normalized = beforeDec + '.' + afterDec;
  } else if (clean.includes('.')) {
    // Solo punti
    const parts = clean.split('.');
    const lastPart = parts[parts.length - 1] || '';
    if (lastPart.length <= 2 && parts.length === 2) {
      normalized = parts[0] + '.' + lastPart;
    } else if (lastPart.length === 3) {
      normalized = parts.join('');
    } else {
      const beforeDec = parts.slice(0, -1).join('');
      normalized = beforeDec + '.' + lastPart;
    }
  }

  const num = parseFloat(normalized);
  if (isNaN(num)) return null;

  return Math.round(num * 100);
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, error, ...props }, ref) => {
    // Display value in input
    const [display, setDisplay] = useState('');
    const [internalError, setInternalError] = useState<string | null>(null);

    // Sync from prop when not typing (e.g. initial load or external update)
    useEffect(() => {
      if (value !== null && value !== undefined) {
        setDisplay(
          (value / 100).toLocaleString('it-IT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      } else {
        setDisplay('');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setDisplay(val);
      setInternalError(null);

      if (!val) {
        onChange(null);
        return;
      }

      const cents = parseMoneyString(val);
      if (cents === null && val.match(/[0-9]/)) {
        setInternalError('Formato non valido');
      } else if (cents !== null) {
        onChange(cents);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const cents = parseMoneyString(display);
      if (cents !== null) {
        setDisplay(
          (cents / 100).toLocaleString('it-IT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      }
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    return (
      <Field
        ref={ref}
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        error={error || (internalError ? internalError : undefined)}
        inputMode="decimal"
        {...props}
      />
    );
  }
);

MoneyInput.displayName = 'MoneyInput';
