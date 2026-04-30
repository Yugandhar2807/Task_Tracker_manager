import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { HttpError, requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

const commentSchema = z.object({
  message: z.string().trim().min(1, "Comment cannot be empty").max(2000),
  // Set automatically by the status-with-note flow; not part of the public contract.
  statusFrom: z.string().optional().nullable(),
  statusTo: z.string().optional().nullable(),
});

async function loadTaskWithAccess(taskId: string, userId: string, role: "ADMIN" | "MEMBER") {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { id: true, ownerId: true, members: { select: { id: true } } } },
    },
  });
  if (!task) throw new HttpError(404, "Task not found");
  if (
    role !== "ADMIN" &&
    task.assigneeId !== userId &&
    task.project.ownerId !== userId &&
    !task.project.members.some((m) => m.id === userId)
  ) {
    throw new HttpError(403, "You don't have access to this task");
  }
  return task;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(req);
    await loadTaskWithAccess(params.id, user.sub, user.role);

    const comments = await prisma.comment.findMany({
      where: { taskId: params.id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
    });
    return NextResponse.json({ comments });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(req);
    const task = await loadTaskWithAccess(params.id, user.sub, user.role);

    const body = await req.json();
    const data = commentSchema.parse(body);

    const comment = await prisma.comment.create({
      data: {
        taskId: task.id,
        userId: user.sub,
        message: data.message,
        statusFrom: data.statusFrom ?? null,
        statusTo: data.statusTo ?? null,
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
    });

    await logActivity({
      action: "TASK_COMMENT_ADDED",
      message: `${user.name} added a note on "${task.title}"`,
      userId: user.sub,
      projectId: task.projectId,
      metadata: { taskId: task.id, commentId: comment.id },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
