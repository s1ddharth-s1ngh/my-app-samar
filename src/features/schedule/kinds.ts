import type { ScheduleKind } from '@/data/types';

/**
 * The four things a block can be. Colour is information here — the kind is
 * what you read at a glance on the timeline — so it lives with the kind and
 * is never picked per block.
 */
export const SCHEDULE_KINDS: Record<ScheduleKind, { label: string; rail: string; fill: string }> = {
  work: {
    label: 'Lavoro',
    rail: 'bg-brand',
    fill: 'bg-brand/[0.10]',
  },
  break: {
    label: 'Pausa',
    rail: 'bg-warn',
    fill: 'bg-warn/[0.12]',
  },
  gym: {
    label: 'Palestra',
    rail: 'bg-good',
    fill: 'bg-good/[0.12]',
  },
  custom: {
    label: 'Altro',
    rail: 'bg-foreground/40',
    fill: 'bg-foreground/[0.05]',
  },
};

export const KIND_OPTIONS = (Object.keys(SCHEDULE_KINDS) as ScheduleKind[]).map((value) => ({
  value,
  label: SCHEDULE_KINDS[value].label,
}));
