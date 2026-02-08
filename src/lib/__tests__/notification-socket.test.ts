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

import { handleNewNotification } from '../notification-socket';
import type { AppNotification } from '@/types/notifications';

function makeMockQueryClient() {
  const store = new Map<string, unknown>();
  return {
    getQueryData: (key: unknown) => store.get(JSON.stringify(key)),
    setQueryData: (key: unknown, value: unknown) => store.set(JSON.stringify(key), value),
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
});
