import { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { PlatformHeader } from './PlatformHeader';
import { MobileShell } from './MobileShell';
import { resolveArea } from './navigation';
import { useIsMobile } from '@/lib/useIsMobile';

/**
 * Two shells, one mounted at a time:
 *
 *   ≥ 768px  header on top, sidebar to the left, the page scrolls inside <main>
 *   < 768px  fixed top bar, scrolling middle, bottom bar with a launcher
 *
 * Only one renders, so a screen mounts once and its effects run once. The
 * breakpoint is read synchronously on the first render, so nothing flashes.
 */
export function Layout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);
  const area = resolveArea(location.pathname);
  const isMobile = useIsMobile();

  // A new page starts at the top, even though the scroll lives inside <main>.
  // jsdom has no scrollTo, so the guard keeps tests honest rather than mocked.
  useLayoutEffect(() => {
    const main = mainRef.current;
    if (typeof main?.scrollTo === 'function') {
      main.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [location.pathname]);

  if (isMobile) {
    return (
      <MobileShell area={area}>
        <div className="w-full px-2 py-2 pb-4">
          <Outlet />
        </div>
      </MobileShell>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-black">
      <div className="relative flex h-full w-full flex-col">
        <PlatformHeader />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar area={area} />
          <main ref={mainRef} className="scrollbar-thin flex-1 overflow-y-auto">
            <div className="w-full px-3 py-3 pb-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
