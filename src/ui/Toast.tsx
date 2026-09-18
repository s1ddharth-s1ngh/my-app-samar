import { useToastStore } from '../stores/toast';
import { AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+96px)] md:bottom-6 md:items-end md:pr-6 p-4 flex flex-col items-center gap-2 z-50 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-xl p-4 text-foreground
            animate-in slide-in-from-bottom-5 fade-in duration-300 motion-reduce:animate-none
            ${toast.type === 'error' ? 'glass-tint-alert' : ''}`}
          role="alert"
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'error' ? (
              <AlertCircle size={18} className="text-destructive" aria-hidden="true" />
            ) : (
              <Info size={18} className="text-primary" aria-hidden="true" />
            )}
          </div>
          <div className="flex-1 text-sm font-medium pr-2">{toast.message}</div>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick();
                removeToast(toast.id);
              }}
              className="shrink-0 text-sm font-bold underline hover:no-underline px-2 py-1"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1"
            aria-label="Chiudi"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
