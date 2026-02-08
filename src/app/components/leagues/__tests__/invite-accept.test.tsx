import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LeagueStatusBadge } from '../league-status-badge';

describe('LeagueStatusBadge', () => {
  it('renders active status in Spanish', () => {
    render(<LeagueStatusBadge status="active" />);
    expect(screen.getByText('Activa')).toBeInTheDocument();
  });

  it('renders upcoming status in Spanish', () => {
    render(<LeagueStatusBadge status="upcoming" />);
    expect(screen.getByText('Próxima')).toBeInTheDocument();
  });

  it('renders finished status in Spanish', () => {
    render(<LeagueStatusBadge status="finished" />);
    expect(screen.getByText('Finalizada')).toBeInTheDocument();
  });
});
