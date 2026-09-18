import { cn } from '@/lib/cn';
import { FIELD } from '@/lib/surfaces';

/** The shared look of every text input and select: a quiet pill on the card. */
export const inputClasses = (hasError: boolean): string =>
  cn(FIELD, hasError && 'border-red-500/50');
