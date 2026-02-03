import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { SuccessContent } from './page';

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => 'receipt-token',
  }),
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('@/hooks/use-reservation-notifications', () => ({
  useReservationNotifications: () => ({
    notification: {
      status: 'sent',
      lastAttemptAt: null,
      message: 'Mock',
    },
    loading: false,
    error: null,
    resend: vi.fn(),
    canResend: true,
    isResending: false,
  }),
}));

vi.mock('@/services/player-service', () => ({
  PlayerService: {
    getReceipt: vi.fn(),
  },
}));

describe('SuccessContent', () => {
  it('renders the notification block', async () => {
    const { PlayerService } = await import('@/services/player-service');
    const mockedPlayerService = PlayerService as {
      getReceipt: ReturnType<typeof vi.fn>;
    };

    mockedPlayerService.getReceipt.mockResolvedValue({
      id: 'res-1',
      status: 'confirmed',
      startAt: '2024-10-10T10:00:00.000Z',
      endAt: '2024-10-10T11:00:00.000Z',
      expiresAt: null,
      precio: 1000,
      checkoutTokenExpiresAt: null,
      serverNow: '2024-10-10T09:00:00.000Z',
      receiptToken: 'receipt-token',
      receiptTokenExpiresAt: null,
      court: {
        id: 'court-1',
        nombre: 'Cancha 1',
        superficie: 'Cemento',
        precioPorHora: 1000,
        club: {
          id: 'club-1',
          nombre: 'Club Test',
          direccion: 'Calle 123',
        },
      },
      cliente: {
        nombre: 'Test',
        email: null,
        telefono: null,
      },
    });

    render(<SuccessContent reservationId="res-1" />);

    await waitFor(() => {
      expect(screen.getByText('Notificación')).toBeInTheDocument();
    });
  });
});
