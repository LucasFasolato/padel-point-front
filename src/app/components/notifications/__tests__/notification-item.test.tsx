import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationItem } from '../notification-item';
import type { AppNotification } from '@/types/notifications';

const makeNotification = (overrides: Partial<AppNotification> = {}): AppNotification => ({
  id: '1',
  type: 'challenge_received',
  title: 'Nuevo desafío de Juan',
  message: 'Te desafió a un partido de categoría 5ta',
  priority: 'high',
  read: false,
  link: '/competitive/challenges/abc',
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('NotificationItem', () => {
  it('renders title and message', () => {
    const n = makeNotification();
    render(<NotificationItem notification={n} onClick={vi.fn()} />);
    expect(screen.getByText('Nuevo desafío de Juan')).toBeInTheDocument();
    expect(screen.getByText(/Te desafió/)).toBeInTheDocument();
  });

  it('shows type label', () => {
    const n = makeNotification({ type: 'match_reported' });
    render(<NotificationItem notification={n} onClick={vi.fn()} />);
    expect(screen.getByText('Resultado reportado')).toBeInTheDocument();
  });

  it('calls onClick with notification when clicked', () => {
    const onClick = vi.fn();
    const n = makeNotification();
    render(<NotificationItem notification={n} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(n);
  });

  it('applies unread styles when not read', () => {
    const n = makeNotification({ read: false });
    const { container } = render(<NotificationItem notification={n} onClick={vi.fn()} />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-emerald-50');
  });

  it('applies read styles when read', () => {
    const n = makeNotification({ read: true });
    const { container } = render(<NotificationItem notification={n} onClick={vi.fn()} />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-white');
  });

  it('renders league_invite_received with correct label', () => {
    const n = makeNotification({
      type: 'league_invite_received',
      title: 'Te invitaron a la liga Padel Masters',
      link: '/leagues/invite?token=abc123',
    });
    render(<NotificationItem notification={n} onClick={vi.fn()} />);
    expect(screen.getByText('Invitación a liga')).toBeInTheDocument();
    expect(screen.getByText('Te invitaron a la liga Padel Masters')).toBeInTheDocument();
  });

  it('renders league_invite_accepted with correct label', () => {
    const n = makeNotification({
      type: 'league_invite_accepted',
      title: 'Carlos aceptó la invitación a Padel Masters',
      link: '/leagues/lg-1',
    });
    render(<NotificationItem notification={n} onClick={vi.fn()} />);
    expect(screen.getByText('Invitación aceptada')).toBeInTheDocument();
  });

  it('renders league_invite_declined with correct label', () => {
    const n = makeNotification({
      type: 'league_invite_declined',
      title: 'María rechazó la invitación a Padel Masters',
      link: '/leagues/lg-1',
    });
    render(<NotificationItem notification={n} onClick={vi.fn()} />);
    expect(screen.getByText('Invitación rechazada')).toBeInTheDocument();
  });

  it('navigates on click for league invite notification', () => {
    const onClick = vi.fn();
    const n = makeNotification({
      type: 'league_invite_received',
      title: 'Te invitaron a la liga Padel Masters',
      link: '/leagues/invite?token=abc123',
    });
    render(<NotificationItem notification={n} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(n);
    expect(n.link).toBe('/leagues/invite?token=abc123');
  });

  it('renders match_disputed with correct label and navigates to match', () => {
    const onClick = vi.fn();
    const n = makeNotification({
      type: 'match_disputed',
      title: 'Juan disputó el resultado',
      link: '/matches/m-123',
    });
    render(<NotificationItem notification={n} onClick={onClick} />);
    expect(screen.getByText('Resultado disputado')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(n);
    expect(n.link).toBe('/matches/m-123');
  });

  it('renders match_resolved with correct label', () => {
    const n = makeNotification({
      type: 'match_resolved',
      title: 'La disputa fue resuelta',
      link: '/matches/m-123',
    });
    render(<NotificationItem notification={n} onClick={vi.fn()} />);
    expect(screen.getByText('Disputa resuelta')).toBeInTheDocument();
  });

  it('renders unknown notification type with generic fallback label', () => {
    // Simulate a type the frontend does not know about yet
    const n = makeNotification({
      type: 'some_future_type' as AppNotification['type'],
      title: 'Something new happened',
    });
    expect(() => {
      render(<NotificationItem notification={n} onClick={vi.fn()} />);
    }).not.toThrow();
    expect(screen.getByText('Notificación')).toBeInTheDocument();
    expect(screen.getByText('Something new happened')).toBeInTheDocument();
  });

  // Challenge notification types
  it('renders challenge_accepted with correct label', () => {
    const n = makeNotification({
      type: 'challenge_accepted',
      title: 'Carlos aceptó tu desafío',
      link: '/competitive/challenges/abc',
    });
    render(<NotificationItem notification={n} onClick={vi.fn()} />);
    expect(screen.getByText('Desafío aceptado')).toBeInTheDocument();
    expect(screen.getByText('Carlos aceptó tu desafío')).toBeInTheDocument();
  });

  it('renders challenge_rejected with correct label', () => {
    const n = makeNotification({
      type: 'challenge_rejected',
      title: 'María rechazó tu desafío',
      link: '/competitive/challenges/def',
    });
    render(<NotificationItem notification={n} onClick={vi.fn()} />);
    expect(screen.getByText('Desafío rechazado')).toBeInTheDocument();
  });

  it('navigates on click for challenge_accepted notification', () => {
    const onClick = vi.fn();
    const n = makeNotification({
      type: 'challenge_accepted',
      title: 'Carlos aceptó tu desafío',
      link: '/competitive/challenges/abc',
    });
    render(<NotificationItem notification={n} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(n);
    expect(n.link).toBe('/competitive/challenges/abc');
  });

  // Robustness tests — never crash on weird payloads
  it('does not crash when title is empty string', () => {
    const n = makeNotification({ title: '' });
    expect(() => {
      render(<NotificationItem notification={n} onClick={vi.fn()} />);
    }).not.toThrow();
  });

  it('does not crash when message is empty string', () => {
    const n = makeNotification({ message: '' });
    expect(() => {
      render(<NotificationItem notification={n} onClick={vi.fn()} />);
    }).not.toThrow();
  });

  it('does not crash when link is null', () => {
    const onClick = vi.fn();
    const n = makeNotification({ link: null });
    expect(() => {
      render(<NotificationItem notification={n} onClick={onClick} />);
    }).not.toThrow();
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(n);
  });

  it('does not crash when createdAt is an invalid date string', () => {
    const n = makeNotification({ createdAt: 'not-a-date' });
    expect(() => {
      render(<NotificationItem notification={n} onClick={vi.fn()} />);
    }).not.toThrow();
  });

  it('does not crash with extremely long title and message', () => {
    const n = makeNotification({
      title: 'A'.repeat(1000),
      message: 'B'.repeat(5000),
    });
    expect(() => {
      render(<NotificationItem notification={n} onClick={vi.fn()} />);
    }).not.toThrow();
  });
});
