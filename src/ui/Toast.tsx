import { useToastStore } from '../stores/toast';
import { AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col items-center sm:items-end gap-2 z-50 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-xl p-4 shadow-lg border transition-all animate-in slide-in-from-bottom-5 fade-in duration-300 ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:border-red-900 dark:text-red-200'
              : 'bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100'
          }`}
          role="alert"
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'error' ? (
              <AlertCircle size={18} className="text-red-500" />
            ) : (
              <Info size={18} className="text-blue-500" />
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
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity p-1"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
