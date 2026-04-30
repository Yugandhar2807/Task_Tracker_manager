import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireAdmin, requireUser } from "@/lib/auth";
import { projectUpdateSchema } from "@/lib/validations";
import { apiError } from "@/lib/api-error";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(req);

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        tasks: {
          orderBy: { createdAt: "desc" },
          include: {
            assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!project) throw new HttpError(404, "Project not found");

    if (
      user.role !== "ADMIN" &&
      project.ownerId !== user.sub &&
      !project.members.some((m) => m.id === user.sub)
    ) {
      throw new HttpError(403, "You don't have access to this project");
    }

    const total = project.tasks.length;
    const done = project.tasks.filter((t) => t.status === "DONE").length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);

    return NextResponse.json({ project: { ...project, progress, taskCount: total, completedCount: done } });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const data = projectUpdateSchema.parse(body);

    const existing = await prisma.project.findUnique({ where: { id: params.id } });
    if (!existing) throw new HttpError(404, "Project not found");

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.archived !== undefined && { archived: data.archived }),
        ...(data.memberIds !== undefined && {
          members: { set: data.memberIds.map((id) => ({ id })) },
        }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    const verb =
      data.archived === true ? "archived"
      : data.archived === false ? "restored"
      : "updated";
    await logActivity({
      action: data.archived === true ? "PROJECT_ARCHIVED" : data.archived === false ? "PROJECT_RESTORED" : "PROJECT_UPDATED",
      message: `${admin.name} ${verb} project "${project.name}"`,
      userId: admin.sub,
      projectId: project.id,
    });

    return NextResponse.json({ project });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const existing = await prisma.project.findUnique({ where: { id: params.id } });
    if (!existing) throw new HttpError(404, "Project not found");

    await prisma.project.delete({ where: { id: params.id } });

    await logActivity({
      action: "PROJECT_DELETED",
      message: `${admin.name} deleted project "${existing.name}"`,
      userId: admin.sub,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
