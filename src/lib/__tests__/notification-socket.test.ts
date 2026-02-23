import { describe, expect, it, vi } from 'vitest';

// Mock dependencies before importing
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(),
}));

vi.mock('@/hooks/use-notifications', () => ({
  NOTIFICATION_QUERY_KEYS: {
    list: ['notifications', 'list'],
    unread: ['notifications', 'unread-count'],
  },
}));

vi.mock('@/lib/toast', () => ({
  toastManager: { info: vi.fn() },
}));

import { handleNewNotification, handleLeagueActivity } from '../notification-socket';
import type { AppNotification } from '@/types/notifications';
import type { ActivityEventView, ActivityResponse } from '@/types/leagues';
import type { InfiniteData } from '@tanstack/react-query';

function makeMockQueryClient() {
  const store = new Map<string, unknown>();

  /**
   * Simulates setQueriesData with prefix matching (exact: false).
   * Finds all stored keys whose parsed array starts with the given prefix key,
   * then applies the updater function to each.
   */
  const setQueriesData = (
    filter: { queryKey: unknown[] },
    updater: (old: unknown) => unknown
  ) => {
    const prefix = JSON.stringify(filter.queryKey);
    for (const [rawKey, value] of store.entries()) {
      // Check if this key starts with the prefix key entries
      try {
        const parsedKey = JSON.parse(rawKey) as unknown[];
        const prefixKey = filter.queryKey as unknown[];
        const matches = prefixKey.every((seg, i) => JSON.stringify(seg) === JSON.stringify(parsedKey[i]));
        if (matches) {
          const next = updater(value);
          store.set(rawKey, next);
        }
      } catch {
        // ignore non-JSON keys
      }
    }
  };

  return {
    getQueryData: (key: unknown) => store.get(JSON.stringify(key)),
    setQueryData: (key: unknown, value: unknown) => store.set(JSON.stringify(key), value),
    setQueriesData,
    invalidateQueries: vi.fn(),
    _store: store,
  };
}

const makeNotif = (overrides: Partial<AppNotification> = {}): AppNotification => ({
  id: 'n1',
  type: 'challenge_received',
  title: 'Test notification',
  message: 'Test body',
  priority: 'high',
  read: false,
  link: null,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('handleNewNotification', () => {
  it('increments unread count when cache exists', () => {
    const qc = makeMockQueryClient();
    qc.setQueryData(['notifications', 'unread-count'], 3);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleNewNotification(qc as any, makeNotif());

    expect(qc.getQueryData(['notifications', 'unread-count'])).toBe(4);
  });

  it('prepends notification to list cache', () => {
    const qc = makeMockQueryClient();
    const existing = [makeNotif({ id: 'old1' }), makeNotif({ id: 'old2' })];
    qc.setQueryData(['notifications', 'list', 50], existing);

    const newNotif = makeNotif({ id: 'new1' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleNewNotification(qc as any, newNotif);

    const updated = qc.getQueryData(['notifications', 'list', 50]) as AppNotification[];
    expect(updated).toHaveLength(3);
    expect(updated[0].id).toBe('new1');
  });

  it('returns true on success', () => {
    const qc = makeMockQueryClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = handleNewNotification(qc as any, makeNotif());
    expect(result).toBe(true);
  });

  it('does not crash when no cache exists', () => {
    const qc = makeMockQueryClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => handleNewNotification(qc as any, makeNotif())).not.toThrow();
  });

  it('invalidates competitive rating queries (ranking/profile/elo-history) on ELO_UPDATED using a prefix predicate', () => {
    const qc = makeMockQueryClient();
    const notification = makeNotif({ type: 'ELO_UPDATED' });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleNewNotification(qc as any, notification);

    expect(qc.invalidateQueries).toHaveBeenCalledTimes(1);
    const [arg] = vi.mocked(qc.invalidateQueries).mock.calls[0];
    expect(arg).toHaveProperty('predicate');
    expect(arg.predicate({ queryKey: ['competitive', 'ranking', { category: null, limit: 20 }] })).toBe(true);
    expect(arg.predicate({ queryKey: ['competitive', 'profile'] })).toBe(true);
    expect(arg.predicate({ queryKey: ['competitive', 'elo-history', { limit: 20 }] })).toBe(true);
    expect(arg.predicate({ queryKey: ['competitive', 'onboarding'] })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// handleLeagueActivity
// ---------------------------------------------------------------------------

const LEAGUE_ID = '22222222-2222-4222-8222-222222222222';

const makeActivityEvent = (overrides: Partial<ActivityEventView> = {}): ActivityEventView => ({
  id: 'ev-1',
  leagueId: LEAGUE_ID,
  type: 'member_joined',
  actorId: 'u-1',
  actorName: 'Juan',
  payload: {},
  createdAt: new Date().toISOString(),
  ...overrides,
});

function makeInfiniteActivityData(
  pages: ActivityResponse[]
): InfiniteData<ActivityResponse, string | undefined> {
  return {
    pages,
    pageParams: pages.map((_, i) => (i === 0 ? undefined : `cursor-${i}`)),
  };
}

describe('handleLeagueActivity', () => {
  it('prepends event to the first page of cached activity', () => {
    const qc = makeMockQueryClient();
    const existing = makeActivityEvent({ id: 'ev-old' });
    const cached = makeInfiniteActivityData([{ items: [existing], nextCursor: null }]);
    qc.setQueryData(['leagues', 'activity', LEAGUE_ID, 50], cached);

    const newEvent = makeActivityEvent({ id: 'ev-new' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleLeagueActivity(qc as any, newEvent);

    const updated = qc.getQueryData([
      'leagues',
      'activity',
      LEAGUE_ID,
      50,
    ]) as InfiniteData<ActivityResponse>;
    expect(updated.pages[0].items[0].id).toBe('ev-new');
    expect(updated.pages[0].items[1].id).toBe('ev-old');
  });

  it('does not duplicate an event already present', () => {
    const qc = makeMockQueryClient();
    const existing = makeActivityEvent({ id: 'ev-1' });
    const cached = makeInfiniteActivityData([{ items: [existing], nextCursor: null }]);
    qc.setQueryData(['leagues', 'activity', LEAGUE_ID, 50], cached);

    // Call with same id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleLeagueActivity(qc as any, makeActivityEvent({ id: 'ev-1' }));

    const updated = qc.getQueryData([
      'leagues',
      'activity',
      LEAGUE_ID,
      50,
    ]) as InfiniteData<ActivityResponse>;
    expect(updated.pages[0].items).toHaveLength(1);
  });

  it('does not crash when no cache exists for that leagueId', () => {
    const qc = makeMockQueryClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => handleLeagueActivity(qc as any, makeActivityEvent())).not.toThrow();
  });

  it('updates all cached variants regardless of limit param (prefix match)', () => {
    const qc = makeMockQueryClient();
    const cached20 = makeInfiniteActivityData([{ items: [], nextCursor: null }]);
    const cached50 = makeInfiniteActivityData([{ items: [], nextCursor: null }]);
    qc.setQueryData(['leagues', 'activity', LEAGUE_ID, 20], cached20);
    qc.setQueryData(['leagues', 'activity', LEAGUE_ID, 50], cached50);

    const ev = makeActivityEvent({ id: 'ev-broadcast' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleLeagueActivity(qc as any, ev);

    const r20 = qc.getQueryData(['leagues', 'activity', LEAGUE_ID, 20]) as InfiniteData<ActivityResponse>;
    const r50 = qc.getQueryData(['leagues', 'activity', LEAGUE_ID, 50]) as InfiniteData<ActivityResponse>;
    expect(r20.pages[0].items[0].id).toBe('ev-broadcast');
    expect(r50.pages[0].items[0].id).toBe('ev-broadcast');
  });

  it('only prepends to the first page, leaving subsequent pages untouched', () => {
    const qc = makeMockQueryClient();
    const page1: ActivityResponse = { items: [makeActivityEvent({ id: 'p1-ev1' })], nextCursor: 'c1' };
    const page2: ActivityResponse = { items: [makeActivityEvent({ id: 'p2-ev1' })], nextCursor: null };
    const cached = makeInfiniteActivityData([page1, page2]);
    qc.setQueryData(['leagues', 'activity', LEAGUE_ID, 50], cached);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleLeagueActivity(qc as any, makeActivityEvent({ id: 'ev-new' }));

    const updated = qc.getQueryData([
      'leagues',
      'activity',
      LEAGUE_ID,
      50,
    ]) as InfiniteData<ActivityResponse>;
    expect(updated.pages[0].items[0].id).toBe('ev-new');
    expect(updated.pages[1].items[0].id).toBe('p2-ev1');
    expect(updated.pages).toHaveLength(2);
  });
});
