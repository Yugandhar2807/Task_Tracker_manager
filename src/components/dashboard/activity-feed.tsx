"use client";

import { motion } from "framer-motion";
import { Activity as ActivityIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";
import type { Activity } from "@/types";

export function ActivityFeed({ activities, loading }: { activities: Activity[]; loading?: boolean }) {
  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ActivityIcon className="h-4 w-4 text-primary" />
          <CardTitle>Recent Activity</CardTitle>
        </div>
        <CardDescription>Latest actions across your team's projects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          activities.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent/40"
            >
              <UserAvatar name={a.user.name} src={a.user.avatarUrl} />
              <div className="flex-1">
                <p className="text-sm leading-tight">{a.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatRelativeTime(a.createdAt)}
                  {a.project ? ` · ${a.project.name}` : ""}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
