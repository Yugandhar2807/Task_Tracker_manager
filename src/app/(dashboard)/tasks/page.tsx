"use client";

import * as React from "react";
import { CheckSquare, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskRow } from "@/components/tasks/task-row";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { useSession } from "@/components/providers/app-providers";
import { api } from "@/lib/api-client";
import type { Task, Priority, TaskStatus } from "@/types";

const STATUS_TABS: { value: TaskStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

export default function TasksPage() {
  const { user } = useSession();
  const isAdmin = user?.role === "ADMIN";

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<TaskStatus | "ALL">("ALL");
  const [priority, setPriority] = React.useState<Priority | "ALL">("ALL");
  const [scope, setScope] = React.useState<"all" | "mine">(isAdmin ? "all" : "mine");
  const [query, setQuery] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = scope === "mine" ? "/api/tasks?assignedToMe=true" : "/api/tasks";
      const r = await api.get<{ tasks: Task[] }>(url);
      setTasks(r.tasks);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = tasks.filter((t) => {
    if (tab !== "ALL" && t.status !== tab) return false;
    if (priority !== "ALL" && t.priority !== priority) return false;
    if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  function onUpdated(updated: Task) {
    setTasks((arr) => arr.map((t) => (t.id === updated.id ? updated : t)));
  }
  function onDeleted(id: string) {
    setTasks((arr) => arr.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">
            {isAdmin ? "Track and manage tasks across all projects." : "Tasks you're assigned to."}
          </p>
        </div>
        {isAdmin && <CreateTaskDialog onCreated={load} />}
      </div>

      <Card className="glass">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-12">
          <div className="relative sm:col-span-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="sm:col-span-3">
            <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
              <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All priorities</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isAdmin && (
            <div className="sm:col-span-4">
              <Select value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tasks</SelectItem>
                  <SelectItem value="mine">Assigned to me</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          {STATUS_TABS.map((t) => {
            const count = t.value === "ALL" ? tasks.length : tasks.filter((x) => x.status === t.value).length;
            return (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label} <span className="ml-1.5 text-xs text-muted-foreground">{count}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckSquare className="h-6 w-6" />
            </div>
            <p className="text-base font-medium">No tasks match these filters</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Try changing the filters above, or create a new task.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div className="space-y-3">
            {filtered.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                isAdmin={!!isAdmin}
                canChangeStatus
                showProject
                onUpdated={onUpdated}
                onDeleted={onDeleted}
                index={i}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
