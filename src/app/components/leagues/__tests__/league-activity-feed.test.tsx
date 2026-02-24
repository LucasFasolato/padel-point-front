import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ActivityEventView } from '@/types/leagues';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetchNextPage = vi.fn();

const defaultHookReturn = {
  data: undefined,
  isLoading: false,
  isFetchingNextPage: false,
  fetchNextPage: mockFetchNextPage,
  hasNextPage: false,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks/use-leagues', () => ({
  useLeagueActivity: vi.fn(() => defaultHookReturn),
}));

vi.mock('@/lib/notification-utils', () => ({
  formatRelativeTime: () => 'hace un momento',
}));

import { useLeagueActivity } from '@/hooks/use-leagues';
import { LeagueActivityFeed } from '../league-activity-feed';

const mockedUseLeagueActivity = vi.mocked(useLeagueActivity);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LEAGUE_ID = '11111111-1111-4111-8111-111111111111';

const makeEvent = (overrides: Partial<ActivityEventView> = {}): ActivityEventView => ({
  id: 'ev-1',
  leagueId: LEAGUE_ID,
  type: 'member_joined',
  actorId: 'u-1',
  actorName: 'Juan',
  payload: {},
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

function setHookReturn(overrides: Partial<typeof defaultHookReturn>) {
  mockedUseLeagueActivity.mockReturnValue({ ...defaultHookReturn, ...overrides } as ReturnType<typeof useLeagueActivity>);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LeagueActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseLeagueActivity.mockReturnValue(defaultHookReturn as ReturnType<typeof useLeagueActivity>);
  });

  it('renders loading skeletons while isLoading is true', () => {
    setHookReturn({ isLoading: true });
    render(<LeagueActivityFeed leagueId={LEAGUE_ID} />);
    expect(screen.getByLabelText('Cargando actividad')).toBeInTheDocument();
  });

  it('renders empty state when items list is empty', () => {
    setHookReturn({ data: { pages: [], pageParams: [], items: [] } });
    render(<LeagueActivityFeed leagueId={LEAGUE_ID} />);
    expect(screen.getByText('Sin actividad todavía')).toBeInTheDocument();
  });

  it('renders "Cargar resultado" button in empty state when onLoadResult is provided', () => {
    const onLoadResult = vi.fn();
    setHookReturn({ data: { pages: [], pageParams: [], items: [] } });
    render(<LeagueActivityFeed leagueId={LEAGUE_ID} onLoadResult={onLoadResult} />);
    const btn = screen.getByRole('button', { name: /Cargar resultado/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onLoadResult).toHaveBeenCalledTimes(1);
  });

  it('does not render "Cargar resultado" button when onLoadResult is not provided', () => {
    setHookReturn({ data: { pages: [], pageParams: [], items: [] } });
    render(<LeagueActivityFeed leagueId={LEAGUE_ID} />);
    expect(screen.queryByRole('button', { name: /Cargar resultado/i })).not.toBeInTheDocument();
  });

  describe('event copy', () => {
    function renderWithEvent(event: ActivityEventView) {
      setHookReturn({ data: { pages: [], pageParams: [], items: [event] } });
      render(<LeagueActivityFeed leagueId={LEAGUE_ID} />);
    }

    it('renders match_confirmed copy', () => {
      renderWithEvent(makeEvent({ type: 'match_confirmed', actorName: 'Carlos' }));
      expect(screen.getByText('Carlos confirmó un partido')).toBeInTheDocument();
    });

    it('renders member_joined copy', () => {
      renderWithEvent(makeEvent({ type: 'member_joined', actorName: 'María' }));
      expect(screen.getByText('María se unió a la liga')).toBeInTheDocument();
    });

    it('renders ranking_moved copy for positive delta (went down)', () => {
      renderWithEvent(makeEvent({ type: 'ranking_moved', actorName: 'Pedro', payload: { delta: 1 } }));
      expect(screen.getByText('Pedro bajó 1 posición en la tabla')).toBeInTheDocument();
    });

    it('renders ranking_moved copy for negative delta (went up)', () => {
      renderWithEvent(makeEvent({ type: 'ranking_moved', actorName: 'Pedro', payload: { delta: -1 } }));
      expect(screen.getByText('Pedro subió 1 posición en la tabla')).toBeInTheDocument();
    });

    it('renders ranking_moved fallback when delta is not a number', () => {
      renderWithEvent(makeEvent({ type: 'ranking_moved', actorName: 'Pedro', payload: {} }));
      expect(screen.getByText('Se actualizó la tabla de posiciones')).toBeInTheDocument();
    });

    it('renders challenge_issued copy', () => {
      renderWithEvent(makeEvent({ type: 'challenge_issued', actorName: 'Lucía' }));
      expect(screen.getByText('Lucía envió un desafío')).toBeInTheDocument();
    });

    it('renders "Actividad en la liga" for unknown event type', () => {
      renderWithEvent(makeEvent({ type: 'unknown_future_event', actorName: 'Alguien' }));
      expect(screen.getByText('Actividad en la liga')).toBeInTheDocument();
    });

    it('falls back to "Alguien" when actorName is null', () => {
      renderWithEvent(makeEvent({ type: 'match_confirmed', actorName: null }));
      expect(screen.getByText('Alguien confirmó un partido')).toBeInTheDocument();
    });
  });

  it('renders "Ver más actividad" button when hasNextPage is true', () => {
    setHookReturn({
      data: { pages: [], pageParams: [], items: [makeEvent()] },
      hasNextPage: true,
    });
    render(<LeagueActivityFeed leagueId={LEAGUE_ID} />);
    expect(screen.getByRole('button', { name: /Ver más actividad/i })).toBeInTheDocument();
  });

  it('calls fetchNextPage when "Ver más actividad" is clicked', () => {
    setHookReturn({
      data: { pages: [], pageParams: [], items: [makeEvent()] },
      hasNextPage: true,
      fetchNextPage: mockFetchNextPage,
    });
    render(<LeagueActivityFeed leagueId={LEAGUE_ID} />);
    fireEvent.click(screen.getByRole('button', { name: /Ver más actividad/i }));
    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('shows "Cargando…" and disables button while isFetchingNextPage', () => {
    setHookReturn({
      data: { pages: [], pageParams: [], items: [makeEvent()] },
      hasNextPage: true,
      isFetchingNextPage: true,
    });
    render(<LeagueActivityFeed leagueId={LEAGUE_ID} />);
    const btn = screen.getByRole('button', { name: /Cargando/i });
    expect(btn).toBeDisabled();
  });

  it('does not render "Ver más actividad" button when hasNextPage is false', () => {
    setHookReturn({
      data: { pages: [], pageParams: [], items: [makeEvent()] },
      hasNextPage: false,
    });
    render(<LeagueActivityFeed leagueId={LEAGUE_ID} />);
    expect(screen.queryByRole('button', { name: /Ver más actividad/i })).not.toBeInTheDocument();
  });
});
