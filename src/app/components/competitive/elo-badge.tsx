import { cn } from '@/lib/utils';
import { formatEloChange } from '@/lib/competitive-utils';

interface EloBadgeProps {
  elo: number;
  change?: number;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
  className?: string;
}

export function EloBadge({ 
  elo, 
  change, 
  size = 'md', 
  showChange = true,
  className 
}: EloBadgeProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl font-bold',
  };

  const changeColor = change && change > 0 
    ? 'text-green-600' 
    : change && change < 0 
    ? 'text-red-600' 
    : '';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('font-semibold text-slate-900', sizeClasses[size])}>
        {elo}
      </span>
      {showChange && change !== undefined && change !== 0 && (
        <span className={cn('text-sm font-medium', changeColor)}>
          {formatEloChange(change)}
        </span>
      )}
    </div>
  );
}