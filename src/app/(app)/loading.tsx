import { Skeleton, SkeletonCard, SkeletonList, SkeletonStatRow } from "@/components/Skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-col gap-7 pt-1">
      <section>
        <Skeleton className="mb-2 h-3 w-32" />
        <SkeletonStatRow />
      </section>
      <section>
        <Skeleton className="mb-2 h-3 w-20" />
        <SkeletonCard />
      </section>
      <section>
        <Skeleton className="mb-2 h-3 w-20" />
        <SkeletonList rows={4} />
      </section>
    </div>
  );
}
