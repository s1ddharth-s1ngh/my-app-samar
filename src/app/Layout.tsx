import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Calendar, Wallet, ListTodo, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface NavEntry {
  to: string;
  icon: LucideIcon;
  label: string;
}

const NAV: NavEntry[] = [
  { to: '/', icon: Calendar, label: 'Oggi' },
  { to: '/soldi', icon: Wallet, label: 'Soldi' },
  { to: '/progetti', icon: ListTodo, label: 'Progetti' },
  { to: '/impostazioni', icon: Settings, label: 'Impostazioni' },
];

/**
 * Three layouts, one tree — the breakpoint does the switching, so there is no
 * flash on load and no resize listener deciding what to render:
 *
 *   < 768px   phone   — single column, floating glass tab bar at the bottom
 *   768–1279  tablet  — fixed icon rail on the left, wider content, 2 columns
 *   ≥ 1280px  desktop — labelled sidebar, centred content, up to 4 columns
 */
export function Layout() {
  return (
    <div className="min-h-screen md:flex">
      <SideNav />

      <main
        className={cn(
          'min-w-0 flex-1',
          // The phone leaves room for the floating bar; the rail does not.
          'px-4 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+104px)]',
          'md:px-6 md:pt-7 md:pb-10',
          'xl:px-10 xl:pt-10'
        )}
      >
        <div className="mx-auto w-full max-w-[560px] md:max-w-[760px] xl:max-w-[1100px]">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

/** Tablet and desktop: a rail that grows labels at `xl`. */
function SideNav() {
  return (
    <aside
      className={cn(
        'hidden md:flex md:sticky md:top-0 md:h-screen md:shrink-0 md:flex-col',
        'border-r border-border bg-card/60 backdrop-blur-xl',
        'md:w-[72px] md:px-2 md:py-4',
        'xl:w-[248px] xl:px-3'
      )}
    >
      <div className="mb-6 flex h-10 items-center justify-center xl:justify-start xl:px-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/[0.07] text-sm font-bold"
          aria-hidden="true"
        >
          C
        </span>
        <span className="ml-2 hidden text-base font-semibold tracking-[-0.02em] xl:inline">
          Ciclo
        </span>
      </div>

      <nav aria-label="Navigazione principale" className="flex-1">
        <ul className="space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                title={label}
                className={({ isActive }) =>
                  cn(
                    'flex h-11 items-center rounded-full transition-colors',
                    'justify-center xl:justify-start xl:px-3',
                    isActive
                      ? 'bg-foreground/[0.07] text-foreground'
                      : 'text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground'
                  )
                }
              >
                <Icon size={19} aria-hidden="true" />
                <span className="ml-3 hidden text-sm font-medium xl:inline">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

/**
 * Collapses the tab bar to icons only while the user scrolls down, and expands
 * it again on any upward scroll. Phone only.
 */
function useMinimizeOnScrollDown(): boolean {
  const [minimized, setMinimized] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) > 8) {
        setMinimized(delta > 0 && y > 64);
        lastY.current = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return minimized;
}

function BottomNav() {
  const minimized = useMinimizeOnScrollDown();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] md:hidden">
      <nav
        aria-label="Navigazione principale"
        className="glass glass-group pointer-events-auto mx-auto max-w-[480px] rounded-full p-1"
      >
        <ul className="flex items-center justify-around">
          {NAV.map(({ to, icon: Icon, label }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    // 44px minimum touch target, whatever the minimized state.
                    'glass-item flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-full px-2 text-[11px]',
                    'transition-all duration-200 motion-reduce:transition-none',
                    minimized ? 'py-2' : 'py-1.5',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )
                }
              >
                <Icon size={20} aria-hidden="true" />
                <span className={minimized ? 'sr-only' : ''}>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
