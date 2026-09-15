import { type HTMLAttributes, forwardRef, type ReactNode } from 'react';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'primary';
  onDelete?: () => void;
}

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ children, variant = 'neutral', onDelete, className = '', ...props }, ref) => {
    const variants = {
      neutral: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
      primary: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none"
            aria-label="Rimuovi"
          >
            <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
              <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Chip.displayName = 'Chip';
