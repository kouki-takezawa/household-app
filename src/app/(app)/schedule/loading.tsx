import { Skeleton, SkeletonList } from "@/components/Skeleton";

export default function ScheduleLoading() {
  return (
    <div className="flex flex-col gap-4 pt-1">
      <section className="flex items-center justify-between">
        <Skeleton className="h-9 w-40 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </section>
      <section className="flex gap-2">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </section>
      <Skeleton className="h-80 w-full rounded-2xl" />
      <section>
        <Skeleton className="mb-2 h-3 w-24" />
        <SkeletonList rows={3} />
      </section>
    </div>
  );
}
