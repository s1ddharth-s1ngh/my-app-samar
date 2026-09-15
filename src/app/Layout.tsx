import { Outlet, NavLink } from 'react-router-dom';
import { Calendar, Wallet, ListTodo, Settings } from 'lucide-react';

export function Layout() {
  return (
    <div className="max-w-[560px] mx-auto min-h-screen bg-surface flex flex-col relative pb-[calc(env(safe-area-inset-bottom,16px)+64px)] shadow-sm">
      <main className="flex-1">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-[560px] mx-auto bg-surface border-t border-line pb-[env(safe-area-inset-bottom,0px)] z-50">
        <ul className="flex justify-around items-center h-16 px-2">
          <NavItem to="/" icon={<Calendar size={24} />} label="Oggi" />
          <NavItem to="/soldi" icon={<Wallet size={24} />} label="Soldi" />
          <NavItem to="/progetti" icon={<ListTodo size={24} />} label="Progetti" />
          <NavItem to="/impostazioni" icon={<Settings size={24} />} label="Impostazioni" />
        </ul>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-16 h-full gap-1 text-xs transition-colors ${
            isActive ? 'text-accent font-medium' : 'text-ink-muted hover:text-ink'
          }`
        }
      >
        {icon}
        <span>{label}</span>
      </NavLink>
    </li>
  );
}
