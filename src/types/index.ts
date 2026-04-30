export type Role = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  createdAt?: string;
  _count?: { assignedTasks: number };
};

export type ProjectListItem = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  owner: { id: string; name: string; email: string; avatarUrl: string | null };
  members: { id: string; name: string; email: string; avatarUrl: string | null }[];
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  completedCount: number;
  progress: number;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  projectId: string;
  assigneeId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; name: string; email: string; avatarUrl: string | null } | null;
  createdBy: { id: string; name: string; email: string; avatarUrl: string | null };
  project: { id: string; name: string };
};

export type Activity = {
  id: string;
  action: string;
  message: string;
  metadata: Record<string, unknown> | null;
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null };
  projectId: string | null;
  project: { id: string; name: string } | null;
  createdAt: string;
};

export type DashboardStats = {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  todo: number;
  overdue: number;
  completionRate: number;
};
