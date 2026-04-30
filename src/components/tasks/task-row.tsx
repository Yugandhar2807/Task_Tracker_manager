"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calendar, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatusChangeDialog } from "@/components/tasks/status-change-dialog";
import { api, ApiError } from "@/lib/api-client";
import { cn, isOverdue } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";

type Props = {
  task: Task;
  isAdmin: boolean;
  canChangeStatus: boolean;
  onUpdated?: (t: Task) => void;
  onDeleted?: (id: string) => void;
  showProject?: boolean;
  index?: number;
};

export function TaskRow({
  task,
  isAdmin,
  canChangeStatus,
  onUpdated,
  onDeleted,
  showProject,
  index = 0,
}: Props) {
  const [pendingStatus, setPendingStatus] = React.useState<TaskStatus | null>(null);
  const overdue = isOverdue(task.dueDate, task.status);

  function requestStatusChange(status: TaskStatus) {
    if (status === task.status) return;
    setPendingStatus(status);
  }

  async function handleDelete() {
    if (!confirm("Delete this task?")) return;
    try {
      await api.del(`/api/tasks/${task.id}`);
      toast.success("Task deleted");
      onDeleted?.(task.id);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ delay: index * 0.02 }}
    >
      <Card
        className={cn(
          "glass p-4 transition-all hover:shadow-md",
          overdue && "ring-1 ring-rose-500/30",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-medium leading-tight">{task.title}</h4>
              <PriorityBadge priority={task.priority} />
              {overdue && (
                <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                  Overdue
                </span>
              )}
            </div>
            {task.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {showProject && task.project && (
                <span className="rounded-md bg-muted px-1.5 py-0.5">{task.project.name}</span>
              )}
              {task.dueDate && (
                <span className={cn("flex items-center gap-1", overdue && "text-rose-500 font-medium")}>
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
              {task.assignee ? (
                <span className="flex items-center gap-1.5">
                  <UserAvatar name={task.assignee.name} src={task.assignee.avatarUrl} className="h-5 w-5" />
                  {task.assignee.name}
                </span>
              ) : (
                <span>Unassigned</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canChangeStatus ? (
              <Select value={task.status} onValueChange={(v) => requestStatusChange(v as TaskStatus)}>
                <SelectTrigger className="h-9 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <StatusBadge status={task.status} />
            )}

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" /> Delete task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </Card>

      {pendingStatus && (
        <StatusChangeDialog
          open={!!pendingStatus}
          onOpenChange={(open) => !open && setPendingStatus(null)}
          task={task}
          nextStatus={pendingStatus}
          onComplete={(updated) => onUpdated?.(updated)}
        />
      )}
    </motion.div>
  );
}
