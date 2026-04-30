"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Send,
  Sparkles,
  X,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  FolderKanban,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/components/providers/app-providers";
import { api, ApiError } from "@/lib/api-client";

type Block =
  | { kind: "text"; body: string }
  | { kind: "stat"; label: string; value: string }
  | {
      kind: "task-list";
      title: string;
      items: {
        id: string;
        title: string;
        status: string;
        priority: string;
        dueDate: string | null;
        projectName: string;
        assigneeName: string | null;
        overdue: boolean;
      }[];
    }
  | {
      kind: "project-list";
      title: string;
      items: { id: string; name: string; progress: number; tasks: number }[];
    }
  | {
      kind: "user-summary";
      title: string;
      user: { name: string; email: string; role: string };
      stats: { total: number; todo: number; inProgress: number; done: number; overdue: number };
      recent: { id: string; title: string; status: string; project: string }[];
    };

type BotResponse = { intent: string; blocks: Block[]; suggestions?: string[] };

type Message =
  | { role: "user"; text: string; id: string }
  | { role: "bot"; response: BotResponse; id: string }
  | { role: "bot-error"; text: string; id: string };

function uid() {
  return Math.random().toString(36).slice(2);
}

function priorityClasses(p: string) {
  if (p === "HIGH") return "bg-rose-500/15 text-rose-600 dark:text-rose-300";
  if (p === "MEDIUM") return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
}

function statusClasses(s: string) {
  if (s === "DONE") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (s === "IN_PROGRESS") return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
  return "bg-muted text-muted-foreground";
}

function formatBody(body: string) {
  // Lightweight bold rendering: **text**
  const parts = body.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    ),
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.kind === "text") {
    return <p className="text-sm leading-relaxed">{formatBody(block.body)}</p>;
  }
  if (block.kind === "stat") {
    return (
      <div className="flex items-center justify-between rounded-md border border-border/60 bg-card/40 px-3 py-2 text-sm">
        <span className="text-muted-foreground">{block.label}</span>
        <span className="tabular-nums font-semibold">{block.value}</span>
      </div>
    );
  }
  if (block.kind === "task-list") {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{block.title}</p>
        {block.items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-md border bg-card/40 p-2.5 text-sm",
              t.overdue && "border-rose-500/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium leading-snug">{t.title}</div>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", priorityClasses(t.priority))}>
                {t.priority}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", statusClasses(t.status))}>
                {t.status.replace("_", " ")}
              </span>
              <FolderKanban className="h-3 w-3" /> {t.projectName}
              {t.assigneeName && <span>· {t.assigneeName}</span>}
              {t.dueDate && (
                <span className={cn("flex items-center gap-1", t.overdue && "text-rose-500 font-medium")}>
                  <Calendar className="h-3 w-3" />
                  {new Date(t.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (block.kind === "project-list") {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{block.title}</p>
        {block.items.map((p) => (
          <div key={p.id} className="rounded-md border bg-card/40 p-2.5 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">{p.name}</div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {p.progress}% · {p.tasks} tasks
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                style={{ width: `${p.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (block.kind === "user-summary") {
    const s = block.stats;
    return (
      <div className="space-y-3">
        <div className="rounded-md border bg-card/40 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{block.user.name}</p>
              <p className="text-xs text-muted-foreground">{block.user.email}</p>
            </div>
            <Badge variant={block.user.role === "ADMIN" ? "default" : "secondary"}>
              {block.user.role}
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5"><ListTodo className="h-3.5 w-3.5" /> Total <strong className="ml-auto tabular-nums">{s.total}</strong></div>
            <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500" /> To Do <strong className="ml-auto tabular-nums">{s.todo}</strong></div>
            <div className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-sky-500" /> In Progress <strong className="ml-auto tabular-nums">{s.inProgress}</strong></div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Done <strong className="ml-auto tabular-nums">{s.done}</strong></div>
            <div className="col-span-2 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-rose-500" /> Overdue <strong className="ml-auto tabular-nums text-rose-500">{s.overdue}</strong></div>
          </div>
        </div>
        {block.recent.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Recent tasks</p>
            <div className="space-y-1.5">
              {block.recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-md border bg-card/40 px-2.5 py-1.5 text-xs">
                  <span className="truncate">{r.title}</span>
                  <span className="text-muted-foreground shrink-0">{r.project}</span>
                  <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium", statusClasses(r.status))}>
                    {r.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
}

const HELP_MEMBER = ["show my tasks", "what's overdue?", "due this week", "my projects"];
const HELP_ADMIN = ["team summary", "tell me about Yugandhar", "show overdue tasks", "list projects"];

export function ChatbotLauncher() {
  const { user } = useSession();
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const initialSuggestions = user?.role === "ADMIN" ? HELP_ADMIN : HELP_MEMBER;

  React.useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "bot",
          id: uid(),
          response: {
            intent: "greeting",
            blocks: [
              {
                kind: "text",
                body: `Hi ${user?.name.split(" ")[0] ?? "there"} 👋  I can answer questions about your tasks, projects, and ${
                  user?.role === "ADMIN" ? "team members" : "deadlines"
                }. Try a suggestion below.`,
              },
            ],
            suggestions: initialSuggestions,
          },
        },
      ]);
    }
  }, [open, messages.length, user, initialSuggestions]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: trimmed, id: uid() }]);
    setBusy(true);
    try {
      const response = await api.post<BotResponse>("/api/chat", { message: trimmed });
      setMessages((m) => [...m, { role: "bot", response, id: uid() }]);
    } catch (e) {
      const err = e instanceof ApiError ? e.message : "Something went wrong";
      setMessages((m) => [...m, { role: "bot-error", text: err, id: uid() }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open assistant"
        className={cn(
          "fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-all",
          "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 hover:scale-105 active:scale-95",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span key="b" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="glass fixed bottom-24 right-5 z-40 flex h-[min(70vh,560px)] w-[min(92vw,400px)] flex-col overflow-hidden rounded-2xl border shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">Task Assistant</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Rule-based · respects your permissions
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3 scrollbar-thin">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                      {m.text}
                    </div>
                  </div>
                ) : m.role === "bot-error" ? (
                  <div key={m.id} className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {m.text}
                  </div>
                ) : (
                  <div key={m.id} className="space-y-2">
                    <div className="space-y-2 rounded-2xl rounded-bl-sm border bg-card/40 p-3">
                      {m.response.blocks.map((b, i) => (
                        <BlockView key={i} block={b} />
                      ))}
                    </div>
                    {m.response.suggestions && m.response.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.response.suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => send(s)}
                            disabled={busy}
                            className="rounded-full border bg-card/30 px-3 py-1 text-xs hover:bg-accent transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ),
              )}
              {busy && (
                <div className="flex items-center gap-1 px-3 py-2">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-border/60 p-3"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about tasks, projects, deadlines…"
                disabled={busy}
                className="h-9"
                autoFocus
              />
              <Button type="submit" size="icon" variant="gradient" disabled={busy || !input.trim()} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
