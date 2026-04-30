import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60 bg-gradient-to-r from-muted/40 via-muted/70 to-muted/40 bg-[length:1000px_100%]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
