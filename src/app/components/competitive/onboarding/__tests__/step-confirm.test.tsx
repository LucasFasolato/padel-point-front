import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StepConfirm } from '../step-confirm';

describe('StepConfirm', () => {
  const defaultProps = {
    category: 5 as const,
    goal: 'improve' as const,
    frequency: 'weekly' as const,
    isSubmitting: false,
    error: null,
    onConfirm: vi.fn(),
    onBack: vi.fn(),
  };

  it('renders summary with category, goal, and frequency', () => {
    render(<StepConfirm {...defaultProps} />);
    expect(screen.getByText(/Todo listo para arrancar/)).toBeInTheDocument();
    expect(screen.getByText(/5ta - Nivel intermedio/)).toBeInTheDocument();
    expect(screen.getByText(/Mejorar mi juego/)).toBeInTheDocument();
    expect(screen.getByText(/3–4 veces por semana/)).toBeInTheDocument();
  });

  it('calls onConfirm when activate button clicked', () => {
    const onConfirm = vi.fn();
    render(<StepConfirm {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: /Activar perfil/ }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('shows loading state when submitting', () => {
    render(<StepConfirm {...defaultProps} isSubmitting={true} />);
    const activateBtn = screen.getByRole('button', { name: /Activar perfil/ });
    expect(activateBtn).toBeDisabled();
  });

  it('renders error message when present', () => {
    render(<StepConfirm {...defaultProps} error="Algo salió mal" />);
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('does not render error when null', () => {
    render(<StepConfirm {...defaultProps} error={null} />);
    expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
  });

  it('disables back button while submitting', () => {
    render(<StepConfirm {...defaultProps} isSubmitting={true} />);
    expect(screen.getByRole('button', { name: /Volver/ })).toBeDisabled();
  });

  it('shows "Categoría inicial" label by default', () => {
    render(<StepConfirm {...defaultProps} />);
    expect(screen.getByText(/Categoría inicial/)).toBeInTheDocument();
  });

  it('shows locked category label when categoryLocked=true', () => {
    render(<StepConfirm {...defaultProps} categoryLocked={true} />);
    expect(screen.getByText(/definida por partidos/)).toBeInTheDocument();
  });
});
