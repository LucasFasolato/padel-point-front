import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import api from '@/lib/api';
import { useReservationNotifications } from '@/hooks/use-reservation-notifications';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('useReservationNotifications', () => {
  it('fetches notification status from the API', async () => {
    const mockedApi = api as unknown as {
      get: ReturnType<typeof vi.fn>;
      post: ReturnType<typeof vi.fn>;
    };

    mockedApi.get.mockResolvedValue({
      data: { status: 'sent', lastAttemptAt: null, message: null },
    });

    const { result } = renderHook(() =>
      useReservationNotifications({
        reservationId: 'res-1',
        receiptToken: 'token-1',
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notification?.status).toBe('sent');
    expect(result.current.state).toBe('sent');
  });

  it('returns an error when receiptToken is missing', async () => {
    const { result } = renderHook(() =>
      useReservationNotifications({
        reservationId: 'res-2',
        receiptToken: '',
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(
      'Falta receiptToken para consultar o reenviar notificaciones.',
    );
    expect(result.current.notification?.status).toBe('error');
    expect(result.current.state).toBe('error');
  });
});
