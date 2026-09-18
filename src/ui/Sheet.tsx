import { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Sheet({ isOpen, onClose, title, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        document.body.style.overflow = 'hidden';
      }
    } else {
      if (dialog.open) {
        dialog.close();
        document.body.style.overflow = '';
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    const handleClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!isInDialog) {
        onClose();
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleClick);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label={title}
      className={`
        /* A LIGHT scrim: a full one leaves the blur nothing to refract. */
        backdrop:bg-black/25 backdrop:backdrop-blur-sm
        glass fixed m-0 w-full max-w-none p-0 text-foreground scrollbar-glass

        /* Phone: bottom sheet */
        inset-x-0 bottom-0 top-auto rounded-t-xl
        animate-in slide-in-from-bottom-full motion-reduce:animate-none

        /* Tablet and desktop: centred modal */
        md:bottom-auto md:top-[10vh] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg
        md:rounded-xl
        md:animate-in md:zoom-in-95 md:slide-in-from-bottom-0 md:fade-in
      `}
    >
      {/* Mobile drag handle */}
      <button
        type="button"
        className="w-full flex justify-center py-3 md:hidden"
        onClick={onClose}
        aria-label="Chiudi"
      >
        <span className="w-12 h-1.5 rounded-full bg-foreground/25" />
      </button>

      <div className="px-4 pb-4 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="page-title">{title}</h2>
          <IconButton icon={X} label="Chiudi" onClick={onClose} className="-mr-2" />
        </div>
        <div className="overflow-y-auto overscroll-contain max-h-[70vh] md:max-h-[65vh]">
          {children}
        </div>
      </div>
    </dialog>,
    document.body
  );
}
