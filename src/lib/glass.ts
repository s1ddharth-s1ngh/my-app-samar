/*
 * The liquid glass system — shared class recipes, imported, never copied.
 *
 * The material itself (blur, saturate, rim ring, opposed inner shadows) lives
 * in `src/styles/glass.css`, built on the values measured from Apple's iOS 27
 * UI Kit and shipped by `@ios27_design_system/tokens`.
 *
 * What this file adds is the discipline around it:
 *  - two radius families and only two — `rounded-full` for anything
 *    interactive on the surface, `rounded-xl` for containers;
 *  - intensity ladder for the flat veils: fields to fill in 0.05 < buttons and
 *    the active element 0.07 < hover 0.08–0.12. A veil, never a wall;
 *  - no filled coloured buttons. A primary action is a denser frost; a
 *    destructive one is a soft red veil. Colour stays information.
 */

/** Buttons and actions: the small iOS 27 glass, as a pill. */
export const glassButtonClass = 'glass-control glass-interactive rounded-full text-foreground';

/** The primary action: the same pill, denser frost. Never a solid blue block. */
export const glassPrimaryButtonClass =
  'glass-control glass-interactive glass-prominent rounded-full text-foreground font-semibold';

/** Destructive action: soft red veil, never a full red button. */
export const glassDestructiveButtonClass =
  'rounded-full border border-destructive/20 bg-destructive/[0.12] backdrop-blur-sm ' +
  'text-destructive hover:bg-destructive/20 transition-colors';

/**
 * Filter fields keep a flat veil rather than the full material: a field has to
 * read as something you can fill in, and the rim ring makes it read as a chip.
 */
export const glassFieldClass =
  'rounded-full border border-transparent bg-foreground/[0.05] backdrop-blur-sm ' +
  'text-foreground placeholder:text-muted-foreground hover:bg-foreground/[0.08] transition-colors';

/** A filter field at rest looks the same as one in focus: only the caret moves. */
export const glassInputFocusClass =
  'focus-visible:outline-none focus-visible:ring-0 focus-visible:border-transparent focus-visible:shadow-none';

export const glassSelectFocusClass =
  'focus:outline-none focus:ring-0 focus:border-transparent focus:shadow-none';

/** Translucent dropdowns and popovers. */
export const glassDropdownClass = 'glass rounded-xl';

export const glassDropdownItemClass =
  'rounded-xl text-foreground focus:bg-foreground/[0.08] focus:text-foreground';

/** Sheets, bars and side panels: the medium iOS 27 glass, container radius. */
export const glassSurfaceClass = 'glass rounded-xl';

/** A LIGHT scrim: a full one leaves the blur nothing to refract. */
export const glassOverlayClass = 'bg-black/25 backdrop-blur-sm';

/** A row action inside a table or card. */
export const glassRowActionClass =
  'rounded-full text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground transition-colors';

/** The one place a semantic red hover is allowed. */
export const glassRowDestructiveActionClass =
  'rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors';

/** The single content sheet a list page lives in. */
export const panelClass = 'rounded-xl border border-border bg-card';

/**
 * iOS 27 replaced the binary Reduce Transparency toggle with a slider.
 * 0 = fully tinted, 1 = ultra clear. The material scales blur and opacity
 * together from this one number.
 */
export const GLASS_TRANSPARENCY_PRESETS = [
  { value: 0, label: 'Opaco' },
  { value: 0.25, label: 'Velato' },
  { value: 0.5, label: 'Predefinito' },
  { value: 0.75, label: 'Trasparente' },
  { value: 1, label: 'Cristallo' },
] as const;
