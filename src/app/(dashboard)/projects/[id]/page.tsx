"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TaskRow } from "@/components/tasks/task-row";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { useSession } from "@/components/providers/app-providers";
import { api, ApiError } from "@/lib/api-client";
import type { Task, TaskStatus } from "@/types";

type ProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  owner: { id: string; name: string; email: string; avatarUrl: string | null };
  members: { id: string; name: string; email: string; avatarUrl: string | null; role: string }[];
  tasks: Task[];
  taskCount: number;
  completedCount: number;
  progress: number;
};

const STATUS_TABS: { value: TaskStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const isAdmin = user?.role === "ADMIN";

  const [project, setProject] = React.useState<ProjectDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<TaskStatus | "ALL">("ALL");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<{ project: ProjectDetail }>(`/api/projects/${params.id}`);
      setProject(r.project);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const isMemberOrOwner = !!user && !!project && (project.ownerId === user.id || project.members.some((m) => m.id === user.id));
  const canChangeStatus = isAdmin || isMemberOrOwner;

  function onTaskUpdated(updated: Task) {
    setProject((p) => p && { ...p, tasks: p.tasks.map((t) => (t.id === updated.id ? updated : t)) });
  }
  function onTaskDeleted(id: string) {
    setProject((p) => p && { ...p, tasks: p.tasks.filter((t) => t.id !== id) });
  }

  async function deleteProject() {
    if (!project) return;
    if (!confirm(`Delete project "${project.name}"? All tasks will be removed.`)) return;
    try {
      await api.del(`/api/projects/${project.id}`);
      toast.success("Project deleted");
      router.push("/projects");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/projects"><ArrowLeft className="h-4 w-4" /> Back to projects</Link>
        </Button>
      </div>
    );
  }

  const filteredTasks =
    tab === "ALL" ? project.tasks : project.tasks.filter((t) => t.status === tab);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects"><ArrowLeft className="h-4 w-4" /> All projects</Link>
        </Button>
      </div>

      <Card className="glass">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-2xl">{project.name}</CardTitle>
            {project.description && (
              <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <UserAvatar name={project.owner.name} src={project.owner.avatarUrl} />
                <div>
                  <div className="text-xs text-muted-foreground leading-tight">Owner</div>
                  <div className="text-sm leading-tight">{project.owner.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground leading-tight">Members</div>
                  <div className="text-sm leading-tight">{project.members.length + 1}</div>
                </div>
              </div>
            </div>
          </div>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={deleteProject} className="text-destructive">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums">
              {project.completedCount}/{project.taskCount} tasks · {project.progress}%
            </span>
          </div>
          <Progress value={project.progress} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {isAdmin && (
          <CreateTaskDialog
            defaultProjectId={project.id}
            projects={[{ id: project.id, name: project.name }]}
            onCreated={load}
          />
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        {STATUS_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="space-y-3 mt-0">
            {filteredTasks.length === 0 ? (
              <Card className="glass">
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No tasks {t.value === "ALL" ? "yet" : `with status ${t.label}`}.
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div className="space-y-3">
                  {filteredTasks.map((task, i) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isAdmin={!!isAdmin}
                      canChangeStatus={canChangeStatus}
                      onUpdated={onTaskUpdated}
                      onDeleted={onTaskDeleted}
                      index={i}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
