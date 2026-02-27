import { Skeleton } from '@/app/components/ui/skeleton';

export function RankingsSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex min-h-[56px] items-center gap-3 px-4 py-3">
            {/* Position */}
            <Skeleton className="h-7 w-7 rounded-full" />
            {/* Avatar */}
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            {/* Name */}
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-2.5 w-16" />
            </div>
            {/* ELO */}
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-2.5 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
