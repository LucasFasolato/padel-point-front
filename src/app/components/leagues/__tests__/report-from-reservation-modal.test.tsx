import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ReportFromReservationModal } from '../report-from-reservation-modal';
import type { LeagueMember, EligibleReservation } from '@/types/leagues';

const MEMBERS: LeagueMember[] = [
  { userId: 'u1', displayName: 'Juan', joinedAt: '2025-01-01T00:00:00Z' },
  { userId: 'u2', displayName: 'Carlos', joinedAt: '2025-01-01T00:00:00Z' },
  { userId: 'u3', displayName: 'María', joinedAt: '2025-01-01T00:00:00Z' },
  { userId: 'u4', displayName: 'Ana', joinedAt: '2025-01-01T00:00:00Z' },
];

const RESERVATIONS: EligibleReservation[] = [
  {
    id: 'res-1',
    courtName: 'Cancha 1',
    clubName: 'Club Norte',
    startAt: '2025-06-01T18:00:00Z',
    endAt: '2025-06-01T19:30:00Z',
  },
  {
    id: 'res-2',
    courtName: 'Cancha 2',
    clubName: 'Club Sur',
    startAt: '2025-06-02T10:00:00Z',
    endAt: '2025-06-02T11:30:00Z',
  },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  isPending: false,
  members: MEMBERS,
  reservations: RESERVATIONS,
  reservationsLoading: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReportFromReservationModal', () => {
  it('renders reservation step with reservation cards', () => {
    render(<ReportFromReservationModal {...defaultProps} />);
    expect(screen.getByText('Elegí la reserva')).toBeInTheDocument();
    expect(screen.getByText('Cancha 1')).toBeInTheDocument();
    expect(screen.getByText('Cancha 2')).toBeInTheDocument();
  });

  it('disables next button until reservation is selected', () => {
    render(<ReportFromReservationModal {...defaultProps} />);
    const nextBtn = screen.getByText('Siguiente');
    expect(nextBtn).toBeDisabled();
  });

  it('enables next button after selecting a reservation', () => {
    render(<ReportFromReservationModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancha 1'));
    const nextBtn = screen.getByText('Siguiente');
    expect(nextBtn).not.toBeDisabled();
  });

  it('navigates to participants step', () => {
    render(<ReportFromReservationModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancha 1'));
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('Elegí los jugadores')).toBeInTheDocument();
    expect(screen.getByText('Equipo A')).toBeInTheDocument();
    expect(screen.getByText('Equipo B')).toBeInTheDocument();
  });

  it('blocks navigation to score step without selecting all 4 players', () => {
    render(<ReportFromReservationModal {...defaultProps} />);
    // Go to step 2
    fireEvent.click(screen.getByText('Cancha 1'));
    fireEvent.click(screen.getByText('Siguiente'));

    // Try to go to step 3 — all buttons with "Siguiente" text
    const nextBtns = screen.getAllByText('Siguiente');
    const stepNext = nextBtns[nextBtns.length - 1];
    expect(stepNext).toBeDisabled();
  });

  it('navigates to score step after selecting 4 unique players', () => {
    render(<ReportFromReservationModal {...defaultProps} />);
    // Step 1: select reservation
    fireEvent.click(screen.getByText('Cancha 1'));
    fireEvent.click(screen.getByText('Siguiente'));

    // Step 2: select players
    fireEvent.change(screen.getByLabelText('Jugador 1', { selector: '#teamA1' }), {
      target: { value: 'u1' },
    });
    fireEvent.change(screen.getByLabelText('Jugador 2', { selector: '#teamA2' }), {
      target: { value: 'u2' },
    });
    fireEvent.change(screen.getByLabelText('Jugador 1', { selector: '#teamB1' }), {
      target: { value: 'u3' },
    });
    fireEvent.change(screen.getByLabelText('Jugador 2', { selector: '#teamB2' }), {
      target: { value: 'u4' },
    });

    // Navigate to score step
    const nextBtns = screen.getAllByText('Siguiente');
    fireEvent.click(nextBtns[nextBtns.length - 1]);

    expect(screen.getByText('Cargá el resultado')).toBeInTheDocument();
    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText('Set 2')).toBeInTheDocument();
  });

  it('calls onSubmit with correct payload on submit', () => {
    const onSubmit = vi.fn();
    render(<ReportFromReservationModal {...defaultProps} onSubmit={onSubmit} />);

    // Step 1
    fireEvent.click(screen.getByText('Cancha 1'));
    fireEvent.click(screen.getByText('Siguiente'));

    // Step 2
    fireEvent.change(screen.getByLabelText('Jugador 1', { selector: '#teamA1' }), {
      target: { value: 'u1' },
    });
    fireEvent.change(screen.getByLabelText('Jugador 2', { selector: '#teamA2' }), {
      target: { value: 'u2' },
    });
    fireEvent.change(screen.getByLabelText('Jugador 1', { selector: '#teamB1' }), {
      target: { value: 'u3' },
    });
    fireEvent.change(screen.getByLabelText('Jugador 2', { selector: '#teamB2' }), {
      target: { value: 'u4' },
    });
    const nextBtns = screen.getAllByText('Siguiente');
    fireEvent.click(nextBtns[nextBtns.length - 1]);

    // Step 3: fill in sets
    fireEvent.change(screen.getByLabelText('Equipo A', { selector: '#set0a' }), {
      target: { value: '6' },
    });
    fireEvent.change(screen.getByLabelText('Equipo B', { selector: '#set0b' }), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByLabelText('Equipo A', { selector: '#set1a' }), {
      target: { value: '6' },
    });
    fireEvent.change(screen.getByLabelText('Equipo B', { selector: '#set1b' }), {
      target: { value: '3' },
    });

    fireEvent.click(screen.getByText('Cargar resultado'));

    expect(onSubmit).toHaveBeenCalledWith({
      reservationId: 'res-1',
      teamA1Id: 'u1',
      teamA2Id: 'u2',
      teamB1Id: 'u3',
      teamB2Id: 'u4',
      sets: [
        { a: 6, b: 4 },
        { a: 6, b: 3 },
      ],
    });
  });

  it('blocks submit when sets are empty', () => {
    render(<ReportFromReservationModal {...defaultProps} />);

    // Step 1
    fireEvent.click(screen.getByText('Cancha 1'));
    fireEvent.click(screen.getByText('Siguiente'));

    // Step 2
    fireEvent.change(screen.getByLabelText('Jugador 1', { selector: '#teamA1' }), {
      target: { value: 'u1' },
    });
    fireEvent.change(screen.getByLabelText('Jugador 2', { selector: '#teamA2' }), {
      target: { value: 'u2' },
    });
    fireEvent.change(screen.getByLabelText('Jugador 1', { selector: '#teamB1' }), {
      target: { value: 'u3' },
    });
    fireEvent.change(screen.getByLabelText('Jugador 2', { selector: '#teamB2' }), {
      target: { value: 'u4' },
    });
    const nextBtns = screen.getAllByText('Siguiente');
    fireEvent.click(nextBtns[nextBtns.length - 1]);

    // Do NOT fill sets — button should be disabled
    const submitBtn = screen.getByText('Cargar resultado');
    expect(submitBtn).toBeDisabled();
  });

  it('shows empty state when no reservations available', () => {
    render(
      <ReportFromReservationModal {...defaultProps} reservations={[]} />
    );
    expect(
      screen.getByText('No hay reservas elegibles en los últimos 30 días.')
    ).toBeInTheDocument();
  });

  it('shows loading skeletons when reservations are loading', () => {
    const { container } = render(
      <ReportFromReservationModal {...defaultProps} reservationsLoading />
    );
    // Skeletons should render
    const skeletons = container.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('does not render when closed', () => {
    render(
      <ReportFromReservationModal {...defaultProps} isOpen={false} />
    );
    expect(screen.queryByText('Elegí la reserva')).not.toBeInTheDocument();
  });

  it('can go back from participants to reservation step', () => {
    render(<ReportFromReservationModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancha 1'));
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('Elegí los jugadores')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Atrás'));
    expect(screen.getByText('Elegí la reserva')).toBeInTheDocument();
  });

  it('can add a third set', () => {
    render(<ReportFromReservationModal {...defaultProps} />);
    // Navigate to score step
    fireEvent.click(screen.getByText('Cancha 1'));
    fireEvent.click(screen.getByText('Siguiente'));
    fireEvent.change(screen.getByLabelText('Jugador 1', { selector: '#teamA1' }), {
      target: { value: 'u1' },
    });
    fireEvent.change(screen.getByLabelText('Jugador 2', { selector: '#teamA2' }), {
      target: { value: 'u2' },
    });
    fireEvent.change(screen.getByLabelText('Jugador 1', { selector: '#teamB1' }), {
      target: { value: 'u3' },
    });
    fireEvent.change(screen.getByLabelText('Jugador 2', { selector: '#teamB2' }), {
      target: { value: 'u4' },
    });
    fireEvent.click(screen.getAllByText('Siguiente')[screen.getAllByText('Siguiente').length - 1]);

    // Should have 2 sets, click to add
    expect(screen.getByText('+ Agregar set')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ Agregar set'));
    expect(screen.getByText('Set 3')).toBeInTheDocument();
  });
});
