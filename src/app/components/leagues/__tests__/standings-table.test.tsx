import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StandingsTable } from '../standings-table';
import type { StandingEntry } from '@/types/leagues';

const makeEntry = (overrides?: Partial<StandingEntry>): StandingEntry => ({
  userId: 'u-1',
  displayName: 'Juan Pérez',
  position: 1,
  points: 15,
  wins: 5,
  losses: 1,
  draws: 0,
  ...overrides,
});

describe('StandingsTable', () => {
  it('renders empty state when no standings', () => {
    render(<StandingsTable standings={[]} />);
    expect(screen.getByText('Aún no hay partidos registrados.')).toBeInTheDocument();
  });

  it('renders rows with position, name, and points', () => {
    const standings = [
      makeEntry({ userId: 'u-1', displayName: 'Juan', position: 1, points: 15 }),
      makeEntry({ userId: 'u-2', displayName: 'María', position: 2, points: 10 }),
    ];
    render(<StandingsTable standings={standings} />);

    expect(screen.getByText('Juan')).toBeInTheDocument();
    expect(screen.getByText('María')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('highlights current user row', () => {
    const standings = [makeEntry({ userId: 'u-1', displayName: 'Yo' })];
    render(<StandingsTable standings={standings} currentUserId="u-1" />);

    expect(screen.getByText('(Vos)')).toBeInTheDocument();
  });

  it('does not show (Vos) for other users', () => {
    const standings = [makeEntry({ userId: 'u-2', displayName: 'Otro' })];
    render(<StandingsTable standings={standings} currentUserId="u-1" />);

    expect(screen.queryByText('(Vos)')).not.toBeInTheDocument();
  });

  it('renders wins, losses, and draws columns', () => {
    const standings = [makeEntry({ position: 1, points: 15, wins: 7, losses: 4, draws: 3 })];
    render(<StandingsTable standings={standings} />);

    // Column headers
    expect(screen.getByText('V')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();

    // Values (using getAllByText for numbers that may appear in multiple cells)
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders "Jugador" fallback when displayName is empty', () => {
    const standings = [makeEntry({ displayName: '', userId: 'u-3' })];
    render(<StandingsTable standings={standings} />);
    // "Jugador" appears in header and as fallback value
    const matches = screen.getAllByText('Jugador');
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});
