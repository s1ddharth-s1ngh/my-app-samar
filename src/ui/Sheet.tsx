import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { useIsMobile } from '@/lib/useIsMobile';
import { MODAL_POP, PANEL_TRANSITION, SHEET_UP } from '@/lib/motion';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Bottom sheet on a phone, centred modal from `md` up.
 *
 * The <dialog> stays for what it gives for free (Esc, focus trap, inert page);
 * the movement is framer-motion, because the dialog has to stay open until the
 * exit finishes — `dialog.close()` would cut the animation off mid-way. So the
 * node is kept mounted while the panel leaves and closed in `onExitComplete`.
 */
export function Sheet({ isOpen, onClose, title, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  // Stays true until the exit animation has finished, so the panel can leave.
  const [mounted, setMounted] = useState(isOpen);

  // Adjusting state during render (not in an effect): opening has to be visible
  // in this same render, or the panel would animate in one frame late.
  if (isOpen && !mounted) setMounted(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (mounted && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    }
    if (!mounted && dialog.open) {
      dialog.close();
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mounted]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    // The dialog now fills the viewport, so "outside" means outside the panel.
    const handleClick = (e: MouseEvent) => {
      const panel = panelRef.current;
      if (panel && !panel.contains(e.target as Node)) onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleClick);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  if (!mounted) return null;

  const panelMotion = isMobile ? SHEET_UP : MODAL_POP;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label={title}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 text-foreground backdrop:bg-black/25 backdrop:backdrop-blur-sm"
    >
      <AnimatePresence onExitComplete={() => setMounted(false)}>
        {isOpen && (
          <motion.div
            ref={panelRef}
            key="panel"
            initial={panelMotion.initial}
            animate={panelMotion.animate}
            exit={panelMotion.exit}
            transition={PANEL_TRANSITION}
            className="glass scrollbar-glass fixed inset-x-0 bottom-0 rounded-t-xl md:top-[10vh] md:bottom-auto md:mx-auto md:max-w-lg md:rounded-xl"
          >
            {/* Mobile drag handle */}
            <button
              type="button"
              className="flex w-full justify-center py-3 md:hidden"
              onClick={onClose}
              aria-label="Chiudi"
            >
              <span className="h-1.5 w-12 rounded-full bg-foreground/25" />
            </button>

            <div className="px-4 pb-4 md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="page-title">{title}</h2>
                <IconButton icon={X} label="Chiudi" onClick={onClose} className="-mr-2" />
              </div>
              <div className="max-h-[70vh] overflow-y-auto overscroll-contain md:max-h-[65vh]">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>,
    document.body
  );
}
