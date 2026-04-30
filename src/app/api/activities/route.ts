import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { searchParams } = req.nextUrl;
    const projectId = searchParams.get("projectId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

    // Members see activities tied to projects they have access to OR their own.
    const accessibleProjects =
      user.role === "ADMIN"
        ? null
        : await prisma.project.findMany({
            where: {
              OR: [
                { ownerId: user.sub },
                { members: { some: { id: user.sub } } },
              ],
            },
            select: { id: true },
          });

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (user.role !== "ADMIN") {
      const ids = (accessibleProjects ?? []).map((p) => p.id);
      where.OR = [{ projectId: { in: ids } }, { userId: user.sub }, { projectId: null }];
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ activities });
  } catch (e) {
    return apiError(e);
  }
}
