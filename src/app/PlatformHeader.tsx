import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Settings } from 'lucide-react';
import { useDataStore } from '@/stores/useDataStore';
import { formatCents } from '@/domain/money';

const CLOCK_FORMAT = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
});

/**
 * The top bar: identity on the left, the one number that matters in the middle,
 * passive context and settings on the right. 56px, black, one hairline below.
 */
export function PlatformHeader() {
  const [now, setNow] = useState(() => new Date());
  const cycles = useDataStore((state) => state.cycles);
  const allocations = useDataStore((state) => state.allocations);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const activeCycle = cycles.find((cycle) => cycle.status === 'active' && !cycle.deletedAt);
  const available = activeCycle
    ? allocations
        .filter((item) => item.cycleId === activeCycle.id && !item.deletedAt)
        .reduce((acc, item) => acc + (item.plannedAmount - item.actualAmount), 0)
    : null;

  const time = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  return (
    <header className="z-50 flex h-14 w-full shrink-0 items-center gap-5 border-b border-white/[0.06] bg-black px-5">
      <Link to="/" className="flex shrink-0 items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E6FFF] text-[13px] font-bold text-white">
          C
        </span>
        <span className="hidden text-[15px] font-semibold tracking-[-0.02em] sm:inline">Samar</span>
      </Link>

      {/* The centre carries the one figure worth seeing from every page. */}
      <div className="flex min-w-0 flex-1 justify-center">
        {available !== null && (
          <Link
            to="/soldi"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 transition-colors hover:bg-white/[0.08]"
          >
            <span className="text-[9.5px] font-semibold tracking-[0.07em] text-white/35 uppercase">
              Disponibile
            </span>
            <span
              data-numeric=""
              className={`text-[13px] font-semibold ${available < 0 ? 'text-red-300' : 'text-white'}`}
            >
              {formatCents(available, { compact: true })}
            </span>
          </Link>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden text-[11px] text-white/40 capitalize tabular-nums xl:inline">
          {CLOCK_FORMAT.format(now)} · {time}
        </span>

        <Link
          to="/"
          title="Oggi"
          aria-label="Oggi"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] transition-colors hover:bg-white/[0.1]"
        >
          <CalendarDays className="h-4 w-4 text-white/60" />
        </Link>

        <Link
          to="/impostazioni"
          title="Impostazioni"
          aria-label="Impostazioni"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] transition-colors hover:bg-white/[0.1]"
        >
          <Settings className="h-4 w-4 text-white/60" />
        </Link>
      </div>
    </header>
  );
}
