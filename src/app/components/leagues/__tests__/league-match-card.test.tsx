import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LeagueMatchCard } from '../league-match-card';
import type { LeagueMatch } from '@/types/leagues';

const makeMatch = (overrides?: Partial<LeagueMatch>): LeagueMatch => ({
  id: 'm-1',
  playedAt: '2025-06-01T18:00:00Z',
  score: '6-4, 6-3',
  status: 'confirmed',
  teamA: [{ displayName: 'Juan' }, { displayName: 'Carlos' }],
  teamB: [{ displayName: 'María' }, { displayName: 'Ana' }],
  ...overrides,
});

describe('LeagueMatchCard', () => {
  it('renders team names and score', () => {
    render(<LeagueMatchCard match={makeMatch()} onClick={vi.fn()} />);
    expect(screen.getByText('Juan / Carlos')).toBeInTheDocument();
    expect(screen.getByText('María / Ana')).toBeInTheDocument();
    expect(screen.getByText('6-4, 6-3')).toBeInTheDocument();
  });

  it('renders confirmed status badge', () => {
    render(<LeagueMatchCard match={makeMatch({ status: 'confirmed' })} onClick={vi.fn()} />);
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
  });

  it('renders pending status badge', () => {
    render(<LeagueMatchCard match={makeMatch({ status: 'pending_confirm' })} onClick={vi.fn()} />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('renders disputed status badge', () => {
    render(<LeagueMatchCard match={makeMatch({ status: 'disputed' })} onClick={vi.fn()} />);
    expect(screen.getByText('Disputado')).toBeInTheDocument();
  });

  it('renders resolved status badge', () => {
    render(<LeagueMatchCard match={makeMatch({ status: 'resolved' })} onClick={vi.fn()} />);
    expect(screen.getByText('Resuelto')).toBeInTheDocument();
  });

  it('calls onClick with match when clicked', () => {
    const onClick = vi.fn();
    const m = makeMatch();
    render(<LeagueMatchCard match={m} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(m);
  });

  it('renders without score when score is empty', () => {
    render(<LeagueMatchCard match={makeMatch({ score: '' })} onClick={vi.fn()} />);
    expect(screen.getByText('Juan / Carlos')).toBeInTheDocument();
    // Should not crash
  });
});
