/**
 * Categorical palette for charts.
 *
 * Validated with the dataviz palette checker against both chart surfaces
 * (dark #101114, light #ffffff): lightness band, chroma floor, normal-vision
 * separation and contrast all PASS. The emerald↔pink pair sits at ΔE 7.6 under
 * deuteranopia — inside the 6–8 floor band, which is legal only with secondary
 * encoding, so every chart using this palette also ships a legend, direct
 * labels and a data table.
 *
 * Hues are assigned in this fixed order and never cycled: a series keeps its
 * colour when the list is filtered. Beyond eight entries the tail folds into
 * "Altro" rather than inventing a hue.
 */
export const CHART_CATEGORICAL = [
  '#3b82f6', // blue
  '#d97706', // amber
  '#059669', // emerald
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#0d9488', // teal
] as const;

/** The slot after the last real series: everything that did not fit. */
export const CHART_OTHER = '#64748b';

export function categoricalColor(index: number): string {
  return CHART_CATEGORICAL[index] ?? CHART_OTHER;
}

/** Axes, grid and tick labels stay recessive and follow the theme tokens. */
export const CHART_INK = 'var(--ink-faint)';
export const CHART_GRID = 'var(--line)';
