import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LeagueCard } from '../league-card';
import type { League } from '@/types/leagues';

const makeLeague = (overrides?: Partial<League>): League => ({
  id: 'lg-1',
  name: 'Liga de los jueves',
  status: 'active',
  startDate: '2026-01-15',
  endDate: '2026-03-15',
  creatorId: 'u-1',
  membersCount: 6,
  ...overrides,
});

describe('LeagueCard', () => {
  it('renders league name and status', () => {
    render(<LeagueCard league={makeLeague()} />);
    expect(screen.getByText('Liga de los jueves')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
  });

  it('renders members count', () => {
    render(<LeagueCard league={makeLeague({ membersCount: 8 })} />);
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<LeagueCard league={makeLeague()} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders different status badges', () => {
    const { rerender } = render(<LeagueCard league={makeLeague({ status: 'upcoming' })} />);
    expect(screen.getByText('Próxima')).toBeInTheDocument();

    rerender(<LeagueCard league={makeLeague({ status: 'finished' })} />);
    expect(screen.getByText('Finalizada')).toBeInTheDocument();
  });
});
