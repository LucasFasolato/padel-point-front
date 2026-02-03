import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ReservationNotificationCard } from './reservation-notification-card';

describe('ReservationNotificationCard', () => {
  const baseProps = {
    lastAttemptAt: null,
    message: null,
    loading: false,
    errorMessage: null,
    isResending: false,
    onResend: vi.fn(),
  };

  it('renders with token (can resend)', () => {
    render(
      <ReservationNotificationCard
        {...baseProps}
        status="sent"
        canResend={true}
      />,
    );

    expect(screen.getByText(/Notific/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reenviar' })).toBeInTheDocument();
  });

  it('renders error state without token', () => {
    render(
      <ReservationNotificationCard
        {...baseProps}
        status="error"
        canResend={false}
        errorMessage="Falta receiptToken para consultar o reenviar notificaciones."
      />,
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Falta receiptToken para consultar o reenviar notificaciones.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No se puede reenviar sin un receiptToken valido.'),
    ).toBeInTheDocument();
  });
});
