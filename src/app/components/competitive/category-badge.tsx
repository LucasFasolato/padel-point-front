import { cn } from '@/lib/utils';
import type { Category } from '@/types/competitive';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/competitive-utils';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CategoryBadge({ category, size = 'md', className }: CategoryBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        CATEGORY_COLORS[category],
        sizeClasses[size],
        className
      )}
    >
      {CATEGORY_LABELS[category].toUpperCase()}
    </span>
  );
}