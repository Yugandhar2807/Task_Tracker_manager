import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireAdmin, requireUser } from "@/lib/auth";
import { taskUpdateSchema } from "@/lib/validations";
import { apiError } from "@/lib/api-error";
import { logActivity } from "@/lib/activity";
import { notify } from "@/lib/notification";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(req);
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: {
          select: { id: true, name: true, ownerId: true, members: { select: { id: true } } },
        },
      },
    });
    if (!task) throw new HttpError(404, "Task not found");

    if (
      user.role !== "ADMIN" &&
      task.assigneeId !== user.sub &&
      task.project.ownerId !== user.sub &&
      !task.project.members.some((m) => m.id === user.sub)
    ) {
      throw new HttpError(403, "You don't have access to this task");
    }

    return NextResponse.json({ task });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const data = taskUpdateSchema.parse(body);

    const existing = await prisma.task.findUnique({
      where: { id: params.id },
      include: { project: { select: { id: true, name: true, ownerId: true, members: { select: { id: true } } } } },
    });
    if (!existing) throw new HttpError(404, "Task not found");

    // RBAC:
    //  - ADMIN: can change anything
    //  - MEMBER: can ONLY change `status`, and only if assignee or project member/owner.
    if (user.role !== "ADMIN") {
      const isAssignee = existing.assigneeId === user.sub;
      const isProjectMember =
        existing.project.ownerId === user.sub ||
        existing.project.members.some((m) => m.id === user.sub);
      if (!isAssignee && !isProjectMember) {
        throw new HttpError(403, "You don't have access to this task");
      }
      // Check the raw body (not zod-parsed data, which can include null defaults from transforms).
      const submittedKeys = Object.keys(body ?? {});
      const disallowed = submittedKeys.filter((k) => k !== "status");
      if (disallowed.length > 0) {
        throw new HttpError(403, "Members can only update task status");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (data.status && data.status !== existing.status) {
      await logActivity({
        action: "TASK_STATUS_CHANGED",
        message: `${user.name} moved task "${task.title}" → ${data.status.replace("_", " ")}`,
        userId: user.sub,
        projectId: task.project.id,
        metadata: { taskId: task.id, from: existing.status, to: data.status },
      });
      // Notify task creator (admin who assigned) when assignee moves the status
      if (existing.createdById !== user.sub) {
        await notify({
          userId: existing.createdById,
          type: "TASK_STATUS_CHANGED",
          message: `${user.name} moved "${task.title}" → ${data.status.replace("_", " ")}`,
          taskId: task.id,
          projectId: task.project.id,
        });
      }
    } else {
      await logActivity({
        action: "TASK_UPDATED",
        message: `${user.name} updated task "${task.title}"`,
        userId: user.sub,
        projectId: task.project.id,
        metadata: { taskId: task.id },
      });
    }

    // If assignee changed, notify the new assignee
    if (
      data.assigneeId !== undefined &&
      data.assigneeId !== existing.assigneeId &&
      data.assigneeId &&
      data.assigneeId !== user.sub
    ) {
      await notify({
        userId: data.assigneeId,
        type: "TASK_REASSIGNED",
        message: `${user.name} assigned you "${task.title}"`,
        taskId: task.id,
        projectId: task.project.id,
      });
    }

    return NextResponse.json({ task });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const existing = await prisma.task.findUnique({
      where: { id: params.id },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!existing) throw new HttpError(404, "Task not found");

    await prisma.task.delete({ where: { id: params.id } });

    await logActivity({
      action: "TASK_DELETED",
      message: `${admin.name} deleted task "${existing.title}"`,
      userId: admin.sub,
      projectId: existing.project.id,
      metadata: { taskId: existing.id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
