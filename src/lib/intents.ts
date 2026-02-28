import type { UserIntent } from '@/types/competitive';

const ACTIVE_STATUSES = new Set(['pending', 'accepted', 'ready', 'pending_confirm', 'active']);

export function normalizeIntentStatus(status: UserIntent['status'] | string | null | undefined) {
  return String(status ?? '').trim().toLowerCase();
}

export function isIntentActive(intent: UserIntent): boolean {
  return ACTIVE_STATUSES.has(normalizeIntentStatus(intent.status));
}

export function sortIntentsByRecency(a: UserIntent, b: UserIntent): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function sortIntentsByActiveThenRecency(a: UserIntent, b: UserIntent): number {
  const aActive = isIntentActive(a);
  const bActive = isIntentActive(b);
  if (aActive !== bActive) return aActive ? -1 : 1;
  return sortIntentsByRecency(a, b);
}

export function isCompetitiveIntentRenderable(intent: UserIntent): boolean {
  const status = normalizeIntentStatus(intent.status);
  switch (intent.intentType) {
    case 'CONFIRM_RESULT':
      return status === 'pending_confirm';
    case 'ACCEPT_CHALLENGE':
      return status === 'pending';
    case 'CREATED_INTENT':
      return status === 'active';
    default:
      return false;
  }
}

export function isInboxIntentRenderable(intent: UserIntent): boolean {
  const status = normalizeIntentStatus(intent.status);
  switch (intent.intentType) {
    case 'CONFIRM_RESULT':
      return status === 'pending_confirm';
    case 'ACCEPT_CHALLENGE':
      return status === 'pending' && Boolean(intent.challengeId);
    default:
      return false;
  }
}

export function isLeagueChallengeIntent(intent: UserIntent): boolean {
  return intent.intentType === 'ACCEPT_CHALLENGE';
}
