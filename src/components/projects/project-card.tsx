"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MoreHorizontal, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { ProjectListItem } from "@/types";

type Props = {
  project: ProjectListItem;
  isAdmin: boolean;
  onDelete?: (id: string) => void;
  index?: number;
};

export function ProjectCard({ project, isAdmin, onDelete, index = 0 }: Props) {
  const allMembers = [project.owner, ...project.members.filter((m) => m.id !== project.owner.id)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className="glass group h-full transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="flex-1">
            <Link href={`/projects/${project.id}`}>
              <CardTitle className="line-clamp-1 transition-colors hover:text-primary">
                {project.name}
              </CardTitle>
            </Link>
            {project.description && (
              <CardDescription className="line-clamp-2 mt-1">{project.description}</CardDescription>
            )}
          </div>
          {isAdmin && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="opacity-0 transition-opacity group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(project.id)}
                >
                  <Trash2 className="h-4 w-4" /> Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="tabular-nums">
                {project.completedCount}/{project.taskCount} · {project.progress}%
              </span>
            </div>
            <Progress value={project.progress} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center -space-x-2">
              {allMembers.slice(0, 4).map((m) => (
                <UserAvatar
                  key={m.id}
                  name={m.name}
                  src={m.avatarUrl}
                  className="h-7 w-7 ring-2 ring-card"
                />
              ))}
              {allMembers.length > 4 && (
                <div className="z-10 flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-card">
                  +{allMembers.length - 4}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {allMembers.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
