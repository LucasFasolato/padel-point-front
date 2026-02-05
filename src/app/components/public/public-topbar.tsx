'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, Home } from 'lucide-react';

export function PublicTopBar({
  backHref,
  title,
}: {
  backHref?: string;
  title?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const onBack = () => {
    if (backHref && backHref !== pathname) {
      router.push(backHref);
      return;
    }

    try {
      router.back();
    } catch {
      router.push('/');
    }
  };

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="relative mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Left */}
        <button
          onClick={onBack}
          aria-label="Volver"
          title="Volver"
          className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-sm font-semibold text-textMuted hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">Volver</span>
        </button>

        {/* Center title (true centered) */}
        {title ? (
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-bold text-text">
            {title}
          </div>
        ) : null}

        {/* Right */}
        <Link
          href="/"
          aria-label="Ir al inicio"
          title="Ir al inicio"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold text-text hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
        >
          <Home size={16} />
          <span className="hidden sm:inline">Inicio</span>
        </Link>
      </div>
    </div>
  );
}
