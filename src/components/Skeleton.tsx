export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-track ${className}`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl bg-surface p-4 shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft ${className}`}>
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="h-6 w-32" />
    </div>
  );
}

export function SkeletonStatRow() {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl bg-surface p-3.5 shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
          <Skeleton className="mb-2 h-2.5 w-10" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3.5">
          <Skeleton className="h-2.5 w-2.5 flex-shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-2 h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
      <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </h2>
      <Skeleton className="h-56 w-full" />
    </div>
  );
}
