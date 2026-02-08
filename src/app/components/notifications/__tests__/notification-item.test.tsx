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
});
