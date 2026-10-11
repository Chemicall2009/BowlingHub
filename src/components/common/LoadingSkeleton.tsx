/**
 * @file src/components/common/LoadingSkeleton.tsx
 * @description Скелетон загрузки карточек дорожек, повторяемый N раз.
 */

import { Skeleton } from "../ui/skeleton";
import { Card, CardContent, CardHeader } from "../ui/card";

interface LoadingSkeletonProps {
  count?: number;
}

export function LoadingSkeleton({ count = 12 }: LoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="border-zinc-800/80 bg-zinc-900/60 animate-pulse overflow-hidden rounded-xl"
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
            <Skeleton className="h-7 w-20 rounded-md bg-zinc-800" />
            <Skeleton className="h-6 w-16 rounded-full bg-zinc-800" />
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-16 w-24 rounded-lg bg-zinc-800" />
              <div className="space-y-2 flex-1 pl-4">
                <Skeleton className="h-4 w-full bg-zinc-800" />
                <Skeleton className="h-6 w-16 bg-zinc-800" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
              <div className="flex gap-1.5">
                <Skeleton className="h-8 w-8 rounded-lg bg-zinc-800" />
                <Skeleton className="h-8 w-8 rounded-lg bg-zinc-800" />
                <Skeleton className="h-8 w-8 rounded-lg bg-zinc-800" />
              </div>
              <Skeleton className="h-4 w-16 bg-zinc-800" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const LaneGridSkeleton = LoadingSkeleton;
