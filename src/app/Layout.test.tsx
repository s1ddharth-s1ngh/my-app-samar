import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { setViewportMatches } from '@/test/setup';

function renderLayout(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<p>Contenuto</p>} />
          <Route path="soldi" element={<p>Soldi</p>} />
          <Route path="soldi/entrate" element={<p>Entrate</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => setViewportMatches(false));

describe('Layout — desktop shell', () => {
  it('renders the header, the two navigation cards and the page', () => {
    renderLayout();

    expect(screen.getByRole('navigation', { name: 'Aree' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Sezioni di Oggi' })).toBeInTheDocument();
    expect(screen.getByText('Contenuto')).toBeInTheDocument();
  });

  it('shows the sections of the area the route belongs to', () => {
    renderLayout('/soldi/entrate');

    const sections = screen.getByRole('navigation', { name: 'Sezioni di Soldi' });
    expect(sections).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrate' })).toHaveAttribute('aria-current', 'page');
  });

  it('keeps the area home lit only on an exact match', () => {
    renderLayout('/soldi/entrate');

    expect(screen.getByRole('link', { name: 'Panoramica' })).not.toHaveAttribute('aria-current');
  });

  it('collapses to the icon rail without losing the navigation', async () => {
    const { container } = renderLayout();

    await userEvent.click(screen.getByRole('button', { name: 'Comprimi la barra' }));

    // Still both cards, just narrower.
    expect(screen.getByRole('navigation', { name: 'Aree' })).toBeInTheDocument();
    expect(container.querySelector('aside')?.className).toContain('w-16');
  });

  it('does not mount the phone shell', () => {
    renderLayout();
    expect(screen.queryByRole('button', { name: 'Tutte le sezioni' })).not.toBeInTheDocument();
  });
});

describe('Layout — phone shell', () => {
  it('renders the top bar, the bottom bar and the launcher', () => {
    setViewportMatches(true);
    renderLayout('/soldi');

    expect(screen.getByRole('navigation', { name: 'Navigazione' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tutte le sezioni' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Aree' })).not.toBeInTheDocument();
  });

  it('titles the top bar with the current section', () => {
    setViewportMatches(true);
    renderLayout('/soldi/entrate');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Entrate');
  });

  it('opens the launcher with the areas and the secondary sections', async () => {
    setViewportMatches(true);
    renderLayout('/soldi');

    await userEvent.click(screen.getByRole('button', { name: 'Tutte le sezioni' }));

    expect(screen.getByText('Aree')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Spese ricorrenti' })).toBeInTheDocument();
  });
});
