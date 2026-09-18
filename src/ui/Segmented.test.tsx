import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Segmented } from './Segmented';

const OPTIONS = [
  { value: 'all', label: 'Tutti' },
  { value: 'active', label: 'Attivi' },
  { value: 'inactive', label: 'Inattivi' },
];

describe('Segmented', () => {
  it('exposes a radio group with the current segment checked', () => {
    render(<Segmented ariaLabel="Stato" options={OPTIONS} value="active" onChange={() => {}} />);

    expect(screen.getByRole('radiogroup', { name: 'Stato' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Attivi' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Tutti' })).not.toBeChecked();
  });

  it('slides the pill by exact multiples of its own width', () => {
    const { container, rerender } = render(
      <Segmented ariaLabel="Stato" options={OPTIONS} value="all" onChange={() => {}} />
    );

    const pill = container.querySelector('[aria-hidden="true"]');
    expect(pill).toHaveStyle({ transform: 'translateX(0%) translateY(-50%)' });

    rerender(
      <Segmented ariaLabel="Stato" options={OPTIONS} value="inactive" onChange={() => {}} />
    );
    expect(pill).toHaveStyle({ transform: 'translateX(200%) translateY(-50%)' });
  });

  it('reports the segment the user clicks', async () => {
    const onChange = vi.fn();
    render(<Segmented ariaLabel="Stato" options={OPTIONS} value="all" onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: 'Inattivi' }));
    expect(onChange).toHaveBeenCalledWith('inactive');
  });

  it('moves with the arrow keys and wraps around', async () => {
    const onChange = vi.fn();
    render(<Segmented ariaLabel="Stato" options={OPTIONS} value="all" onChange={onChange} />);

    const first = screen.getByRole('radio', { name: 'Tutti' });
    first.focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('active');

    onChange.mockClear();
    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith('inactive');
  });

  it('keeps only the active segment in the tab order', () => {
    render(<Segmented ariaLabel="Stato" options={OPTIONS} value="active" onChange={() => {}} />);

    expect(screen.getByRole('radio', { name: 'Attivi' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'Tutti' })).toHaveAttribute('tabindex', '-1');
  });

  it('falls back to the first segment when the value matches nothing', () => {
    const { container } = render(
      <Segmented ariaLabel="Stato" options={OPTIONS} value="sconosciuto" onChange={() => {}} />
    );

    const pill = container.querySelector('[aria-hidden="true"]');
    expect(pill).toHaveStyle({ transform: 'translateX(0%) translateY(-50%)' });
  });
});
