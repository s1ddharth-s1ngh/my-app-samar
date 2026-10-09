import type { ScheduleKind } from '@/data/types';

/**
 * The four things a block can be. Colour is information here — the kind is
 * what you read at a glance on the timeline — so it lives with the kind and
 * is never picked per block.
 */
export const SCHEDULE_KINDS: Record<ScheduleKind, { label: string; rail: string; fill: string }> = {
  work: {
    label: 'Lavoro',
    rail: 'bg-[#1F523A]',
    fill: 'bg-[#1F523A]/[0.25]',
  },
  break: {
    label: 'Pausa',
    rail: 'bg-amber-400',
    fill: 'bg-amber-400/[0.12]',
  },
  gym: {
    label: 'Palestra',
    rail: 'bg-emerald-400',
    fill: 'bg-emerald-400/[0.12]',
  },
  custom: {
    label: 'Altro',
    rail: 'bg-white/40',
    fill: 'bg-white/[0.05]',
  },
};

export const KIND_OPTIONS = (Object.keys(SCHEDULE_KINDS) as ScheduleKind[]).map((value) => ({
  value,
  label: SCHEDULE_KINDS[value].label,
}));
