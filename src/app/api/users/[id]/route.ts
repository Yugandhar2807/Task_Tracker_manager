import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { HttpError, requireAdmin } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

const updateUserSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  name: z.string().trim().min(2).max(80).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const data = updateUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) throw new HttpError(404, "User not found");

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });

    await logActivity({
      action: "USER_UPDATED",
      message: `${admin.name} updated ${user.name}`,
      userId: admin.sub,
      metadata: { targetUserId: user.id },
    });

    return NextResponse.json({ user });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    if (admin.sub === params.id) {
      throw new HttpError(400, "You cannot delete your own account");
    }
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) throw new HttpError(404, "User not found");

    await prisma.user.delete({ where: { id: params.id } });

    await logActivity({
      action: "USER_DELETED",
      message: `${admin.name} removed ${existing.name} from the workspace`,
      userId: admin.sub,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
