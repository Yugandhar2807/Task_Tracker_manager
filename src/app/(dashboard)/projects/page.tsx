"use client";

import * as React from "react";
import { FolderKanban, Search } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/components/projects/project-card";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { useSession } from "@/components/providers/app-providers";
import { api, ApiError } from "@/lib/api-client";
import type { ProjectListItem } from "@/types";

export default function ProjectsPage() {
  const { user } = useSession();
  const isAdmin = user?.role === "ADMIN";
  const [projects, setProjects] = React.useState<ProjectListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<{ projects: ProjectListItem[] }>("/api/projects");
      setProjects(r.projects);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this project? All tasks within it will be removed.")) return;
    try {
      await api.del(`/api/projects/${id}`);
      toast.success("Project deleted");
      setProjects((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            {isAdmin ? "Create and manage projects across your team." : "Projects you're part of."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 sm:w-64"
            />
          </div>
          {isAdmin && <CreateProjectDialog onCreated={load} />}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FolderKanban className="h-6 w-6" />
            </div>
            <p className="text-base font-medium">No projects found</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {isAdmin
                ? "Create your first project to start organizing tasks."
                : "Once an admin adds you to a project, it will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              isAdmin={!!isAdmin}
              onDelete={isAdmin ? handleDelete : undefined}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
