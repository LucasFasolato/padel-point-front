'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { CategoryBadge } from '@/app/components/competitive/category-badge';
import { Button } from '@/app/components/ui/button';
import type { Category } from '@/types/competitive';

interface AccountHeaderCardProps {
  displayName?: string | null;
  email?: string | null;
  category?: Category | null;
  city?: string | null;
  province?: string | null;
  avatarUrl?: string | null;
}

export function AccountHeaderCard({
  displayName,
  email,
  category,
  city,
  province,
  avatarUrl,
}: AccountHeaderCardProps) {
  const initials = (displayName || email || 'P').trim().charAt(0).toUpperCase();
  const locationLabel = [city, province].filter(Boolean).join(', ');

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0E7C66] to-[#065F46] p-5 shadow-lg">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-[72px] w-[72px] shrink-0 rounded-full object-cover ring-2 ring-white/30"
          />
        ) : (
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white ring-2 ring-white/30">
            {initials}
          </div>
        )}

        {/* Name + info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold leading-tight text-white">
            {displayName || 'Jugador'}
          </p>
          {email && (
            <p className="mt-0.5 truncate text-sm text-emerald-100">{email}</p>
          )}

          {/* Chips: category + location */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {category && (
              <CategoryBadge
                category={category}
                size="sm"
                className="bg-white/20 text-white"
              />
            )}
            {locationLabel && (
              <span className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-emerald-50">
                {locationLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit CTA */}
      <div className="mt-4">
        <Link href="/me/profile">
          <Button
            variant="outline"
            size="md"
            fullWidth
            className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/40"
          >
            <PenLine size={15} />
            Editar perfil
          </Button>
        </Link>
      </div>
    </div>
  );
}
