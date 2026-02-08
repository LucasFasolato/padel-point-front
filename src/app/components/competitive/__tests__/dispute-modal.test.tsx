import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DisputeModal } from '../dispute-modal';

describe('DisputeModal', () => {
  it('does not render when closed', () => {
    render(
      <DisputeModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(screen.queryByText('Disputar resultado')).not.toBeInTheDocument();
  });

  it('renders reason select and submit button when open', () => {
    render(
      <DisputeModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(screen.getByText('Disputar resultado')).toBeInTheDocument();
    expect(screen.getByLabelText('Motivo')).toBeInTheDocument();
    expect(screen.getByText('Enviar disputa')).toBeInTheDocument();
  });

  it('disables submit when no reason selected', () => {
    render(
      <DisputeModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    const submitBtn = screen.getByText('Enviar disputa');
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit after selecting a reason', () => {
    render(
      <DisputeModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    fireEvent.change(screen.getByLabelText('Motivo'), {
      target: { value: 'wrong_score' },
    });
    const submitBtn = screen.getByText('Enviar disputa');
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls onSubmit with reason and message', () => {
    const onSubmit = vi.fn();
    render(
      <DisputeModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} />
    );

    fireEvent.change(screen.getByLabelText('Motivo'), {
      target: { value: 'wrong_score' },
    });
    fireEvent.change(screen.getByLabelText(/Detalle/), {
      target: { value: 'El marcador estaba al revés' },
    });
    fireEvent.click(screen.getByText('Enviar disputa'));

    expect(onSubmit).toHaveBeenCalledWith(
      'wrong_score',
      'El marcador estaba al revés'
    );
  });

  it('calls onSubmit with undefined message when empty', () => {
    const onSubmit = vi.fn();
    render(
      <DisputeModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} />
    );

    fireEvent.change(screen.getByLabelText('Motivo'), {
      target: { value: 'match_not_played' },
    });
    fireEvent.click(screen.getByText('Enviar disputa'));

    expect(onSubmit).toHaveBeenCalledWith('match_not_played', undefined);
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <DisputeModal isOpen={true} onClose={onClose} onSubmit={vi.fn()} />
    );
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows loading state on submit button', () => {
    render(
      <DisputeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        loading={true}
      />
    );
    const submitBtn = screen.getByText('Enviar disputa');
    expect(submitBtn).toBeDisabled();
  });
});
