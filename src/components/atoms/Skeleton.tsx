import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background rounded-xl shadow-sm border border-gray-200 max-w-full lg:max-w-[320px] xl:max-w-full',
        className
      )}
      aria-hidden="true"
    >
      <Skeleton className="aspect-16/10 w-full rounded-t-xl rounded-b-none" />
      <div className="flex flex-col gap-3 p-4 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3 mt-auto" />
      </div>
    </div>
  );
}

export function ImageCarouselSkeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <div
      className={cn('overflow-hidden rounded-3xl border-10 border-white', className)}
      aria-hidden="true"
    >
      <Skeleton className="aspect-video w-full rounded-3xl" />
    </div>
  );
}
