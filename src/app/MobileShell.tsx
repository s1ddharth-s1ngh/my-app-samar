import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  AREAS,
  areaByKey,
  getPrimarySections,
  getSecondarySections,
  isSectionActive,
  resolveTitle,
  type AreaKey,
  type NavSection,
} from './navigation';

/**
 * The phone shell: a fixed top bar, the only scrolling region in the middle,
 * and a bottom bar with a launcher in the centre. `fixed inset-0` pins it to
 * the viewport whatever the browser does with `dvh`, so neither bar scrolls.
 */
export function MobileShell({ area, children }: { area: AreaKey; children: ReactNode }) {
  const location = useLocation();
  const [launcherOpen, setLauncherOpen] = useState(false);

  const primary = getPrimarySections(area);
  const secondary = getSecondarySections(area);
  const title = resolveTitle(location.pathname);

  return (
    <>
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-black">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-black px-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1E6FFF] text-[11px] font-bold">
            C
          </span>
          <h1 className="min-w-0 flex-1 truncate text-[14px] font-semibold tracking-[-0.02em]">
            {title}
          </h1>
          <span className="text-[10px] tracking-[0.07em] text-white/35 uppercase">
            {areaByKey(area).label}
          </span>
        </header>

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          {children}
        </main>

        <BottomNav
          sections={primary}
          pathname={location.pathname}
          launcherOpen={launcherOpen}
          onLauncher={() => setLauncherOpen((open) => !open)}
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
      className="sticky bottom-0 z-40 shrink-0 border-t border-white/[0.07] bg-[#0b0b0d]/90 shadow-[0_-8px_28px_rgba(0,0,0,0.55)] backdrop-blur-xl"
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
              'relative flex h-12 w-12 items-center justify-center rounded-[18px] text-white transition-transform active:scale-95',
              launcherOpen
                ? 'bg-white/[0.12]'
                : 'bg-[#1E6FFF] shadow-[0_8px_24px_rgba(30,111,255,0.45)]'
            )}
          >
            {launcherOpen ? (
              <X className="h-[21px] w-[21px]" />
            ) : (
              <LayoutGrid className="h-[21px] w-[21px]" />
            )}
          </button>
          <span className="mt-1 text-[10px] leading-none font-semibold tracking-tight text-white/80">
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
      aria-current={active ? 'page' : undefined}
      className="relative flex h-16 flex-col items-center justify-center gap-1 transition-transform active:scale-95"
    >
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
          active ? 'bg-white/[0.12] text-white' : 'text-white/45'
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span
        className={cn(
          'text-[10px] leading-none tracking-tight',
          active ? 'font-semibold text-white' : 'text-white/45'
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Chiudi il menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] rounded-[20px] border border-white/[0.08] bg-[#121212] p-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]">
        <p className="px-1 pb-2 text-[9.5px] font-semibold tracking-[0.07em] text-white/30 uppercase">
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
                onClick={onClose}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl px-1 py-3 transition-colors',
                  active ? 'bg-neutral-200 text-neutral-900' : 'bg-white/[0.04] text-white/70'
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
            <p className="px-1 pt-4 pb-2 text-[9.5px] font-semibold tracking-[0.07em] text-white/30 uppercase">
              Altre sezioni
            </p>
            <div className="space-y-1">
              {secondary.map((section) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.id}
                    to={section.href}
                    onClick={onClose}
                    className="flex h-10 items-center gap-2.5 rounded-full pr-3 pl-1.5 text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07]">
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
