import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SessionProvider } from "@/components/providers/app-providers";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true },
  });
  if (!user) redirect("/login");

  return (
    <SessionProvider initialUser={user}>
      <DashboardShell>{children}</DashboardShell>
    </SessionProvider>
  );
}
