import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StepCategory } from '../step-category';

describe('StepCategory', () => {
  const defaultProps = {
    selected: null as import('@/types/competitive').Category | null,
    onSelect: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
  };

  it('renders all 8 category options', () => {
    render(<StepCategory {...defaultProps} />);
    expect(screen.getByText(/¿Cuál es tu nivel actual/)).toBeInTheDocument();
    expect(screen.getByText(/8va - Estoy empezando/)).toBeInTheDocument();
    expect(screen.getByText(/1ra - Nivel élite/)).toBeInTheDocument();
  });

  it('disables continue button when no category selected', () => {
    render(<StepCategory {...defaultProps} />);
    const continueBtn = screen.getByRole('button', { name: /Continuar/ });
    expect(continueBtn).toBeDisabled();
  });

  it('enables continue button when category is selected', () => {
    render(<StepCategory {...defaultProps} selected={5} />);
    const continueBtn = screen.getByRole('button', { name: /Continuar/ });
    expect(continueBtn).not.toBeDisabled();
  });

  it('calls onSelect when a category is clicked', () => {
    const onSelect = vi.fn();
    render(<StepCategory {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByText(/7ma - Nivel inicial/));
    expect(onSelect).toHaveBeenCalledWith(7);
  });

  it('calls onNext when continue is clicked', () => {
    const onNext = vi.fn();
    render(<StepCategory {...defaultProps} selected={5} onNext={onNext} />);

    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(onNext).toHaveBeenCalled();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<StepCategory {...defaultProps} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: /Volver/ }));
    expect(onBack).toHaveBeenCalled();
  });
});
