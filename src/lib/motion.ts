/**
 * Vocabolario di animazione condiviso — porta del sistema di `Telebi/builder-test`
 * (`src/lib/motion.ts`). Nessun componente inventa durate o easing propri: i
 * numeri stanno qui, le ragioni in `docs/ANIMAZIONI-UX.md`.
 */
export type Ease = [number, number, number, number];

/** Easing "firma": pannelli, drawer, movimenti decisi. */
export const EASE: Ease = [0.32, 0.72, 0, 1];
/** Ease-out esponenziale: entrate di liste e menu. */
export const EASE_OUT_EXPO: Ease = [0.16, 1, 0.3, 1];
/** Ease morbido generico: dissolvenze di pagina. */
export const SMOOTH_EASE: Ease = [0.25, 0.1, 0.25, 1];

/** Molla del feedback al tocco: reagisce al gesto invece di durare un tempo fisso. */
export const TAP_SPRING = { type: 'spring', stiffness: 400, damping: 15 } as const;
/** Rimpicciolimento al tocco. Visibile, non caricaturale. */
export const TAP = { scale: 0.95 } as const;
/** Variante per elementi grandi (righe, card), dove 0.95 sarebbe eccessivo. */
export const TAP_SOFT = { scale: 0.97 } as const;

/** Cascata delle voci di menu: si ferma all'ottava, o le ultime righe aspettano troppo. */
export const MENU_MOTION = {
  base: 0.04,
  stagger: 0.035,
  staggerMaxIndex: 7,
  duration: 0.45,
  ease: EASE_OUT_EXPO,
  from: { opacity: 0, y: 12 },
} as const;

/** Transizione d'ingresso della voce in posizione `index`. */
export const menuItemTransition = (index: number) => ({
  delay:
    MENU_MOTION.base +
    Math.min(Math.max(index, 0), MENU_MOTION.staggerMaxIndex) * MENU_MOTION.stagger,
  duration: MENU_MOTION.duration,
  ease: MENU_MOTION.ease,
});

/** Pannelli che si montano e smontano (fogli, launcher). */
export const PANEL_TRANSITION = { duration: 0.32, ease: EASE } as const;
/** Foglio dal basso (telefono). */
export const SHEET_UP = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
} as const;
/** Modale centrata (tablet/desktop). */
export const MODAL_POP = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 12 },
} as const;
/** Velo dietro un pannello. */
export const SCRIM = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

/** Dissolvenza di pagina a ogni cambio di rotta. */
export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24, ease: SMOOTH_EASE },
} as const;
