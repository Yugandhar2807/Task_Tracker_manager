import Link from "next/link";
import { KanbanSquare } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-mesh opacity-70" />
      <div className="absolute -top-40 -left-32 -z-10 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-32 -z-10 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />

      <header className="container flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
            <KanbanSquare className="h-5 w-5" />
          </div>
          <span>Team Task Manager</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="container flex min-h-[calc(100vh-100px)] items-center justify-center pb-12">
        {children}
      </main>
    </div>
  );
}
