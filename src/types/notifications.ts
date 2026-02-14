export const NOTIFICATION_TYPES = {
  CHALLENGE_RECEIVED: 'CHALLENGE_RECEIVED',
  CHALLENGE_ACCEPTED: 'CHALLENGE_ACCEPTED',
  CHALLENGE_REJECTED: 'CHALLENGE_REJECTED',
  MATCH_REPORTED: 'MATCH_REPORTED',
  MATCH_CONFIRMED: 'MATCH_CONFIRMED',
  ELO_UPDATED: 'ELO_UPDATED',
  LEAGUE_INVITE_RECEIVED: 'LEAGUE_INVITE_RECEIVED',
  LEAGUE_INVITE_ACCEPTED: 'LEAGUE_INVITE_ACCEPTED',
  LEAGUE_INVITE_DECLINED: 'LEAGUE_INVITE_DECLINED',
  MATCH_DISPUTED: 'MATCH_DISPUTED',
  MATCH_RESOLVED: 'MATCH_RESOLVED',
  SYSTEM: 'SYSTEM',
  GENERAL: 'GENERAL',
} as const;

/** Canonical values expected from backend enums. */
export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** Legacy values kept for backward compatibility with older payloads. */
export type LegacyNotificationType = Lowercase<NotificationType>;

/** Allows unknown future values without breaking rendering. */
export type AppNotificationType = NotificationType | LegacyNotificationType | (string & {});

const NOTIFICATION_TYPE_SET = new Set<string>(Object.values(NOTIFICATION_TYPES));

const LEGACY_NOTIFICATION_TYPE_MAP: Record<LegacyNotificationType, NotificationType> = {
  challenge_received: NOTIFICATION_TYPES.CHALLENGE_RECEIVED,
  challenge_accepted: NOTIFICATION_TYPES.CHALLENGE_ACCEPTED,
  challenge_rejected: NOTIFICATION_TYPES.CHALLENGE_REJECTED,
  match_reported: NOTIFICATION_TYPES.MATCH_REPORTED,
  match_confirmed: NOTIFICATION_TYPES.MATCH_CONFIRMED,
  elo_updated: NOTIFICATION_TYPES.ELO_UPDATED,
  league_invite_received: NOTIFICATION_TYPES.LEAGUE_INVITE_RECEIVED,
  league_invite_accepted: NOTIFICATION_TYPES.LEAGUE_INVITE_ACCEPTED,
  league_invite_declined: NOTIFICATION_TYPES.LEAGUE_INVITE_DECLINED,
  match_disputed: NOTIFICATION_TYPES.MATCH_DISPUTED,
  match_resolved: NOTIFICATION_TYPES.MATCH_RESOLVED,
  system: NOTIFICATION_TYPES.SYSTEM,
  general: NOTIFICATION_TYPES.GENERAL,
};

export function normalizeNotificationType(type: AppNotificationType): NotificationType | null {
  if (NOTIFICATION_TYPE_SET.has(type)) {
    return type as NotificationType;
  }
  return LEGACY_NOTIFICATION_TYPE_MAP[type as LegacyNotificationType] ?? null;
}

/** Priority controls whether a toast is shown on realtime receive */
export type NotificationPriority = 'high' | 'normal' | 'low';

/** Metadata for actionable notifications (e.g. league invites). */
export interface NotificationActionMeta {
  inviteId?: string;
  inviteStatus?: string;
  leagueId?: string;
  leagueName?: string;
  inviterName?: string;
}

/** Optional backend payload object (kept loose for forward compatibility). */
export interface NotificationPayloadData {
  inviteId?: string;
  inviteToken?: string;
  inviteStatus?: string;
  status?: string;
  [key: string]: unknown;
}

/** Notification types that support inline Accept/Decline actions */
export const ACTIONABLE_NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set([
  NOTIFICATION_TYPES.LEAGUE_INVITE_RECEIVED,
]);

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  /** Optional deep-link path (e.g. "/competitive/challenges/abc123") */
  link: string | null;
  createdAt: string;
  /** Optional metadata for actionable notifications */
  actionMeta?: NotificationActionMeta;
  /** Optional raw payload data for backward/forward compatibility */
  data?: NotificationPayloadData;
}

export interface UnreadCountResponse {
  count: number;
}

/** High-priority types that deserve a toast on realtime receive */
export const TOAST_WORTHY_TYPES: NotificationType[] = [
  NOTIFICATION_TYPES.CHALLENGE_RECEIVED,
  NOTIFICATION_TYPES.MATCH_REPORTED,
  NOTIFICATION_TYPES.LEAGUE_INVITE_RECEIVED,
  NOTIFICATION_TYPES.MATCH_DISPUTED,
];

/** Human-readable labels by type */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NOTIFICATION_TYPES.CHALLENGE_RECEIVED]: 'Nuevo desafío',
  [NOTIFICATION_TYPES.CHALLENGE_ACCEPTED]: 'Desafío aceptado',
  [NOTIFICATION_TYPES.CHALLENGE_REJECTED]: 'Desafío rechazado',
  [NOTIFICATION_TYPES.MATCH_REPORTED]: 'Resultado reportado',
  [NOTIFICATION_TYPES.MATCH_CONFIRMED]: 'Resultado confirmado',
  [NOTIFICATION_TYPES.ELO_UPDATED]: 'ELO actualizado',
  [NOTIFICATION_TYPES.LEAGUE_INVITE_RECEIVED]: 'Invitación a liga',
  [NOTIFICATION_TYPES.LEAGUE_INVITE_ACCEPTED]: 'Invitación aceptada',
  [NOTIFICATION_TYPES.LEAGUE_INVITE_DECLINED]: 'Invitación rechazada',
  [NOTIFICATION_TYPES.MATCH_DISPUTED]: 'Resultado disputado',
  [NOTIFICATION_TYPES.MATCH_RESOLVED]: 'Disputa resuelta',
  [NOTIFICATION_TYPES.SYSTEM]: 'Sistema',
  [NOTIFICATION_TYPES.GENERAL]: 'Notificación',
};
