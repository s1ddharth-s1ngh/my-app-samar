import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  AREAS,
  getPrimarySections,
  getSecondarySections,
  isSectionActive,
  type AreaKey,
  type NavSection,
} from './navigation';

/**
 * The phone shell: one scrolling region filling the viewport and a bottom bar
 * with a launcher in the centre. `fixed inset-0` pins it to the viewport
 * whatever the browser does with `dvh`, so the bar never scrolls.
 */
export function MobileShell({ area, children }: { area: AreaKey; children: ReactNode }) {
  const location = useLocation();
  const [launcher, setLauncher] = useState({ pathname: location.pathname, open: false });
  if (launcher.pathname !== location.pathname) {
    setLauncher({ pathname: location.pathname, open: false });
  }
  const launcherOpen = launcher.pathname === location.pathname && launcher.open;
  const setLauncherOpen = (open: boolean) => setLauncher({ pathname: location.pathname, open });
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    mainRef.current?.scrollTo?.({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => {
    if (!launcherOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLauncher({ pathname: location.pathname, open: false });
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [launcherOpen, location.pathname]);

  const primary = getPrimarySections(area);
  const secondary = getSecondarySections(area);

  return (
    <>
      <div className="mobile-shell fixed inset-0 flex flex-col overflow-hidden bg-canvas">
        <main
          ref={mainRef}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          {children}
        </main>

        <BottomNav
          sections={primary}
          pathname={location.pathname}
          launcherOpen={launcherOpen}
          onLauncher={() => setLauncherOpen(!launcherOpen)}
        />
      </div>

      <Launcher
        open={launcherOpen}
        onClose={() => setLauncherOpen(false)}
        area={area}
        secondary={secondary}
      />
    </>
  );
}

function BottomNav({
  sections,
  pathname,
  launcherOpen,
  onLauncher,
}: {
  sections: NavSection[];
  pathname: string;
  launcherOpen: boolean;
  onLauncher: () => void;
}) {
  // Four slots plus the launcher in the middle: the bar never reflows.
  const left = sections.slice(0, 2);
  const right = sections.slice(2, 4);

  return (
    <nav
      aria-label="Navigazione"
      className="sticky bottom-0 z-40 shrink-0 border-t border-border bg-card/95 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid h-16 grid-cols-5">
        {[0, 1].map((index) => (
          <NavSlot key={`l${index}`} section={left[index]} pathname={pathname} />
        ))}

        <div className="relative flex flex-col items-center justify-end pb-1.5">
          <button
            type="button"
            onClick={onLauncher}
            aria-expanded={launcherOpen}
            aria-label="Tutte le sezioni"
            className={cn(
              'mobile-launcher-button relative flex h-12 w-12 items-center justify-center rounded-[18px] text-foreground',
              launcherOpen ? 'bg-foreground/[0.12]' : 'bg-brand text-on-brand shadow-card'
            )}
          >
            <LayoutGrid
              className={cn('mobile-launcher-icon h-[21px] w-[21px]', launcherOpen && 'is-hidden')}
            />
            <X
              className={cn(
                'mobile-launcher-icon absolute h-[21px] w-[21px]',
                !launcherOpen && 'is-hidden'
              )}
            />
          </button>
          <span className="mt-1 text-[10px] leading-none font-semibold tracking-tight text-secondary">
            Menu
          </span>
        </div>

        {[0, 1].map((index) => (
          <NavSlot key={`r${index}`} section={right[index]} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}

function NavSlot({ section, pathname }: { section?: NavSection; pathname: string }) {
  if (!section) return <div className="h-16" />;

  const active = isSectionActive(pathname, section);
  const Icon = section.icon;

  return (
    <Link
      to={section.href}
      viewTransition
      aria-current={active ? 'page' : undefined}
      className="mobile-nav-slot relative flex h-16 flex-col items-center justify-center gap-1"
    >
      <span
        className={cn(
          'mobile-nav-icon flex h-7 w-7 items-center justify-center rounded-full',
          active ? 'bg-foreground/[0.12] text-foreground' : 'text-muted-foreground'
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span
        className={cn(
          'mobile-nav-label text-[10px] leading-none tracking-tight',
          active ? 'font-semibold text-foreground' : 'text-muted-foreground'
        )}
      >
        {section.label}
      </span>
    </Link>
  );
}

/** Everything that did not fit the bottom bar, plus the jump between areas. */
function Launcher({
  open,
  onClose,
  area,
  secondary,
}: {
  open: boolean;
  onClose: () => void;
  area: AreaKey;
  secondary: NavSection[];
}) {
  return (
    <div
      className={cn('mobile-launcher fixed inset-0 z-50', open && 'is-open')}
      aria-hidden={!open}
      inert={!open}
    >
      <button
        type="button"
        aria-label="Chiudi il menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] max-h-[calc(100dvh-110px)] overflow-y-auto rounded-[20px] border border-border bg-card p-3 shadow-card">
        <p className="px-1 pb-2 text-[9.5px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
          Aree
        </p>
        <div className="grid grid-cols-4 gap-2">
          {AREAS.map((entry) => {
            const Icon = entry.icon;
            const active = entry.key === area;
            return (
              <Link
                key={entry.key}
                to={entry.home}
                viewTransition
                onClick={onClose}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl px-1 py-3 transition-colors',
                  active
                    ? 'bg-selected text-selected-foreground'
                    : 'bg-foreground/[0.04] text-secondary'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-medium">{entry.label}</span>
              </Link>
            );
          })}
        </div>

        {secondary.length > 0 && (
          <>
            <p className="px-1 pt-4 pb-2 text-[9.5px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
              Altre sezioni
            </p>
            <div className="space-y-1">
              {secondary.map((section) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.id}
                    to={section.href}
                    viewTransition
                    onClick={onClose}
                    className="flex h-10 items-center gap-2.5 rounded-full pr-3 pl-1.5 text-secondary transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/[0.07]">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[13px] tracking-[-0.2px]">{section.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
