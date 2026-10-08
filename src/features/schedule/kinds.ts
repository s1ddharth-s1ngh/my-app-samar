import type { ScheduleKind } from '@/data/types';

/**
 * The four things a block can be. Colour is information here — the kind is
 * what you read at a glance on the timeline — so it lives with the kind and
 * is never picked per block.
 */
export const SCHEDULE_KINDS: Record<
  ScheduleKind,
  { label: string; rail: string; fill: string; text: string }
> = {
  work: {
    label: 'Lavoro',
    rail: 'bg-[#1E6FFF]',
    fill: 'bg-[#1E6FFF]/[0.12]',
    text: 'text-[#9cc4ff]',
  },
  break: {
    label: 'Pausa',
    rail: 'bg-amber-400',
    fill: 'bg-amber-400/[0.12]',
    text: 'text-amber-200',
  },
  gym: {
    label: 'Palestra',
    rail: 'bg-emerald-400',
    fill: 'bg-emerald-400/[0.12]',
    text: 'text-emerald-200',
  },
  custom: {
    label: 'Altro',
    rail: 'bg-white/40',
    fill: 'bg-white/[0.05]',
    text: 'text-white/70',
  },
};

export const KIND_OPTIONS = (Object.keys(SCHEDULE_KINDS) as ScheduleKind[]).map((value) => ({
  value,
  label: SCHEDULE_KINDS[value].label,
}));
