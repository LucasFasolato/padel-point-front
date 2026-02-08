'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, Home } from 'lucide-react';
import { NotificationBell } from '@/app/components/notifications/notification-bell';
import { useUnreadCount } from '@/hooks/use-notifications';

export function PublicTopBar({
  backHref,
  title,
  showNotifications = false,
}: {
  backHref?: string;
  title?: string;
  /** Show the notification bell in the right slot instead of Home */
  showNotifications?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: unreadCount } = useUnreadCount();

  const onBack = () => {
    // Si me pasaste un backHref y no es el mismo path actual, uso eso
    if (backHref && backHref !== pathname) {
      router.push(backHref);
      return;
    }

    // Si no, intento volver; si no hay stack útil, caigo a home
    try {
      router.back();
      // Nota: Next no expone history length fiable acá, así que lo dejamos simple.
      // El botón Home siempre está visible como salida segura.
    } catch {
      router.push('/');
    }
  };

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="relative mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Left */}
        <button
          onClick={onBack}
          aria-label="Volver"
          title="Volver"
          className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">Volver</span>
        </button>

        {/* Center title (true centered) */}
        {title ? (
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-bold text-slate-900">
            {title}
          </div>
        ) : null}

        {/* Right */}
        {showNotifications ? (
          <NotificationBell
            count={unreadCount ?? 0}
            onClick={() => router.push('/notifications')}
          />
        ) : (
          <Link
            href="/"
            aria-label="Ir al inicio"
            title="Ir al inicio"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <Home size={16} />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
        )}
      </div>
    </div>
  );
}
