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

const mockUseIntents = vi.fn();
const mockAcceptMutateAsync = vi.fn();
const mockRejectMutateAsync = vi.fn();

vi.mock('@/hooks/use-intents', () => ({
  useIntents: () => mockUseIntents(),
}));

vi.mock('@/hooks/use-challenges', () => ({
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
      <div>Juga tu primer partido para ver tu evolucion</div>
    ) : (
      <div data-testid="elo-chart-mock">chart:{history.length}</div>
    ),
}));

vi.mock('@/app/components/competitive/insights-section', () => ({
  InsightsSection: () => <div data-testid="insights-section" />,
}));

vi.mock('@/app/components/competitive/activity-feed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed" />,
}));

vi.mock('@/app/components/competitive/intent-composer-sheet', () => ({
  IntentComposerSheet: () => null,
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

function makePendingChallengeIntent(id = 'c-1') {
  return {
    id: `challenge:${id}`,
    intentType: 'ACCEPT_CHALLENGE',
    status: 'pending',
    actorName: 'Rival Uno',
    subtitle: 'Te desafio a un partido',
    createdAt: new Date().toISOString(),
    challengeId: id,
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
    mockUseIntents.mockReturnValue({
      items: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
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

  it('shows skeleton while profile is loading', () => {
    mockedUseCompetitiveProfile.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useCompetitiveProfile>);

    render(<CompetitivePage />);
    expect(screen.queryByText(/perfil competitivo/i)).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows skeleton instead of error when profile returns 409 CITY_REQUIRED', () => {
    const cityRequiredError = Object.assign(new Error('City required'), {
      response: { status: 409, data: { code: 'CITY_REQUIRED' } },
    });
    mockedUseCompetitiveProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: cityRequiredError,
    } as ReturnType<typeof useCompetitiveProfile>);

    render(<CompetitivePage />);
    expect(screen.queryByText(/perfil competitivo/i)).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders competitive hub when onboardingComplete is true and profile exists', () => {
    mockReadyCompetitiveState();

    render(<CompetitivePage />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText('Tu progreso')).toBeInTheDocument();
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
    expect(screen.getByText(/cambio:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Resultado de partido/).length).toBeGreaterThan(0);
  });

  it('shows empty state when onboarding errors (graceful fallback)', () => {
    mockedUseOnboardingState.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useOnboardingState>);

    render(<CompetitivePage />);
    expect(screen.getByText(/perfil competitivo/i)).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders pending challenge intent when there is one', () => {
    mockReadyCompetitiveState();
    mockUseIntents.mockReturnValue({
      items: [makePendingChallengeIntent()],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<CompetitivePage />);

    expect(screen.getByText(/Desaf/)).toBeInTheDocument();
    expect(screen.getByText('Rival Uno')).toBeInTheDocument();
    expect(screen.getByText('Te desafio a un partido')).toBeInTheDocument();
  });

  it('accept removes card', async () => {
    mockReadyCompetitiveState();
    mockUseIntents.mockReturnValue({
      items: [makePendingChallengeIntent('c-accept')],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
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
    mockUseIntents.mockReturnValue({
      items: [makePendingChallengeIntent('c-reject')],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<CompetitivePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));

    await waitFor(() => {
      expect(screen.queryByText('Rival Uno')).not.toBeInTheDocument();
    });
    expect(mockRejectMutateAsync).toHaveBeenCalledWith('c-reject');
  });
});
