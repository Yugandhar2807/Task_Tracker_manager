import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);

    const taskScope =
      user.role === "ADMIN"
        ? {}
        : {
            OR: [
              { assigneeId: user.sub },
              { project: { ownerId: user.sub } },
              { project: { members: { some: { id: user.sub } } } },
            ],
          };

    const [total, done, inProgress, todo, overdue] = await Promise.all([
      prisma.task.count({ where: taskScope }),
      prisma.task.count({ where: { ...taskScope, status: "DONE" } }),
      prisma.task.count({ where: { ...taskScope, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...taskScope, status: "TODO" } }),
      prisma.task.count({
        where: {
          ...taskScope,
          status: { not: "DONE" },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        total,
        completed: done,
        pending: total - done,
        inProgress,
        todo,
        overdue,
        completionRate: total === 0 ? 0 : Math.round((done / total) * 100),
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
