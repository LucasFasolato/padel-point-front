'use client';

import { PublicTopBar } from '@/app/components/public/public-topbar';
import { NotificationCenter } from '@/app/components/notifications/notification-center';

export default function NotificationsPage() {
  return (
    <>
      <PublicTopBar title="Notificaciones" backHref="/" />
      <NotificationCenter />
    </>
  );
}
