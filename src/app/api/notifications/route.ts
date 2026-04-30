import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { searchParams } = req.nextUrl;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.sub },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { userId: user.sub, read: false } }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (e) {
    return apiError(e);
  }
}

// Mark all notifications as read for the current user
export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await prisma.notification.updateMany({
      where: { userId: user.sub, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
