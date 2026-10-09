/*
 * The surface vocabulary, transcribed from NexSuite.
 *
 * These strings are the system. A page composes them; it does not invent a
 * fifth card background or a sixth text opacity. Change one here and it changes
 * everywhere — that is the whole point of keeping them in one file.
 */

/** Content card: the default surface for anything on the black canvas. */
export const CARD = 'min-w-0 bg-card border border-border rounded-[20px] p-4 shadow-card';

/** Floating card of the navigation column — very slightly lifted. */
export const CARD_NAV = 'rounded-2xl bg-card border border-border shadow-card';

/** Metric card: a subtle vertical gradient sets the headline figures apart. */
export const CARD_METRIC =
  'metric-surface min-w-0 border border-border rounded-[20px] p-4 flex flex-col';

/** Quick-access pill on a page header row. */
export const PILL_QUIET =
  'px-3 h-7 rounded-full bg-foreground/[0.04] border border-border text-muted-foreground ' +
  'hover:text-foreground hover:bg-foreground/[0.08] transition-colors text-[11px] font-medium';

/** The primary action. The only filled brand button in the system. */
export const PILL_BRAND =
  'touch-button px-3 h-8 rounded-full bg-brand text-on-brand hover:bg-brand-hover transition-colors ' +
  'text-[11px] font-semibold';

/** A destructive action: soft red, never a filled red block. */
export const PILL_DANGER =
  'px-3 h-7 rounded-full bg-bad/10 border border-bad/25 text-bad ' +
  'hover:bg-bad/20 transition-colors text-[11px] font-medium';

/** Inline link inside a card header or a list. */
export const LINK_SOFT =
  'text-[11px] text-brand-soft hover:text-foreground transition-colors font-medium';

/** Micro label above a value, or a table column head. */
export const MICRO_LABEL =
  'text-[9.5px] uppercase tracking-[0.07em] text-muted-foreground font-semibold';

/** Row in a list of records. */
export const ROW =
  'w-full flex items-center gap-3 py-2 px-1.5 rounded-lg transition-colors text-left min-w-0 ' +
  'hover:bg-foreground/[0.03]';

/** Separator between rows of the same list. */
export const ROW_DIVIDE = 'divide-y divide-border';

/** Empty state inside a card: one quiet line, not a whole illustration. */
export const EMPTY_LINE = 'text-[12px] text-muted-foreground py-6 text-center';

/** Icon button in a row: 28px, appears on hover of the row. */
export const ICON_ACTION =
  'h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground ' +
  'hover:bg-foreground/[0.07] hover:text-foreground transition-colors';

export const ICON_ACTION_DANGER =
  'h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground ' +
  'hover:bg-bad/10 hover:text-bad transition-colors';

/** Form field inside a card. */
export const FIELD =
  'h-9 w-full rounded-full bg-foreground/[0.04] border border-border px-3.5 text-[12px] ' +
  'text-foreground placeholder:text-muted-foreground transition-colors ' +
  'hover:bg-foreground/[0.06] focus:outline-none focus:border-brand-soft/60 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';

/** Table head cell. */
export const TH =
  'px-2 py-1.5 text-[9.5px] uppercase tracking-[0.06em] font-semibold text-muted-foreground';

/** Table body cell. */
export const TD = 'px-2 py-2 align-middle';

/** Table row. */
export const TR = 'border-t border-border hover:bg-foreground/[0.03] transition-colors';
