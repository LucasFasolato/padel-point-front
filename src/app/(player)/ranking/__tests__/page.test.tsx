import { describe, expect, it, vi } from 'vitest';

const mockRedirect = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

import RankingPage from '../page';

describe('Legacy Ranking Page', () => {
  it('redirects to /competitive/rankings', () => {
    RankingPage();

    expect(mockRedirect).toHaveBeenCalledWith('/competitive/rankings');
  });
});
