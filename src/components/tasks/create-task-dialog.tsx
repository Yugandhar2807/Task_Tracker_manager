"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { taskCreateSchema, type TaskCreateInput } from "@/lib/validations";
import { api, ApiError } from "@/lib/api-client";
import type { ProjectListItem, SafeUser } from "@/types";

type Props = {
  defaultProjectId?: string;
  projects?: { id: string; name: string }[];
  onCreated?: () => void;
};

export function CreateTaskDialog({ defaultProjectId, projects: projectsProp, onCreated }: Props) {
  const [open, setOpen] = React.useState(false);
  const [users, setUsers] = React.useState<SafeUser[]>([]);
  const [projects, setProjects] = React.useState<{ id: string; name: string }[]>(projectsProp ?? []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskCreateInput>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: defaultProjectId ?? "",
      assigneeId: undefined,
      status: "TODO",
      priority: "MEDIUM",
      dueDate: null,
    },
  });

  const projectId = watch("projectId");
  const assigneeId = watch("assigneeId");
  const priority = watch("priority");

  React.useEffect(() => {
    if (!open) return;
    api.get<{ users: SafeUser[] }>("/api/users").then((r) => setUsers(r.users)).catch(() => {});
    if (!projectsProp) {
      api
        .get<{ projects: ProjectListItem[] }>("/api/projects")
        .then((r) => setProjects(r.projects.map((p) => ({ id: p.id, name: p.name }))))
        .catch(() => {});
    }
  }, [open, projectsProp]);

  async function onSubmit(values: TaskCreateInput) {
    try {
      const payload = {
        ...values,
        assigneeId: values.assigneeId || null,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      };
      await api.post("/api/tasks", payload);
      toast.success("Task created");
      reset();
      setOpen(false);
      onCreated?.();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to create task");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="h-4 w-4" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>Tasks belong to a project and can be assigned to a member.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Implement payment webhook" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Add context, acceptance criteria, etc." {...register("description")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={(v) => setValue("projectId", v)}>
                <SelectTrigger><SelectValue placeholder="Choose project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && <p className="text-xs text-destructive">{errors.projectId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={assigneeId ?? "__none__"}
                onValueChange={(v) => setValue("assigneeId", v === "__none__" ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setValue("priority", v as "LOW" | "MEDIUM" | "HIGH")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
