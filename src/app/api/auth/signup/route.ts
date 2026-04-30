import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession, setAuthCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validations";
import { apiError } from "@/lib/api-error";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = signupSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // First user becomes ADMIN automatically. All subsequent signups are MEMBER —
    // role changes happen only through the admin /members page (PUT /api/users/:id).
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "MEMBER";

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      },
    });

    await logActivity({
      action: "USER_SIGNED_UP",
      message: `${user.name} joined the workspace`,
      userId: user.id,
    });

    const token = await createSession({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const res = NextResponse.json(
      {
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
      },
      { status: 201 },
    );
    return setAuthCookie(res, token);
  } catch (e) {
    return apiError(e);
  }
}
