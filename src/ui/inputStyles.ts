/** The shared look of every text input, select and textarea in the app. */
export const inputClasses = (hasError: boolean): string =>
  [
    'block w-full rounded-[12px] border bg-surface-2 px-4 py-3 text-ink',
    'placeholder:text-ink-faint',
    'transition-colors duration-200 motion-reduce:transition-none',
    'focus:outline-none focus:border-accent-strong focus:shadow-[var(--shadow-focus)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    hasError ? 'border-alert' : 'border-line',
  ].join(' ');
