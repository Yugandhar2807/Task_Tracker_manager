"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Check } from "lucide-react";
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
import { projectCreateSchema, type ProjectCreateInput } from "@/lib/validations";
import { api, ApiError } from "@/lib/api-client";
import type { SafeUser } from "@/types";
import { cn, getInitials } from "@/lib/utils";

export function CreateProjectDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [users, setUsers] = React.useState<SafeUser[]>([]);
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectCreateInput>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: { name: "", description: "", memberIds: [] },
  });

  React.useEffect(() => {
    if (!open) return;
    api.get<{ users: SafeUser[] }>("/api/users").then((r) => setUsers(r.users)).catch(() => {});
  }, [open]);

  function toggleMember(id: string) {
    setSelectedMembers((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function onSubmit(values: ProjectCreateInput) {
    try {
      await api.post("/api/projects", { ...values, memberIds: selectedMembers });
      toast.success("Project created");
      reset();
      setSelectedMembers([]);
      setOpen(false);
      onCreated?.();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to create project");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="h-4 w-4" /> New project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Projects organize tasks and team members. You'll be set as the owner.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" placeholder="Q4 Platform Refresh" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" placeholder="What's this project about?" {...register("description")} />
          </div>
          <div className="space-y-2">
            <Label>Team members</Label>
            <div className="max-h-48 overflow-auto rounded-md border p-1 scrollbar-thin">
              {users.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No other users yet.</p>
              ) : (
                users.map((u) => {
                  const selected = selectedMembers.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleMember(u.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md p-2 text-left text-sm transition-colors hover:bg-accent",
                        selected && "bg-accent",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white">
                          {getInitials(u.name)}
                        </span>
                        <span>
                          <span className="block leading-tight">{u.name}</span>
                          <span className="block text-xs text-muted-foreground leading-tight">
                            {u.email} · {u.role}
                          </span>
                        </span>
                      </span>
                      {selected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
