import { Skeleton } from "@/components/ui/skeleton";

export default function SiteLoading() {
  return (
    <div className="container-x py-16 sm:py-20" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-6 h-14 w-full max-w-2xl" />
      <Skeleton className="mt-4 h-5 w-full max-w-xl" />
      <Skeleton className="mt-3 h-5 w-full max-w-lg" />
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="aspect-[4/5] w-full rounded-lg" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
