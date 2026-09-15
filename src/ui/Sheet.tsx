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
      className={`
        backdrop:bg-black/50 backdrop:backdrop-blur-sm
        fixed m-0 w-full max-w-none bg-white dark:bg-zinc-900 shadow-xl
        transition-transform duration-300
        
        /* Mobile: Bottom Sheet */
        inset-x-0 bottom-0 top-auto rounded-t-3xl border-t border-zinc-200 dark:border-zinc-800
        animate-in slide-in-from-bottom-full
        
        /* Desktop: Centered Modal */
        sm:bottom-auto sm:top-[10vh] sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md sm:rounded-2xl sm:border sm:border-zinc-200 sm:dark:border-zinc-800
        sm:animate-in sm:zoom-in-95 sm:slide-in-from-bottom-0 sm:fade-in
      `}
    >
      {/* Mobile drag handle */}
      <div className="w-full flex justify-center py-3 sm:hidden" onClick={onClose}>
        <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
      </div>

      <div className="px-4 pb-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h2>
          <IconButton icon={X} label="Chiudi" onClick={onClose} className="-mr-2" />
        </div>
        <div className="overflow-y-auto max-h-[80vh] sm:max-h-[70vh]">{children}</div>
      </div>
    </dialog>,
    document.body
  );
}
