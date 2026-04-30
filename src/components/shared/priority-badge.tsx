import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import type { Priority } from "@/types";

const config: Record<
  Priority,
  { variant: "danger" | "warning" | "success"; icon: React.ComponentType<{ className?: string }> }
> = {
  HIGH: { variant: "danger", icon: ArrowUp },
  MEDIUM: { variant: "warning", icon: ArrowRight },
  LOW: { variant: "success", icon: ArrowDown },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const c = config[priority];
  const Icon = c.icon;
  return (
    <Badge variant={c.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {priority}
    </Badge>
  );
}
