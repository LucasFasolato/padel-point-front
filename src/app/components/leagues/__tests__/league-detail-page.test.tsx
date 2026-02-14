import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { League, LeagueMatch } from '@/types/leagues';

// Mock next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'lg-1' }),
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock auth store
vi.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (s: { user: { userId: string } }) => unknown) =>
    selector({ user: { userId: 'u-me' } }),
}));

// Mock hooks
const mockLeagueDetail = vi.fn<() => { data: League | undefined; isLoading: boolean; error: unknown }>();
const mockLeagueMatches = vi.fn<() => { data: LeagueMatch[] | undefined }>();
const mockUpdateSettings = vi.fn();

vi.mock('@/hooks/use-leagues', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-leagues')>();
  return {
    ...actual,
    useLeagueDetail: () => mockLeagueDetail(),
    useLeagueStandings: () => ({ data: undefined, isLoading: false }),
    useCreateInvites: () => ({ mutate: vi.fn(), isPending: false }),
    useReportFromReservation: () => ({ mutate: vi.fn(), isPending: false }),
    useReportManual: () => ({ mutate: vi.fn(), isPending: false }),
    useEligibleReservations: () => ({ data: [], isLoading: false }),
    useLeagueMatches: () => mockLeagueMatches(),
    useLeagueSettings: () => ({ data: undefined }),
    useUpdateLeagueSettings: () => ({ mutate: mockUpdateSettings, isPending: false }),
    useUpdateMemberRole: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

// Mock heavy components that pull in transitive deps
vi.mock('@/app/components/leagues', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/components/leagues')>();
  return {
    ...actual,
    LeagueStatusBadge: ({ status }: { status: string }) => (
      <span data-testid="status-badge">{status}</span>
    ),
    StandingsTable: () => <div data-testid="standings-table" />,
    InviteModal: () => null,
    ReportMethodSheet: () => null,
    ReportFromReservationModal: () => null,
    ReportManualModal: () => null,
    LeagueChallengesSection: () => <div data-testid="league-challenges-section" />,
    LeagueMatchCard: ({ match, onClick }: { match: LeagueMatch; onClick: () => void }) => (
      <button data-testid={`match-${match.id}`} onClick={onClick}>
        {match.teamA.map((p) => p.displayName).join(' / ')} vs{' '}
        {match.teamB.map((p) => p.displayName).join(' / ')} - {match.score}
      </button>
    ),
    LeagueSettingsPanel: () => <div data-testid="settings-panel" />,
  };
});

vi.mock('@/app/components/public/public-topbar', () => ({
  PublicTopBar: ({ title }: { title: string }) => <div data-testid="topbar">{title}</div>,
}));

// Mock Radix tabs to render all content (no hidden panels)
vi.mock('@/app/components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: { children: ReactNode; className?: string }) => (
    <div data-testid="tabs" {...props}>
      {children}
    </div>
  ),
  TabsList: ({ children }: { children: ReactNode }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: { children: ReactNode; value: string }) => (
    <button data-testid={`tab-${value}`}>{children}</button>
  ),
  TabsContent: ({ children }: { children: ReactNode; value: string }) => <div>{children}</div>,
}));

import LeagueDetailPage from '@/app/(player)/leagues/[id]/page';

const BASE_LEAGUE: League = {
  id: 'lg-1',
  name: 'Padel Masters',
  status: 'active',
  startDate: '2025-06-01',
  endDate: '2025-12-31',
  creatorId: 'u-1',
  membersCount: 8,
  members: [{ userId: 'u-1', displayName: 'Juan', joinedAt: '2025-01-01T00:00:00Z' }],
  standings: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockLeagueMatches.mockReturnValue({ data: [] });
});

describe('LeagueDetailPage', () => {
  it('renders all four tabs', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, mode: 'open' },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    expect(screen.getByTestId('tab-tabla')).toBeInTheDocument();
    expect(screen.getByTestId('tab-partidos')).toBeInTheDocument();
    expect(screen.getByTestId('tab-miembros')).toBeInTheDocument();
    expect(screen.getByTestId('tab-ajustes')).toBeInTheDocument();
  });

  it('renders OPEN league with "Liga abierta" and helper text', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, mode: 'open' },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    expect(screen.getByText('Liga abierta')).toBeInTheDocument();
    expect(screen.getByText('Se actualiza con cada partido confirmado')).toBeInTheDocument();
  });

  it('renders OPEN league without date range', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, mode: 'open' },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    expect(screen.queryByText(/Temporada:/)).not.toBeInTheDocument();
  });

  it('renders SCHEDULED league with date range', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, mode: 'scheduled' },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    expect(screen.getByText('Liga por temporada')).toBeInTheDocument();
    expect(screen.getByText(/Temporada:/)).toBeInTheDocument();
  });

  it('defaults to "Liga abierta" when mode is undefined', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, mode: undefined },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    expect(screen.getByText('Liga abierta')).toBeInTheDocument();
  });

  it('shows "Cargar resultado" CTA when league is ACTIVE', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, status: 'active' },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    expect(screen.getByText('Cargar resultado')).toBeInTheDocument();
  });

  it('hides CTA and shows explanation when league is UPCOMING', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, status: 'upcoming' },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    expect(screen.queryByText('Cargar resultado')).not.toBeInTheDocument();
    expect(screen.getByText(/La liga aún no está activa/)).toBeInTheDocument();
  });

  it('hides CTA and shows finalized message when league is FINISHED', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, status: 'finished' },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    expect(screen.queryByText('Cargar resultado')).not.toBeInTheDocument();
    expect(screen.getByText(/Liga finalizada/)).toBeInTheDocument();
  });

  it('shows match history empty state', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, status: 'active' },
      isLoading: false,
      error: null,
    });
    mockLeagueMatches.mockReturnValue({ data: [] });
    render(<LeagueDetailPage />);
    expect(screen.getByText('Todavía no hay partidos')).toBeInTheDocument();
    expect(screen.getByText(/cargar partidos desde reserva o manualmente/i)).toBeInTheDocument();
    expect(screen.getByText('Cargar primer resultado')).toBeInTheDocument();
  });

  it('hides "Cargar primer resultado" in empty state when finished', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, status: 'finished' },
      isLoading: false,
      error: null,
    });
    mockLeagueMatches.mockReturnValue({ data: [] });
    render(<LeagueDetailPage />);
    expect(screen.getByText('Todavía no hay partidos')).toBeInTheDocument();
    expect(screen.queryByText('Cargar primer resultado')).not.toBeInTheDocument();
  });

  it('renders match cards when matches exist', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, status: 'active' },
      isLoading: false,
      error: null,
    });
    mockLeagueMatches.mockReturnValue({
      data: [
        {
          id: 'm-1',
          playedAt: '2025-06-15T18:00:00Z',
          score: '6-4, 6-3',
          status: 'confirmed' as const,
          teamA: [{ displayName: 'Juan' }, { displayName: 'Carlos' }],
          teamB: [{ displayName: 'María' }, { displayName: 'Ana' }],
        },
      ],
    });
    render(<LeagueDetailPage />);
    expect(screen.getByText(/Juan \/ Carlos/)).toBeInTheDocument();
    expect(screen.getByText(/6-4, 6-3/)).toBeInTheDocument();
    expect(screen.queryByText('Todavía no hay partidos')).not.toBeInTheDocument();
  });

  it('renders settings panel in Ajustes tab', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, status: 'active' },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
  });
});
