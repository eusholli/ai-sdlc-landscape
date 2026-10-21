import { Skeleton } from "@/components/ui/skeleton";

export function ToolDetailSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">Loading tool details</span>
      <div className="flex items-start gap-4">
        <Skeleton className="size-14 shrink-0" />
        <div className="flex flex-1 flex-col gap-2 pt-1">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-28" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    </div>
  );
}
