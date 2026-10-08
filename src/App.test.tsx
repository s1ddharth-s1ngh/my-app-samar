import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('boots into the desktop shell with both navigation levels', async () => {
    render(<App />);

    // Level 1: the areas — on screen once the store has read IndexedDB.
    expect(await screen.findByRole('navigation', { name: 'Aree' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Soldi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lavoro' })).toBeInTheDocument();

    // Level 2: the sections of the area the route lands in.
    expect(screen.getByRole('navigation', { name: 'Sezioni di Agenda' })).toBeInTheDocument();
  });
});
