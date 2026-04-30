"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSession } from "@/components/providers/app-providers";
import { api, ApiError } from "@/lib/api-client";
import type { Role, SafeUser } from "@/types";

export default function MembersPage() {
  const router = useRouter();
  const { user } = useSession();

  React.useEffect(() => {
    if (user && user.role !== "ADMIN") router.replace("/dashboard");
  }, [user, router]);

  const [users, setUsers] = React.useState<SafeUser[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<{ users: SafeUser[] }>("/api/users");
      setUsers(r.users);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function changeRole(id: string, role: Role) {
    try {
      await api.put(`/api/users/${id}`, { role });
      toast.success("Role updated");
      setUsers((arr) => arr.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to update");
    }
  }

  async function deleteUser(u: SafeUser) {
    if (!confirm(`Remove ${u.name} from the workspace? This cannot be undone.`)) return;
    try {
      await api.del(`/api/users/${u.id}`);
      toast.success("Member removed");
      setUsers((arr) => arr.filter((x) => x.id !== u.id));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Team Members</h2>
        <p className="text-muted-foreground">Manage roles and access for everyone in the workspace.</p>
      </div>

      <Card className="glass">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle>{users.length} {users.length === 1 ? "member" : "members"}</CardTitle>
          </div>
          <CardDescription>
            New users sign up via the public registration page. The first sign-up is automatically an Admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-2 px-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">To Do</TableHead>
                  <TableHead className="text-center">In Progress</TableHead>
                  <TableHead className="text-center">Done</TableHead>
                  <TableHead className="text-center">Overdue</TableHead>
                  <TableHead className="min-w-[160px]">Workload</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const s = u.stats ?? { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0, completionRate: 0 };
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.name} src={u.avatarUrl} />
                          <div>
                            <div className="font-medium leading-tight">
                              {u.name} {user?.id === u.id && <span className="text-xs text-muted-foreground">(you)</span>}
                            </div>
                            <div className="text-xs text-muted-foreground leading-tight">{u.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user?.id === u.id ? (
                          <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                        ) : (
                          <Select value={u.role} onValueChange={(v) => changeRole(u.id, v as Role)}>
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">ADMIN</SelectItem>
                              <SelectItem value="MEMBER">MEMBER</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-muted-foreground">{s.todo}</TableCell>
                      <TableCell className="text-center tabular-nums text-sky-500">{s.inProgress}</TableCell>
                      <TableCell className="text-center tabular-nums text-emerald-500">{s.done}</TableCell>
                      <TableCell className="text-center tabular-nums">
                        <span className={cn("inline-block min-w-[1.5rem] rounded px-1.5 py-0.5 text-xs font-semibold",
                          s.overdue > 0 ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                        )}>
                          {s.overdue}
                        </span>
                      </TableCell>
                      <TableCell>
                        {s.total === 0 ? (
                          <span className="text-xs text-muted-foreground">No tasks</span>
                        ) : (
                          <div className="space-y-1">
                            <Progress value={s.completionRate} className="h-1.5" />
                            <div className="text-[11px] text-muted-foreground tabular-nums">
                              {s.done}/{s.total} done · {s.completionRate}%
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {user?.id !== u.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteUser(u)}
                            className="text-destructive hover:text-destructive"
                            aria-label={`Remove ${u.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
