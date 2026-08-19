import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function EventDetailLoading() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center gap-1 pb-1">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
      <SkeletonCard className="h-52" />
    </div>
  );
}
