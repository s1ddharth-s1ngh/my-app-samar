import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the bottom navigation', () => {
    render(<App />);
    expect(screen.getAllByText('Oggi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Soldi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Progetti').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Impostazioni').length).toBeGreaterThan(0);
  });
});
