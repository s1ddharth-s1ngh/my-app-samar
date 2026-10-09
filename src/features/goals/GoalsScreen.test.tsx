import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { GoalsScreen } from './GoalsScreen';
import { useDataStore } from '@/stores/useDataStore';
import { dbAdapter } from '@/stores/db';
import { defaultSettings } from '@/data/defaults';
import { goalDueInstant } from '@/domain/goals';
import { shiftDate } from '@/domain/schedule';
import { todayCalendarDate } from '@/domain/cycles';
import { newTask } from '@/features/tasks/taskModel';

describe('GoalsScreen', () => {
  beforeEach(async () => {
    await dbAdapter.init('goals_screen_' + Date.now() + '_' + Math.random());
    useDataStore.setState({ tasks: [], settings: defaultSettings() });
  });

  it('elenca un obiettivo con la sua cadenza e lo chiude', async () => {
    const goal = newTask({
      title: 'Finire il corso',
      kind: 'goal',
      dueAt: goalDueInstant(shiftDate(todayCalendarDate(), 10)),
      recurrence: {
        freq: 'weekly',
        interval: 1,
        byWeekday: [1, 3, 5],
        byMonthDay: null,
        timeOfDay: '20:00',
        startsOn: todayCalendarDate(),
        endsOn: shiftDate(todayCalendarDate(), 10),
      },
    });
    await useDataStore.getState().createItem('tasks', goal);

    render(
      <MemoryRouter>
        <GoalsScreen />
      </MemoryRouter>
    );

    expect(screen.getByText('Finire il corso')).toBeInTheDocument();
    expect(screen.getByText('lun, mer, ven alle 20:00')).toBeInTheDocument();
    expect(screen.getByText('fra 10 giorni')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Segna raggiunto/ }));

    expect(await screen.findByText('Raggiunte')).toBeInTheDocument();
    expect(screen.getByText('Raggiunto.')).toBeInTheDocument();
  });

  it('senza obiettivi offre di scrivere il primo', () => {
    render(
      <MemoryRouter>
        <GoalsScreen />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Scrivi il primo' })).toBeInTheDocument();
  });
});
