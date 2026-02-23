import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart" />,
}));

import { EloChart } from '../elo-chart';
import type { EloHistoryPoint } from '@/types/competitive';

const point: EloHistoryPoint = {
  id: 'eh-1',
  eloBefore: 1180,
  eloAfter: 1192,
  delta: 12,
  reason: 'match_result',
  refId: 'm-1',
  createdAt: new Date().toISOString(),
};

describe('EloChart', () => {
  it('renders empty state when history is empty', () => {
    render(<EloChart history={[]} />);
    expect(screen.getByText('Jugá tu primer partido para ver tu evolución')).toBeInTheDocument();
  });

  it('renders chart when history exists', () => {
    render(<EloChart history={[point]} />);
    expect(screen.getByTestId('elo-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
