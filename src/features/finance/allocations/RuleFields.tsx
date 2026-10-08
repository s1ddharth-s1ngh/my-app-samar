import { Field, MoneyInput, Select } from '@/ui';
import { formatCents } from '@/domain/money';
import type { AllocationRule } from '@/data/types';

/** One sentence saying how a bucket gets its money. */
export function describeRule(rule: AllocationRule): string {
  if (rule.type === 'fixed') return `Importo fisso: ${formatCents(rule.value)}`;
  if (rule.type === 'percent') {
    return `${rule.value}% ${rule.base === 'gross' ? 'del totale entrato' : 'di quel che resta'}`;
  }
  return 'Tutto il resto';
}

const RULE_OPTIONS = [
  { value: 'fixed', label: 'Importo fisso' },
  { value: 'percent', label: 'Percentuale' },
  { value: 'remainder', label: 'Tutto il resto' },
];

const BASE_OPTIONS = [
  { value: 'afterFixed', label: 'Quel che resta dopo i fissi' },
  { value: 'gross', label: 'Il totale entrato' },
];

/** A rule of each type, so switching type never produces a half-filled rule. */
function ruleOfType(type: string): AllocationRule {
  if (type === 'fixed') return { type: 'fixed', value: 0 };
  if (type === 'percent') return { type: 'percent', value: 10, base: 'afterFixed' };
  return { type: 'remainder' };
}

/**
 * How a bucket is funded. Shared by the bucket sheet and the rules screen: a
 * bucket created without one is a bucket the engine cannot serve.
 */
export function RuleFields({
  rule,
  onChange,
}: {
  rule: AllocationRule;
  onChange: (rule: AllocationRule) => void;
}) {
  return (
    <>
      <Select
        label="Come si finanzia"
        value={rule.type}
        onChange={(e) => onChange(ruleOfType(e.target.value))}
        options={RULE_OPTIONS}
      />

      {rule.type === 'fixed' && (
        <MoneyInput
          label="Importo"
          value={rule.value}
          onChange={(value) => onChange({ type: 'fixed', value: value ?? 0 })}
        />
      )}

      {rule.type === 'percent' && (
        <>
          <Field
            label="Percentuale (0-100)"
            type="number"
            min={0}
            max={100}
            value={rule.value}
            onChange={(e) =>
              onChange({ ...rule, value: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })
            }
          />
          <Select
            label="Su quale base"
            value={rule.base}
            onChange={(e) =>
              onChange({ ...rule, base: e.target.value === 'gross' ? 'gross' : 'afterFixed' })
            }
            options={BASE_OPTIONS}
          />
        </>
      )}

      {rule.type === 'remainder' && (
        <p className="text-[11px] text-white/35">
          Prende quel che avanza dopo tutti gli altri. Un solo bucket per ciclo può farlo: se ce n’è
          più d’uno, gli altri restano a zero.
        </p>
      )}
    </>
  );
}
