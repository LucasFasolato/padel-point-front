import { describe, expect, it } from 'vitest';
import {
  groupLeaguesByStatus,
  formatDateRange,
  normalizeLeagueStatus,
  getStatusLabel,
  getStatusColors,
  STATUS_LABELS,
} from '../league-utils';
import type { League } from '@/types/leagues';

const makeLeague = (id: string, status: string): League => ({
  id,
  name: `Liga ${id}`,
  status: status as League['status'],
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

  it('returns null when startDate is missing', () => {
    expect(formatDateRange(null, '2026-03-28')).toBeNull();
    expect(formatDateRange(undefined, '2026-03-28')).toBeNull();
    expect(formatDateRange('', '2026-03-28')).toBeNull();
  });

  it('returns null when endDate is missing', () => {
    expect(formatDateRange('2026-01-15', null)).toBeNull();
    expect(formatDateRange('2026-01-15', undefined)).toBeNull();
    expect(formatDateRange('2026-01-15', '')).toBeNull();
  });

  it('returns null for epoch/pre-2000 dates (permanent league sentinel)', () => {
    expect(formatDateRange('1970-01-01', '1970-01-01')).toBeNull();
    expect(formatDateRange('1969-12-31', '1970-01-01')).toBeNull();
  });
});

describe('STATUS_LABELS', () => {
  it('has Spanish labels for all statuses', () => {
    expect(STATUS_LABELS.active).toBe('Activa');
    expect(STATUS_LABELS.upcoming).toBe('Próxima');
    expect(STATUS_LABELS.finished).toBe('Finalizada');
  });
});

describe('normalizeLeagueStatus', () => {
  it('maps "draft" to "upcoming"', () => {
    expect(normalizeLeagueStatus('draft')).toBe('upcoming');
  });

  it('passes through known statuses unchanged', () => {
    expect(normalizeLeagueStatus('active')).toBe('active');
    expect(normalizeLeagueStatus('upcoming')).toBe('upcoming');
    expect(normalizeLeagueStatus('finished')).toBe('finished');
  });

  it('falls back to "upcoming" for unknown statuses', () => {
    expect(normalizeLeagueStatus('unknown_thing')).toBe('upcoming');
  });
});

describe('getStatusLabel / getStatusColors', () => {
  it('returns label for known status', () => {
    expect(getStatusLabel('active')).toBe('Activa');
  });

  it('returns label for aliased status (draft)', () => {
    expect(getStatusLabel('draft')).toBe('Próxima');
  });

  it('returns fallback label for completely unknown status', () => {
    expect(getStatusLabel('xyz')).toBe('Próxima');
  });

  it('returns colors for known status', () => {
    expect(getStatusColors('active').bg).toBe('bg-emerald-100');
  });

  it('returns colors for aliased status (draft)', () => {
    expect(getStatusColors('draft').bg).toBe('bg-blue-100');
  });
});

describe('groupLeaguesByStatus with draft', () => {
  it('groups "draft" leagues under "upcoming"', () => {
    const leagues = [
      makeLeague('1', 'active'),
      makeLeague('2', 'draft'),
      makeLeague('3', 'upcoming'),
    ];
    const groups = groupLeaguesByStatus(leagues);

    expect(groups).toHaveLength(2);
    expect(groups[0].status).toBe('active');
    expect(groups[1].status).toBe('upcoming');
    expect(groups[1].items).toHaveLength(2); // draft + upcoming
  });
});
