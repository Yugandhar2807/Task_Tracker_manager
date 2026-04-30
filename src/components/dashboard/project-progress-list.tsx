"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FolderKanban } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectListItem } from "@/types";

export function ProjectProgressList({
  projects,
  loading,
}: {
  projects: ProjectListItem[];
  loading?: boolean;
}) {
  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-primary" />
          <CardTitle>Project Progress</CardTitle>
        </div>
        <CardDescription>Completion percentage by project</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))
        ) : projects.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No projects yet. Create one to get started.
          </p>
        ) : (
          projects.slice(0, 6).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/projects/${p.id}`}
                  className="truncate text-sm font-medium hover:text-primary transition-colors"
                >
                  {p.name}
                </Link>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {p.completedCount}/{p.taskCount} · {p.progress}%
                </span>
              </div>
              <Progress value={p.progress} />
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
