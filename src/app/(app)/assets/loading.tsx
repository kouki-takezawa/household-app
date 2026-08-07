import { Skeleton, SkeletonCard, SkeletonChart, SkeletonList } from "@/components/Skeleton";

export default function AssetsLoading() {
  return (
    <div className="flex flex-col gap-6 pt-1">
      <section>
        <Skeleton className="mb-2 h-3 w-20" />
        <SkeletonCard />
      </section>
      <SkeletonChart label="資産配分" />
      <SkeletonChart label="資産推移" />
      <section>
        <Skeleton className="mb-2 h-3 w-24" />
        <SkeletonList rows={5} />
      </section>
      <section>
        <Skeleton className="mb-2 h-3 w-20" />
        <SkeletonList rows={3} />
      </section>
    </div>
  );
}
