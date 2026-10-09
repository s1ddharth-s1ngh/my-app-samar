import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/useIsMobile';
import { CARD_NAV } from '@/lib/surfaces';
import { AREAS, areaByKey, getSections, isSectionActive, type AreaKey } from './navigation';

const COLLAPSED_KEY = 'ciclo-sidebar-collapsed';

/**
 * Two floating cards stacked in a column: the areas, then the sections of the
 * area you are browsing. Collapsing narrows both to the icon chip alone — the
 * navigation never disappears, and the two cards keep the same width in either
 * state because the pill is identical in both.
 */
export function AppSidebar({ area }: { area: AreaKey }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [storedCollapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, storedCollapsed ? '1' : '0');
    } catch {
      // The choice still applies for this session.
    }
  }, [storedCollapsed]);

  const compact = useMediaQuery('(max-width: 1023px)');
  const collapsed = storedCollapsed || compact;

  const sections = getSections(area);
  const current = areaByKey(area);
  const AreaIcon = current.icon;

  return (
    <div className="relative z-30 hidden h-full flex-shrink-0 py-3 pl-3 md:block">
      <aside
        className={cn(
          'flex h-full flex-col gap-3 text-foreground transition-[width] duration-300 motion-reduce:transition-none',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Card 1 — the areas */}
        <nav
          aria-label="Aree"
          className={cn(CARD_NAV, 'flex-shrink-0 space-y-1', collapsed ? 'px-2 py-3' : 'p-3')}
        >
          {AREAS.map((entry) => {
            const Icon = entry.icon;
            const active = area === entry.key;
            return (
              <button
                key={entry.key}
                type="button"
                title={entry.label}
                aria-label={entry.label}
                aria-current={active ? 'page' : undefined}
                onClick={() => navigate(entry.home)}
                className={pillClass(active, collapsed)}
              >
                <span className={chipClass(active)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {!collapsed && (
                  <span className="truncate text-[13px] tracking-[-0.2px]">{entry.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Card 2 — the sections of the area being browsed */}
        <div className={cn(CARD_NAV, 'flex min-h-0 flex-1 flex-col overflow-hidden')}>
          <div
            className={cn(
              'hidden lg:flex flex-shrink-0 items-center pt-3.5 pb-1.5',
              collapsed ? 'justify-center px-2' : 'gap-2 px-4'
            )}
          >
            {!collapsed && (
              <>
                <AreaIcon className="h-4 w-4" />
                <span className="truncate text-xs font-semibold tracking-wide">
                  {current.label.toUpperCase()}
                </span>
              </>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              title={collapsed ? 'Espandi la barra' : 'Comprimi la barra'}
              aria-label={collapsed ? 'Espandi la barra' : 'Comprimi la barra'}
              aria-expanded={!collapsed}
              className={cn(
                'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground',
                !collapsed && 'ml-auto'
              )}
            >
              {collapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <ChevronsLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          <nav
            aria-label={`Sezioni di ${current.label}`}
            className={cn(
              'scrollbar-thin flex-1 space-y-1 overflow-y-auto pt-1.5',
              collapsed ? 'px-2 pb-3' : 'p-3 pt-1.5'
            )}
          >
            {sections.map((section) => {
              const active = isSectionActive(location.pathname, section);
              const Icon = section.icon;
              return (
                <Link
                  key={section.id}
                  to={section.href}
                  title={section.label}
                  aria-label={section.label}
                  aria-current={active ? 'page' : undefined}
                  className={pillClass(active, collapsed)}
                >
                  <span className={chipClass(active)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {!collapsed && (
                    <span className="truncate text-[13px] tracking-[-0.2px]">{section.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </div>
  );
}

/**
 * The same pill serves both cards. A fixed `h-10` in either state means
 * collapsing changes only the width, so the column keeps its rhythm.
 */
function pillClass(active: boolean, collapsed: boolean): string {
  return cn(
    'group flex h-10 w-full items-center rounded-full font-medium transition-colors',
    collapsed ? 'justify-center px-1' : 'gap-2.5 pl-1.5 pr-3',
    active
      ? 'bg-selected text-selected-foreground'
      : 'text-secondary hover:bg-foreground/[0.05] hover:text-foreground'
  );
}

function chipClass(active: boolean): string {
  return cn(
    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors',
    active
      ? 'bg-selected-foreground/10 text-selected-foreground'
      : 'bg-foreground/[0.07] text-foreground'
  );
}
