import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Calendar, Wallet, ListTodo, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Calendar, label: 'Oggi' },
  { to: '/soldi', icon: Wallet, label: 'Soldi' },
  { to: '/progetti', icon: ListTodo, label: 'Progetti' },
  { to: '/impostazioni', icon: Settings, label: 'Impostazioni' },
] as const;

/**
 * Collapses the tab bar to icons only while the user scrolls down, the web
 * equivalent of `tabBarMinimizeBehavior(.onScrollDown)`. Expands again on any
 * upward scroll so the labels are one gesture away.
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

export function Layout() {
  const minimized = useMinimizeOnScrollDown();

  return (
    <div className="max-w-[560px] mx-auto min-h-screen flex flex-col relative pb-[calc(env(safe-area-inset-bottom,0px)+108px)]">
      <main className="flex-1 px-4 pt-5 sm:px-6 sm:pt-8">
        <Outlet />
      </main>

      {/* The tab bar floats above the content: glass belongs to navigation only. */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pointer-events-none">
        <nav
          className="glass glass-group pointer-events-auto mx-auto max-w-[480px] rounded-[28px]"
          aria-label="Navigazione principale"
        >
          <ul className="flex justify-around items-center px-2">
            {NAV_ITEMS.map(({ to, icon, label }) => (
              <NavItem key={to} to={to} icon={icon} label={label} minimized={minimized} />
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

interface NavItemProps {
  to: string;
  icon: typeof Calendar;
  label: string;
  minimized: boolean;
}

function NavItem({ to, icon: Icon, label, minimized }: NavItemProps) {
  return (
    <li>
      <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          [
            // 44px minimum touch target, whatever the minimized state.
            'glass-item flex flex-col items-center justify-center gap-1 rounded-[20px]',
            'min-w-[56px] min-h-[44px] px-2 text-xs transition-all duration-200 motion-reduce:transition-none',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            minimized ? 'py-2' : 'py-2.5',
            isActive
              ? 'glass-tint-accent text-accent font-medium'
              : 'text-ink-muted hover:text-ink',
          ].join(' ')
        }
      >
        <Icon size={22} aria-hidden="true" />
        <span className={minimized ? 'sr-only' : ''}>{label}</span>
      </NavLink>
    </li>
  );
}
