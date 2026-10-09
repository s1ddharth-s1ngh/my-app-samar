import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';
import { TAP, TAP_SPRING } from '@/lib/motion';
import { PILL_BRAND, PILL_DANGER, PILL_QUIET } from '@/lib/surfaces';

export interface ButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof HTMLMotionProps<'button'>>,
    HTMLMotionProps<'button'> {
  /** `brand` is the one filled brand button on a page; everything else is quiet. */
  variant?: 'brand' | 'quiet' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  brand: PILL_BRAND,
  quiet: PILL_QUIET,
  ghost:
    'px-3 h-7 rounded-full text-[11px] font-medium text-white/45 hover:text-white hover:bg-white/[0.06] transition-colors',
  danger: PILL_DANGER,
};

/** `md` matches the toolbar height used everywhere else. */
const SIZES = { sm: 'h-7', md: 'h-9 px-4 text-[12px]' } as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'brand', size = 'sm', fullWidth = false, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileTap={props.disabled ? undefined : TAP}
      transition={TAP_SPRING}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';
