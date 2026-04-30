import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireAdmin, requireUser } from "@/lib/auth";
import { taskCreateSchema } from "@/lib/validations";
import { apiError } from "@/lib/api-error";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { searchParams } = req.nextUrl;
    const projectId = searchParams.get("projectId");
    const assignedToMe = searchParams.get("assignedToMe") === "true";

    // Visibility:
    //  - ADMIN: all tasks (optionally filtered by projectId)
    //  - MEMBER: tasks assigned to them OR in projects they own/are members of
    const memberFilter =
      user.role === "ADMIN"
        ? {}
        : {
            OR: [
              { assigneeId: user.sub },
              { project: { ownerId: user.sub } },
              { project: { members: { some: { id: user.sub } } } },
            ],
          };

    const where = {
      ...(projectId ? { projectId } : {}),
      ...(assignedToMe ? { assigneeId: user.sub } : {}),
      ...memberFilter,
    };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ tasks });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const data = taskCreateSchema.parse(body);

    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new HttpError(404, "Project not found");

    if (data.assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId } });
      if (!assignee) throw new HttpError(400, "Assignee not found");
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        projectId: data.projectId,
        assigneeId: data.assigneeId ?? null,
        status: data.status ?? "TODO",
        priority: data.priority ?? "MEDIUM",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdById: admin.sub,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
      },
    });

    await logActivity({
      action: "TASK_CREATED",
      message: `${admin.name} created task "${task.title}" in ${project.name}`,
      userId: admin.sub,
      projectId: project.id,
      metadata: { taskId: task.id },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
