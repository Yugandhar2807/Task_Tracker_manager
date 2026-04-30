"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Archive, ArchiveRestore, ArrowLeft, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  archived: boolean;
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
  const rawParams = useParams<{ id: string }>();
  const projectId = rawParams?.id ?? "";
  const router = useRouter();
  const { user } = useSession();
  const isAdmin = user?.role === "ADMIN";

  const [project, setProject] = React.useState<ProjectDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<TaskStatus | "ALL">("ALL");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<{ project: ProjectDetail }>(`/api/projects/${projectId}`);
      setProject(r.project);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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

  async function toggleArchive() {
    if (!project) return;
    const next = !project.archived;
    const verb = next ? "Archive" : "Restore";
    if (!confirm(`${verb} project "${project.name}"?`)) return;
    try {
      await api.put(`/api/projects/${project.id}`, { archived: next });
      toast.success(next ? "Project archived" : "Project restored");
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to update");
    }
  }

  async function removeMember(memberId: string, memberName: string) {
    if (!project) return;
    if (!confirm(`Remove ${memberName} from "${project.name}"?`)) return;
    try {
      const remaining = project.members.filter((m) => m.id !== memberId).map((m) => m.id);
      await api.put(`/api/projects/${project.id}`, { memberIds: remaining });
      toast.success(`${memberName} removed`);
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to remove member");
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

      {project.archived && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <Archive className="h-4 w-4" />
          This project is archived. {isAdmin ? "Click Restore to bring it back to active projects." : "Read-only."}
        </div>
      )}

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
                  <div className="text-xs text-muted-foreground leading-tight">Team</div>
                  <div className="text-sm leading-tight">
                    1 owner + {project.members.length} member{project.members.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleArchive}>
                {project.archived ? (
                  <><ArchiveRestore className="h-4 w-4" /> Restore</>
                ) : (
                  <><Archive className="h-4 w-4" /> Archive</>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={deleteProject} className="text-destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
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

      <Card className="glass">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Team</CardTitle>
          </div>
          <CardDescription>
            Everyone with access to this project. {isAdmin ? "Click ✕ to remove a member." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-md border bg-card/40 p-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar name={project.owner.name} src={project.owner.avatarUrl} />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{project.owner.name}</div>
                <div className="text-xs text-muted-foreground truncate">{project.owner.email}</div>
              </div>
            </div>
            <Badge>Owner</Badge>
          </div>
          {project.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-md border bg-card/40 p-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <UserAvatar name={m.name} src={m.avatarUrl} />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary">Member</Badge>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMember(m.id, m.name)}
                    aria-label={`Remove ${m.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {project.members.length === 0 && (
            <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">
              No members yet. {isAdmin ? "Edit the project to add some." : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {(() => {
        // Per-member contribution breakdown for THIS project.
        const everyone = [
          { id: project.owner.id, name: project.owner.name, avatarUrl: project.owner.avatarUrl, isOwner: true },
          ...project.members.map((m) => ({ id: m.id, name: m.name, avatarUrl: m.avatarUrl, isOwner: false })),
        ];
        const now = Date.now();
        const breakdowns = everyone.map((p) => {
          const tasks = project.tasks.filter((t) => t.assigneeId === p.id);
          const done = tasks.filter((t) => t.status === "DONE").length;
          const overdue = tasks.filter(
            (t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate).getTime() < now,
          ).length;
          const completionRate = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);
          return { ...p, total: tasks.length, done, overdue, completionRate };
        });
        const unassigned = project.tasks.filter((t) => !t.assigneeId).length;
        const anyAssigned = breakdowns.some((b) => b.total > 0);
        if (!anyAssigned && unassigned === 0) return null;
        return (
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Workload by member</CardTitle>
              </div>
              <CardDescription>How tasks in this project are distributed across the team.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {breakdowns
                .filter((b) => b.total > 0)
                .map((b) => (
                  <div key={b.id} className="rounded-md border bg-card/40 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar name={b.name} src={b.avatarUrl} className="h-7 w-7" />
                        <span className="text-sm font-medium truncate">{b.name}</span>
                        {b.isOwner && <Badge className="text-[10px]">Owner</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {b.done}/{b.total} · {b.completionRate}%
                      </span>
                    </div>
                    <Progress value={b.completionRate} className="h-1.5" />
                    {b.overdue > 0 && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400">
                        {b.overdue} overdue
                      </p>
                    )}
                  </div>
                ))}
              {unassigned > 0 && (
                <div className="rounded-md border border-dashed bg-card/30 p-3 sm:col-span-2">
                  <p className="text-sm">
                    <span className="font-medium">{unassigned} task{unassigned === 1 ? "" : "s"}</span>{" "}
                    <span className="text-muted-foreground">unassigned in this project.</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

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
