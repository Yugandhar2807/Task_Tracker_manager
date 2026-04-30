import { Badge } from "@/components/ui/badge";
import { Circle, CircleDashed, CircleCheck } from "lucide-react";
import type { TaskStatus } from "@/types";

const config: Record<
  TaskStatus,
  { variant: "secondary" | "info" | "success"; label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  TODO: { variant: "secondary", label: "To Do", icon: CircleDashed },
  IN_PROGRESS: { variant: "info", label: "In Progress", icon: Circle },
  DONE: { variant: "success", label: "Done", icon: CircleCheck },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <Badge variant={c.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {c.label}
    </Badge>
  );
}
