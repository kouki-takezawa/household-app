import { Skeleton, SkeletonCollapsible, SkeletonList, SkeletonStatRow } from "@/components/Skeleton";

export default function BudgetLoading() {
  return (
    <div className="flex flex-col gap-6 pt-1">
      <section className="flex items-center justify-between gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </section>
      <SkeletonStatRow />
      <SkeletonCollapsible />
      <section>
        <Skeleton className="mb-2 h-3 w-20" />
        <SkeletonList rows={5} />
      </section>
    </div>
  );
}
