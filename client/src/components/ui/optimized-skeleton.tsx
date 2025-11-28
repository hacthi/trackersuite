import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800",
        className
      )}
      {...props}
    />
  );
}

// Optimized skeleton components for different content types
export const ClientCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-3 p-4 border rounded-lg", className)}>
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-[180px]" />
        <Skeleton className="h-4 w-[120px]" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[80%]" />
    </div>
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
);

export const FollowUpCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-3 p-4 border rounded-lg", className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-[140px]" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[60%]" />
    </div>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  </div>
);

export const DashboardStatSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-2 p-6 border rounded-lg", className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-[100px]" />
      <Skeleton className="h-5 w-5 rounded" />
    </div>
    <Skeleton className="h-8 w-16" />
    <Skeleton className="h-3 w-[80px]" />
  </div>
);

export const TableRowSkeleton = ({ columns = 4, className }: { columns?: number; className?: string }) => (
  <tr className={className}>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-4">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

export const ChartSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-4 p-4", className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-[120px]" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  </div>
);

export const FormSkeleton = ({ fields = 4, className }: { fields?: number; className?: string }) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex gap-2 pt-4">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

export { Skeleton };