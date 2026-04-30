"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  KanbanSquare,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/providers/app-providers";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/members", label: "Members", icon: Users, adminOnly: true },
];

export function Sidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname() ?? "";
  const { user } = useSession();
  const isAdmin = user?.role === "ADMIN";

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
          "transition-opacity",
        )}
        onClick={() => onOpenChange(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col glass border-r border-border/60 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-5">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
              <KanbanSquare className="h-5 w-5" />
            </div>
            <span className="text-base">Task Manager</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => onOpenChange(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/15 to-purple-500/15 ring-1 ring-primary/20"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={cn("relative h-4 w-4", active && "text-primary")} />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/60 p-4">
          <div className="rounded-lg bg-card/40 p-3 text-xs">
            <p className="font-medium">
              {user?.role === "ADMIN" ? "Admin workspace" : "Member workspace"}
            </p>
            <p className="mt-1 text-muted-foreground">
              {user?.role === "ADMIN"
                ? "You can create projects, manage tasks, and invite members."
                : "You can view assigned tasks and update their status."}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
