import { Skeleton, SkeletonList } from "@/components/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6 pt-1">
      <Skeleton className="h-10 w-full rounded-xl" />
      <section>
        <Skeleton className="mb-2 h-3 w-40" />
        <SkeletonList rows={3} />
      </section>
      <Skeleton className="h-56 w-full rounded-2xl" />
    </div>
  );
}
