import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StepGoals } from '../step-goals';

describe('StepGoals', () => {
  const defaultProps = {
    selectedGoal: null as import('@/store/onboarding-store').PlayerGoal | null,
    selectedFrequency: null as import('@/store/onboarding-store').PlayFrequency | null,
    onSelectGoal: vi.fn(),
    onSelectFrequency: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
  };

  it('renders goal and frequency sections', () => {
    render(<StepGoals {...defaultProps} />);
    expect(screen.getByText(/¿Qué te motiva a jugar/)).toBeInTheDocument();
    expect(screen.getByText(/¿Cuánto jugás por semana/)).toBeInTheDocument();
  });

  it('disables continue when neither goal nor frequency selected', () => {
    render(<StepGoals {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeDisabled();
  });

  it('disables continue when only goal is selected', () => {
    render(<StepGoals {...defaultProps} selectedGoal="improve" />);
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeDisabled();
  });

  it('enables continue when both goal and frequency are selected', () => {
    render(
      <StepGoals {...defaultProps} selectedGoal="compete" selectedFrequency="3-4" />
    );
    expect(screen.getByRole('button', { name: /Continuar/ })).not.toBeDisabled();
  });

  it('calls onSelectGoal when goal option clicked', () => {
    const onSelectGoal = vi.fn();
    render(<StepGoals {...defaultProps} onSelectGoal={onSelectGoal} />);

    fireEvent.click(screen.getByText(/Competir y ganar/));
    expect(onSelectGoal).toHaveBeenCalledWith('compete');
  });

  it('calls onSelectFrequency when frequency option clicked', () => {
    const onSelectFrequency = vi.fn();
    render(<StepGoals {...defaultProps} onSelectFrequency={onSelectFrequency} />);

    fireEvent.click(screen.getByText(/3–4 veces por semana/));
    expect(onSelectFrequency).toHaveBeenCalledWith('3-4');
  });
});
