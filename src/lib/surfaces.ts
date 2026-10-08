/*
 * The surface vocabulary, transcribed from NexSuite.
 *
 * These strings are the system. A page composes them; it does not invent a
 * fifth card background or a sixth text opacity. Change one here and it changes
 * everywhere — that is the whole point of keeping them in one file.
 */

/** Content card: the default surface for anything on the black canvas. */
export const CARD = 'bg-[#111111] border border-white/[0.06] rounded-[20px] p-4';

/** Floating card of the navigation column — very slightly lifted. */
export const CARD_NAV =
  'rounded-xl bg-[#121212] border border-white/[0.06] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)]';

/** Metric card: a subtle vertical gradient sets the headline figures apart. */
export const CARD_METRIC =
  'bg-gradient-to-b from-[#161616] to-[#101010] border border-white/[0.07] rounded-[20px] p-4 flex flex-col';

/** Quick-access pill on a page header row. */
export const PILL_QUIET =
  'px-3 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/55 ' +
  'hover:text-white hover:bg-white/[0.08] transition-colors text-[11px] font-medium';

/** The primary action. The only filled brand button in the system. */
export const PILL_BRAND =
  'px-3 h-7 rounded-full bg-[#1F523A] text-white hover:bg-[#35643F] transition-colors ' +
  'text-[11px] font-semibold';

/** A destructive action: soft red, never a filled red block. */
export const PILL_DANGER =
  'px-3 h-7 rounded-full bg-red-500/10 border border-red-500/25 text-red-300 ' +
  'hover:bg-red-500/20 transition-colors text-[11px] font-medium';

/** Inline link inside a card header or a list. */
export const LINK_SOFT =
  'text-[11px] text-[#D1D9B0] hover:text-white transition-colors font-medium';

/** Micro label above a value, or a table column head. */
export const MICRO_LABEL = 'text-[9.5px] uppercase tracking-[0.07em] text-white/30 font-semibold';

/** Row in a list of records. */
export const ROW =
  'w-full flex items-center gap-3 py-2 px-1.5 rounded-lg transition-colors text-left min-w-0 ' +
  'hover:bg-white/[0.03]';

/** Separator between rows of the same list. */
export const ROW_DIVIDE = 'divide-y divide-white/[0.04]';

/** Empty state inside a card: one quiet line, not a whole illustration. */
export const EMPTY_LINE = 'text-[12px] text-white/35 py-6 text-center';

/** Icon button in a row: 28px, appears on hover of the row. */
export const ICON_ACTION =
  'h-7 w-7 inline-flex items-center justify-center rounded-full text-white/45 ' +
  'hover:bg-white/[0.07] hover:text-white transition-colors';

export const ICON_ACTION_DANGER =
  'h-7 w-7 inline-flex items-center justify-center rounded-full text-white/45 ' +
  'hover:bg-red-500/10 hover:text-red-300 transition-colors';

/** Form field inside a card. */
export const FIELD =
  'h-9 w-full rounded-full bg-white/[0.04] border border-white/[0.08] px-3.5 text-[12px] ' +
  'text-white placeholder:text-white/30 transition-colors ' +
  'hover:bg-white/[0.06] focus:outline-none focus:border-[#9DB560]/60 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';

/** Table head cell. */
export const TH =
  'px-2 py-1.5 text-[9.5px] uppercase tracking-[0.06em] font-semibold text-white/35';

/** Table body cell. */
export const TD = 'px-2 py-2 align-middle';

/** Table row. */
export const TR = 'border-t border-white/[0.04] hover:bg-white/[0.03] transition-colors';
