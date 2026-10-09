import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/** Keep the outgoing view until its brief fade ends, then reveal the new view. */
export function TabPanel({
  value,
  label,
  children,
}: {
  value: string;
  label: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={value}
        role="tabpanel"
        aria-label={label}
        initial={reduceMotion ? false : { opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? {} : { opacity: 0, y: -3 }}
        transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
