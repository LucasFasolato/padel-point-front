import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockUseUnreadCount = vi.fn(() => ({ data: 0 }));

vi.mock('@/hooks/use-notifications', () => ({
  useUnreadCount: () => mockUseUnreadCount(),
}));

import { BottomNav } from '../bottom-nav';

describe('BottomNav', () => {
  beforeEach(() => {
    mockUseUnreadCount.mockReturnValue({ data: 0 });
  });

  it('renders Alertas tab linking to /notifications', () => {
    render(<BottomNav />);
    const alertasLink = screen.getByText('Alertas').closest('a');
    expect(alertasLink).toHaveAttribute('href', '/notifications');
  });

  it('Alertas link is clickable even when badge is showing', () => {
    mockUseUnreadCount.mockReturnValue({ data: 3 });
    render(<BottomNav />);

    const alertasLink = screen.getByText('Alertas').closest('a');
    expect(alertasLink).toHaveAttribute('href', '/notifications');

    // Badge dot must have pointer-events-none so it never captures taps
    const badge = alertasLink!.querySelector('span[aria-hidden="true"]');
    expect(badge).toBeInTheDocument();
    expect(badge!.className).toContain('pointer-events-none');
  });

  it('shows aria-label with unread hint when badge is present', () => {
    mockUseUnreadCount.mockReturnValue({ data: 5 });
    render(<BottomNav />);

    const alertasLink = screen.getByLabelText(
      'Alertas — tienes notificaciones sin leer'
    );
    expect(alertasLink).toBeInTheDocument();
  });

  it('shows plain aria-label when no unread notifications', () => {
    mockUseUnreadCount.mockReturnValue({ data: 0 });
    render(<BottomNav />);

    const alertasLink = screen.getByText('Alertas').closest('a');
    expect(alertasLink).toHaveAttribute('aria-label', 'Alertas');
  });
});
