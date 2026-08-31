import { Skeleton, SkeletonCard, SkeletonList, SkeletonStatRow } from "@/components/Skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-col gap-7 pt-1">
      <Skeleton className="h-11 w-full rounded-full" />
      <section>
        <Skeleton className="mb-2 h-3 w-20" />
        <SkeletonCard className="h-40" />
      </section>
      <section>
        <Skeleton className="mb-2 h-3 w-32" />
        <SkeletonStatRow />
      </section>
      <section>
        <Skeleton className="mb-2 h-3 w-28" />
        <SkeletonList rows={3} />
      </section>
      <section>
        <Skeleton className="mb-2 h-3 w-20" />
        <SkeletonList rows={4} />
      </section>
    </div>
  );
}
