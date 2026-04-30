import { prisma } from "./prisma";
import type { JWTPayload } from "./jwt";

export type ChatBlock =
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

export type ChatResponse = {
  intent: string;
  blocks: ChatBlock[];
  suggestions?: string[];
};

const HELP_SUGGESTIONS_MEMBER = [
  "show my tasks",
  "what's overdue?",
  "due this week",
  "my projects",
];
const HELP_SUGGESTIONS_ADMIN = [
  "team summary",
  "tell me about Yugandhar",
  "show overdue tasks",
  "list projects",
];

function buildTaskScope(user: JWTPayload) {
  return user.role === "ADMIN"
    ? {}
    : {
        OR: [
          { assigneeId: user.sub },
          { project: { ownerId: user.sub } },
          { project: { members: { some: { id: user.sub } } } },
        ],
      };
}

function shapeTask(t: {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  project: { name: string };
  assignee: { name: string } | null;
}) {
  const overdue = !!t.dueDate && t.status !== "DONE" && t.dueDate.getTime() < Date.now();
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    projectName: t.project.name,
    assigneeName: t.assignee?.name ?? null,
    overdue,
  };
}

/** Match a free-form name against users (fuzzy: case-insensitive substring on name + email-local). */
async function findUserByName(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const candidates = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });
  // Exact (case-insensitive) name first, then prefix on any name part, then substring.
  const lowerName = (u: { name: string }) => u.name.toLowerCase();
  const lowerLocal = (u: { email: string }) => u.email.split("@")[0].toLowerCase();
  return (
    candidates.find((u) => lowerName(u) === q) ||
    candidates.find((u) => lowerName(u).split(/\s+/).some((p) => p.startsWith(q))) ||
    candidates.find((u) => lowerLocal(u) === q || lowerLocal(u).startsWith(q)) ||
    candidates.find((u) => lowerName(u).includes(q) || lowerLocal(u).includes(q)) ||
    null
  );
}

async function statsForUser(targetId: string) {
  const [total, todo, inProgress, done, overdue] = await Promise.all([
    prisma.task.count({ where: { assigneeId: targetId } }),
    prisma.task.count({ where: { assigneeId: targetId, status: "TODO" } }),
    prisma.task.count({ where: { assigneeId: targetId, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { assigneeId: targetId, status: "DONE" } }),
    prisma.task.count({
      where: {
        assigneeId: targetId,
        status: { not: "DONE" },
        dueDate: { lt: new Date() },
      },
    }),
  ]);
  return { total, todo, inProgress, done, overdue };
}

export async function answer(question: string, user: JWTPayload): Promise<ChatResponse> {
  const q = question.trim().toLowerCase();
  const isAdmin = user.role === "ADMIN";
  const suggestions = isAdmin ? HELP_SUGGESTIONS_ADMIN : HELP_SUGGESTIONS_MEMBER;

  // -------- HELP / GREETING --------
  if (!q || /^(hi|hello|hey|help|what can you do|commands)\b/.test(q)) {
    return {
      intent: "help",
      blocks: [
        {
          kind: "text",
          body:
            `Hi ${user.name.split(" ")[0]} 👋  I'm your task assistant. ` +
            `I can answer questions about your tasks, projects, due dates, and ${
              isAdmin ? "your team's progress" : "what's assigned to you"
            }. Try one of the suggestions below.`,
        },
      ],
      suggestions,
    };
  }

  // -------- TEAM / SUMMARY / STATS — checked BEFORE user lookup so "team summary" / "summary" don't get parsed as a name. --------
  if (/^(team summary|summary|stats|how are we doing|status report)$/.test(q)) {
    const scope = buildTaskScope(user);
    const [total, done, inProgress, todo, overdue] = await Promise.all([
      prisma.task.count({ where: scope }),
      prisma.task.count({ where: { ...scope, status: "DONE" } }),
      prisma.task.count({ where: { ...scope, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...scope, status: "TODO" } }),
      prisma.task.count({
        where: { ...scope, status: { not: "DONE" }, dueDate: { lt: new Date() } },
      }),
    ]);
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);
    return {
      intent: "summary",
      blocks: [
        {
          kind: "text",
          body: `${isAdmin ? "Team" : "Your"} progress: **${done}/${total}** tasks done (**${rate}%**).`,
        },
        { kind: "stat", label: "To Do", value: String(todo) },
        { kind: "stat", label: "In Progress", value: String(inProgress) },
        { kind: "stat", label: "Done", value: String(done) },
        { kind: "stat", label: "Overdue", value: String(overdue) },
      ],
      suggestions,
    };
  }

  // -------- USER LOOKUP (admin only): "about <name>", "<name>'s tasks", "brief on <name>", "tell me about <name>" --------
  if (isAdmin) {
    const userMatch =
      q.match(/(?:about|brief(?: on)?|tell me about|summary of|info on|status of)\s+([a-z][a-z\s.'-]{0,60})$/i) ||
      q.match(/^([a-z][a-z\s.'-]{0,60})(?:'s| ’s)?\s+(?:tasks|progress|work|status)$/i);
    if (userMatch) {
      const target = await findUserByName(userMatch[1]);
      if (!target) {
        return {
          intent: "user-summary-not-found",
          blocks: [
            { kind: "text", body: `I couldn't find a member matching "${userMatch[1].trim()}".` },
          ],
          suggestions,
        };
      }
      const stats = await statsForUser(target.id);
      const recent = await prisma.task.findMany({
        where: { assigneeId: target.id },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
        take: 5,
        include: { project: { select: { name: true } } },
      });
      return {
        intent: "user-summary",
        blocks: [
          {
            kind: "user-summary",
            title: `Brief on ${target.name}`,
            user: target,
            stats,
            recent: recent.map((r) => ({
              id: r.id,
              title: r.title,
              status: r.status,
              project: r.project.name,
            })),
          },
        ],
        suggestions: ["show overdue tasks", "team summary", "list projects"],
      };
    }
  }

  // -------- OVERDUE --------
  if (/\boverdue|late|past due\b/.test(q)) {
    const tasks = await prisma.task.findMany({
      where: {
        ...buildTaskScope(user),
        status: { not: "DONE" },
        dueDate: { lt: new Date() },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    });
    return {
      intent: "overdue",
      blocks:
        tasks.length === 0
          ? [{ kind: "text", body: "Nothing's overdue 🎉" }]
          : [
              {
                kind: "task-list",
                title: `${tasks.length} overdue ${tasks.length === 1 ? "task" : "tasks"}`,
                items: tasks.map(shapeTask),
              },
            ],
      suggestions,
    };
  }

  // -------- DUE THIS WEEK / SOON --------
  if (/\b(due (soon|this week|today|tomorrow)|this week|upcoming)\b/.test(q)) {
    const days = /today/.test(q) ? 1 : /tomorrow/.test(q) ? 2 : 7;
    const end = new Date();
    end.setDate(end.getDate() + days);
    const tasks = await prisma.task.findMany({
      where: {
        ...buildTaskScope(user),
        status: { not: "DONE" },
        dueDate: { gte: new Date(), lte: end },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    });
    return {
      intent: "due-soon",
      blocks:
        tasks.length === 0
          ? [{ kind: "text", body: `Nothing due in the next ${days} day${days === 1 ? "" : "s"}.` }]
          : [
              {
                kind: "task-list",
                title: `Due in the next ${days} day${days === 1 ? "" : "s"}`,
                items: tasks.map(shapeTask),
              },
            ],
      suggestions,
    };
  }

  // -------- MY TASKS / WHAT DO I HAVE --------
  if (
    /\b(my tasks|assigned to me|what do i have|what's on my plate|show my)\b/.test(q) ||
    (q === "my" && false)
  ) {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: user.sub },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      take: 25,
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    });
    return {
      intent: "my-tasks",
      blocks:
        tasks.length === 0
          ? [{ kind: "text", body: "You have no tasks assigned right now." }]
          : [
              {
                kind: "task-list",
                title: `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} assigned to you`,
                items: tasks.map(shapeTask),
              },
            ],
      suggestions,
    };
  }

  // -------- HIGH PRIORITY --------
  if (/\b(high priority|urgent|important)\b/.test(q)) {
    const tasks = await prisma.task.findMany({
      where: { ...buildTaskScope(user), priority: "HIGH", status: { not: "DONE" } },
      orderBy: [{ dueDate: "asc" }],
      take: 15,
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    });
    return {
      intent: "high-priority",
      blocks:
        tasks.length === 0
          ? [{ kind: "text", body: "No high-priority tasks open. Nice." }]
          : [
              {
                kind: "task-list",
                title: `${tasks.length} high-priority open task${tasks.length === 1 ? "" : "s"}`,
                items: tasks.map(shapeTask),
              },
            ],
      suggestions,
    };
  }

  // -------- PROJECTS --------
  if (/\b(projects?|list projects)\b/.test(q)) {
    const where =
      user.role === "ADMIN"
        ? {}
        : {
            OR: [{ ownerId: user.sub }, { members: { some: { id: user.sub } } }],
          };
    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { tasks: { select: { status: true } } },
    });
    const items = projects.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.status === "DONE").length;
      return {
        id: p.id,
        name: p.name,
        progress: total === 0 ? 0 : Math.round((done / total) * 100),
        tasks: total,
      };
    });
    return {
      intent: "projects",
      blocks:
        items.length === 0
          ? [{ kind: "text", body: "No projects yet." }]
          : [{ kind: "project-list", title: `${items.length} projects`, items }],
      suggestions,
    };
  }

  // -------- FALLBACK --------
  return {
    intent: "fallback",
    blocks: [
      {
        kind: "text",
        body:
          "I'm a rule-based assistant — I didn't understand that. Try one of the suggestions below, " +
          "or ask things like \"show my tasks\", \"what's overdue\", \"due this week\"" +
          (isAdmin ? ", or \"tell me about <member name>\"." : "."),
      },
    ],
    suggestions,
  };
}
