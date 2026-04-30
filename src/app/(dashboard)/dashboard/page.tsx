"use client";

import * as React from "react";
import { CheckCircle2, Clock, ListTodo, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ProjectProgressList } from "@/components/dashboard/project-progress-list";
import { api } from "@/lib/api-client";
import { useSession } from "@/components/providers/app-providers";
import type { Activity, DashboardStats, ProjectListItem } from "@/types";

export default function DashboardPage() {
  const { user } = useSession();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [projects, setProjects] = React.useState<ProjectListItem[]>([]);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [s, p, a] = await Promise.all([
          api.get<{ stats: DashboardStats }>("/api/dashboard"),
          api.get<{ projects: ProjectListItem[] }>("/api/projects"),
          api.get<{ activities: Activity[] }>("/api/activities?limit=10"),
        ]);
        if (cancelled) return;
        setStats(s.stats);
        setProjects(p.projects);
        setActivities(a.activities);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user?.name.split(" ")[0]} 👋
        </h2>
        <p className="text-muted-foreground">
          {user?.role === "ADMIN"
            ? "Here's what's happening across your team's projects."
            : "Here's an overview of your assigned tasks."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          index={0}
          label="Total Tasks"
          value={stats?.total ?? "—"}
          icon={<ListTodo />}
          accent="indigo"
        />
        <StatCard
          index={1}
          label="Completed"
          value={stats?.completed ?? "—"}
          icon={<CheckCircle2 />}
          accent="emerald"
        />
        <StatCard
          index={2}
          label="Pending"
          value={stats?.pending ?? "—"}
          icon={<Clock />}
          accent="amber"
        />
        <StatCard
          index={3}
          label="Overdue"
          value={stats?.overdue ?? "—"}
          icon={<AlertTriangle />}
          accent="rose"
        />
      </div>

      <Card className="glass">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle>Overall Completion</CardTitle>
          </div>
          <CardDescription>
            {stats
              ? `${stats.completed} of ${stats.total} tasks completed (${stats.completionRate}%)`
              : "Calculating…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={stats?.completionRate ?? 0} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProjectProgressList projects={projects} loading={loading} />
        <ActivityFeed activities={activities} loading={loading} />
      </div>
    </div>
  );
}
