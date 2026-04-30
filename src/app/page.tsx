import Link from "next/link";
import { ArrowRight, CheckCircle2, KanbanSquare, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-gradient-mesh opacity-60" />
      <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

      <header className="container flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
            <KanbanSquare className="h-5 w-5" />
          </div>
          <span>Team Task Manager</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button variant="gradient" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="container flex flex-col items-center text-center py-20 sm:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-1.5 text-xs font-medium backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Production-ready team collaboration
        </div>
        <h1 className="mt-6 max-w-4xl text-balance text-5xl font-bold tracking-tight sm:text-7xl">
          Plan, <span className="gradient-text">collaborate</span>, and ship faster as a team
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          A modern SaaS dashboard for managing projects, assigning tasks, and tracking team activity —
          with role-based access, real progress tracking, and a beautiful dark/light interface.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button variant="gradient" size="lg" asChild>
            <Link href="/signup">
              Create your workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        <div className="mt-20 grid w-full max-w-5xl gap-6 sm:grid-cols-3">
          {[
            {
              icon: <ShieldCheck className="h-5 w-5" />,
              title: "Role-based access",
              text: "Admin and Member roles with strict server-side enforcement.",
            },
            {
              icon: <KanbanSquare className="h-5 w-5" />,
              title: "Tasks that flow",
              text: "Status, priority, due dates, and assignees — all with one click.",
            },
            {
              icon: <Users className="h-5 w-5" />,
              title: "Team activity",
              text: "A persistent activity feed shows who did what, in real time.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="glass rounded-xl p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {f.icon}
              </div>
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>

        <ul className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          {["JWT auth", "PostgreSQL + Prisma", "Next.js 14", "Tailwind + Shadcn UI", "Framer Motion"].map(
            (t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t}
              </li>
            ),
          )}
        </ul>
      </section>
    </main>
  );
}
