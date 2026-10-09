import { useId } from 'react';
import { Check, Pipette } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO_LABEL } from '@/lib/surfaces';

const PALETTE = [
  '#35643F',
  '#617D30',
  '#0F766E',
  '#2563EB',
  '#7C3AED',
  '#DB2777',
  '#DC2626',
  '#D97706',
];

function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const id = useId();
  const normalised = isHexColor(value) ? value.toUpperCase() : '#35643F';

  return (
    <fieldset className="space-y-2">
      <legend className={cn(MICRO_LABEL, 'mb-2 block')}>{label}</legend>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {PALETTE.map((color) => {
            const selected = color === normalised;
            return (
              <button
                key={color}
                type="button"
                aria-label={`Scegli ${color}`}
                aria-pressed={selected}
                onClick={() => onChange(color)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 border-card transition-transform active:scale-95',
                  selected && 'ring-2 ring-brand ring-offset-2 ring-offset-card'
                )}
                style={{ backgroundColor: color }}
              >
                {selected && (
                  <Check className="h-4 w-4 text-white drop-shadow-sm" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
        <label
          htmlFor={id}
          className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-card"
          title="Colore personalizzato"
        >
          <input
            id={id}
            type="color"
            value={normalised}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Colore personalizzato"
          />
          <Pipette className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </label>
      </div>
      <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-foreground/[0.03] px-3">
        <span
          className="h-5 w-5 shrink-0 rounded-md border border-black/10"
          style={{ backgroundColor: normalised }}
        />
        <input
          value={normalised}
          onChange={(event) => {
            const next = event.target.value.toUpperCase();
            if (next === '#' || /^#[0-9A-F]{0,6}$/.test(next)) onChange(next);
          }}
          onBlur={() => {
            if (!isHexColor(value)) onChange('#35643F');
          }}
          className="min-w-0 flex-1 bg-transparent text-[12px] font-medium tracking-wide text-foreground outline-none"
          maxLength={7}
          spellCheck={false}
          aria-label={`${label} in formato HEX`}
        />
      </div>
    </fieldset>
  );
}
