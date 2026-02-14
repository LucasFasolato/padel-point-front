import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mock hooks
const mockNotifications = vi.fn<() => {
  data: unknown;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}>();
const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();
const mockWsStatus = vi.fn<() => boolean>();

vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => mockNotifications(),
  useMarkRead: () => ({ mutate: mockMarkRead }),
  useMarkAllRead: () => ({ mutate: mockMarkAllRead, isPending: false }),
  useAcceptNotificationInvite: () => ({ mutate: vi.fn(), isPending: false }),
  useDeclineNotificationInvite: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/use-notification-socket', () => ({
  useNotificationSocketStatus: () => mockWsStatus(),
}));

import { NotificationCenter } from '../notification-center';

beforeEach(() => {
  vi.clearAllMocks();
  mockWsStatus.mockReturnValue(true);
});

describe('NotificationCenter', () => {
  it('shows empty state with league and competitive CTAs', () => {
    mockNotifications.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NotificationCenter />);

    expect(screen.getByText('Sin notificaciones')).toBeInTheDocument();
    expect(screen.getByText('Invitá amigos a una liga')).toBeInTheDocument();
    expect(screen.getByText('Jugá un partido competitivo')).toBeInTheDocument();
  });

  it('navigates to /leagues when league CTA is clicked', () => {
    mockNotifications.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NotificationCenter />);
    fireEvent.click(screen.getByText('Invitá amigos a una liga'));
    expect(pushMock).toHaveBeenCalledWith('/leagues');
  });

  it('navigates to /competitive when competitive CTA is clicked', () => {
    mockNotifications.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NotificationCenter />);
    fireEvent.click(screen.getByText('Jugá un partido competitivo'));
    expect(pushMock).toHaveBeenCalledWith('/competitive');
  });

  it('shows WS disconnected indicator when websocket is down', () => {
    mockWsStatus.mockReturnValue(false);
    mockNotifications.mockReturnValue({
      data: [
        {
          id: '1',
          type: 'general',
          title: 'Test',
          message: '',
          priority: 'normal',
          read: false,
          link: null,
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NotificationCenter />);
    expect(screen.getByText('Actualizando por consulta')).toBeInTheDocument();
  });

  it('does not show WS indicator when connected', () => {
    mockWsStatus.mockReturnValue(true);
    mockNotifications.mockReturnValue({
      data: [
        {
          id: '1',
          type: 'general',
          title: 'Test',
          message: '',
          priority: 'normal',
          read: true,
          link: null,
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NotificationCenter />);
    expect(screen.queryByText('Actualizando por consulta')).not.toBeInTheDocument();
  });

  it('does not crash when data is null', () => {
    mockNotifications.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    expect(() => {
      render(<NotificationCenter />);
    }).not.toThrow();
    // Should show empty state
    expect(screen.getByText('Sin notificaciones')).toBeInTheDocument();
  });

  it('does not crash when data is undefined', () => {
    mockNotifications.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    expect(() => {
      render(<NotificationCenter />);
    }).not.toThrow();
    expect(screen.getByText('Sin notificaciones')).toBeInTheDocument();
  });

  it('does not mark notifications as read on initial render', () => {
    mockNotifications.mockReturnValue({
      data: [
        {
          id: 'n1',
          type: 'LEAGUE_INVITE_RECEIVED',
          title: 'Te invitaron a la liga',
          message: '',
          priority: 'normal',
          read: false,
          link: null,
          createdAt: new Date().toISOString(),
          actionMeta: { inviteId: 'inv-1' },
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NotificationCenter />);
    expect(mockMarkRead).not.toHaveBeenCalled();
    expect(mockMarkAllRead).not.toHaveBeenCalled();
  });

  it('renders invite actions when readAt is present and invite is actionable', () => {
    mockNotifications.mockReturnValue({
      data: [
        {
          id: 'n-invite',
          type: 'league_invite_received',
          title: 'Te invitaron a la liga',
          message: '',
          priority: 'normal',
          read: true,
          readAt: '2025-01-02T00:00:00.000Z',
          link: null,
          createdAt: new Date().toISOString(),
          data: { inviteId: 'inv-1', leagueId: '11111111-1111-4111-8111-111111111111' },
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NotificationCenter />);

    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it('marks notification as read and navigates on click', () => {
    mockNotifications.mockReturnValue({
      data: [
        {
          id: 'n1',
          type: 'challenge_received',
          title: 'Juan te desafió a un partido',
          message: 'Te desafiaron',
          priority: 'high',
          read: false,
          link: '/competitive/challenges/abc',
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NotificationCenter />);
    fireEvent.click(screen.getByText('Juan te desafió a un partido'));
    expect(mockMarkRead).toHaveBeenCalledWith('n1');
    expect(pushMock).toHaveBeenCalledWith('/competitive/challenges/abc');
  });

  it('shows retry button on error', () => {
    const refetchMock = vi.fn();
    mockNotifications.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchMock,
    });

    render(<NotificationCenter />);
    expect(screen.getByText('No pudimos cargar tus notificaciones')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Reintentar'));
    expect(refetchMock).toHaveBeenCalled();
  });
});
