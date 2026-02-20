'use client';

import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/notification-utils';
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPES,
  normalizeNotificationType,
} from '@/types/notifications';
import { Button } from '@/app/components/ui/button';
import type { AppNotification } from '@/types/notifications';

interface NotificationItemProps {
  notification: AppNotification;
  onClick: (notification: AppNotification) => void;
  /** Called when the user accepts a league invite */
  onAccept?: (notification: AppNotification) => void;
  /** Called when the user declines a league invite */
  onDecline?: (notification: AppNotification) => void;
  /** Called when a CTA link should be navigated to */
  onNavigate?: (path: string) => void;
  /** Whether an accept/decline action is in-flight */
  isActing?: boolean;
  /** Which action is currently loading: 'accept' | 'decline' */
  actingAction?: 'accept' | 'decline' | null;
  /** Whether this notification has already been acted on (hides buttons) */
  acted?: boolean;
}

const NON_ACTIONABLE_INVITE_STATUSES = new Set([
  'accepted',
  'declined',
  'rejected',
]);

function resolveInviteId(notification: AppNotification): string | null {
  const inviteId =
    notification.actionMeta?.inviteId ??
    notification.data?.inviteId ??
    notification.data?.inviteToken;
  return typeof inviteId === 'string' && inviteId.length > 0 ? inviteId : null;
}

function isInviteResolved(notification: AppNotification): boolean {
  const status = notification.actionMeta?.inviteStatus ?? notification.data?.inviteStatus;
  if (typeof status !== 'string') return false;
  return NON_ACTIONABLE_INVITE_STATUSES.has(status.toLowerCase());
}

function hasInviteAction(notification: AppNotification, acted: boolean): boolean {
  const type = normalizeNotificationType(notification.type);

  return (
    type === NOTIFICATION_TYPES.LEAGUE_INVITE_RECEIVED &&
    !!resolveInviteId(notification) &&
    !isInviteResolved(notification) &&
    !acted
  );
}

/* ── Ranking movement helpers ────────────────────────────────────── */

interface RankingMovementView {
  title: string;
  subtitle: string | null;
  deltaBadge: { label: string; className: string } | null;
  leagueId: string;
}

function resolveRankingMovement(notification: AppNotification): RankingMovementView | null {
  const d = notification.data;
  const leagueId =
    notification.actionMeta?.leagueId ??
    (typeof d?.leagueId === 'string' ? d.leagueId : null);
  if (!leagueId) return null;

  const leagueName =
    notification.actionMeta?.leagueName ??
    (typeof d?.leagueName === 'string' ? d.leagueName : 'tu liga');

  const movementType = typeof d?.movementType === 'string' ? d.movementType.toUpperCase() : null;
  const newPos = typeof d?.newPosition === 'number' ? d.newPosition : null;
  const oldPos = typeof d?.oldPosition === 'number' ? d.oldPosition : null;
  const delta = typeof d?.delta === 'number' ? d.delta : null;

  // Title: prefer backend-provided, then build from data, then fallback
  let title = notification.title;
  if (!title || title.trim().length === 0) {
    if (newPos != null && movementType) {
      switch (movementType) {
        case 'UP':
          title = `Subiste al #${newPos} en ${leagueName} 🔥`;
          break;
        case 'DOWN':
          title = `Bajaste al #${newPos} en ${leagueName}`;
          break;
        case 'NEW':
          title = `Nueva entrada: estás #${newPos} en ${leagueName} ✨`;
          break;
        default:
          title = `Ranking actualizado en ${leagueName}`;
      }
    } else {
      title = `Ranking actualizado en ${leagueName}`;
    }
  }

  // Subtitle
  let subtitle: string | null = null;
  if (oldPos != null && newPos != null) {
    subtitle = `Del #${oldPos} → #${newPos}`;
  } else if (newPos != null) {
    subtitle = `Posición actual: #${newPos}`;
  }

  // Delta badge
  let deltaBadge: RankingMovementView['deltaBadge'] = null;
  if (delta != null && delta !== 0) {
    deltaBadge =
      delta > 0
        ? { label: `+${delta}`, className: 'bg-emerald-100 text-emerald-700' }
        : { label: `${delta}`, className: 'bg-rose-100 text-rose-600' };
  }

  return { title, subtitle, deltaBadge, leagueId };
}

export function NotificationItem({
  notification,
  onClick,
  onAccept,
  onDecline,
  onNavigate,
  isActing = false,
  actingAction = null,
  acted = false,
}: NotificationItemProps) {
  const normalizedType = normalizeNotificationType(notification.type);
  const typeLabel = normalizedType ? NOTIFICATION_TYPE_LABELS[normalizedType] : 'Notificación';
  const showActions = hasInviteAction(notification, acted) && onAccept && onDecline;
  const rankingView =
    normalizedType === NOTIFICATION_TYPES.LEAGUE_RANKING_MOVED
      ? resolveRankingMovement(notification)
      : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(notification)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(notification);
        }
      }}
      className={cn(
        'flex w-full gap-3 rounded-xl px-4 py-3 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1',
        'min-h-[56px]',
        notification.read
          ? 'bg-white hover:bg-slate-50'
          : 'bg-emerald-50/50 hover:bg-emerald-50'
      )}
    >
      {/* Unread dot */}
      <div className="flex shrink-0 pt-1.5">
        <span
          className={cn(
            'block h-2 w-2 rounded-full',
            notification.read ? 'bg-transparent' : 'bg-emerald-500'
          )}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {typeLabel}
          </p>
          <span className="shrink-0 text-[11px] text-slate-400">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        <p
          className={cn(
            'mt-0.5 text-sm leading-snug',
            notification.read ? 'text-slate-600' : 'font-semibold text-slate-900'
          )}
        >
          {rankingView ? rankingView.title : notification.title}
        </p>
        {rankingView ? (
          <>
            {(rankingView.subtitle || rankingView.deltaBadge) && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                {rankingView.subtitle && <span>{rankingView.subtitle}</span>}
                {rankingView.deltaBadge && (
                  <span className={cn('inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none', rankingView.deltaBadge.className)}>
                    {rankingView.deltaBadge.label}
                  </span>
                )}
              </p>
            )}
            {onNavigate && (
              <div
                className="mt-2 flex gap-2"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(`/leagues/${rankingView.leagueId}?tab=tabla`);
                  }}
                >
                  Ver tabla
                </Button>
              </div>
            )}
          </>
        ) : (
          notification.message && (
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
              {notification.message}
            </p>
          )
        )}

        {/* Action buttons for league invites */}
        {showActions && (
          <div
            className="mt-2 flex gap-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              loading={isActing && actingAction === 'decline'}
              disabled={isActing}
              onClick={(e) => {
                e.stopPropagation();
                onDecline(notification);
              }}
            >
              Rechazar
            </Button>
            <Button
              size="sm"
              loading={isActing && actingAction === 'accept'}
              disabled={isActing}
              onClick={(e) => {
                e.stopPropagation();
                onAccept(notification);
              }}
            >
              Aceptar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
