"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api-client";

type Notification = {
  id: string;
  type: string;
  message: string;
  taskId: string | null;
  projectId: string | null;
  read: boolean;
  createdAt: string;
};

type Response = { notifications: Notification[]; unreadCount: number };

export function NotificationBell() {
  const [items, setItems] = React.useState<Notification[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = React.useCallback(async () => {
    try {
      const r = await api.get<Response>("/api/notifications?limit=20");
      setItems(r.notifications);
      setUnread(r.unreadCount);
    } catch {
      // silent
    }
  }, []);

  React.useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(fetchAll, 30_000); // poll every 30s
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchAll]);

  async function markAllRead() {
    try {
      await api.put("/api/notifications", {});
      setItems((arr) => arr.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      // silent
    }
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) fetchAll();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white"
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-xs">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">You're all caught up</p>
            </div>
          ) : (
            items.map((n) => {
              const href = n.projectId ? `/projects/${n.projectId}` : "/tasks";
              return (
                <Link
                  key={n.id}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block border-b px-3 py-2.5 text-sm transition-colors hover:bg-accent/50 last:border-0",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    <div className={cn("flex-1", n.read && "pl-4")}>
                      <p className="leading-snug">{n.message}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
