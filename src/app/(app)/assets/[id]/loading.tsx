import { Skeleton, SkeletonCard, SkeletonList } from "@/components/Skeleton";

export default function AccountDetailLoading() {
  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center gap-1 pb-1">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <SkeletonCard className="h-40" />
      <section>
        <Skeleton className="mb-2 h-3 w-20" />
        <SkeletonList rows={4} />
      </section>
    </div>
  );
}
