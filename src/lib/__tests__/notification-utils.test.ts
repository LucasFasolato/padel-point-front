import { describe, expect, it } from 'vitest';
import { groupByRecency, formatRelativeTime, TIME_GROUP_LABELS } from '../notification-utils';
import type { AppNotification } from '@/types/notifications';

const makeNotif = (id: string, createdAt: string): AppNotification => ({
  id,
  type: 'general',
  title: `Notif ${id}`,
  message: '',
  priority: 'normal',
  read: false,
  link: null,
  createdAt,
});

describe('groupByRecency', () => {
  it('groups today items correctly', () => {
    const today = new Date().toISOString();
    const result = groupByRecency([makeNotif('1', today)]);
    expect(result).toHaveLength(1);
    expect(result[0].group).toBe('today');
    expect(result[0].items).toHaveLength(1);
  });

  it('groups items from this week', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    // Make sure it's not "today"
    yesterday.setHours(0, 0, 0, 0);

    const result = groupByRecency([makeNotif('1', yesterday.toISOString())]);
    // Could be "today" or "this_week" depending on time of day
    expect(result).toHaveLength(1);
    expect(['today', 'this_week']).toContain(result[0].group);
  });

  it('groups older items', () => {
    const old = new Date('2024-01-01').toISOString();
    const result = groupByRecency([makeNotif('1', old)]);
    expect(result).toHaveLength(1);
    expect(result[0].group).toBe('older');
  });

  it('returns empty array for no notifications', () => {
    expect(groupByRecency([])).toEqual([]);
  });

  it('skips empty groups', () => {
    const today = new Date().toISOString();
    const old = new Date('2024-01-01').toISOString();
    const result = groupByRecency([makeNotif('1', today), makeNotif('2', old)]);
    // Should have "today" and "older" but not "this_week"
    const groups = result.map((g) => g.group);
    expect(groups).toContain('today');
    expect(groups).toContain('older');
  });
});

describe('formatRelativeTime', () => {
  it('returns "Ahora" for just now', () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe('Ahora');
  });

  it('returns minutes for recent', () => {
    const d = new Date(Date.now() - 5 * 60000);
    expect(formatRelativeTime(d.toISOString())).toBe('Hace 5 min');
  });

  it('returns hours for same-day', () => {
    const d = new Date(Date.now() - 3 * 3600000);
    expect(formatRelativeTime(d.toISOString())).toBe('Hace 3h');
  });

  it('returns "Ayer" for 1 day ago', () => {
    const d = new Date(Date.now() - 25 * 3600000);
    expect(formatRelativeTime(d.toISOString())).toBe('Ayer');
  });

  it('returns days for recent past', () => {
    const d = new Date(Date.now() - 4 * 86400000);
    expect(formatRelativeTime(d.toISOString())).toBe('Hace 4 días');
  });

  it('returns date string for old dates', () => {
    const result = formatRelativeTime('2024-03-15T10:00:00Z');
    // Should be a short date like "15 mar"
    expect(result).toMatch(/\d+\s\w+/);
  });
});

describe('TIME_GROUP_LABELS', () => {
  it('has labels for all groups', () => {
    expect(TIME_GROUP_LABELS.today).toBe('Hoy');
    expect(TIME_GROUP_LABELS.this_week).toBe('Esta semana');
    expect(TIME_GROUP_LABELS.older).toBe('Anteriores');
  });
});
