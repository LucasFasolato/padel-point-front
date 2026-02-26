import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListItemProps {
  /** Leading slot: avatar, icon, or thumbnail */
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  /** Trailing slot: badge, value, or custom element */
  trailing?: ReactNode;
  /** Renders the row as a <Link> */
  href?: string;
  /** Renders the row as a <button> */
  onClick?: () => void;
  /** Appends a chevron to the trailing side */
  showChevron?: boolean;
  /** Suppress hover/active styles even when the row is interactive */
  static?: boolean;
  className?: string;
}

/**
 * ListItem — DS v1 row component for lists, settings menus, and feed items.
 *
 * Auto-renders as `<Link>`, `<button>`, or `<div>` based on props.
 * Minimum 56px height ensures comfortable tap targets on mobile.
 *
 * @example
 * ```tsx
 * // Static row
 * <ListItem title="ELO actual" trailing={<span>1 420</span>} />
 *
 * // Navigable row
 * <ListItem
 *   href="/matches/abc"
 *   leading={<TrophyIcon />}
 *   title="vs Martín García"
 *   subtitle="Hace 2 días · 6-3 6-4"
 *   showChevron
 * />
 * ```
 */
export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  href,
  onClick,
  showChevron = false,
  static: isStatic = false,
  className,
}: ListItemProps) {
  const isInteractive = !isStatic && (!!href || !!onClick);

  const inner = (
    <>
      {leading && <div className="flex-shrink-0">{leading}</div>}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        {subtitle && (
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        )}
      </div>

      {(trailing || showChevron) && (
        <div className="flex flex-shrink-0 items-center gap-1">
          {trailing}
          {showChevron && <ChevronRight size={16} className="text-slate-400" />}
        </div>
      )}
    </>
  );

  const baseClass = cn(
    'flex min-h-[56px] items-center gap-3 px-4 py-3',
    isInteractive && 'cursor-pointer transition-colors hover:bg-slate-50 active:bg-slate-100',
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(baseClass, 'w-full text-left')}>
        {inner}
      </button>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}
