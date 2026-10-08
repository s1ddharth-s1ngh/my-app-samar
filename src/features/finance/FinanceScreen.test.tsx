import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import FinanceScreen from './FinanceScreen';
import { useDataStore } from '@/stores/useDataStore';
import { dbAdapter } from '@/stores/db';
import { defaultSettings } from '@/data/defaults';

/** The screen the whole money area hangs off: it must survive a real dataset. */
describe('FinanceScreen', () => {
  beforeEach(async () => {
    await dbAdapter.init('finance_screen_' + Date.now() + '_' + Math.random());
  });

  it('mostra il ciclo di oggi e la sua ripartizione', async () => {
    await useDataStore.getState().loadSeed();
    const cycle = useDataStore.getState().cycles[0]!;

    render(
      <MemoryRouter>
        <FinanceScreen />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Soldi' })).toBeInTheDocument();
    expect(screen.getByText(cycle.label)).toBeInTheDocument();
    expect(screen.getByText('Entrate del ciclo')).toBeInTheDocument();
  });

  it('senza cicli offre il banner che ne apre uno', () => {
    useDataStore.setState({
      cycles: [],
      allocations: [],
      transactions: [],
      incomeEntries: [],
      settings: defaultSettings(),
    });

    render(
      <MemoryRouter>
        <FinanceScreen />
      </MemoryRouter>
    );

    // The banner's button, not a message telling the user to go somewhere else.
    expect(screen.getByRole('button', { name: /^Apri / })).toBeInTheDocument();
  });
});
