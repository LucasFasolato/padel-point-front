import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReportManualModal } from '@/app/components/leagues/report-manual-modal';
import type { LeagueMember } from '@/types/leagues';

const MEMBERS: LeagueMember[] = [
  { userId: 'u1', displayName: 'Yo', joinedAt: '2026-01-01T00:00:00Z' },
  { userId: 'u2', displayName: 'Rival', joinedAt: '2026-01-01T00:00:00Z' },
  { userId: 'u3', displayName: 'Partner', joinedAt: '2026-01-01T00:00:00Z' },
  { userId: 'u4', displayName: 'Rival Partner', joinedAt: '2026-01-01T00:00:00Z' },
];

function openAndFillBasicFlow() {
  fireEvent.change(screen.getByLabelText('Rival'), { target: { value: 'u2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

  const teamAInputs = screen.getAllByLabelText('Equipo A');
  const teamBInputs = screen.getAllByLabelText('Equipo B');
  fireEvent.change(teamAInputs[0], { target: { value: '6' } });
  fireEvent.change(teamBInputs[0], { target: { value: '4' } });
  fireEvent.change(teamAInputs[1], { target: { value: '6' } });
  fireEvent.change(teamBInputs[1], { target: { value: '3' } });

  fireEvent.click(screen.getByRole('button', { name: 'Revisar' }));
}

describe('ReportManualModal', () => {
  it('submits singles payload after 3-step flow', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});

    render(
      <ReportManualModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        members={MEMBERS}
        currentUserId="u1"
      />
    );

    openAndFillBasicFlow();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar resultado' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      teamA1Id: 'u1',
      teamB1Id: 'u2',
      sets: [{ a: 6, b: 4 }, { a: 6, b: 3 }],
    });
  });

  it('shows pending confirmation success card when backend returns pending status', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      matchId: 'm-1',
      status: 'pending_confirm',
    });
    const onViewMatch = vi.fn();

    render(
      <ReportManualModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        members={MEMBERS}
        currentUserId="u1"
        onViewMatch={onViewMatch}
      />
    );

    openAndFillBasicFlow();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar resultado' }));

    await screen.findByText('Pendiente de confirmación');
    fireEvent.click(screen.getByRole('button', { name: 'Ver partido' }));
    expect(onViewMatch).toHaveBeenCalledWith('m-1');
  });

  it('renders backend validation message on typed error', async () => {
    const onSubmit = vi.fn().mockRejectedValue({
      response: {
        data: {
          message: 'Ya existe un partido para estos jugadores.',
        },
      },
    });

    render(
      <ReportManualModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        members={MEMBERS}
        currentUserId="u1"
      />
    );

    openAndFillBasicFlow();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar resultado' }));

    await screen.findByText('Ya existe un partido para estos jugadores.');
  });
});
