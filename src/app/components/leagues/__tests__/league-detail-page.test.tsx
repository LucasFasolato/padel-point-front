import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { League, LeagueMatch } from '@/types/leagues';

// Mock next/navigation
const pushMock = vi.fn();
const VALID_UUID = '11111111-1111-4111-8111-111111111111';
let paramsId: string | undefined = VALID_UUID;
let searchParamsRaw = '';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: paramsId }),
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(searchParamsRaw),
}));

// Mock auth store
let authState = { user: { userId: 'u-me' }, token: 'token-1' };
vi.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

// Mock hooks
const mockLeagueDetail = vi.fn<() => { data: League | undefined; isLoading: boolean; error: unknown }>();
const mockLeagueMatches = vi.fn<() => { data: LeagueMatch[] | undefined }>();
const useLeagueDetailMock = vi.fn(() => mockLeagueDetail());
const useLeagueStandingsMock = vi.fn(() => ({ data: undefined, isLoading: false }));
const useCreateInvitesMock = vi.fn(() => ({ mutate: vi.fn(), isPending: false }));
const useReportFromReservationMock = vi.fn(() => ({ mutate: vi.fn(), isPending: false }));
const useReportManualMock = vi.fn(() => ({ mutate: vi.fn(), isPending: false }));
const useEligibleReservationsMock = vi.fn(() => ({ data: [], isLoading: false }));
const useLeagueMatchesMock = vi.fn(() => mockLeagueMatches());
const useUpdateMemberRoleMock = vi.fn(() => ({ mutate: vi.fn(), isPending: false }));
const useCreateLeagueMatchMock = vi.fn(() => ({ mutate: vi.fn(), isPending: false }));
const useCaptureLeagueMatchResultMock = vi.fn(() => ({ mutate: vi.fn(), isPending: false }));
const useEnableLeagueShareMock = vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false }));
const usePublicLeagueStandingsMock = vi.fn(() => ({ data: undefined, isLoading: false, error: null, refetch: vi.fn() }));
const useLeaguePendingConfirmationsMock = vi.fn(() => ({ data: [] }));
const useDeleteLeagueMock = vi.fn(() => ({ mutate: vi.fn(), isPending: false }));
const enableShareMutateAsyncMock = vi.fn();

vi.mock('@/hooks/use-leagues', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-leagues')>();
  return {
    ...actual,
    useLeagueDetail: (id: string) => useLeagueDetailMock(id),
    useLeagueStandings: (id: string) => useLeagueStandingsMock(id),
    useCreateInvites: (id: string) => useCreateInvitesMock(id),
    useReportFromReservation: (id: string) => useReportFromReservationMock(id),
    useReportManual: (id: string) => useReportManualMock(id),
    useEligibleReservations: (id: string) => useEligibleReservationsMock(id),
    useLeagueMatches: (id: string) => useLeagueMatchesMock(id),
    useUpdateMemberRole: (id: string) => useUpdateMemberRoleMock(id),
    useCreateLeagueMatch: (id: string) => useCreateLeagueMatchMock(id),
    useCaptureLeagueMatchResult: (id: string) => useCaptureLeagueMatchResultMock(id),
    useEnableLeagueShare: (id: string) => useEnableLeagueShareMock(id),
    usePublicLeagueStandings: (id: string, token: string) => usePublicLeagueStandingsMock(id, token),
    useLeaguePendingConfirmations: (id: string) => useLeaguePendingConfirmationsMock(id),
    useDeleteLeague: () => useDeleteLeagueMock(),
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
    LeagueShareCard: () => <div data-testid="league-share-card" />,
    InviteModal: () => null,
    ReportMethodSheet: () => null,
    ReportFromReservationModal: () => null,
    ReportManualModal: () => null,
    LeagueIntentsPanel: () => <div data-testid="league-intents-panel" />,
    LeagueChallengesSection: () => <div data-testid="league-challenges-section" />,
    LeagueMatchCard: ({ match, onClick }: { match: LeagueMatch; onClick: () => void }) => (
      <button data-testid={`match-${match.id}`} onClick={onClick}>
        {match.teamA.map((p) => p.displayName).join(' / ')} vs{' '}
        {match.teamB.map((p) => p.displayName).join(' / ')} - {match.score}
      </button>
    ),
    LeagueMatchModeSheet: () => null,
    LeagueMatchCreateModal: () => null,
    LeagueMatchResultModal: () => null,
    RecentActivityStrip: () => null,
  };
});

vi.mock('@/app/components/competitive/intent-composer-sheet', () => ({
  IntentComposerSheet: () => null,
}));

vi.mock('@/hooks/use-notification-socket', () => ({
  useLeagueActivitySocket: vi.fn(),
}));

vi.mock('@/hooks/use-matches', () => ({
  usePendingConfirmations: vi.fn(() => ({ data: [] })),
}));

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
  paramsId = VALID_UUID;
  searchParamsRaw = '';
  authState = { user: { userId: 'u-me' }, token: 'token-1' };
  mockLeagueMatches.mockReturnValue({ data: [] });
  useEnableLeagueShareMock.mockReturnValue({
    mutateAsync: enableShareMutateAsyncMock.mockResolvedValue({
      shareToken: 'share-123',
      shareUrlPath: `/leagues/${VALID_UUID}?share=1&token=share-123`,
    }),
    isPending: false,
  });
  usePublicLeagueStandingsMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe('LeagueDetailPage', () => {
  it('renders all four tabs', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, mode: 'open' },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    expect(screen.getByTestId('tab-resumen')).toBeInTheDocument();
    expect(screen.getByTestId('tab-tabla')).toBeInTheDocument();
    expect(screen.getByTestId('tab-partidos')).toBeInTheDocument();
    expect(screen.getByTestId('tab-miembros')).toBeInTheDocument();
  });

  it('clicking copy link enables share link and copies to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
    });

    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, mode: 'open' },
      isLoading: false,
      error: null,
    });

    render(<LeagueDetailPage />);

    fireEvent.click(screen.getByRole('button', { name: /Copiar link/i }));

    await waitFor(() => {
      expect(enableShareMutateAsyncMock).toHaveBeenCalled();
    });
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining(`/public/leagues/${VALID_UUID}/share?token=share-123`)
    );
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
    // At least one enabled "Cargar resultado" button should be present (global CTA)
    const buttons = screen.getAllByRole('button', { name: /Cargar resultado/i });
    expect(buttons.some((btn) => !btn.hasAttribute('disabled'))).toBe(true);
  });

  it('hides CTA and shows explanation when league is UPCOMING', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, status: 'upcoming' },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    // The global CTA is absent; the Partidos tab button is disabled
    const buttons = screen.queryAllByRole('button', { name: /Cargar resultado/i });
    expect(buttons.every((btn) => btn.hasAttribute('disabled'))).toBe(true);
    expect(screen.getByText(/La liga aún no está activa/)).toBeInTheDocument();
  });

  it('shows server reason in blocked banner when canRecordMatches is false with reason', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, status: 'active', canRecordMatches: false, reason: 'Necesitás al menos 2 jugadores.' },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    expect(screen.getByText('Necesitás al menos 2 jugadores.')).toBeInTheDocument();
  });

  it('hides CTA and shows finalized message when league is FINISHED', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, status: 'finished' },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    // Global CTA is absent; Partidos tab button is disabled
    const buttons = screen.queryAllByRole('button', { name: /Cargar resultado/i });
    expect(buttons.every((btn) => btn.hasAttribute('disabled'))).toBe(true);
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
    expect(screen.getByText(/Cargá un resultado para que aparezca acá/i)).toBeInTheDocument();
  });

  it('shows empty state and finalized message when finished', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, status: 'finished' },
      isLoading: false,
      error: null,
    });
    mockLeagueMatches.mockReturnValue({ data: [] });
    render(<LeagueDetailPage />);
    expect(screen.getByText('Todavía no hay partidos')).toBeInTheDocument();
    expect(screen.getByText(/Liga finalizada/)).toBeInTheDocument();
    // No "Cargar resultado" action available for finished leagues
    const buttons = screen.queryAllByRole('button', { name: /Cargar resultado/i });
    expect(buttons.every((btn) => btn.hasAttribute('disabled'))).toBe(true);
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

  it('renders Resumen tab with hero card and league name', () => {
    mockLeagueDetail.mockReturnValue({
      data: { ...BASE_LEAGUE, status: 'active' },
      isLoading: false,
      error: null,
    });
    render(<LeagueDetailPage />);
    expect(screen.getByTestId('tab-resumen')).toBeInTheDocument();
    // League name appears in both topbar and hero card h1
    expect(screen.getAllByText('Padel Masters').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('status-badge')).toBeInTheDocument();
  });

  it('renders invalid-link state and never mounts league hooks', () => {
    paramsId = 'undefined';
    mockLeagueDetail.mockReturnValue({ data: undefined, isLoading: false, error: null });

    render(<LeagueDetailPage />);

    expect(screen.getByText('Liga no encontrada')).toBeInTheDocument();
    expect(screen.getByText('El enlace es inválido o la liga no existe.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver a Ligas' })).toBeInTheDocument();

    expect(useLeagueDetailMock).not.toHaveBeenCalled();
    expect(useLeagueStandingsMock).not.toHaveBeenCalled();
    expect(useCreateInvitesMock).not.toHaveBeenCalled();
    expect(useReportFromReservationMock).not.toHaveBeenCalled();
    expect(useReportManualMock).not.toHaveBeenCalled();
  });

  it('uses public share standings endpoint and renders share view when share token is present without auth', () => {
    searchParamsRaw = 'share=1&token=token-public';
    authState = { user: { userId: '' }, token: '' };
    usePublicLeagueStandingsMock.mockReturnValue({
      data: {
        leagueName: 'Liga Compartida',
        rows: [{ userId: 'u-1', displayName: 'Juan', position: 1, points: 10, wins: 3, losses: 0, draws: 1 }],
        movement: {},
        computedAt: '2026-02-23T10:00:00.000Z',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LeagueDetailPage />);

    expect(usePublicLeagueStandingsMock).toHaveBeenCalledWith(VALID_UUID, 'token-public');
    expect(screen.getByText('Liga Compartida')).toBeInTheDocument();
    expect(screen.getByTestId('league-share-card')).toBeInTheDocument();
    expect(screen.getByTestId('standings-table')).toBeInTheDocument();
    expect(useLeagueDetailMock).not.toHaveBeenCalled();
  });

  it('shows error state when public share token is invalid', () => {
    searchParamsRaw = 'share=1&token=bad-token';
    authState = { user: { userId: '' }, token: '' };
    usePublicLeagueStandingsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Forbidden'),
      refetch: vi.fn(),
    });

    render(<LeagueDetailPage />);

    expect(screen.getByText('No pudimos abrir esta tabla compartida.')).toBeInTheDocument();
    expect(screen.getByText('El enlace puede estar vencido o ser inválido.')).toBeInTheDocument();
  });
});

import { normalizeShareUrl } from '@/app/(player)/leagues/[id]/page';

describe('normalizeShareUrl', () => {
  it('returns an already-absolute https URL unchanged', () => {
    expect(normalizeShareUrl('https://padelpoint.app/public/leagues/abc/share?token=t1')).toBe(
      'https://padelpoint.app/public/leagues/abc/share?token=t1'
    );
  });

  it('returns an already-absolute http URL unchanged', () => {
    expect(normalizeShareUrl('http://localhost/public/leagues/abc/share?token=t1')).toBe(
      'http://localhost/public/leagues/abc/share?token=t1'
    );
  });

  it('resolves a relative path against window.location.origin', () => {
    const result = normalizeShareUrl('/public/leagues/abc/share?token=t1');
    expect(result).toMatch(/^https?:\/\//);
    expect(result).toContain('/public/leagues/abc/share?token=t1');
  });

  it('returns empty string unchanged', () => {
    expect(normalizeShareUrl('')).toBe('');
  });

  it('handles a relative path without leading slash', () => {
    const result = normalizeShareUrl('public/leagues/abc/share?token=t1');
    expect(result).toMatch(/^https?:\/\//);
  });
});
