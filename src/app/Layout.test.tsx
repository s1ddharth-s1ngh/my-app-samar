import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';

function renderLayout(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<p>Contenuto</p>} />
          <Route path="soldi" element={<p>Soldi</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('Layout', () => {
  it('ships both navigations so the breakpoint can choose, not a resize listener', () => {
    renderLayout();

    const navs = screen.getAllByRole('navigation', { name: 'Navigazione principale' });
    expect(navs).toHaveLength(2);
  });

  it('hides the rail below md and the tab bar from md up', () => {
    const { container } = renderLayout();

    const rail = container.querySelector('aside');
    expect(rail?.className).toContain('hidden');
    expect(rail?.className).toContain('md:flex');

    const bottomBar = container.querySelector('.fixed.inset-x-0.bottom-0');
    expect(bottomBar?.className).toContain('md:hidden');
  });

  it('reveals the rail labels only at the desktop breakpoint', () => {
    const { container } = renderLayout();

    const label = container.querySelector('aside nav span');
    expect(label?.className).toContain('hidden');
    expect(label?.className).toContain('xl:inline');
  });

  it('widens the content column at each breakpoint', () => {
    const { container } = renderLayout();

    const column = container.querySelector('main > div');
    expect(column?.className).toContain('max-w-[560px]');
    expect(column?.className).toContain('md:max-w-[760px]');
    expect(column?.className).toContain('xl:max-w-[1100px]');
  });

  it('marks the current route in both navigations', () => {
    renderLayout('/soldi');

    const current = screen.getAllByRole('link', { current: 'page' });
    expect(current).toHaveLength(2);
    expect(current[0]).toHaveTextContent('Soldi');
  });

  it('renders the routed screen', () => {
    renderLayout();
    expect(screen.getByText('Contenuto')).toBeInTheDocument();
  });
});
