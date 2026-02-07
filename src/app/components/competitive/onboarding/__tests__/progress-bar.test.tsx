import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from '../progress-bar';

describe('ProgressBar', () => {
  it('renders step indicator text', () => {
    render(<ProgressBar currentStep={0} />);
    expect(screen.getByText('Paso 1 de 4')).toBeInTheDocument();
  });

  it('updates step text for different steps', () => {
    const { rerender } = render(<ProgressBar currentStep={2} />);
    expect(screen.getByText('Paso 3 de 4')).toBeInTheDocument();

    rerender(<ProgressBar currentStep={3} />);
    expect(screen.getByText('Paso 4 de 4')).toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    render(<ProgressBar currentStep={1} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '2');
    expect(progressbar).toHaveAttribute('aria-valuemin', '1');
    expect(progressbar).toHaveAttribute('aria-valuemax', '4');
  });
});
