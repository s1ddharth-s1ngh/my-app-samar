type ClassValue = string | false | null | undefined;

/** Joins class names, dropping the falsy ones. Later classes win by source order. */
export function cn(...values: ClassValue[]): string {
  return values
    .filter((value): value is string => typeof value === 'string' && value !== '')
    .join(' ');
}
