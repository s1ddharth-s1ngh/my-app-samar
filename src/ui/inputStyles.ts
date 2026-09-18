import { cn } from '@/lib/cn';

/**
 * The shared look of every text input and select. A pill, like everything else
 * interactive on the surface; the fill is the field's own, so it reads as
 * something you can type into rather than as a chip.
 */
export const inputClasses = (hasError: boolean): string =>
  cn(
    // One control height across the whole app, as the toolbar demands.
    'block h-9 w-full rounded-full border bg-muted/60 px-4 text-foreground',
    'placeholder:text-muted-foreground',
    'transition-colors focus:outline-none focus:border-primary',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    hasError ? 'border-destructive' : 'border-border'
  );
