export type NotificationType =
  | 'challenge_received'
  | 'challenge_accepted'
  | 'challenge_rejected'
  | 'match_reported'
  | 'match_confirmed'
  | 'elo_updated'
  | 'league_invite_received'
  | 'league_invite_accepted'
  | 'league_invite_declined'
  | 'system'
  | 'general';

/** Priority controls whether a toast is shown on realtime receive */
export type NotificationPriority = 'high' | 'normal' | 'low';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  /** Optional deep-link path (e.g. "/competitive/challenges/abc123") */
  link: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

/** High-priority types that deserve a toast on realtime receive */
export const TOAST_WORTHY_TYPES: NotificationType[] = [
  'challenge_received',
  'match_reported',
  'league_invite_received',
];

/** Human-readable labels by type */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  challenge_received: 'Nuevo desafío',
  challenge_accepted: 'Desafío aceptado',
  challenge_rejected: 'Desafío rechazado',
  match_reported: 'Resultado reportado',
  match_confirmed: 'Resultado confirmado',
  elo_updated: 'ELO actualizado',
  league_invite_received: 'Invitación a liga',
  league_invite_accepted: 'Invitación aceptada',
  league_invite_declined: 'Invitación rechazada',
  system: 'Sistema',
  general: 'Notificación',
};
