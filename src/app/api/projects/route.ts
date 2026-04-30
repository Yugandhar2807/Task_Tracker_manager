import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { projectCreateSchema } from "@/lib/validations";
import { apiError } from "@/lib/api-error";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);

    // ADMIN sees all projects; MEMBER sees only projects they own or are a member of.
    const where =
      user.role === "ADMIN"
        ? {}
        : {
            OR: [
              { ownerId: user.sub },
              { members: { some: { id: user.sub } } },
            ],
          };

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: { select: { id: true, name: true, email: true, avatarUrl: true } },
        _count: { select: { tasks: true } },
        tasks: { select: { status: true } },
      },
    });

    const projectsWithProgress = projects.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.status === "DONE").length;
      const progress = total === 0 ? 0 : Math.round((done / total) * 100);
      const { tasks: _t, ...rest } = p;
      return { ...rest, taskCount: total, completedCount: done, progress };
    });

    return NextResponse.json({ projects: projectsWithProgress });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const data = projectCreateSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        ownerId: admin.sub,
        members: {
          connect: data.memberIds.map((id) => ({ id })),
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    await logActivity({
      action: "PROJECT_CREATED",
      message: `${admin.name} created project "${project.name}"`,
      userId: admin.sub,
      projectId: project.id,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
