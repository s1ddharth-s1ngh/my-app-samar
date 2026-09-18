/*
 * The liquid glass system — shared constants, imported, never copied.
 *
 * Intensity ladder, and nothing above it: fields to fill in 0.05 < buttons and
 * the active element 0.07 < hover 0.08–0.12. The glass has to stay a veil;
 * `backdrop-blur-sm` is part of the signature.
 *
 * Everything interactive is a pill (`rounded-full`); containers are
 * `rounded-xl`. There are no filled coloured buttons in this system — a primary
 * action is a denser frost, not a blue block.
 */

/** Buttons and actions: veil 0.07, hover 0.12. */
export const glassButtonClass =
  'rounded-full border border-foreground/10 bg-foreground/[0.07] backdrop-blur-sm ' +
  'text-foreground hover:bg-foreground/[0.12] hover:text-foreground transition-colors';

/** The primary action: the same pill, denser frost. Never a solid blue block. */
export const glassPrimaryButtonClass =
  'rounded-full border border-foreground/15 bg-foreground/[0.18] backdrop-blur-sm ' +
  'text-foreground hover:bg-foreground/[0.24] hover:text-foreground transition-colors';

/** Destructive action: soft red veil, never a full red button. */
export const glassDestructiveButtonClass =
  'rounded-full border border-destructive/20 bg-destructive/[0.12] backdrop-blur-sm ' +
  'text-destructive hover:bg-destructive/20 hover:text-destructive transition-colors';

/** Filter fields (input, select trigger): veil 0.05, hover 0.08, no border. */
export const glassFieldClass =
  'rounded-full border-transparent bg-foreground/[0.05] backdrop-blur-sm ' +
  'text-foreground placeholder:text-muted-foreground hover:bg-foreground/[0.08] transition-colors';

/** A filter field at rest looks the same as one in focus: only the caret moves. */
export const glassInputFocusClass =
  'focus-visible:outline-none focus-visible:ring-0 focus-visible:border-transparent focus-visible:shadow-none';

export const glassSelectFocusClass =
  'focus:outline-none focus:ring-0 focus:border-transparent focus:shadow-none';

/** Translucent dropdowns and popovers. */
export const glassDropdownClass =
  'rounded-xl border border-foreground/10 bg-popover/85 backdrop-blur-xl shadow-lg';

export const glassDropdownItemClass =
  'rounded-lg text-foreground focus:bg-foreground/[0.08] focus:text-foreground';

/**
 * A full-height panel needs three things together, or the blur has nothing to
 * refract and the sheet reads as a flat slab: low opacity so the page shows
 * through the body, saturation to revive the colours behind, and a light
 * hairline on the top edge so the slab catches the light.
 */
export const glassSurfaceClass =
  'bg-popover/60 backdrop-blur-2xl backdrop-saturate-[180%] border border-foreground/15';

/** A LIGHT scrim: a full one kills the effect. */
export const glassOverlayClass = 'bg-black/25 backdrop-blur-sm';

export const glassPanelShadow =
  'shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55),inset_1px_1px_0_0_hsl(var(--foreground)/0.12)]';

/** A row action inside a table or card. */
export const glassRowActionClass =
  'rounded-full text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground transition-colors';

/** The one place a semantic red hover is allowed. */
export const glassRowDestructiveActionClass =
  'rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors';

/** The single content sheet a list page lives in. */
export const panelClass = 'rounded-xl border border-border bg-card';
