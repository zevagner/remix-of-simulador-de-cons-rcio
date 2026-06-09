import { Skeleton } from '@/components/ui/skeleton';

export function ModuleSkeleton() {
  return (
    <div className="space-y-6 py-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-xl border border-border p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
