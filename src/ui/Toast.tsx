import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Check, CircleAlert, Info, X } from 'lucide-react';
import { TOAST_DURATION_MS, type Toast, useToastStore } from '../stores/toast';
import { cn } from '@/lib/cn';

const TOAST_TONE = {
  success: { icon: Check, iconClass: 'bg-good/15 text-good' },
  error: { icon: CircleAlert, iconClass: 'bg-bad/10 text-bad' },
  info: { icon: Info, iconClass: 'bg-brand/10 text-brand-soft' },
} as const;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const tone = TOAST_TONE[toast.type];
  const Icon = tone.icon;
  const pointerStart = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [remaining, setRemaining] = useState(TOAST_DURATION_MS);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, TOAST_DURATION_MS - (Date.now() - startedAt)));
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  const endSwipe = () => {
    if (Math.abs(dragX) > 64) onDismiss();
    else setDragX(0);
    pointerStart.current = null;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStart.current === null) return;
    setDragX(Math.max(-120, Math.min(120, event.clientX - pointerStart.current)));
  };

  return (
    <div
      className="toast-enter pointer-events-auto relative w-full touch-pan-y overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm"
      role={toast.type === 'error' ? 'alert' : 'status'}
      style={{
        opacity: 1 - Math.min(Math.abs(dragX) / 180, 0.45),
        transform: `translateX(${dragX}px)`,
        transition: dragX === 0 ? 'transform 180ms ease, opacity 180ms ease' : 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endSwipe}
      onPointerCancel={endSwipe}
    >
      <div className="flex min-h-13 items-center gap-2.5 px-3 py-2.5">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            tone.iconClass
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 text-[12px] font-medium leading-snug">{toast.message}</p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              onDismiss();
            }}
            className="min-h-8 shrink-0 rounded-full px-2 text-[11px] font-semibold text-brand-soft hover:bg-brand/10"
          >
            {toast.action.label}
          </button>
        )}
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
          {Math.max(1, Math.ceil(remaining / 1000))}s
        </span>
        <button
          onClick={onDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Chiudi"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <span
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-brand/60"
        style={{ transform: `scaleX(${remaining / TOAST_DURATION_MS})` }}
        aria-hidden="true"
      />
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-3 bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] z-[60] flex w-[min(21rem,calc(100vw-1.5rem))] flex-col items-end gap-2 md:right-6 md:bottom-6"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}
