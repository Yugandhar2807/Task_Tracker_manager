import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireUser(req);
    const users = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        assignedTasks: { select: { status: true, dueDate: true } },
      },
    });

    const now = Date.now();
    const enriched = users.map((u) => {
      const total = u.assignedTasks.length;
      const done = u.assignedTasks.filter((t) => t.status === "DONE").length;
      const inProgress = u.assignedTasks.filter((t) => t.status === "IN_PROGRESS").length;
      const todo = u.assignedTasks.filter((t) => t.status === "TODO").length;
      const overdue = u.assignedTasks.filter(
        (t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate).getTime() < now,
      ).length;
      const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);
      // strip the heavy assignedTasks array from the response
      const { assignedTasks: _t, ...rest } = u;
      return {
        ...rest,
        _count: { assignedTasks: total },
        stats: { total, todo, inProgress, done, overdue, completionRate },
      };
    });

    return NextResponse.json({ users: enriched });
  } catch (e) {
    return apiError(e);
  }
}
