import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('boots into the desktop shell with both navigation levels', () => {
    render(<App />);

    // Level 1: the areas.
    expect(screen.getByRole('navigation', { name: 'Aree' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Soldi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lavoro' })).toBeInTheDocument();

    // Level 2: the sections of the area the route lands in.
    expect(screen.getByRole('navigation', { name: 'Sezioni di Oggi' })).toBeInTheDocument();
  });
});
