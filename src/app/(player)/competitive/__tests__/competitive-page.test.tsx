import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn() }),
  usePathname: () => '/competitive',
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: Record<string, unknown>) => <a {...props}>{children}</a>,
}));

vi.mock('@/hooks/use-notifications', () => ({
  useUnreadCount: vi.fn(() => ({ data: 0 })),
}));

vi.mock('@/hooks/use-competitive-profile', () => ({
  useCompetitiveProfile: vi.fn(),
  useEloHistory: vi.fn(),
  useOnboardingState: vi.fn(),
  useSkillRadar: vi.fn(),
}));

vi.mock('@/hooks/use-matches', () => ({
  useMyMatches: vi.fn(() => ({ data: [], isLoading: false })),
  usePendingConfirmations: vi.fn(() => ({ data: [], isLoading: false })),
}));

const mockUseChallengesInbox = vi.fn();
const mockAcceptMutateAsync = vi.fn();
const mockRejectMutateAsync = vi.fn();

vi.mock('@/hooks/use-challenges', () => ({
  useChallengesInbox: (...args: unknown[]) => mockUseChallengesInbox(...args),
  useChallengeActions: () => ({
    acceptDirect: { mutateAsync: mockAcceptMutateAsync },
    rejectDirect: { mutateAsync: mockRejectMutateAsync },
  }),
}));

vi.mock('react-chartjs-2', () => ({
  Radar: () => <div data-testid="radar-chart-mock" />,
}));

vi.mock('@/app/components/competitive/elo-chart', () => ({
  EloChart: ({ history }: { history: unknown[] }) =>
    history.length === 0 ? (
      <div>Jug\u00E1 tu primer partido para ver tu evoluci\u00F3n</div>
    ) : (
      <div data-testid="elo-chart-mock">chart:{history.length}</div>
    ),
}));

import CompetitivePage from '../page';
import {
  useCompetitiveProfile,
  useEloHistory,
  useOnboardingState,
  useSkillRadar,
} from '@/hooks/use-competitive-profile';

const mockedUseOnboardingState = vi.mocked(useOnboardingState);
const mockedUseCompetitiveProfile = vi.mocked(useCompetitiveProfile);
const mockedUseEloHistory = vi.mocked(useEloHistory);
const mockedUseSkillRadar = vi.mocked(useSkillRadar);

function makeInboxChallenge(id = 'c-1') {
  return {
    id,
    type: 'direct',
    status: 'pending',
    targetCategory: null,
    reservationId: null,
    message: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    teamA: {
      p1: { userId: 'u-2', email: 'rival@test.com', displayName: 'Rival Uno' },
      p2: null,
    },
    teamB: {
      p1: null,
      p2: null,
    },
    invitedOpponent: { userId: 'u-1', email: 'yo@test.com', displayName: 'Yo' },
    isReady: false,
  };
}

function mockReadyCompetitiveState() {
  mockedUseOnboardingState.mockReturnValue({
    data: {
      onboardingComplete: true,
      category: 5,
      primaryGoal: 'improve',
      playingFrequency: 'weekly',
      categoryLocked: true,
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useOnboardingState>);

  mockedUseCompetitiveProfile.mockReturnValue({
    data: {
      id: 'p-1',
      displayName: 'Test Player',
      category: 5,
      elo: 1200,
      wins: 3,
      losses: 1,
      matchesPlayed: 4,
    },
    isLoading: false,
  } as ReturnType<typeof useCompetitiveProfile>);
}

describe('CompetitivePage onboarding gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAcceptMutateAsync.mockResolvedValue({});
    mockRejectMutateAsync.mockResolvedValue({});
    mockUseChallengesInbox.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    mockedUseEloHistory.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
    } as ReturnType<typeof useEloHistory>);
    mockedUseSkillRadar.mockReturnValue({
      data: {
        activity: 50,
        momentum: 50,
        consistency: 50,
        dominance: 50,
        resilience: 50,
        meta: { computedAt: '2026-01-01T00:00:00Z', matches30d: 0, sampleSize: 0 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useSkillRadar>);
    mockedUseCompetitiveProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useCompetitiveProfile>);
  });

  it('shows skeleton while onboarding state is loading', () => {
    mockedUseOnboardingState.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useOnboardingState>);

    render(<CompetitivePage />);
    expect(screen.queryByText('Activ\u00E1 tu perfil competitivo')).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to onboarding when onboardingComplete is false', () => {
    mockedUseOnboardingState.mockReturnValue({
      data: {
        onboardingComplete: false,
        category: 0,
        primaryGoal: '',
        playingFrequency: '',
        categoryLocked: false,
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useOnboardingState>);

    render(<CompetitivePage />);
    expect(mockReplace).toHaveBeenCalledWith('/competitive/onboarding');
  });

  it('renders competitive hub when onboardingComplete is true and profile exists', () => {
    mockReadyCompetitiveState();

    render(<CompetitivePage />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText('Tu progreso')).toBeInTheDocument();
    expect(screen.queryByText('Desaf\u00EDos pendientes')).not.toBeInTheDocument();
  });

  it('renders progress chart when elo history data exists', () => {
    mockReadyCompetitiveState();

    mockedUseEloHistory.mockReturnValue({
      data: {
        items: [
          {
            id: 'eh-1',
            eloBefore: 1188,
            eloAfter: 1200,
            delta: 12,
            reason: 'match_result',
            refId: 'm-1',
            createdAt: new Date().toISOString(),
          },
        ],
      },
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
    } as ReturnType<typeof useEloHistory>);

    render(<CompetitivePage />);

    expect(screen.getByTestId('elo-chart-mock')).toHaveTextContent('chart:1');
    expect(screen.getByText(/\u00DAltimo cambio:/)).toBeInTheDocument();
    expect(screen.getByText(/Resultado de partido/)).toBeInTheDocument();
  });

  it('shows empty state when onboarding errors (graceful fallback)', () => {
    mockedUseOnboardingState.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useOnboardingState>);

    render(<CompetitivePage />);
    expect(screen.getByText('Activ\u00E1 tu perfil competitivo')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders pending challenges section when inbox has 1 pending', () => {
    mockReadyCompetitiveState();
    mockUseChallengesInbox.mockReturnValue({
      data: [makeInboxChallenge()],
      isLoading: false,
      isError: false,
    });

    render(<CompetitivePage />);

    expect(screen.getByText('Desaf\u00EDos pendientes')).toBeInTheDocument();
    expect(screen.getByText('Rival Uno')).toBeInTheDocument();
    expect(screen.getByText('Te desafi\u00F3 a un partido')).toBeInTheDocument();
  });

  it('accept removes card', async () => {
    mockReadyCompetitiveState();
    mockUseChallengesInbox.mockReturnValue({
      data: [makeInboxChallenge('c-accept')],
      isLoading: false,
      isError: false,
    });

    render(<CompetitivePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => {
      expect(screen.queryByText('Rival Uno')).not.toBeInTheDocument();
    });
    expect(mockAcceptMutateAsync).toHaveBeenCalledWith('c-accept');
  });

  it('reject removes card', async () => {
    mockReadyCompetitiveState();
    mockUseChallengesInbox.mockReturnValue({
      data: [makeInboxChallenge('c-reject')],
      isLoading: false,
      isError: false,
    });

    render(<CompetitivePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));

    await waitFor(() => {
      expect(screen.queryByText('Rival Uno')).not.toBeInTheDocument();
    });
    expect(mockRejectMutateAsync).toHaveBeenCalledWith('c-reject');
  });
});
