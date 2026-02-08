import { describe, expect, it } from 'vitest';
import {
  groupLeaguesByStatus,
  formatDateRange,
  STATUS_LABELS,
} from '../league-utils';
import type { League } from '@/types/leagues';

const makeLeague = (id: string, status: League['status']): League => ({
  id,
  name: `Liga ${id}`,
  status,
  startDate: '2026-01-15',
  endDate: '2026-03-15',
  creatorId: 'u-1',
  membersCount: 4,
});

describe('groupLeaguesByStatus', () => {
  it('groups leagues by status in correct order', () => {
    const leagues = [
      makeLeague('1', 'finished'),
      makeLeague('2', 'active'),
      makeLeague('3', 'upcoming'),
      makeLeague('4', 'active'),
    ];
    const groups = groupLeaguesByStatus(leagues);

    expect(groups).toHaveLength(3);
    expect(groups[0].status).toBe('active');
    expect(groups[0].items).toHaveLength(2);
    expect(groups[1].status).toBe('upcoming');
    expect(groups[2].status).toBe('finished');
  });

  it('returns empty array for empty input', () => {
    expect(groupLeaguesByStatus([])).toEqual([]);
  });

  it('omits statuses with no leagues', () => {
    const leagues = [makeLeague('1', 'active')];
    const groups = groupLeaguesByStatus(leagues);
    expect(groups).toHaveLength(1);
    expect(groups[0].status).toBe('active');
  });
});

describe('formatDateRange', () => {
  it('formats same-year range with separator', () => {
    const result = formatDateRange('2026-01-15T00:00:00', '2026-03-28T00:00:00');
    expect(result).toContain('ene');
    expect(result).toContain('mar');
    expect(result).toContain('–');
    // Year appears only once (at the end)
    expect(result).toContain('2026');
  });

  it('formats cross-year range with year on both', () => {
    const result = formatDateRange('2025-12-01T00:00:00', '2026-02-15T00:00:00');
    expect(result).toContain('2025');
    expect(result).toContain('2026');
  });
});

describe('STATUS_LABELS', () => {
  it('has Spanish labels for all statuses', () => {
    expect(STATUS_LABELS.active).toBe('Activa');
    expect(STATUS_LABELS.upcoming).toBe('Próxima');
    expect(STATUS_LABELS.finished).toBe('Finalizada');
  });
});
