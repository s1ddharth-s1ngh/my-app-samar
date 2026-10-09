import {
  CalendarDays,
  CalendarClock,
  CalendarRange,
  Boxes,
  Inbox,
  Layers,
  LineChart,
  ListTodo,
  Receipt,
  Settings,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * The navigation model, in two levels — the same shape NexSuite uses.
 *
 *   level 1  area     what part of your life you are looking at
 *   level 2  section  a page inside that area
 *
 * The sidebar renders level 1 in its first card and level 2 in its second, so
 * where you are is always answered by two visible rows rather than by a URL.
 */

export type AreaKey = 'agenda' | 'soldi' | 'lavoro' | 'impostazioni';

export interface Area {
  key: AreaKey;
  label: string;
  /** Where clicking the area lands. */
  home: string;
  icon: LucideIcon;
}

export interface NavSection {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** The area's own landing page: only highlighted on an exact match. */
  isHome?: boolean;
  /** Reachable, but not worth a row in the phone's bottom bar. */
  secondary?: boolean;
}

export const AREAS: Area[] = [
  { key: 'agenda', label: 'Agenda', home: '/', icon: CalendarDays },
  { key: 'soldi', label: 'Soldi', home: '/soldi', icon: Wallet },
  { key: 'lavoro', label: 'Lavoro', home: '/progetti', icon: ListTodo },
  { key: 'impostazioni', label: 'Impostazioni', home: '/impostazioni', icon: Settings },
];

const SECTIONS: Record<AreaKey, NavSection[]> = {
  agenda: [
    { id: 'giornata', label: 'La giornata', href: '/', icon: CalendarDays, isHome: true },
    { id: 'schema', label: 'Schema settimanale', href: '/agenda/schema', icon: CalendarRange },
  ],

  soldi: [
    { id: 'panoramica', label: 'Panoramica', href: '/soldi', icon: Wallet, isHome: true },
    { id: 'entrate', label: 'Entrate', href: '/soldi/entrate', icon: TrendingUp },
    { id: 'movimenti', label: 'Movimenti', href: '/soldi/movimenti', icon: Receipt },
    { id: 'ripartizione', label: 'Ripartizione', href: '/soldi/ripartizione', icon: Layers },
    { id: 'storico', label: 'Storico', href: '/soldi/storico', icon: LineChart },
    { id: 'bucket', label: 'Bucket', href: '/soldi/bucket', icon: Boxes, secondary: true },
    { id: 'fonti', label: 'Fonti di entrata', href: '/soldi/fonti', icon: Wallet, secondary: true },
    {
      id: 'regole',
      label: 'Regole di allocazione',
      href: '/soldi/allocazioni',
      icon: SlidersHorizontal,
      secondary: true,
    },
    {
      id: 'ricorrenti',
      label: 'Spese ricorrenti',
      href: '/soldi/ricorrenti',
      icon: CalendarClock,
      secondary: true,
    },
  ],

  lavoro: [
    { id: 'progetti', label: 'Progetti', href: '/progetti', icon: ListTodo, isHome: true },
    { id: 'obiettivi', label: 'Obiettivi', href: '/obiettivi', icon: Target },
    { id: 'inbox', label: 'Inbox', href: '/progetti/inbox', icon: Inbox },
  ],

  impostazioni: [
    { id: 'generali', label: 'Generali', href: '/impostazioni', icon: Settings, isHome: true },
  ],
};

export function areaByKey(key: AreaKey): Area {
  return AREAS.find((area) => area.key === key) ?? AREAS[0]!;
}

export function getSections(area: AreaKey): NavSection[] {
  return SECTIONS[area];
}

/** The sections worth a slot in the phone's bottom bar. */
export function getPrimarySections(area: AreaKey): NavSection[] {
  return SECTIONS[area].filter((section) => !section.secondary);
}

export function getSecondarySections(area: AreaKey): NavSection[] {
  return SECTIONS[area].filter((section) => section.secondary);
}

/** Longest prefix wins, so `/soldi/entrate` resolves before `/soldi`. */
export function resolveArea(pathname: string): AreaKey {
  if (pathname === '/' || pathname.startsWith('/agenda')) return 'agenda';
  if (pathname.startsWith('/soldi')) return 'soldi';
  if (pathname.startsWith('/progetti') || pathname.startsWith('/obiettivi')) return 'lavoro';
  if (pathname.startsWith('/impostazioni')) return 'impostazioni';
  return 'agenda';
}

/** The area's home stays lit only on an exact match; the rest match by prefix. */
export function isSectionActive(pathname: string, section: NavSection): boolean {
  if (section.isHome) return pathname === section.href || pathname === `${section.href}/`;
  return pathname === section.href || pathname.startsWith(`${section.href}/`);
}
